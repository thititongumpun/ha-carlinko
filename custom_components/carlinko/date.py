"""Date platform: the date the vehicle was last serviced."""

from __future__ import annotations

from datetime import date

from homeassistant.components.date import DateEntity
from homeassistant.const import EntityCategory
from homeassistant.core import HomeAssistant
from homeassistant.helpers.entity_platform import AddConfigEntryEntitiesCallback

from . import CarlinkoConfigEntry
from .entity import CarlinkoEntity


async def async_setup_entry(
    hass: HomeAssistant,
    entry: CarlinkoConfigEntry,
    async_add_entities: AddConfigEntryEntitiesCallback,
) -> None:
    """Set up the last-service date for each vehicle."""
    coordinator = entry.runtime_data
    async_add_entities(
        CarlinkoLastServiceDate(coordinator, vehicle_id) for vehicle_id in coordinator.data
    )


class CarlinkoLastServiceDate(CarlinkoEntity, DateEntity):
    """The date of the last dealer service, tracked by hand."""

    _attr_entity_category = EntityCategory.CONFIG
    _attr_translation_key = "last_service_date"

    def __init__(self, coordinator, vehicle_id: str) -> None:
        super().__init__(coordinator, vehicle_id)
        self._attr_unique_id = f"{self.vin}_{self._attr_translation_key}"

    @property
    def native_value(self) -> date | None:
        """Return the stored date, or None when never set."""
        stored = self.service.get("last_date")
        return date.fromisoformat(stored) if stored else None

    async def async_set_value(self, value: date) -> None:
        """Store the date in the config entry options."""
        self.set_service("last_date", value.isoformat())
