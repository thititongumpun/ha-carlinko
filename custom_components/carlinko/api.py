"""CarLinko cloud API client.

HA-free (stdlib + aiohttp only) so the tests and ``tools/cli.py`` run without
Home Assistant installed.
"""

from __future__ import annotations

import base64
import hashlib
import hmac
import json
import logging
import time
from typing import Any

import aiohttp

from .const import (
    API_HOST,
    API_VERSION,
    CODE_OK,
    DEFAULT_REGION,
    OP_INIT,
    SIGN_KEY,
    STALE_TOKEN_CODES,
    USER_AGENT,
)

_LOGGER = logging.getLogger(__name__)


class CarlinkoError(Exception):
    """Any non-``0000`` API envelope or transport failure."""

    def __init__(self, msg: str, code: str | None = None) -> None:
        super().__init__(msg)
        self.msg = msg
        self.code = code


class CarlinkoAuthError(CarlinkoError):
    """Credentials rejected or no token returned."""


def sign(params: dict, ts: str) -> str:
    """base64(HMAC-SHA256(SIGN_KEY, jsonEncode(sortByKeyAsc({**params, timestamp})))).

    Must match the Dart client byte-for-byte: ``None`` -> ``""``, everything
    stringified, keys sorted, no separator whitespace, non-ASCII left as-is.
    """
    m = {k: ("" if v is None else str(v)) for k, v in {**params, "timestamp": ts}.items()}
    msg = json.dumps(dict(sorted(m.items())), separators=(",", ":"), ensure_ascii=False).encode()
    return base64.b64encode(hmac.new(SIGN_KEY, msg, hashlib.sha256).digest()).decode()


_BLOB_KEYS = (
    "doors",
    "unlocked",
    "trunk",
    "hv_state",
    "windows",
    "sunroof",
    "volt12",
    "speed",
    "odometer",
    "ac_on",
    "ac_temp",
    "battery_pct",
    "range_km",
    "consumption",
    "charge_mode",
    "charge_state",
    "charge_remain_min",
    "charge_power_kw",
    "wltc_range",
)


def parse_blob(hex_str: str) -> dict[str, Any]:
    """Decode the 73-byte telemetry blob. All 19 keys always present.

    A short/odd blob yields ``None`` for the fields it cannot reach; only a
    non-hex string is an error (that is a protocol violation, not a short read).
    """
    try:
        b = bytes.fromhex(hex_str or "")
    except ValueError as err:
        raise CarlinkoError(f"invalid telemetry hex: {err}") from err

    n = len(b)

    def u8(i: int) -> int | None:
        return b[i] if i < n else None

    def u16(i: int) -> int | None:
        return (b[i] << 8) | b[i + 1] if i + 1 < n else None

    def u24(i: int) -> int | None:
        return (b[i] << 16) | (b[i + 1] << 8) | b[i + 2] if i + 2 < n else None

    def scale(v: int | None, f: float, digits: int) -> float | None:
        return None if v is None else round(v * f, digits)

    out: dict[str, Any] = dict.fromkeys(_BLOB_KEYS)

    out["doors"] = u8(2)
    out["unlocked"] = u8(3)
    out["trunk"] = u8(4)
    out["hv_state"] = u8(5)
    out["windows"] = u8(8)
    out["sunroof"] = u8(9)
    out["volt12"] = scale(u16(12), 0.01, 2)
    out["speed"] = scale(u16(14), 1 / 16, 1)
    out["odometer"] = u24(18)
    ac = u8(23)
    out["ac_on"] = None if ac is None else ac != 0
    out["ac_temp"] = u8(24)
    out["battery_pct"] = u8(28)
    out["range_km"] = u16(29)
    out["consumption"] = scale(u8(55), 0.1, 1)
    out["charge_mode"] = u8(56)
    state = u8(57)
    out["charge_state"] = state

    remain = u16(58)
    out["charge_remain_min"] = None if remain is None or remain >= 0x3FE else remain

    # The b62-63 pair carries regen power while not charging, so it is only
    # meaningful once the car reports an actual charge state.
    power = u16(62)
    out["charge_power_kw"] = scale(power, 0.1, 1) if state not in (None, 0) else None

    out["wltc_range"] = u16(68)
    return out


class CarlinkoApi:
    """Minimal async client for the endpoints this integration needs."""

    def __init__(
        self,
        session: aiohttp.ClientSession,
        account: str,
        password: str,
        region: str = DEFAULT_REGION,
        token: str | None = None,
    ) -> None:
        self._session = session
        self._account = account
        self._password = password
        self.region = (region or DEFAULT_REGION).lower()
        self.base = API_HOST.format(region=self.region)
        self.token = token
        self.skew_ms = 0
        self._synced = False

    # --- plumbing -----------------------------------------------------

    def _ts(self) -> str:
        return str(int(time.time() * 1000) + self.skew_ms)

    def _headers(self, sign_params: dict, ts: str, *, auth: bool) -> dict[str, str]:
        headers = {
            "timestamp": ts,
            "signature": sign(sign_params, ts),
            "user-agent": USER_AGENT,
            "language": "en",
            "version": API_VERSION,
            "content-type": "application/json",
        }
        if auth and self.token:
            headers["token"] = self.token
        return headers

    async def _envelope(self, resp: aiohttp.ClientResponse) -> dict[str, Any]:
        try:
            payload = await resp.json(content_type=None)
        except (aiohttp.ClientError, ValueError) as err:
            raise CarlinkoError(f"bad response ({resp.status}): {err}") from err
        if not isinstance(payload, dict):
            raise CarlinkoError(f"unexpected response: {payload!r}")
        return payload

    async def _request(
        self,
        method: str,
        path: str,
        *,
        params: dict | None = None,
        body: dict | None = None,
        sign_params: dict,
        auth: bool = True,
        retry: bool = True,
    ) -> Any:
        if not self._synced:
            # ponytail: one-shot clock sync per process; re-sync on a timestamp-
            # rejection code if the server ever reports one
            try:
                await self._sync_clock()
            except CarlinkoError as err:
                _LOGGER.debug("clock sync failed, proceeding with skew 0: %s", err)
            else:
                self._synced = True
        ts = self._ts()
        if body is not None and "timestamp" in body:
            body["timestamp"] = ts  # body and header must carry the signed timestamp
        try:
            async with self._session.request(
                method,
                self.base + path,
                params=params,
                json=body,
                headers=self._headers(sign_params, ts, auth=auth),
            ) as resp:
                payload = await self._envelope(resp)
        except aiohttp.ClientError as err:
            raise CarlinkoError(f"request to {path} failed: {err}") from err

        code = str(payload.get("code"))
        if code != CODE_OK:
            msg = str(payload.get("msg") or code)
            if auth and retry and code in STALE_TOKEN_CODES:
                await self.login()
                return await self._request(
                    method,
                    path,
                    params=params,
                    body=body,
                    sign_params=sign_params,
                    auth=auth,
                    retry=False,
                )
            raise CarlinkoError(msg, code)
        return payload.get("data")

    async def _sync_clock(self) -> None:
        """Align our timestamps with the server; a skewed clock fails signing."""
        try:
            async with self._session.get(self.base + "/pub/timestamp") as resp:
                payload = await self._envelope(resp)
        except aiohttp.ClientError as err:
            raise CarlinkoError(f"timestamp sync failed: {err}") from err
        try:
            self.skew_ms = int(payload["data"]) - int(time.time() * 1000)
        except (KeyError, TypeError, ValueError):
            self.skew_ms = 0

    # --- endpoints ----------------------------------------------------

    async def login(self) -> str:
        await self._sync_clock()
        self._synced = True
        ts = self._ts()
        body = {
            "account": self._account,
            "password": self._password,
            "method": "PASSWORD",
            "appType": "APP",
            "osType": "ANDROID",
            "appName": "CarLinko",
            "appVersion": API_VERSION,
            "osVersion": "13",
            "language": "en",
            "timeZone": "Asia/Bangkok",
            "phoneBrand": "Google",
            "phoneModel": "Pixel 7 Pro",
            "md5": "",
            "verifyCode": "",
            "dateTime": ts,
            "timestamp": ts,
        }
        try:
            async with self._session.post(
                self.base + "/user/login",
                json=body,
                headers=self._headers(body, ts, auth=False),
            ) as resp:
                payload = await self._envelope(resp)
        except aiohttp.ClientError as err:
            raise CarlinkoError(f"login request failed: {err}") from err

        code = str(payload.get("code"))
        if code != CODE_OK:
            raise CarlinkoAuthError(str(payload.get("msg") or code), code)

        data = payload.get("data")
        token = data.get("token") if isinstance(data, dict) else data
        if not token:
            raise CarlinkoAuthError("login succeeded but no token returned", code)

        self.token = str(token)
        return self.token

    async def get_vehicles(self) -> list[dict]:
        data = await self._request("GET", "/user/vehicle", sign_params={})
        return data if isinstance(data, list) else []

    async def get_state(self, vehicle_id: str) -> dict[str, Any]:
        vid = str(vehicle_id)
        data = await self._request(
            "GET", f"/user/vehicle/state/{vid}", sign_params={"id": vid}
        )
        state = parse_blob(data if isinstance(data, str) else "")
        state["raw"] = data
        return state

    async def locate(self, device_sn: str) -> dict[str, Any]:
        body = {"sn": str(device_sn), "showAddress": 1, "timestamp": self._ts()}
        data = await self._request(
            "POST", "/maps/deviceLocate", body=body, sign_params=body
        )
        data = data or {}
        return {
            "lat": data.get("lat"),
            "lng": data.get("lng"),
            "address": data.get("address"),
        }

    async def remote_control(self, vehicle_id: str, device_sn: str, opcode: str) -> None:
        # ponytail: init "77" mirrors the app; drop if live testing shows it is not required
        if opcode != OP_INIT:
            try:
                await self.remote_control(vehicle_id, device_sn, OP_INIT)
            except CarlinkoError:
                pass
        body = {
            "vehicleId": str(vehicle_id),
            "deviceSn": str(device_sn),
            "data": opcode,
            "timeOut": 20,
            "timestamp": self._ts(),
        }
        await self._request(
            "POST", "/user/vehicle/remoteControl", body=body, sign_params=body
        )
