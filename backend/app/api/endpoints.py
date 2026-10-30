from typing import List, Optional
from fastapi import APIRouter, HTTPException, Query, status
from pydantic import BaseModel

from backend.app.schemas.event import (
    AcousticEvent,
    EventCreateRequest,
    SystemStatus,
)
from backend.app.core.event_manager import event_manager

router = APIRouter()


class SimulationTriggerRequest(BaseModel):
    preset: str = "horn_front_left"


@router.get("/health", status_code=status.HTTP_200_OK)
async def get_health():
    """Healthcheck endpoint for orchestrators and local uptime checks."""
    return {"status": "healthy", "service": "osai-backend"}


@router.get("/status", response_model=SystemStatus)
async def get_status():
    """Returns runtime diagnostics, adapter connection status, and model availability."""
    return event_manager.get_system_status()


@router.get("/events", response_model=List[AcousticEvent])
async def list_events(limit: int = Query(50, ge=1, le=100)):
    """Retrieve historical acoustic events in reverse chronological order."""
    return event_manager.get_events(limit=limit)


@router.post("/events", response_model=AcousticEvent, status_code=status.HTTP_201_CREATED)
async def create_event(req: EventCreateRequest):
    """
    Ingests a new acoustic event into the system.
    Broadcasts the event to all connected WebSocket clients.
    """
    return await event_manager.create_event(req)


@router.post("/simulation/trigger", response_model=AcousticEvent)
async def trigger_simulation(req: SimulationTriggerRequest):
    """
    Triggers an explicit simulation preset event.
    Available presets:
      - horn_front_left
      - horn_rear
      - siren_front_right
      - non_horn_sound
      - uncertain_classification
      - unknown_direction
    """
    return await event_manager.trigger_simulation_preset(req.preset)
