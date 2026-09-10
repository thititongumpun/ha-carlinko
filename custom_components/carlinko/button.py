"""Button platform for the CarLinko integration."""

from __future__ import annotations

from homeassistant.components.button import ButtonEntity
from homeassistant.core import HomeAssistant
from homeassistant.helpers.entity_platform import AddConfigEntryEntitiesCallback

from . import CarlinkoConfigEntry
from .const import OP_STOP_CHARGING
from .entity import CarlinkoEntity


async def async_setup_entry(
    hass: HomeAssistant,
    entry: CarlinkoConfigEntry,
    async_add_entities: AddConfigEntryEntitiesCallback,
) -> None:
    """Set up one stop-charging button per vehicle."""
    coordinator = entry.runtime_data
    async_add_entities(
        CarlinkoStopChargingButton(coordinator, vehicle_id)
        for vehicle_id in coordinator.data
    )


class CarlinkoStopChargingButton(CarlinkoEntity, ButtonEntity):
    """Button to stop an in-progress charge session."""

    _attr_translation_key = "stop_charging"

    def __init__(self, coordinator, vehicle_id: str) -> None:
        super().__init__(coordinator, vehicle_id)
        self._attr_unique_id = f"{self.vehicle['vin']}_{self._attr_translation_key}"

    async def async_press(self) -> None:
        """Stop charging."""
        await self.coordinator.send(self.vehicle_id, OP_STOP_CHARGING)
