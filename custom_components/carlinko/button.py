"""Button platform for the CarLinko integration."""

from __future__ import annotations

from homeassistant.components.button import ButtonEntity
from homeassistant.core import HomeAssistant
from homeassistant.helpers.entity_platform import AddConfigEntryEntitiesCallback

from . import CarlinkoConfigEntry
from .const import OP_FIND_CAR, OP_STOP_CHARGING, OP_WINDOWS_VENT
from .entity import CarlinkoEntity


async def async_setup_entry(
    hass: HomeAssistant,
    entry: CarlinkoConfigEntry,
    async_add_entities: AddConfigEntryEntitiesCallback,
) -> None:
    """Set up the buttons for each vehicle."""
    coordinator = entry.runtime_data
    async_add_entities(
        cls(coordinator, vehicle_id)
        for vehicle_id in coordinator.data
        for cls in (CarlinkoStopChargingButton, CarlinkoVentWindowsButton, CarlinkoFindCarButton)
    )


class CarlinkoStopChargingButton(CarlinkoEntity, ButtonEntity):
    """Button to stop an in-progress charge session."""

    _attr_translation_key = "stop_charging"

    def __init__(self, coordinator, vehicle_id: str) -> None:
        super().__init__(coordinator, vehicle_id)
        self._attr_unique_id = f"{self.vin}_{self._attr_translation_key}"

    async def async_press(self) -> None:
        """Stop charging."""
        await self.coordinator.send(self.vehicle_id, OP_STOP_CHARGING)


class CarlinkoVentWindowsButton(CarlinkoEntity, ButtonEntity):
    """Button to crack all windows open (vent position)."""

    _attr_translation_key = "vent_windows"

    def __init__(self, coordinator, vehicle_id: str) -> None:
        super().__init__(coordinator, vehicle_id)
        self._attr_unique_id = f"{self.vin}_{self._attr_translation_key}"

    async def async_press(self) -> None:
        """Vent windows."""
        # ponytail: 740E00 is a static decode (opcodes.md), not yet runtime-confirmed
        await self.coordinator.send(self.vehicle_id, OP_WINDOWS_VENT)


class CarlinkoFindCarButton(CarlinkoEntity, ButtonEntity):
    """Button to flash lights / horn so you can find the car."""

    _attr_translation_key = "find_car"

    def __init__(self, coordinator, vehicle_id: str) -> None:
        super().__init__(coordinator, vehicle_id)
        self._attr_unique_id = f"{self.vin}_{self._attr_translation_key}"

    async def async_press(self) -> None:
        """Find car."""
        # ponytail: 740400 is a static decode (opcodes.md), not yet runtime-confirmed
        await self.coordinator.send(self.vehicle_id, OP_FIND_CAR)
