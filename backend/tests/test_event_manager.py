import pytest
from backend.app.core.event_manager import EventManager
from backend.app.schemas.event import EventCreateRequest


@pytest.mark.asyncio
async def test_event_manager_history_limit():
    mgr = EventManager(max_history=5)
    for i in range(10):
        await mgr.create_event(
            EventCreateRequest(
                sound_class="horn",
                confidence=0.9,
                direction="front",
                source="simulation",
            )
        )
    events = mgr.get_events()
    assert len(events) == 5
    assert mgr._total_events_processed == 10


@pytest.mark.asyncio
async def test_simulation_presets():
    mgr = EventManager()
    e1 = await mgr.trigger_simulation_preset("horn_front_left")
    assert e1.sound_class == "horn"
    assert e1.direction == "front_left"
    assert e1.source == "simulation"

    e2 = await mgr.trigger_simulation_preset("unknown_direction")
    assert e2.direction == "unknown"
    assert e2.direction_confidence is None
