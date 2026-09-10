"""Sensor platform for the CarLinko integration."""

from __future__ import annotations

from collections.abc import Callable
from dataclasses import dataclass
from datetime import date, timedelta
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
    UnitOfEnergy,
    UnitOfTemperature,
    UnitOfLength,
    UnitOfPower,
    UnitOfPressure,
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

    value_fn: Callable[[dict], Any] | None = None
    service_fn: Callable[[int | None, int | None], Any] | None = None


def service_left(service: dict, odometer: int | None) -> tuple[int | None, int | None]:
    """Kilometres and days left until the next service; None where inputs are unset."""
    last_km = service.get("last_odometer")
    km = None if last_km is None or odometer is None else last_km + service["interval_km"] - odometer
    last_date = service.get("last_date")
    days = (
        None
        if not last_date
        else (
            date.fromisoformat(last_date) + timedelta(days=service["interval_days"]) - date.today()
        ).days
    )
    return km, days


def next_service(km: int | None, days: int | None) -> str:
    """Which limit the next service will hit first."""
    if km is None or days is None:
        return "unset"
    if km <= 0 or days <= 0:
        return "overdue"
    # ponytail: flat 50 km/day assumption; read the odometer trend if it ever matters
    return "km" if km / 50 < days else "days"


SENSOR_DESCRIPTIONS: tuple[CarlinkoSensorDescription, ...] = (
    CarlinkoSensorDescription(
        key="battery",
        device_class=SensorDeviceClass.BATTERY,
        native_unit_of_measurement=PERCENTAGE,
        state_class=SensorStateClass.MEASUREMENT,
        suggested_display_precision=0,
        value_fn=lambda d: d["battery_pct"],
    ),
    CarlinkoSensorDescription(
        key="range",
        device_class=SensorDeviceClass.DISTANCE,
        native_unit_of_measurement=UnitOfLength.KILOMETERS,
        state_class=SensorStateClass.MEASUREMENT,
        suggested_display_precision=0,
        value_fn=lambda d: d["range_km"],
    ),
    CarlinkoSensorDescription(
        key="odometer",
        device_class=SensorDeviceClass.DISTANCE,
        native_unit_of_measurement=UnitOfLength.KILOMETERS,
        state_class=SensorStateClass.TOTAL_INCREASING,
        suggested_display_precision=0,
        value_fn=lambda d: d["odometer"],
    ),
    CarlinkoSensorDescription(
        key="charge_power",
        device_class=SensorDeviceClass.POWER,
        native_unit_of_measurement=UnitOfPower.KILO_WATT,
        state_class=SensorStateClass.MEASUREMENT,
        suggested_display_precision=1,
        value_fn=lambda d: d["charge_power_kw"],
    ),
    CarlinkoSensorDescription(
        key="charge_remaining",
        device_class=SensorDeviceClass.DURATION,
        native_unit_of_measurement=UnitOfTime.MINUTES,
        state_class=SensorStateClass.MEASUREMENT,
        suggested_display_precision=0,
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
        suggested_display_precision=2,
        value_fn=lambda d: d["volt12"],
    ),
    CarlinkoSensorDescription(
        key="speed",
        device_class=SensorDeviceClass.SPEED,
        native_unit_of_measurement=UnitOfSpeed.KILOMETERS_PER_HOUR,
        state_class=SensorStateClass.MEASUREMENT,
        suggested_display_precision=1,
        value_fn=lambda d: d["speed"],
    ),
    CarlinkoSensorDescription(
        key="ac_temp",
        device_class=SensorDeviceClass.TEMPERATURE,
        native_unit_of_measurement=UnitOfTemperature.CELSIUS,
        value_fn=lambda d: d["ac_temp"],
    ),
    CarlinkoSensorDescription(
        key="consumption",
        native_unit_of_measurement=f"{UnitOfEnergy.KILO_WATT_HOUR}/100km",
        state_class=SensorStateClass.MEASUREMENT,
        suggested_display_precision=1,
        value_fn=lambda d: d["consumption"],
    ),
    CarlinkoSensorDescription(
        key="wltc_range",
        device_class=SensorDeviceClass.DISTANCE,
        native_unit_of_measurement=UnitOfLength.KILOMETERS,
        state_class=SensorStateClass.MEASUREMENT,
        suggested_display_precision=0,
        value_fn=lambda d: d["wltc_range"],
    ),
    CarlinkoSensorDescription(
        key="tyre_fl_pressure",
        device_class=SensorDeviceClass.PRESSURE,
        native_unit_of_measurement=UnitOfPressure.KPA,
        state_class=SensorStateClass.MEASUREMENT,
        suggested_display_precision=2,
        value_fn=lambda d, k=f"tyre_fl_pressure": d[k],
    ),
    CarlinkoSensorDescription(
        key="tyre_fl_temp",
        device_class=SensorDeviceClass.TEMPERATURE,
        native_unit_of_measurement=UnitOfTemperature.CELSIUS,
        state_class=SensorStateClass.MEASUREMENT,
        suggested_display_precision=1,
        value_fn=lambda d, k=f"tyre_fl_temp": d[k],
    ),
    CarlinkoSensorDescription(
        key="tyre_fr_pressure",
        device_class=SensorDeviceClass.PRESSURE,
        native_unit_of_measurement=UnitOfPressure.KPA,
        state_class=SensorStateClass.MEASUREMENT,
        suggested_display_precision=2,
        value_fn=lambda d, k=f"tyre_fr_pressure": d[k],
    ),
    CarlinkoSensorDescription(
        key="tyre_fr_temp",
        device_class=SensorDeviceClass.TEMPERATURE,
        native_unit_of_measurement=UnitOfTemperature.CELSIUS,
        state_class=SensorStateClass.MEASUREMENT,
        suggested_display_precision=1,
        value_fn=lambda d, k=f"tyre_fr_temp": d[k],
    ),
    CarlinkoSensorDescription(
        key="tyre_rl_pressure",
        device_class=SensorDeviceClass.PRESSURE,
        native_unit_of_measurement=UnitOfPressure.KPA,
        state_class=SensorStateClass.MEASUREMENT,
        suggested_display_precision=2,
        value_fn=lambda d, k=f"tyre_rl_pressure": d[k],
    ),
    CarlinkoSensorDescription(
        key="tyre_rl_temp",
        device_class=SensorDeviceClass.TEMPERATURE,
        native_unit_of_measurement=UnitOfTemperature.CELSIUS,
        state_class=SensorStateClass.MEASUREMENT,
        suggested_display_precision=1,
        value_fn=lambda d, k=f"tyre_rl_temp": d[k],
    ),
    CarlinkoSensorDescription(
        key="tyre_rr_pressure",
        device_class=SensorDeviceClass.PRESSURE,
        native_unit_of_measurement=UnitOfPressure.KPA,
        state_class=SensorStateClass.MEASUREMENT,
        suggested_display_precision=2,
        value_fn=lambda d, k=f"tyre_rr_pressure": d[k],
    ),
    CarlinkoSensorDescription(
        key="tyre_rr_temp",
        device_class=SensorDeviceClass.TEMPERATURE,
        native_unit_of_measurement=UnitOfTemperature.CELSIUS,
        state_class=SensorStateClass.MEASUREMENT,
        suggested_display_precision=1,
        value_fn=lambda d, k=f"tyre_rr_temp": d[k],
    ),
    CarlinkoSensorDescription(
        key="km_until_service",
        device_class=SensorDeviceClass.DISTANCE,
        native_unit_of_measurement=UnitOfLength.KILOMETERS,
        suggested_display_precision=0,
        service_fn=lambda km, days: km,
    ),
    CarlinkoSensorDescription(
        key="days_until_service",
        device_class=SensorDeviceClass.DURATION,
        native_unit_of_measurement=UnitOfTime.DAYS,
        suggested_display_precision=0,
        service_fn=lambda km, days: days,
    ),
    CarlinkoSensorDescription(
        key="next_service",
        device_class=SensorDeviceClass.ENUM,
        options=["overdue", "km", "days", "unset"],
        service_fn=next_service,
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
        self._attr_unique_id = f"{self.vin}_{description.key}"

    @property
    def _service_left(self) -> tuple[int | None, int | None]:
        return service_left(self.service, self.state_data["odometer"])

    @property
    def native_value(self) -> Any:
        """Return the state of the sensor."""
        if self.entity_description.service_fn:
            return self.entity_description.service_fn(*self._service_left)
        return self.entity_description.value_fn(self.state_data)

    @property
    def extra_state_attributes(self) -> dict[str, Any] | None:
        """Expose the raw km/days figures behind the next-service verdict."""
        if self.entity_description.key != "next_service":
            return None
        km, days = self._service_left
        return {"km": km, "days": days}
