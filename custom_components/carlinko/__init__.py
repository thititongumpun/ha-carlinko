"""The CarLinko integration."""

from __future__ import annotations

import socket

from homeassistant.components.http import StaticPathConfig
from homeassistant.config_entries import ConfigEntry
from homeassistant.const import CONF_PASSWORD, CONF_REGION, Platform
from homeassistant.core import HomeAssistant
from homeassistant.helpers.aiohttp_client import async_get_clientsession
from homeassistant.helpers.typing import ConfigType

from .api import CarlinkoApi
from .const import CONF_ACCOUNT, CONF_TOKEN, DEFAULT_REGION, DOMAIN
from .coordinator import CarlinkoCoordinator

PLATFORMS: list[Platform] = [
    Platform.BINARY_SENSOR,
    Platform.BUTTON,
    Platform.COVER,
    Platform.DATE,
    Platform.DEVICE_TRACKER,
    Platform.IMAGE,
    Platform.LOCK,
    Platform.NUMBER,
    Platform.SENSOR,
    Platform.SWITCH,
]

type CarlinkoConfigEntry = ConfigEntry[CarlinkoCoordinator]


async def async_setup(hass: HomeAssistant, config: ConfigType) -> bool:
    """Serve the Lovelace card's static assets from /carlinko."""
    await hass.http.async_register_static_paths(
        [
            StaticPathConfig(
                url_path=f"/{DOMAIN}",
                path=hass.config.path(f"custom_components/{DOMAIN}/www"),
                cache_headers=False,
            )
        ]
    )
    return True


async def async_setup_entry(hass: HomeAssistant, entry: CarlinkoConfigEntry) -> bool:
    """Set up CarLinko from a config entry."""
    session = async_get_clientsession(hass, family=socket.AF_INET)
    api = CarlinkoApi(
        session,
        entry.data[CONF_ACCOUNT],
        entry.data[CONF_PASSWORD],
        entry.data.get(CONF_REGION, DEFAULT_REGION),
        token=entry.data.get(CONF_TOKEN),
    )
    coordinator = CarlinkoCoordinator(hass, entry, api)
    await coordinator.async_config_entry_first_refresh()

    entry.runtime_data = coordinator
    await hass.config_entries.async_forward_entry_setups(entry, PLATFORMS)
    entry.async_on_unload(entry.add_update_listener(_options_updated))
    return True


async def _options_updated(hass: HomeAssistant, entry: CarlinkoConfigEntry) -> None:
    """Re-render the service sensors after a number/date write. No reload needed."""
    entry.runtime_data.async_update_listeners()


async def async_unload_entry(hass: HomeAssistant, entry: CarlinkoConfigEntry) -> bool:
    """Unload a config entry."""
    return await hass.config_entries.async_unload_platforms(entry, PLATFORMS)
