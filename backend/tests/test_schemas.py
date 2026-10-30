import pytest
from pydantic import ValidationError
from backend.app.schemas.event import AcousticEvent, EventCreateRequest


def test_valid_acoustic_event():
    event = AcousticEvent(
        event_id="evt_test_123",
        sound_class="horn",
        confidence=0.94,
        direction="front_left",
        direction_confidence=0.86,
        source="simulation",
        alert_state="active",
    )
    assert event.event_id == "evt_test_123"
    assert event.sound_class == "horn"
    assert event.confidence == 0.94
    assert event.direction == "front_left"
    assert event.direction_confidence == 0.86
    assert event.source == "simulation"
    assert event.alert_state == "active"


def test_invalid_confidence_range():
    with pytest.raises(ValidationError):
        AcousticEvent(
            event_id="evt_bad",
            sound_class="horn",
            confidence=1.5,  # Invalid: > 1.0
            direction="front",
            source="simulation",
        )

    with pytest.raises(ValidationError):
        AcousticEvent(
            event_id="evt_bad",
            sound_class="horn",
            confidence=-0.1,  # Invalid: < 0.0
            direction="front",
            source="simulation",
        )


def test_invalid_sound_class():
    with pytest.raises(ValidationError):
        AcousticEvent(
            event_id="evt_bad",
            sound_class="helicopter",  # Not in allowed literals
            confidence=0.8,
            direction="front",
            source="simulation",
        )


def test_direction_unknown_and_optional_confidence():
    event = AcousticEvent(
        event_id="evt_unknown_dir",
        sound_class="horn",
        confidence=0.88,
        direction="unknown",
        direction_confidence=None,
        source="simulation",
    )
    assert event.direction == "unknown"
    assert event.direction_confidence is None
