"""Data update coordinator for the CarLinko integration."""

from __future__ import annotations

import asyncio
import logging
from datetime import timedelta

from homeassistant.config_entries import ConfigEntry
from homeassistant.core import HomeAssistant
from homeassistant.exceptions import ConfigEntryAuthFailed, HomeAssistantError
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

                location = (self.data or {}).get(vid, {}).get("location")
                if locate_now:
                    sn = self._device_sn(row)
                    if sn:
                        try:
                            location = await self.api.locate(sn)
                        except CarlinkoError as err:
                            _LOGGER.debug("locate failed for %s: %s", vid, err)

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
