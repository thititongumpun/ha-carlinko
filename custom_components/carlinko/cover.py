"""Cover platform for the CarLinko integration (windows)."""

from __future__ import annotations

from typing import Any

from homeassistant.components.cover import CoverDeviceClass, CoverEntity, CoverEntityFeature
from homeassistant.core import HomeAssistant
from homeassistant.helpers.entity_platform import AddConfigEntryEntitiesCallback

from . import CarlinkoConfigEntry
from .api import caps
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
    """Set up the covers (windows, trunk, sunroof) each vehicle supports."""
    coordinator = entry.runtime_data
    async_add_entities(
        cls(coordinator, vehicle_id)
        for vehicle_id, data in coordinator.data.items()
        for cls, cap in (
            (CarlinkoWindows, "windows_open"),
            (CarlinkoTrunk, "liftgate"),
            (CarlinkoSunroof, "sunroof"),
        )
        if caps(data["vehicle"]).get(cap)
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
    # Not DOOR: a tailgate lifts, and only the non-door classes get HA's up/down
    # arrows on the open/close buttons. See cover_icon.ts in the frontend.
    _attr_device_class = CoverDeviceClass.SHUTTER
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
    # Not WINDOW: the panel slides rearward, so the horizontal arrows read right.
    _attr_device_class = CoverDeviceClass.CURTAIN

    def __init__(self, coordinator, vehicle_id: str) -> None:
        super().__init__(coordinator, vehicle_id)
        self._attr_unique_id = f"{self.vin}_{self._attr_translation_key}"

    @property
    def supported_features(self) -> CoverEntityFeature:
        """Drop the tilt button on a sunroof that only opens and closes."""
        features = CoverEntityFeature.OPEN | CoverEntityFeature.CLOSE
        if self.caps.get("sunroof_tilt"):
            features |= CoverEntityFeature.OPEN_TILT
        return features

    @property
    def is_closed(self) -> bool | None:
        v = self.state_data["sunroof"]
        return None if v is None else v == 0

    async def async_open_cover(self, **kwargs: Any) -> None:
        # ponytail: sunroof opcodes are a static decode, not yet runtime-confirmed
        await self.coordinator.send(self.vehicle_id, OP_SUNROOF_OPEN)

    async def async_close_cover(self, **kwargs: Any) -> None:
        await self.coordinator.send(self.vehicle_id, OP_SUNROOF_CLOSE)

    async def async_open_cover_tilt(self, **kwargs: Any) -> None:
        await self.coordinator.send(self.vehicle_id, OP_SUNROOF_TILT)
