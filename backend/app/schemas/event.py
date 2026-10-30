from datetime import datetime, timezone
from typing import Literal, Optional
from pydantic import BaseModel, Field, field_validator

SoundClass = Literal["horn", "siren", "other", "unknown"]
Direction = Literal[
    "front_left",
    "front",
    "front_right",
    "left",
    "right",
    "rear_left",
    "rear",
    "rear_right",
    "unknown",
]
EventSource = Literal["simulation", "audio_replay", "live_audio", "hardware"]
AlertState = Literal["active", "cleared", "uncertain"]


class AcousticEvent(BaseModel):
    event_id: str = Field(..., description="Unique event identifier")
    timestamp: str = Field(
        default_factory=lambda: datetime.now(timezone.utc).isoformat(),
        description="ISO-8601 UTC timestamp of detection",
    )
    sound_class: SoundClass = Field(
        ..., description="Detected acoustic classification"
    )
    confidence: float = Field(
        ...,
        ge=0.0,
        le=1.0,
        description="Classifier score (0.0 to 1.0), not a calibrated probability",
    )
    direction: Direction = Field(
        default="unknown",
        description="Estimated arrival sector; unknown unless valid multichannel array used",
    )
    direction_confidence: Optional[float] = Field(
        default=None,
        ge=0.0,
        le=1.0,
        description="Direction estimation confidence, null if unavailable",
    )
    source: EventSource = Field(
        default="simulation",
        description="Signal source origin (simulation, audio_replay, live_audio, hardware)",
    )
    alert_state: AlertState = Field(
        default="active",
        description="Current alert state (active, cleared, uncertain)",
    )

    @field_validator("direction_confidence")
    @classmethod
    def validate_direction_confidence(cls, v: Optional[float], info) -> Optional[float]:
        # If direction is unknown, direction_confidence should ideally be None or low
        return v


class EventCreateRequest(BaseModel):
    sound_class: SoundClass
    confidence: float = Field(..., ge=0.0, le=1.0)
    direction: Direction = "unknown"
    direction_confidence: Optional[float] = Field(default=None, ge=0.0, le=1.0)
    source: EventSource = "simulation"
    alert_state: AlertState = "active"


class SystemStatus(BaseModel):
    status: str
    backend_version: str
    input_mode: EventSource
    classifier_available: bool
    classifier_model: str
    localization_available: bool
    localization_method: str
    active_websocket_connections: int
    total_events_processed: int
    timestamp: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())
