"""Image platform for the CarLinko integration."""

from __future__ import annotations

import json
import logging
from datetime import UTC, datetime

from homeassistant.components.image import ImageEntity
from homeassistant.core import HomeAssistant
from homeassistant.helpers.entity_platform import AddConfigEntryEntitiesCallback

from . import CarlinkoConfigEntry
from .coordinator import CarlinkoCoordinator
from .entity import CarlinkoEntity

_LOGGER = logging.getLogger(__name__)


async def async_setup_entry(
    hass: HomeAssistant,
    entry: CarlinkoConfigEntry,
    async_add_entities: AddConfigEntryEntitiesCallback,
) -> None:
    """Set up the vehicle photo for each vehicle."""
    coordinator = entry.runtime_data
    async_add_entities(
        CarlinkoVehicleImage(coordinator, vehicle_id, hass) for vehicle_id in coordinator.data
    )


def _img_urls(row: dict) -> dict[str, str]:
    """Return {front,side,top: url} (lowercased keys) from a /user/vehicle row.

    `vehicleImgConfig` (a JSON string) is tried first; `vehicleImgConfigs`
    (a list, one entry per vehicleColor) is the fallback.
    """
    raw = row.get("vehicleImgConfig")
    if raw:
        try:
            parsed = json.loads(raw)
        except (TypeError, ValueError) as err:
            _LOGGER.debug("bad vehicleImgConfig for row: %s", err)
        else:
            if isinstance(parsed, dict):
                urls = {k.lower(): v for k, v in parsed.items() if isinstance(v, str)}
                if urls:
                    return urls

    for config in row.get("vehicleImgConfigs") or []:
        if isinstance(config, dict):
            urls = {k.lower(): v for k, v in config.items() if isinstance(v, str)}
            if urls:
                return urls

    return {}


class CarlinkoVehicleImage(CarlinkoEntity, ImageEntity):
    """Static CDN photo of the vehicle (Side view as the entity picture)."""

    _attr_translation_key = "vehicle"

    def __init__(self, coordinator: CarlinkoCoordinator, vehicle_id: str, hass: HomeAssistant) -> None:
        CarlinkoEntity.__init__(self, coordinator, vehicle_id)
        ImageEntity.__init__(self, hass)
        self._attr_unique_id = f"{self.vin}_vehicle_image"
        # The photo is a static CDN asset per car, not a live feed, so a single
        # timestamp at init is enough to satisfy ImageEntity's "last updated" state.
        self._attr_image_last_updated = datetime.now(UTC)

    @property
    def image_url(self) -> str | None:
        """Side view of the car, used to fetch the entity picture."""
        return _img_urls(self.vehicle).get("side")

    @property
    def extra_state_attributes(self) -> dict[str, str | None]:
        """Expose all three CDN angles so the Lovelace card can pick one."""
        urls = _img_urls(self.vehicle)
        return {
            "image_front": urls.get("front"),
            "image_side": urls.get("side"),
            "image_top": urls.get("top"),
        }
