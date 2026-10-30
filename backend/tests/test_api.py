import pytest
from httpx import ASGITransport, AsyncClient
from backend.app.main import app


@pytest.mark.asyncio
async def test_health_endpoint():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        response = await client.get("/api/health")
        assert response.status_code == 200
        assert response.json() == {"status": "healthy", "service": "osai-backend"}


@pytest.mark.asyncio
async def test_status_endpoint():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        response = await client.get("/api/status")
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "operational"
        assert "classifier_available" in data
        assert "localization_available" in data
        assert data["classifier_available"] is False  # Truthful placeholder


@pytest.mark.asyncio
async def test_create_and_list_events():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        payload = {
            "sound_class": "horn",
            "confidence": 0.93,
            "direction": "rear_left",
            "direction_confidence": 0.81,
            "source": "simulation",
            "alert_state": "active",
        }
        create_res = await client.post("/api/events", json=payload)
        assert create_res.status_code == 201
        created_event = create_res.json()
        assert created_event["sound_class"] == "horn"
        assert created_event["direction"] == "rear_left"
        assert created_event["event_id"].startswith("evt_")

        # Now list events
        list_res = await client.get("/api/events")
        assert list_res.status_code == 200
        events = list_res.json()
        assert len(events) >= 1
        assert any(e["event_id"] == created_event["event_id"] for e in events)


@pytest.mark.asyncio
async def test_simulation_trigger():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        trigger_res = await client.post(
            "/api/simulation/trigger", json={"preset": "horn_front_left"}
        )
        assert trigger_res.status_code == 200
        data = trigger_res.json()
        assert data["sound_class"] == "horn"
        assert data["direction"] == "front_left"
        assert data["source"] == "simulation"
