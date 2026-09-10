"""Device tracker platform for the CarLinko integration."""

from __future__ import annotations

from typing import Any

from homeassistant.components.device_tracker import TrackerEntity
from homeassistant.core import HomeAssistant
from homeassistant.helpers.entity_platform import AddConfigEntryEntitiesCallback

from . import CarlinkoConfigEntry
from .entity import CarlinkoEntity


async def async_setup_entry(
    hass: HomeAssistant,
    entry: CarlinkoConfigEntry,
    async_add_entities: AddConfigEntryEntitiesCallback,
) -> None:
    """Set up device trackers from a config entry."""
    coordinator = entry.runtime_data
    async_add_entities(
        CarlinkoTracker(coordinator, vehicle_id) for vehicle_id in coordinator.data
    )


class CarlinkoTracker(CarlinkoEntity, TrackerEntity):
    """Tracks a vehicle's last known location."""

    _attr_translation_key = "location"

    def __init__(self, coordinator, vehicle_id: str) -> None:
        super().__init__(coordinator, vehicle_id)
        self._attr_unique_id = f"{self.vin}_location"

    @property
    def _loc(self) -> dict | None:
        return self.coordinator.data[self.vehicle_id]["location"]

    @property
    def latitude(self) -> float | None:
        loc = self._loc
        if not loc:
            return None
        try:
            return float(loc.get("lat"))
        except (TypeError, ValueError):
            return None

    @property
    def longitude(self) -> float | None:
        loc = self._loc
        if not loc:
            return None
        try:
            return float(loc.get("lng"))
        except (TypeError, ValueError):
            return None

    @property
    def extra_state_attributes(self) -> dict[str, Any] | None:
        loc = self._loc
        return {"address": loc.get("address")} if loc else None
