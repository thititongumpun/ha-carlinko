"""Event platform: the car's own notices (charging started / finished, door open, ...)."""

from __future__ import annotations

from homeassistant.components.event import EventEntity
from homeassistant.core import HomeAssistant
from homeassistant.helpers.entity_platform import AddConfigEntryEntitiesCallback

from . import CarlinkoConfigEntry
from .api import charge_notice, notice_time
from .entity import CarlinkoEntity


async def async_setup_entry(
    hass: HomeAssistant,
    entry: CarlinkoConfigEntry,
    async_add_entities: AddConfigEntryEntitiesCallback,
) -> None:
    """Set up one notice event per vehicle."""
    coordinator = entry.runtime_data
    async_add_entities(CarlinkoNoticeEvent(coordinator, vehicle_id) for vehicle_id in coordinator.data)


class CarlinkoNoticeEvent(CarlinkoEntity, EventEntity):
    """Fires once per new vehicle notice."""

    _attr_translation_key = "notice"
    _attr_event_types = ["notice"]
    _attr_icon = "mdi:message-alert"

    def __init__(self, coordinator, vehicle_id: str) -> None:
        super().__init__(coordinator, vehicle_id)
        self._attr_unique_id = f"{self.vin}_notice"
        # shortcut: notices that arrive while HA is down are not replayed; persist _seen via RestoreEntity if users ask
        self._seen: set[str] | None = None

    def _handle_coordinator_update(self) -> None:
        notices = self.coordinator.data[self.vehicle_id].get("notices", [])
        if self._seen is None:  # first update: seed only, so a restart does not replay old notices
            self._seen = {str(n.get("noticeId")) for n in notices}
        else:
            for n in reversed(notices):  # oldest first
                nid = str(n.get("noticeId"))
                if nid in self._seen:
                    continue
                self._seen.add(nid)
                kind = (charge_notice(n.get("title")) or charge_notice(n.get("contents")))
                created = notice_time(n.get("createdTime"))
                self._trigger_event(
                    "notice",
                    {
                        "title": n.get("title"),
                        "contents": n.get("contents"),
                        "created": created.isoformat() if created else None,
                        "kind": f"charge_{kind[0]}" if kind else "other",
                    },
                )
        super()._handle_coordinator_update()
