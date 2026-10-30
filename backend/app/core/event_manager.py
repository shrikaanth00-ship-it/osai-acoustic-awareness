import asyncio
import json
import uuid
from datetime import datetime, timezone
from typing import List, Optional, Set
from fastapi import WebSocket

from backend.app.schemas.event import (
    AcousticEvent,
    EventCreateRequest,
    SystemStatus,
    SoundClass,
    Direction,
    AlertState,
)
from backend.app.audio.classifier import BaseClassifier, PlaceholderClassifier
from backend.app.audio.localization import BaseLocalization, PlaceholderLocalization
from backend.app.adapters.input_adapter import (
    BaseInputAdapter,
    SimulationAdapter,
    HardwareStreamAdapterStub,
)


class EventManager:
    """Core event processing, alert lifecycle, and WebSocket broadcast manager."""

    def __init__(
        self,
        classifier: Optional[BaseClassifier] = None,
        localization: Optional[BaseLocalization] = None,
        input_adapter: Optional[BaseInputAdapter] = None,
        max_history: int = 100,
    ):
        self.classifier: BaseClassifier = classifier or PlaceholderClassifier()
        self.localization: BaseLocalization = localization or PlaceholderLocalization()
        self.input_adapter: BaseInputAdapter = input_adapter or SimulationAdapter()
        self.max_history = max_history

        self._events: List[AcousticEvent] = []
        self._active_connections: Set[WebSocket] = set()
        self._total_events_processed: int = 0
        self._lock = asyncio.Lock()

    async def connect_client(self, websocket: WebSocket):
        """Register a new WebSocket client and send initial snapshot."""
        await websocket.accept()
        self._active_connections.add(websocket)
        # Send initial status & most recent events
        try:
            snapshot = {
                "type": "SNAPSHOT",
                "status": self.get_system_status().model_dump(),
                "recent_events": [e.model_dump() for e in self._events[-10:]],
            }
            await websocket.send_text(json.dumps(snapshot))
        except Exception:
            self._active_connections.discard(websocket)

    def disconnect_client(self, websocket: WebSocket):
        """Unregister a disconnected WebSocket client."""
        self._active_connections.discard(websocket)

    async def broadcast_event(self, event: AcousticEvent):
        """Broadcast an event to all connected WebSocket clients."""
        payload = json.dumps({"type": "EVENT", "event": event.model_dump()})
        disconnected: Set[WebSocket] = set()
        for connection in list(self._active_connections):
            try:
                await connection.send_text(payload)
            except Exception:
                disconnected.add(connection)
        for dc in disconnected:
            self._active_connections.discard(dc)

    async def record_event(self, event: AcousticEvent) -> AcousticEvent:
        """Store an event and notify active subscribers."""
        async with self._lock:
            self._events.append(event)
            if len(self._events) > self.max_history:
                self._events.pop(0)
            self._total_events_processed += 1

        await self.broadcast_event(event)
        return event

    async def create_event(self, req: EventCreateRequest) -> AcousticEvent:
        """Create and ingest a validated event."""
        event_id = f"evt_{uuid.uuid4().hex[:10]}"
        timestamp = datetime.now(timezone.utc).isoformat()
        event = AcousticEvent(
            event_id=event_id,
            timestamp=timestamp,
            sound_class=req.sound_class,
            confidence=req.confidence,
            direction=req.direction,
            direction_confidence=req.direction_confidence,
            source=req.source,
            alert_state=req.alert_state,
        )
        return await self.record_event(event)

    def get_events(self, limit: int = 50) -> List[AcousticEvent]:
        """Retrieve recent events in reverse chronological order."""
        return list(reversed(self._events[-limit:]))

    def get_system_status(self) -> SystemStatus:
        """Return truthful current system diagnostics and availability."""
        return SystemStatus(
            status="operational",
            backend_version="0.1.0-prototype",
            input_mode=self.input_adapter.source_type,
            classifier_available=self.classifier.is_available,
            classifier_model=self.classifier.name,
            localization_available=self.localization.is_available,
            localization_method=self.localization.method_name,
            active_websocket_connections=len(self._active_connections),
            total_events_processed=self._total_events_processed,
        )

    async def trigger_simulation_preset(self, preset: str) -> AcousticEvent:
        """
        Generate explicit simulation presets:
        - horn_front_left
        - horn_rear
        - siren_front_right
        - non_horn_traffic
        - uncertain_classification
        - unknown_direction
        """
        if preset == "horn_front_left":
            req = EventCreateRequest(
                sound_class="horn",
                confidence=0.92,
                direction="front_left",
                direction_confidence=0.88,
                source="simulation",
                alert_state="active",
            )
        elif preset == "horn_rear":
            req = EventCreateRequest(
                sound_class="horn",
                confidence=0.89,
                direction="rear",
                direction_confidence=0.82,
                source="simulation",
                alert_state="active",
            )
        elif preset == "siren_front_right":
            req = EventCreateRequest(
                sound_class="siren",
                confidence=0.95,
                direction="front_right",
                direction_confidence=0.91,
                source="simulation",
                alert_state="active",
            )
        elif preset == "non_horn_sound":
            req = EventCreateRequest(
                sound_class="other",
                confidence=0.74,
                direction="left",
                direction_confidence=0.65,
                source="simulation",
                alert_state="cleared",
            )
        elif preset == "uncertain_classification":
            req = EventCreateRequest(
                sound_class="unknown",
                confidence=0.48,
                direction="front",
                direction_confidence=0.52,
                source="simulation",
                alert_state="uncertain",
            )
        elif preset == "unknown_direction":
            req = EventCreateRequest(
                sound_class="horn",
                confidence=0.91,
                direction="unknown",
                direction_confidence=None,
                source="simulation",
                alert_state="active",
            )
        else:
            req = EventCreateRequest(
                sound_class="horn",
                confidence=0.85,
                direction="front",
                direction_confidence=0.80,
                source="simulation",
                alert_state="active",
            )

        return await self.create_event(req)


# Global singleton instance for application lifecycle
event_manager = EventManager()
