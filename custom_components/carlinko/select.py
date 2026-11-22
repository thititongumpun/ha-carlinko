"""Select platform: seat ventilation levels."""

from __future__ import annotations

from homeassistant.components.select import SelectEntity, SelectEntityDescription
from homeassistant.core import HomeAssistant
from homeassistant.helpers.entity_platform import AddConfigEntryEntitiesCallback

from . import CarlinkoConfigEntry
from .api import CHARGE_LIMITS, caps
from .const import OP_SEAT
from .entity import CarlinkoEntity

OFF = "off"


SEAT_DESCRIPTIONS: tuple[SelectEntityDescription, ...] = tuple(
    SelectEntityDescription(key=key, icon="mdi:car-seat-cooler") for key in OP_SEAT
)


async def async_setup_entry(
    hass: HomeAssistant,
    entry: CarlinkoConfigEntry,
    async_add_entities: AddConfigEntryEntitiesCallback,
) -> None:
    """Set up one select per seat vent the vehicle reports having."""
    coordinator = entry.runtime_data
    async_add_entities(
        CarlinkoSeatSelect(coordinator, vehicle_id, description, levels)
        for vehicle_id, data in coordinator.data.items()
        for description in SEAT_DESCRIPTIONS
        if (levels := caps(data["vehicle"]).get(description.key, 0))
    )
    # the C5 stores a default targetSoc but its app has no slider, so gate on the flag
    async_add_entities(
        CarlinkoChargeLimitSelect(coordinator, vehicle_id)
        for vehicle_id, data in coordinator.data.items()
        if caps(data["vehicle"]).get("soc_limit")
    )


class CarlinkoSeatSelect(CarlinkoEntity, SelectEntity):
    """Seat ventilation as off / l1 / l2 / l3, capped at what the car has."""


    def __init__(
        self,
        coordinator,
        vehicle_id: str,
        description: SelectEntityDescription,
        levels: int,
    ) -> None:
        super().__init__(coordinator, vehicle_id)
        self.entity_description = description
        self._attr_translation_key = description.key
        self._attr_unique_id = f"{self.vin}_{description.key}"
        self._attr_options = [OFF, *(f"l{i}" for i in range(1, levels + 1))]

    @property
    def current_option(self) -> str | None:
        """Map the raw level byte onto our options; anything else is unknown."""
        level = self.state_data[self.entity_description.key]
        if level is None:
            return None
        return self._attr_options[level] if level < len(self._attr_options) else None

    async def async_select_option(self, option: str) -> None:
        level = 0 if option == OFF else int(option[1:])
        opcode = f"{OP_SEAT[self.entity_description.key]}{level:02X}"
        await self.coordinator.send(self.vehicle_id, opcode)


class CarlinkoChargeLimitSelect(CarlinkoEntity, SelectEntity):
    """Charge limit (80 / 90 / 100 %), a plain REST cloud setting rather than a remote-control opcode."""

    _attr_icon = "mdi:battery-charging-high"
    _attr_options = [str(v) for v in CHARGE_LIMITS]

    def __init__(self, coordinator, vehicle_id: str) -> None:
        super().__init__(coordinator, vehicle_id)
        self._attr_translation_key = "charge_limit"
        self._attr_unique_id = f"{self.vin}_charge_limit"

    @property
    def current_option(self) -> str | None:
        return str(v) if (v := self.state_data.get("target_soc")) else None

    async def async_select_option(self, option: str) -> None:
        await self.coordinator.set_charge_limit(self.vehicle_id, int(option))
