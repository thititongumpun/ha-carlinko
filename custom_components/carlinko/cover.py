"""Cover platform for the CarLinko integration (windows)."""

from __future__ import annotations

from typing import Any

from homeassistant.components.cover import CoverDeviceClass, CoverEntity, CoverEntityFeature
from homeassistant.core import HomeAssistant
from homeassistant.helpers.entity_platform import AddConfigEntryEntitiesCallback

from . import CarlinkoConfigEntry
from .const import (
    OP_SUNROOF_CLOSE,
    OP_SUNROOF_OPEN,
    OP_SUNROOF_TILT,
    OP_TRUNK_CLOSE,
    OP_TRUNK_OPEN,
    OP_WINDOWS_CLOSE,
    OP_WINDOWS_OPEN,
)
from .entity import CarlinkoEntity


async def async_setup_entry(
    hass: HomeAssistant,
    entry: CarlinkoConfigEntry,
    async_add_entities: AddConfigEntryEntitiesCallback,
) -> None:
    """Set up the covers (windows, trunk, sunroof) for each vehicle."""
    coordinator = entry.runtime_data
    async_add_entities(
        cls(coordinator, vehicle_id)
        for vehicle_id in coordinator.data
        for cls in (CarlinkoWindows, CarlinkoTrunk, CarlinkoSunroof)
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


class CarlinkoTrunk(CarlinkoEntity, CoverEntity):
    """Tailgate: open / close. State from telemetry byte 4."""

    _attr_translation_key = "trunk"
    _attr_device_class = CoverDeviceClass.DOOR
    _attr_supported_features = CoverEntityFeature.OPEN | CoverEntityFeature.CLOSE

    def __init__(self, coordinator, vehicle_id: str) -> None:
        super().__init__(coordinator, vehicle_id)
        self._attr_unique_id = f"{self.vin}_{self._attr_translation_key}"

    @property
    def is_closed(self) -> bool | None:
        t = self.state_data["trunk"]
        return None if t is None else t == 0

    async def async_open_cover(self, **kwargs: Any) -> None:
        await self.coordinator.send(self.vehicle_id, OP_TRUNK_OPEN)

    async def async_close_cover(self, **kwargs: Any) -> None:
        await self.coordinator.send(self.vehicle_id, OP_TRUNK_CLOSE)


class CarlinkoSunroof(CarlinkoEntity, CoverEntity):
    """Sunroof: open / close / tilt. State from telemetry byte 9 (0 = closed)."""

    _attr_translation_key = "sunroof"
    _attr_device_class = CoverDeviceClass.WINDOW
    _attr_supported_features = (
        CoverEntityFeature.OPEN | CoverEntityFeature.CLOSE | CoverEntityFeature.OPEN_TILT
    )

    def __init__(self, coordinator, vehicle_id: str) -> None:
        super().__init__(coordinator, vehicle_id)
        self._attr_unique_id = f"{self.vin}_{self._attr_translation_key}"

    @property
    def is_closed(self) -> bool | None:
        # ponytail: always created; disable it in HA if the car has no opening sunroof
        v = self.state_data["sunroof"]
        return None if v is None else v == 0

    async def async_open_cover(self, **kwargs: Any) -> None:
        # ponytail: sunroof opcodes are a static decode, not yet runtime-confirmed
        await self.coordinator.send(self.vehicle_id, OP_SUNROOF_OPEN)

    async def async_close_cover(self, **kwargs: Any) -> None:
        await self.coordinator.send(self.vehicle_id, OP_SUNROOF_CLOSE)

    async def async_open_cover_tilt(self, **kwargs: Any) -> None:
        await self.coordinator.send(self.vehicle_id, OP_SUNROOF_TILT)
