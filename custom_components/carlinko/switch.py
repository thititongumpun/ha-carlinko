"""Switch platform for the CarLinko integration."""

from __future__ import annotations

from typing import Any

from homeassistant.components.switch import SwitchDeviceClass, SwitchEntity
from homeassistant.core import HomeAssistant
from homeassistant.helpers.entity_platform import AddConfigEntryEntitiesCallback

from . import CarlinkoConfigEntry
from .const import OP_AC_OFF, OP_AC_ON
from .entity import CarlinkoEntity


async def async_setup_entry(
    hass: HomeAssistant,
    entry: CarlinkoConfigEntry,
    async_add_entities: AddConfigEntryEntitiesCallback,
) -> None:
    """Set up one climate switch per vehicle."""
    coordinator = entry.runtime_data
    async_add_entities(
        CarlinkoClimateSwitch(coordinator, vehicle_id)
        for vehicle_id in coordinator.data
    )


class CarlinkoClimateSwitch(CarlinkoEntity, SwitchEntity):
    """Remote air-conditioning switch for a vehicle.

    # ponytail: A/C opcodes are a static decode (opcodes.md); confirm with
    # tools/cli.py send before trusting.
    """

    _attr_translation_key = "climate"
    _attr_device_class = SwitchDeviceClass.SWITCH

    def __init__(self, coordinator, vehicle_id: str) -> None:
        super().__init__(coordinator, vehicle_id)
        self._attr_unique_id = f"{self.vin}_{self._attr_translation_key}"

    @property
    def is_on(self) -> bool | None:
        """Return True if the A/C is on."""
        return self.state_data["ac_on"]

    async def async_turn_on(self, **kwargs: Any) -> None:
        """Turn the A/C on."""
        await self.coordinator.send(self.vehicle_id, OP_AC_ON)

    async def async_turn_off(self, **kwargs: Any) -> None:
        """Turn the A/C off."""
        await self.coordinator.send(self.vehicle_id, OP_AC_OFF)
