"""Data update coordinator for the CarLinko integration."""

from __future__ import annotations

import asyncio
import logging
from datetime import timedelta

from homeassistant.config_entries import ConfigEntry
from homeassistant.core import HomeAssistant
from homeassistant.exceptions import ConfigEntryAuthFailed, HomeAssistantError
from homeassistant.helpers.aiohttp_client import async_get_clientsession
from homeassistant.helpers.update_coordinator import DataUpdateCoordinator, UpdateFailed

from .api import CarlinkoApi, CarlinkoAuthError, CarlinkoError
from .const import CONF_TOKEN, DOMAIN, LOCATE_EVERY, SCAN_INTERVAL

_LOGGER = logging.getLogger(__name__)


class CarlinkoCoordinator(DataUpdateCoordinator[dict[str, dict]]):
    """Fetch vehicle list, state and (throttled) location for all vehicles."""

    def __init__(self, hass: HomeAssistant, entry: ConfigEntry, api: CarlinkoApi) -> None:
        super().__init__(
            hass,
            _LOGGER,
            name=DOMAIN,
            config_entry=entry,
            update_interval=timedelta(seconds=SCAN_INTERVAL),
        )
        self.api = api
        self._tick = 0

    async def _reverse_geocode(self, loc: dict, prev: dict) -> str | None:
        """CarLinko returns no address in some regions (TH); fall back to Nominatim.

        Only called when the position moved, so a parked car costs zero requests.
        """
        # ponytail: Nominatim public API (1 req/s policy); locate runs every 15 min at most
        if loc.get("lat") == prev.get("lat") and loc.get("lng") == prev.get("lng"):
            return prev.get("address")
        try:
            async with async_get_clientsession(self.hass).get(
                "https://nominatim.openstreetmap.org/reverse",
                params={"format": "jsonv2", "lat": str(loc["lat"]), "lon": str(loc["lng"]), "zoom": "17"},
                headers={"User-Agent": f"ha-carlinko/{DOMAIN}", "Accept-Language": self.hass.config.language},
                timeout=10,
            ) as resp:
                payload = await resp.json(content_type=None)
            return payload.get("display_name") or None
        except Exception as err:  # noqa: BLE001 - never let geocoding break a refresh
            _LOGGER.debug("reverse geocode failed: %s", err)
            return None

    def _device_sn(self, row: dict) -> str | None:
        return row.get("deviceId") or row.get("deviceSn")

    async def _async_update_data(self) -> dict[str, dict]:
        self._tick += 1
        locate_now = self._tick % LOCATE_EVERY == 1

        try:
            vehicles = await self.api.get_vehicles()
            data: dict[str, dict] = {}
            for row in vehicles:
                vid_raw = row.get("vehicleId")
                if not vid_raw:
                    raise UpdateFailed("vehicle row without vehicleId")
                vid = str(vid_raw)
                state = await self.api.get_state(vid_raw)
                try:
                    state["online"] = await self.api.is_online(vid_raw)
                except CarlinkoError as err:
                    _LOGGER.debug("isOnline failed for %s: %s", vid, err)
                    state["online"] = None

                location = (self.data or {}).get(vid, {}).get("location")
                if locate_now:
                    sn = self._device_sn(row)
                    if sn:
                        try:
                            location = await self.api.locate(sn)
                        except CarlinkoError as err:
                            _LOGGER.debug("locate failed for %s: %s", vid, err)
                        else:
                            if not location.get("address"):
                                prev = (self.data or {}).get(vid, {}).get("location") or {}
                                location["address"] = await self._reverse_geocode(location, prev)

                data[vid] = {"vehicle": row, "state": state, "location": location}
        except CarlinkoAuthError as err:
            raise ConfigEntryAuthFailed from err
        except CarlinkoError as err:
            raise UpdateFailed(str(err)) from err

        if self.api.token != self.config_entry.data.get(CONF_TOKEN):
            self.hass.config_entries.async_update_entry(
                self.config_entry, data={**self.config_entry.data, CONF_TOKEN: self.api.token}
            )

        return data

    # ponytail: fixed 60 s poll / locate every 15th tick; make it an option if users hit rate limits
    async def send(self, vehicle_id: str, opcode: str) -> None:
        """Send a remote-control opcode to a vehicle, then refresh."""
        row = self.data[vehicle_id]["vehicle"]
        sn = self._device_sn(row)
        if not sn:
            raise HomeAssistantError(f"vehicle {vehicle_id} has no deviceId/deviceSn")
        try:
            await self.api.remote_control(vehicle_id, sn, opcode)
        except CarlinkoError as err:
            raise HomeAssistantError(str(err)) from err
        await asyncio.sleep(5)
        await self.async_request_refresh()
