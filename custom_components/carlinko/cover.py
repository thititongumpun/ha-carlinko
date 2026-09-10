"""Cover platform for the CarLinko integration (windows)."""

from __future__ import annotations

from typing import Any

from homeassistant.components.cover import CoverDeviceClass, CoverEntity, CoverEntityFeature
from homeassistant.core import HomeAssistant
from homeassistant.helpers.entity_platform import AddConfigEntryEntitiesCallback

from . import CarlinkoConfigEntry
from .const import OP_WINDOWS_CLOSE, OP_WINDOWS_OPEN
from .entity import CarlinkoEntity


async def async_setup_entry(
    hass: HomeAssistant,
    entry: CarlinkoConfigEntry,
    async_add_entities: AddConfigEntryEntitiesCallback,
) -> None:
    """Set up one windows cover per vehicle."""
    coordinator = entry.runtime_data
    async_add_entities(
        CarlinkoWindows(coordinator, vehicle_id) for vehicle_id in coordinator.data
    )


class CarlinkoWindows(CarlinkoEntity, CoverEntity):
    """All windows as one cover: open / close (vent is a separate button)."""

    _attr_translation_key = "windows"
    _attr_device_class = CoverDeviceClass.WINDOW
    _attr_supported_features = CoverEntityFeature.OPEN | CoverEntityFeature.CLOSE

    def __init__(self, coordinator, vehicle_id: str) -> None:
        super().__init__(coordinator, vehicle_id)
        self._attr_unique_id = f"{self.vin}_{self._attr_translation_key}"

    @property
    def is_closed(self) -> bool | None:
        # ponytail: byte 8 packs 2 bits per window; we only report "all closed" vs not.
        w = self.state_data["windows"]
        return None if w is None else w == 0

    async def async_open_cover(self, **kwargs: Any) -> None:
        await self.coordinator.send(self.vehicle_id, OP_WINDOWS_OPEN)

    async def async_close_cover(self, **kwargs: Any) -> None:
        await self.coordinator.send(self.vehicle_id, OP_WINDOWS_CLOSE)
