"""The CarLinko integration."""

from __future__ import annotations

import socket

from homeassistant.config_entries import ConfigEntry
from homeassistant.const import CONF_PASSWORD, Platform
from homeassistant.core import HomeAssistant
from homeassistant.helpers.aiohttp_client import async_get_clientsession

from .api import CarlinkoApi
from .const import CONF_ACCOUNT, DEFAULT_REGION
from .coordinator import CarlinkoCoordinator

PLATFORMS: list[Platform] = [
    Platform.BINARY_SENSOR,
    Platform.BUTTON,
    Platform.DEVICE_TRACKER,
    Platform.LOCK,
    Platform.SENSOR,
    Platform.SWITCH,
]

type CarlinkoConfigEntry = ConfigEntry[CarlinkoCoordinator]


async def async_setup_entry(hass: HomeAssistant, entry: CarlinkoConfigEntry) -> bool:
    """Set up CarLinko from a config entry."""
    session = async_get_clientsession(hass, family=socket.AF_INET)
    api = CarlinkoApi(
        session,
        entry.data[CONF_ACCOUNT],
        entry.data[CONF_PASSWORD],
        entry.data.get("region", DEFAULT_REGION),
        token=entry.data.get("token"),
    )
    coordinator = CarlinkoCoordinator(hass, entry, api)
    await coordinator.async_config_entry_first_refresh()

    entry.runtime_data = coordinator
    await hass.config_entries.async_forward_entry_setups(entry, PLATFORMS)
    return True


async def async_unload_entry(hass: HomeAssistant, entry: CarlinkoConfigEntry) -> bool:
    """Unload a config entry."""
    return await hass.config_entries.async_unload_platforms(entry, PLATFORMS)
