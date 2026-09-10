"""Base entity for the CarLinko integration."""

from __future__ import annotations

from homeassistant.helpers.device_registry import DeviceInfo
from homeassistant.helpers.update_coordinator import CoordinatorEntity

from .const import DOMAIN
from .coordinator import CarlinkoCoordinator


class CarlinkoEntity(CoordinatorEntity[CarlinkoCoordinator]):
    """Common device_info and data accessors for one vehicle."""

    _attr_has_entity_name = True

    def __init__(self, coordinator: CarlinkoCoordinator, vehicle_id: str) -> None:
        super().__init__(coordinator)
        self.vehicle_id = vehicle_id
        row = coordinator.data[vehicle_id]["vehicle"]
        self.vin = row.get("vin") or vehicle_id
        self._attr_device_info = DeviceInfo(
            identifiers={(DOMAIN, self.vin)},
            manufacturer=row.get("brand"),
            model=row.get("model"),
            name=row.get("licenseNumber") or row.get("model"),
            serial_number=self.vin,
        )

    @property
    def vehicle(self) -> dict:
        """Raw /user/vehicle row for this vehicle."""
        return self.coordinator.data[self.vehicle_id]["vehicle"]

    @property
    def state_data(self) -> dict:
        """Parsed telemetry blob for this vehicle."""
        return self.coordinator.data[self.vehicle_id]["state"]
