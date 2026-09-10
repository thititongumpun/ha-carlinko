"""Binary sensor platform for the CarLinko integration."""

from __future__ import annotations

from collections.abc import Callable
from dataclasses import dataclass

from homeassistant.components.binary_sensor import (
    BinarySensorDeviceClass,
    BinarySensorEntity,
    BinarySensorEntityDescription,
)
from homeassistant.core import HomeAssistant
from homeassistant.helpers.entity_platform import AddConfigEntryEntitiesCallback

from . import CarlinkoConfigEntry
from .entity import CarlinkoEntity


@dataclass(frozen=True, kw_only=True)
class CarlinkoBinarySensorDescription(BinarySensorEntityDescription):
    """Describes a CarLinko binary sensor entity."""

    is_on_fn: Callable[[dict], bool | None]


BINARY_SENSOR_DESCRIPTIONS: tuple[CarlinkoBinarySensorDescription, ...] = (
    CarlinkoBinarySensorDescription(
        key="door_open",
        device_class=BinarySensorDeviceClass.DOOR,
        is_on_fn=lambda d: None if d["doors"] is None else d["doors"] != 0,
    ),
    CarlinkoBinarySensorDescription(
        key="trunk_open",
        device_class=BinarySensorDeviceClass.OPENING,
        is_on_fn=lambda d: None if d["trunk"] is None else d["trunk"] != 0,
    ),
    CarlinkoBinarySensorDescription(
        key="charging",
        device_class=BinarySensorDeviceClass.BATTERY_CHARGING,
        is_on_fn=lambda d: None if d["charge_state"] is None else d["charge_state"] == 1,
    ),
    CarlinkoBinarySensorDescription(
        key="plugged_in",
        device_class=BinarySensorDeviceClass.PLUG,
        is_on_fn=lambda d: None if d["charge_mode"] is None else d["charge_mode"] != 0,
    ),
    CarlinkoBinarySensorDescription(
        key="ac_on",
        device_class=BinarySensorDeviceClass.RUNNING,
        is_on_fn=lambda d: d["ac_on"],
    ),
    CarlinkoBinarySensorDescription(
        key="hv_active",
        device_class=BinarySensorDeviceClass.POWER,
        is_on_fn=lambda d: None if d["hv_state"] is None else d["hv_state"] != 0,
    ),
)


async def async_setup_entry(
    hass: HomeAssistant,
    entry: CarlinkoConfigEntry,
    async_add_entities: AddConfigEntryEntitiesCallback,
) -> None:
    """Set up CarLinko binary sensors from a config entry."""
    coordinator = entry.runtime_data
    async_add_entities(
        CarlinkoBinarySensor(coordinator, vehicle_id, description)
        for vehicle_id in coordinator.data
        for description in BINARY_SENSOR_DESCRIPTIONS
    )


class CarlinkoBinarySensor(CarlinkoEntity, BinarySensorEntity):
    """A single boolean-ish status flag for one vehicle."""

    entity_description: CarlinkoBinarySensorDescription

    def __init__(
        self, coordinator, vehicle_id: str, description: CarlinkoBinarySensorDescription
    ) -> None:
        super().__init__(coordinator, vehicle_id)
        self.entity_description = description
        self._attr_translation_key = description.key
        self._attr_unique_id = f"{self.vehicle['vin']}_{description.key}"

    @property
    def is_on(self) -> bool | None:
        """Return true if the condition is on."""
        return self.entity_description.is_on_fn(self.state_data)
