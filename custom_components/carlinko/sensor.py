"""Sensor platform for the CarLinko integration."""

from __future__ import annotations

from collections.abc import Callable
from dataclasses import dataclass
from typing import Any

from homeassistant.components.sensor import (
    SensorDeviceClass,
    SensorEntity,
    SensorEntityDescription,
    SensorStateClass,
)
from homeassistant.const import (
    PERCENTAGE,
    UnitOfElectricPotential,
    UnitOfLength,
    UnitOfPower,
    UnitOfSpeed,
    UnitOfTime,
)
from homeassistant.core import HomeAssistant
from homeassistant.helpers.entity_platform import AddConfigEntryEntitiesCallback

from . import CarlinkoConfigEntry
from .entity import CarlinkoEntity

_CHARGE_STATE = {0: "idle", 1: "charging", 2: "complete", 3: "canceled", 4: "hot", 5: "stopped"}
_CHARGE_MODE = {0: "none", 1: "ac", 16: "dc"}


@dataclass(frozen=True, kw_only=True)
class CarlinkoSensorDescription(SensorEntityDescription):
    """Describes a CarLinko sensor entity."""

    value_fn: Callable[[dict], Any]


SENSOR_DESCRIPTIONS: tuple[CarlinkoSensorDescription, ...] = (
    CarlinkoSensorDescription(
        key="battery",
        device_class=SensorDeviceClass.BATTERY,
        native_unit_of_measurement=PERCENTAGE,
        state_class=SensorStateClass.MEASUREMENT,
        value_fn=lambda d: d["battery_pct"],
    ),
    CarlinkoSensorDescription(
        key="range",
        device_class=SensorDeviceClass.DISTANCE,
        native_unit_of_measurement=UnitOfLength.KILOMETERS,
        state_class=SensorStateClass.MEASUREMENT,
        value_fn=lambda d: d["range_km"],
    ),
    CarlinkoSensorDescription(
        key="odometer",
        device_class=SensorDeviceClass.DISTANCE,
        native_unit_of_measurement=UnitOfLength.KILOMETERS,
        state_class=SensorStateClass.TOTAL_INCREASING,
        value_fn=lambda d: d["odometer"],
    ),
    CarlinkoSensorDescription(
        key="charge_power",
        device_class=SensorDeviceClass.POWER,
        native_unit_of_measurement=UnitOfPower.KILO_WATT,
        state_class=SensorStateClass.MEASUREMENT,
        value_fn=lambda d: d["charge_power_kw"],
    ),
    CarlinkoSensorDescription(
        key="charge_remaining",
        device_class=SensorDeviceClass.DURATION,
        native_unit_of_measurement=UnitOfTime.MINUTES,
        state_class=SensorStateClass.MEASUREMENT,
        value_fn=lambda d: d["charge_remain_min"],
    ),
    CarlinkoSensorDescription(
        key="charge_state",
        device_class=SensorDeviceClass.ENUM,
        options=list(_CHARGE_STATE.values()),
        value_fn=lambda d: _CHARGE_STATE.get(d["charge_state"]),
    ),
    CarlinkoSensorDescription(
        key="charge_mode",
        device_class=SensorDeviceClass.ENUM,
        options=list(_CHARGE_MODE.values()),
        value_fn=lambda d: _CHARGE_MODE.get(d["charge_mode"]),
    ),
    CarlinkoSensorDescription(
        key="volt12",
        device_class=SensorDeviceClass.VOLTAGE,
        native_unit_of_measurement=UnitOfElectricPotential.VOLT,
        state_class=SensorStateClass.MEASUREMENT,
        value_fn=lambda d: d["volt12"],
    ),
    CarlinkoSensorDescription(
        key="speed",
        device_class=SensorDeviceClass.SPEED,
        native_unit_of_measurement=UnitOfSpeed.KILOMETERS_PER_HOUR,
        state_class=SensorStateClass.MEASUREMENT,
        value_fn=lambda d: d["speed"],
    ),
)


async def async_setup_entry(
    hass: HomeAssistant,
    entry: CarlinkoConfigEntry,
    async_add_entities: AddConfigEntryEntitiesCallback,
) -> None:
    """Set up CarLinko sensors from a config entry."""
    coordinator = entry.runtime_data
    async_add_entities(
        CarlinkoSensor(coordinator, vehicle_id, description)
        for vehicle_id in coordinator.data
        for description in SENSOR_DESCRIPTIONS
    )


class CarlinkoSensor(CarlinkoEntity, SensorEntity):
    """A single telemetry sensor for one vehicle."""

    entity_description: CarlinkoSensorDescription

    def __init__(self, coordinator, vehicle_id: str, description: CarlinkoSensorDescription) -> None:
        super().__init__(coordinator, vehicle_id)
        self.entity_description = description
        self._attr_translation_key = description.key
        self._attr_unique_id = f"{self.vehicle['vin']}_{description.key}"

    @property
    def native_value(self) -> Any:
        """Return the state of the sensor."""
        return self.entity_description.value_fn(self.state_data)
