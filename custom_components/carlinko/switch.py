"""Switch platform for the CarLinko integration."""

from __future__ import annotations

from collections.abc import Callable
from dataclasses import dataclass
from typing import Any

from homeassistant.components.switch import (
    SwitchDeviceClass,
    SwitchEntity,
    SwitchEntityDescription,
)
from homeassistant.core import HomeAssistant
from homeassistant.helpers.entity_platform import AddConfigEntryEntitiesCallback

from . import CarlinkoConfigEntry
from .api import caps
from .const import OP_AC_OFF, OP_AC_ON, OP_DEFOG_OFF, OP_DEFOG_ON
from .entity import CarlinkoEntity


@dataclass(frozen=True, kw_only=True)
class CarlinkoSwitchDescription(SwitchEntityDescription):
    """Describes a CarLinko switch entity."""

    cap: str
    is_on_fn: Callable[[dict], bool | None]
    on_opcode: str
    off_opcode: str


SWITCH_DESCRIPTIONS: tuple[CarlinkoSwitchDescription, ...] = (
    # ponytail: A/C opcodes are a static decode (opcodes.md); confirm with
    # tools/cli.py send before trusting.
    CarlinkoSwitchDescription(
        key="climate",
        cap="ac",
        device_class=SwitchDeviceClass.SWITCH,
        is_on_fn=lambda d: d["ac_on"],
        on_opcode=OP_AC_ON,
        off_opcode=OP_AC_OFF,
    ),
    # The blob has no defog flag of its own, so this switch is write-only and
    # reports unknown. ponytail: point is_on_fn at a byte if the probe finds one.
    CarlinkoSwitchDescription(
        key="defog",
        cap="defog",
        icon="mdi:car-defrost-front",
        is_on_fn=lambda d: None,
        on_opcode=OP_DEFOG_ON,
        off_opcode=OP_DEFOG_OFF,
    ),
)


async def async_setup_entry(
    hass: HomeAssistant,
    entry: CarlinkoConfigEntry,
    async_add_entities: AddConfigEntryEntitiesCallback,
) -> None:
    """Set up the switches each vehicle actually supports."""
    coordinator = entry.runtime_data
    async_add_entities(
        CarlinkoSwitch(coordinator, vehicle_id, description)
        for vehicle_id, data in coordinator.data.items()
        for description in SWITCH_DESCRIPTIONS
        if caps(data["vehicle"]).get(description.cap)
    )


class CarlinkoSwitch(CarlinkoEntity, SwitchEntity):
    """A remote-control switch backed by an on/off opcode pair."""

    entity_description: CarlinkoSwitchDescription

    def __init__(
        self, coordinator, vehicle_id: str, description: CarlinkoSwitchDescription
    ) -> None:
        super().__init__(coordinator, vehicle_id)
        self.entity_description = description
        self._attr_translation_key = description.key
        self._attr_unique_id = f"{self.vin}_{description.key}"

    @property
    def is_on(self) -> bool | None:
        """Return True when the feature is on, None when the car does not say."""
        return self.entity_description.is_on_fn(self.state_data)

    async def async_turn_on(self, **kwargs: Any) -> None:
        await self.coordinator.send(self.vehicle_id, self.entity_description.on_opcode)

    async def async_turn_off(self, **kwargs: Any) -> None:
        await self.coordinator.send(self.vehicle_id, self.entity_description.off_opcode)
