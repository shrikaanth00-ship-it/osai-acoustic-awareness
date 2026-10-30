from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware

from backend.app.api.endpoints import router as api_router
from backend.app.core.event_manager import event_manager

app = FastAPI(
    title="OSAI Acoustic Awareness API",
    description="Backend API and WebSocket stream for vehicle acoustic awareness and visual directional alerts.",
    version="0.1.0-prototype",
)

# Enable CORS for local Vite dev server and web dashboard
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(api_router, prefix="/api")


@app.websocket("/ws/events")
async def websocket_events_endpoint(websocket: WebSocket):
    """
    WebSocket endpoint for real-time acoustic event streaming.
    Clients receive an initial SNAPSHOT with system status and recent events,
    followed by real-time EVENT broadcasts.
    """
    await event_manager.connect_client(websocket)
    try:
        while True:
            # Keep connection alive and accept incoming messages (such as ping/heartbeat)
            data = await websocket.receive_text()
            # If client sends a ping or echo, reply
            if data == "ping":
                await websocket.send_text("pong")
    except WebSocketDisconnect:
        event_manager.disconnect_client(websocket)
    except Exception:
        event_manager.disconnect_client(websocket)


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("backend.app.main:app", host="0.0.0.0", port=8000, reload=True)
