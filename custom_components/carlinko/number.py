"""Number platform: manually tracked service reminder settings."""

from __future__ import annotations

from dataclasses import dataclass

from homeassistant.components.number import (
    NumberDeviceClass,
    NumberEntity,
    NumberEntityDescription,
    NumberMode,
)
from homeassistant.const import (
    EntityCategory,
    UnitOfEnergy,
    UnitOfLength,
    UnitOfTemperature,
    UnitOfTime,
)
from homeassistant.core import HomeAssistant
from homeassistant.helpers.entity_platform import AddConfigEntryEntitiesCallback

from . import CarlinkoConfigEntry
from .api import caps
from .const import OP_AC_TEMP
from .entity import CarlinkoEntity


@dataclass(frozen=True, kw_only=True)
class CarlinkoNumberDescription(NumberEntityDescription):
    """Describes a CarLinko service-setting number entity."""

    option: str


NUMBER_DESCRIPTIONS: tuple[CarlinkoNumberDescription, ...] = (
    CarlinkoNumberDescription(
        key="last_service_odometer",
        option="last_odometer",
        device_class=NumberDeviceClass.DISTANCE,
        native_unit_of_measurement=UnitOfLength.KILOMETERS,
        native_min_value=0,
        native_max_value=2_000_000,
        native_step=1,
    ),
    CarlinkoNumberDescription(
        key="service_interval_km",
        option="interval_km",
        device_class=NumberDeviceClass.DISTANCE,
        native_unit_of_measurement=UnitOfLength.KILOMETERS,
        native_min_value=1000,
        native_max_value=100000,
        native_step=1000,
    ),
    CarlinkoNumberDescription(
        key="service_interval_days",
        option="interval_days",
        native_unit_of_measurement=UnitOfTime.DAYS,
        native_min_value=30,
        native_max_value=1095,
        native_step=1,
    ),
    CarlinkoNumberDescription(
        key="battery_capacity",
        option="battery_kwh",
        device_class=NumberDeviceClass.ENERGY_STORAGE,
        native_unit_of_measurement=UnitOfEnergy.KILO_WATT_HOUR,
        native_min_value=10,
        native_max_value=200,
        native_step=1,
    ),
)


async def async_setup_entry(
    hass: HomeAssistant,
    entry: CarlinkoConfigEntry,
    async_add_entities: AddConfigEntryEntitiesCallback,
) -> None:
    """Set up the service-setting numbers for each vehicle."""
    coordinator = entry.runtime_data
    async_add_entities(
        CarlinkoServiceNumber(coordinator, vehicle_id, description)
        for vehicle_id in coordinator.data
        for description in NUMBER_DESCRIPTIONS
    )
    async_add_entities(
        CarlinkoAcTemp(coordinator, vehicle_id)
        for vehicle_id, data in coordinator.data.items()
        if caps(data["vehicle"]).get("set_temp")
    )


class CarlinkoServiceNumber(CarlinkoEntity, NumberEntity):
    """One service setting stored in the config entry options."""

    entity_description: CarlinkoNumberDescription
    _attr_entity_category = EntityCategory.CONFIG
    _attr_mode = NumberMode.BOX

    def __init__(self, coordinator, vehicle_id: str, description: CarlinkoNumberDescription) -> None:
        super().__init__(coordinator, vehicle_id)
        self.entity_description = description
        self._attr_translation_key = description.key
        self._attr_unique_id = f"{self.vin}_{description.key}"

    @property
    def native_value(self) -> float | None:
        """Return the stored setting, or None when never set."""
        return self.service.get(self.entity_description.option)

    async def async_set_native_value(self, value: float) -> None:
        """Store the setting in the config entry options."""
        self.set_service(self.entity_description.option, int(value))


class CarlinkoAcTemp(CarlinkoEntity, NumberEntity):
    """A/C target temperature: reads blob byte 24, writes 7411 + plain °C."""

    _attr_translation_key = "ac_temp_set"
    _attr_device_class = NumberDeviceClass.TEMPERATURE
    _attr_native_unit_of_measurement = UnitOfTemperature.CELSIUS
    # shortcut: fixed C5 range and plain-°C byte; read SetTemperature's range and
    # the half-degree encoding if a J5/Tiggo owner reports a refusal.
    _attr_native_min_value = 15
    _attr_native_max_value = 31
    _attr_native_step = 1
    _attr_mode = NumberMode.SLIDER

    def __init__(self, coordinator, vehicle_id: str) -> None:
        super().__init__(coordinator, vehicle_id)
        self._attr_unique_id = f"{self.vin}_ac_temp_set"

    @property
    def native_value(self) -> float | None:
        return self.state_data["ac_temp"]

    async def async_set_native_value(self, value: float) -> None:
        await self.coordinator.send(self.vehicle_id, f"{OP_AC_TEMP}{int(value):02X}")
