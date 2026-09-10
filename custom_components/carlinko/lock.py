"""Lock platform for the CarLinko integration."""

from __future__ import annotations

from typing import Any

from homeassistant.components.lock import LockEntity
from homeassistant.core import HomeAssistant
from homeassistant.helpers.entity_platform import AddConfigEntryEntitiesCallback

from . import CarlinkoConfigEntry
from .const import OP_LOCK, OP_UNLOCK
from .entity import CarlinkoEntity


async def async_setup_entry(
    hass: HomeAssistant,
    entry: CarlinkoConfigEntry,
    async_add_entities: AddConfigEntryEntitiesCallback,
) -> None:
    """Set up one lock per vehicle."""
    coordinator = entry.runtime_data
    async_add_entities(
        CarlinkoLock(coordinator, vehicle_id) for vehicle_id in coordinator.data
    )


class CarlinkoLock(CarlinkoEntity, LockEntity):
    """Door lock for a vehicle."""

    _attr_translation_key = "door_lock"

    def __init__(self, coordinator, vehicle_id: str) -> None:
        super().__init__(coordinator, vehicle_id)
        self._attr_unique_id = f"{self.vehicle['vin']}_{self._attr_translation_key}"

    @property
    def is_locked(self) -> bool | None:
        """Return True if the vehicle is locked."""
        unlocked = self.state_data["unlocked"]
        return None if unlocked is None else unlocked == 0

    async def async_lock(self, **kwargs: Any) -> None:
        """Lock the vehicle."""
        await self.coordinator.send(self.vehicle_id, OP_LOCK)

    async def async_unlock(self, **kwargs: Any) -> None:
        """Unlock the vehicle."""
        await self.coordinator.send(self.vehicle_id, OP_UNLOCK)
