"""CarLinko cloud API client.

HA-free (stdlib + aiohttp + cryptography, all shipped with HA core) so the tests and ``tools/cli.py`` run without
Home Assistant installed.
"""

from __future__ import annotations

import base64
import hashlib
import hmac
import json
import logging
import os
import re
import time
from datetime import UTC, datetime
from typing import Any

import aiohttp
from cryptography.hazmat.primitives.ciphers import Cipher, algorithms, modes

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


CHARGE_LIMITS = (80, 90, 100)  # the app's only slider stops; others are untested server-side


def target_soc(data: Any) -> int | None:
    """targetSoc from a terminalNoticeConfig reply; None when absent or off-scale."""
    v = data.get("targetSoc") if isinstance(data, dict) else None
    return v if isinstance(v, int) and v in CHARGE_LIMITS else None


def notice_time(s: Any) -> datetime | None:
    """CarLinko notice ``createdTime`` ("YYYY-MM-DD HH:MM:SS", UTC); None when unparseable."""
    try:
        return datetime.strptime(s, "%Y-%m-%d %H:%M:%S").replace(tzinfo=UTC)
    except (TypeError, ValueError):
        return None


def charge_notice(text: Any) -> tuple[str, float] | None:
    """("start" | "complete", soc %) for a charging notice, else None."""
    if not isinstance(text, str):
        return None
    pct = re.findall(r"(\d+(?:\.\d+)?)\s*%", text)
    if not pct:
        return None
    low = text.lower()
    # shortcut: English wording guessed (app language follows the account), adjust when an English-account notice is seen
    if "ชาร์จเสร็จ" in text or ("charg" in low and any(w in low for w in ("complet", "finish", "full"))):
        return "complete", float(pct[-1])
    if "เริ่มชาร์จ" in text or ("charg" in low and "start" in low):
        return "start", float(pct[-1])
    return None


def last_charge(notices: list[dict[str, Any]]) -> dict[str, Any] | None:
    """Latest charging session from vehicle notices (newest first); None without charging notices."""
    found = [(t, c, n) for n in notices if (c := (charge_notice(n.get("title")) or charge_notice(n.get("contents"))))
             and (t := notice_time(n.get("createdTime")))]
    if not found:
        return None
    iso = lambda t: t.isoformat() if t else None  # noqa: E731
    end = found[0] if found[0][1][0] == "complete" else None
    start = next((f for f in found[1 if end else 0:] if f[1][0] == "start"), None)
    return {
        "end_soc": end[1][1] if end else None,
        "ended_at": iso(end[0]) if end else None,
        "start_soc": start[1][1] if start else None,
        "started_at": iso(start[0]) if start else None,
    }


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


_TYRES = ("fl", "fr", "rl", "rr")
# Fallback raw-byte -> kPa factor when the model's config has no formula; C5-confirmed.
TPMS_SCALE = 1.375

# Seat comfort levels, one byte each (0 = off, 1-3 = level). Offsets from the
# ha-carlinko project's live capture; 35 and 40 are skipped there too.
_SEATS = {
    "seat_heat_l": 32,
    "seat_heat_r": 33,
    "seat_heat_lr": 34,
    "seat_heat_rr": 36,
    "seat_vent_l": 37,
    "seat_vent_r": 38,
    "seat_vent_lr": 39,
    "seat_vent_rr": 41,
}

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
    "fuel_pct",
    "fuel_range",
    "fuel_consumption",
    "windshield_heat",
    "steer_heat",
) + tuple(f"tyre_{pos}_{m}" for m in ("pressure", "temp") for pos in _TYRES) + tuple(_SEATS)


def parse_blob(hex_str: str, tpms_scale: float = TPMS_SCALE) -> dict[str, Any]:
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
    # b23: 0 = A/C off. Observed 2026-09-11: b23 == 0 while the app showed off,
    # so the earlier "inverted" reading was wrong. Values above 1 are unconfirmed.
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

    # PHEV only, all 0 on a BEV. Offsets from elad-bar/ha-carlinko's Tiggo 8 PHEV
    # captures: b21 tank %, b53 L/100 km x0.1, b70-71 fuel range (dash-matched).
    out["fuel_pct"] = u8(21)
    out["fuel_consumption"] = scale(u8(53), 0.1, 1)
    out["fuel_range"] = u16(70)

    # ponytail: seat/heat offsets are another project's capture, not confirmed on
    # this car. Gated on vehicleControlConfig, so an unequipped car shows nothing.
    for key, off in _SEATS.items():
        out[key] = u8(off)
    ws = u8(64)
    out["windshield_heat"] = None if ws is None else ws != 0
    sh = u8(65)
    out["steer_heat"] = None if sh is None else sh != 0

    # TPMS, order FL, FR, RL, RR: b44-47 pressure, b48-51 temperature.
    # kPa = raw * tpms_scale, per model from vehicleControlConfig (C5 1.373:
    # 199/201 -> 39.6/40.0 psi, app shows 40; Tiggo 8 PHEV 1.779, issue #3).
    # degC = raw * 0.5 - 25 (confirmed: 109/107 -> 29.5/28.5, app shows 30/29).
    # 0x00/0xFF mean "no reading" (a parked sample reports 0xFF on all eight).
    for i, pos in enumerate(_TYRES):
        kpa = u8(44 + i)
        out[f"tyre_{pos}_pressure"] = None if kpa in (None, 0, 0xFF) else round(kpa * tpms_scale, 1)
        temp = u8(48 + i)
        out[f"tyre_{pos}_temp"] = None if temp in (None, 0, 0xFF) else temp * 0.5 - 25

    return out


# vehicleControlConfig -> our capability names. The cloud publishes this per
# model, so gating on it keeps a sunroof entity off a car with no sunroof.
_CAP_FLAGS = {
    "lock": "Lock",
    "find": "Search",
    "charging": "ChargingManagement",
    "windshield_heat": "FrontWindshieldHeater",
    "steer_heat": "SteeringWheelHeater",
    "windows_open": "WindowsOpen",
    "windows_close": "WindowsClose",
    "windows_vent": "WindowsVent",
    "sunroof": "Sunroof",
    "sunroof_tilt": "SunroofTilting",
    "soc_limit": "socUpperLimit",  # the app shows the charge-limit slider
}

_CAP_AC_FLAGS = {
    "ac": "Switch",
    "set_temp": "SetTemperature",
    "quick_cool": "RapidCool",
    "quick_heat": "RapidHeat",
    "defog": "Defogging",
    "purify": "AirPurification",
}

# Seat key -> (enable flag, per-level list). Rear left and right share a flag.
_CAP_SEATS = {
    "seat_heat_l": ("DriverHeater", "LeftHeaterList"),
    "seat_vent_l": ("DriverVent", "LeftVentList"),
    "seat_heat_r": ("AssistantHeater", "RightHeaterList"),
    "seat_vent_r": ("AssistantVent", "RightVentList"),
    "seat_heat_lr": ("RearHeater", "RearHeaterList"),
    "seat_vent_lr": ("RearVent", "RearVentList"),
    "seat_heat_rr": ("RearHeater", "RearHeaterList"),
    "seat_vent_rr": ("RearVent", "RearVentList"),
}


def _seat_levels(ac: dict[str, Any], flag: str, list_key: str) -> int:
    """Highest enabled seat level, 0 when the car does not have that seat."""
    if not ac.get(flag):
        return 0
    levels = ac.get(list_key)
    if levels is None:
        return 3  # flag set but no list: the usual off/L1/L2/L3
    if not isinstance(levels, list):
        return 0
    return max((i + 1 for i, on in enumerate(levels[:3]) if on), default=0)


def caps(row: dict[str, Any]) -> dict[str, Any]:
    """What this model supports, from /user/vehicle's vehicleControlConfig.

    Booleans for on/off features; seat keys hold the number of levels, 0 when
    absent. A missing or unparseable config yields all-false, which hides the
    optional entities rather than creating dead ones.
    """
    cfg = row.get("vehicleControlConfig")
    if isinstance(cfg, str):
        try:
            cfg = json.loads(cfg)
        except ValueError:
            cfg = None
    if not isinstance(cfg, dict):
        cfg = {}
    ac = cfg.get("A/C")
    if not isinstance(ac, dict):
        ac = {}

    out: dict[str, Any] = {k: bool(cfg.get(src)) for k, src in _CAP_FLAGS.items()}
    out.update({k: bool(ac.get(src)) for k, src in _CAP_AC_FLAGS.items()})
    out.update({k: _seat_levels(ac, *v) for k, v in _CAP_SEATS.items()})
    # An OMODA C5 reports PowerLiftgate but not Trunk; either means "it opens".
    out["liftgate"] = bool(cfg.get("PowerLiftgate") or cfg.get("Trunk"))
    out["phev"] = bool(cfg.get("fuelConsumption"))
    out["tpms_scale"] = _tpms_scale(cfg, str(row.get("model") or ""))
    return out


def _tpms_scale(cfg: dict[str, Any], model: str) -> float:
    """Raw tyre byte -> kPa factor from the model's "data * 1.373" formula."""
    # Tiggo 7/8 PHEV ("CSH" in MY/ID): owner-confirmed 1.779 (issue #3,
    # elad-bar #1/#3). Wins over the config, which did not fix it in v0.0.24.
    if re.search(r"tiggo.*\b(phev|csh)\b", model, re.IGNORECASE):
        return 1.779
    for key in ("appKpaFormula", "webTirePressureFormula"):
        m = re.fullmatch(r"\s*data\s*\*\s*([0-9.]+)\s*", str(cfg.get(key) or ""))
        if m:
            try:
                return float(m.group(1))
            except ValueError:
                pass
    return TPMS_SCALE


def charge_target(state: dict[str, Any], battery_kwh: float) -> float | None:
    """Infer the SoC limit set in the car from its own remaining-time estimate.

    ``charge_remain_min`` is the BMS figure and already accounts for the target,
    so target = now + the energy still to be delivered. None unless charging.
    """
    pct = state["battery_pct"]
    kw = state["charge_power_kw"]
    mins = state["charge_remain_min"]
    if state["charge_state"] != 1 or not kw or pct is None or mins is None or not battery_kwh:
        return None
    # ponytail: linear pack model; the car tapers and pads above ~90 %, so a true
    # 100 % reads 95-105. Fit a taper curve from logged sessions if it ever matters.
    return round(pct + kw * mins / 60 / battery_kwh * 100, 1)


_CONTROL_KEY_PREFIX = bytes.fromhex("A0F47CB6677BE6A3")

# Car-side refusal codes for A/C (RESULT byte), from the app's module_en.json via openlinko.
_AC_REFUSALS = {
    "2A": "vehicle in motion",
    "93": "vehicle not in remote mode",
    "23": "vehicle is started",
    "94": "high-voltage fault",
    "95": "battery too low",
    "96": "key detected inside the car",
    "22": "a door is unlocked",
    "99": "T-Box authentication failed",
    "9A": "not in P",
    "9B": "hazard lights are on",
}


def encrypt_control(opcode: str, vin: str, user_id: str, rand: bytes | None = None) -> str:
    """AES-wrap a 74xxyy opcode the way app 1.14.10 does; T-Box fw >= 2.3.1_051A01R
    rejects plain frames with ``__7404``. Scheme reversed by GodrezJr2/openlinko:
    data = "66" + rnd + AES-128-ECB(key=A0F47CB6677BE6A3+rnd, zero-pad(op+VIN+uid)).
    """
    frame = bytes.fromhex(opcode) + vin.encode() + user_id.encode()
    frame += b"\x00" * (-len(frame) % 16)
    rnd = rand if rand is not None else os.urandom(8)
    enc = Cipher(algorithms.AES(_CONTROL_KEY_PREFIX + rnd), modes.ECB()).encryptor()  # noqa: S305 - the T-Box's protocol, not our choice
    return "66" + rnd.hex() + (enc.update(frame) + enc.finalize()).hex()


def _reply_tail(reply: str) -> str:
    """The car's part of a control reply, without the ``<deviceSn>__`` prefix."""
    return reply.split("__")[-1].upper()


def _frame_rejected(opcode: str, reply: str) -> bool:
    """Bare ``74RR`` reply: the T-Box could not read the frame, nothing actuated."""
    tail = _reply_tail(reply)
    return opcode.upper().startswith("74") and tail.startswith("74") and len(tail) == 4


def control_verdict(opcode: str, reply: str) -> tuple[bool, str | None]:
    """(done, reason) from a ``<deviceSn>__74<CMD><STATE><RESULT>`` reply; RESULT 00 = done.

    HTTP code 0000 only means the cloud reached the T-Box; this is the car's answer.
    """
    op, tail = opcode.upper(), _reply_tail(reply)
    if _frame_rejected(op, reply):
        return False, f"car control system error (0x{tail[2:]}), command frame rejected"
    if len(op) != 6 or not tail.startswith(op) or len(tail) < 8:
        return True, None  # no verdict in the reply; nothing to judge
    res = tail[6:8]
    if res == "00":
        return True, None
    if res == "44":
        return False, "no operation permission: this account is not authorised on the car's T-Box"
    reason = _AC_REFUSALS.get(res) if op[2:4] == "10" else None
    return False, reason or f"car refused (code 0x{res})"


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
        self._user_id = ""

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
        except (aiohttp.ClientError, TimeoutError, OSError) as err:
            raise CarlinkoError(f"request to {path} failed: {err}") from err

        code = str(payload.get("code"))
        _LOGGER.debug("%s %s -> %s %s", method, path, code, payload.get("msg") or "")
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
        except (aiohttp.ClientError, TimeoutError, OSError) as err:
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
        except (aiohttp.ClientError, TimeoutError, OSError) as err:
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

    async def get_state(self, vehicle_id: str, tpms_scale: float = TPMS_SCALE) -> dict[str, Any]:
        vid = str(vehicle_id)
        data = await self._request(
            "GET", f"/user/vehicle/state/{vid}", sign_params={"id": vid}
        )
        state = parse_blob(data if isinstance(data, str) else "", tpms_scale)
        state["raw"] = data
        return state

    async def is_online(self, vehicle_id: str) -> bool | None:
        vid = str(vehicle_id)
        data = await self._request(
            "GET", f"/user/vehicle/isOnline/{vid}", sign_params={"id": vid}
        )
        return data if isinstance(data, bool) else None

    async def get_target_soc(self, vehicle_id: str) -> int | None:
        vid = str(vehicle_id)
        data = await self._request(
            "GET",
            f"/user/device/manage/terminalNoticeConfig/{vid}",
            sign_params={"vehicleId": vid},
        )
        return target_soc(data)

    async def set_target_soc(self, vehicle_id: str, value: int) -> None:
        if value not in CHARGE_LIMITS:
            raise CarlinkoError(f"charge limit must be one of {CHARGE_LIMITS}, got {value!r}")
        # no "timestamp" in the body: the fork's live-confirmed contract signs exactly these two keys
        body = {"targetSoc": value, "vehicleId": str(vehicle_id)}
        await self._request("PUT", "/user/device/manage/targetSoc", body=body, sign_params=body)

    async def get_maintain(self, vehicle_id: str) -> list[dict[str, Any]]:
        """Dealer service records, newest first per the app; [] when none logged."""
        q = {"vehicleId": str(vehicle_id), "queryKey": "", "page": "1", "size": "20"}
        data = await self._request("GET", "/user/maintain/page", params=q, sign_params=q)
        return [r for r in data if isinstance(r, dict)] if isinstance(data, list) else []

    async def get_notices(self, vehicle_id: str) -> list[dict[str, Any]]:
        """Vehicle notices (type 2), newest first; [] when none. Read-only, never marks as read."""
        q = {"page": "1", "size": "20", "type": "2", "vehicleId": str(vehicle_id)}
        data = await self._request("GET", "/user/notice/page", params=q, sign_params=q)
        return [r for r in data if isinstance(r, dict)] if isinstance(data, list) else []

    async def get_maintain_details(self, maintain_id: str) -> dict[str, Any]:
        mid = str(maintain_id)
        data = await self._request(
            "GET", f"/user/maintain/details/{mid}", sign_params={"maintainId": mid}
        )
        return data if isinstance(data, dict) else {}

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

    async def user_id(self) -> str:
        """Numeric account id; the encrypted control frame embeds it."""
        if not self._user_id:
            data = await self._request("GET", "/user/info", sign_params={})
            self._user_id = str((data or {}).get("id") or "") if isinstance(data, dict) else ""
        return self._user_id

    async def _post_control(self, vehicle_id: str, device_sn: str, data: str) -> str:
        body = {
            "vehicleId": str(vehicle_id),
            "deviceSn": str(device_sn),
            "data": data,
            "timeOut": 20,
            "timestamp": self._ts(),
        }
        reply = await self._request(
            "POST", "/user/vehicle/remoteControl", body=body, sign_params=body
        )
        return str(reply or "")

    async def remote_control(
        self, vehicle_id: str, device_sn: str, opcode: str, vin: str | None = None
    ) -> None:
        """Send one command and raise CarlinkoError unless the car reports it done."""
        if opcode == OP_INIT or not opcode.upper().startswith("74"):
            reply = await self._post_control(vehicle_id, device_sn, opcode)
            _LOGGER.debug("control %s -> %s", opcode, _reply_tail(reply))
            return
        # ponytail: init "77" mirrors the app; drop if live testing shows it is not required
        try:
            await self._post_control(vehicle_id, device_sn, OP_INIT)
        except CarlinkoError as err:
            _LOGGER.debug("control init 77 failed: %s", err)

        tries = [("plain", opcode)]
        try:
            uid = await self.user_id()
        except CarlinkoError as err:
            _LOGGER.debug("user id lookup failed, sending plain: %s", err)
            uid = ""
        if vin and uid:
            tries.insert(0, ("encrypted", encrypt_control(opcode, vin, uid)))
        else:
            _LOGGER.debug("no VIN (%s) or user id (%s), sending plain", bool(vin), bool(uid))

        for mode, data in tries:
            reply = await self._post_control(vehicle_id, device_sn, data)
            ok, reason = control_verdict(opcode, reply)
            _LOGGER.debug("control %s (%s) -> %s", opcode, mode, _reply_tail(reply))
            if ok:
                return
            if not _frame_rejected(opcode, reply):
                break  # the car read the frame and refused: resending could double it
        raise CarlinkoError(f"{opcode}: {reason}")
