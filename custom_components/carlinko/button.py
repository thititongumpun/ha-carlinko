"""Button platform for the CarLinko integration."""

from __future__ import annotations

from dataclasses import dataclass

from homeassistant.components.button import ButtonEntity, ButtonEntityDescription
from homeassistant.core import HomeAssistant
from homeassistant.helpers.entity_platform import AddConfigEntryEntitiesCallback

from . import CarlinkoConfigEntry
from .api import caps
from .const import (
    OP_FIND_CAR,
    OP_QUICK_COOL,
    OP_STOP_CHARGING,
    OP_WINDOWS_VENT,
)
from .entity import CarlinkoEntity


@dataclass(frozen=True, kw_only=True)
class CarlinkoButtonDescription(ButtonEntityDescription):
    """Describes a CarLinko button entity."""

    cap: str
    opcode: str


# ponytail: every opcode here except stop-charging is a static decode
# (opcodes.md), not yet runtime-confirmed.
BUTTON_DESCRIPTIONS: tuple[CarlinkoButtonDescription, ...] = (
    CarlinkoButtonDescription(
        key="stop_charging", cap="charging", opcode=OP_STOP_CHARGING
    ),
    CarlinkoButtonDescription(
        key="vent_windows", cap="windows_vent", opcode=OP_WINDOWS_VENT
    ),
    CarlinkoButtonDescription(key="find_car", cap="find", opcode=OP_FIND_CAR),
    CarlinkoButtonDescription(
        key="quick_cool", cap="quick_cool", icon="mdi:snowflake", opcode=OP_QUICK_COOL
    ),
)


async def async_setup_entry(
    hass: HomeAssistant,
    entry: CarlinkoConfigEntry,
    async_add_entities: AddConfigEntryEntitiesCallback,
) -> None:
    """Set up the buttons each vehicle actually supports."""
    coordinator = entry.runtime_data
    async_add_entities(
        CarlinkoButton(coordinator, vehicle_id, description)
        for vehicle_id, data in coordinator.data.items()
        for description in BUTTON_DESCRIPTIONS
        if caps(data["vehicle"]).get(description.cap)
    )


class CarlinkoButton(CarlinkoEntity, ButtonEntity):
    """A button that fires one remote-control opcode."""

    entity_description: CarlinkoButtonDescription

    def __init__(
        self, coordinator, vehicle_id: str, description: CarlinkoButtonDescription
    ) -> None:
        super().__init__(coordinator, vehicle_id)
        self.entity_description = description
        self._attr_translation_key = description.key
        self._attr_unique_id = f"{self.vin}_{description.key}"

    async def async_press(self) -> None:
        await self.coordinator.send(self.vehicle_id, self.entity_description.opcode)
