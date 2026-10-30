# OSAI API and Data Contract

## Base URLs
* **REST API:** `http://localhost:8000/api`
* **WebSocket Stream:** `ws://localhost:8000/ws/events`

---

## Data Models

### 1. AcousticEvent Schema
Represents an acoustic alert instance detected or simulated by the system.

```json
{
  "event_id": "evt_9c182b8a4f",
  "timestamp": "2026-10-30T10:45:00.123456+00:00",
  "sound_class": "horn",
  "confidence": 0.94,
  "direction": "front_left",
  "direction_confidence": 0.88,
  "source": "simulation",
  "alert_state": "active"
}
```

#### Fields:
* `event_id` (string, required): Unique identifier (prefixed with `evt_`).
* `timestamp` (string, ISO-8601 UTC): Detection timestamp.
* `sound_class` (string enum, required):
  * `"horn"`: Vehicle horn sound.
  * `"siren"`: Emergency vehicle siren.
  * `"other"`: Non-critical sound (engine noise, traffic ambient).
  * `"unknown"`: Audio detected but below confidence threshold.
* `confidence` (float, required, `0.0 <= confidence <= 1.0`): Uncalibrated classification model score.
* `direction` (string enum, required):
  * `"front"`, `"front_right"`, `"right"`, `"rear_right"`, `"rear"`, `"rear_left"`, `"left"`, `"front_left"`, or `"unknown"`.
* `direction_confidence` (float or null, `0.0 <= x <= 1.0`): Spatial localization confidence; `null` when direction is unknown.
* `source` (string enum, required):
  * `"simulation"`: Injected via simulation controls or mock tests.
  * `"audio_replay"`: From recorded audio file playback.
  * `"live_audio"`: From desktop microphone input.
  * `"hardware"`: From dedicated in-vehicle microphone array.
* `alert_state` (string enum, required):
  * `"active"`: Alert actively demanding driver attention.
  * `"uncertain"`: Ambiguous signal; highlighted in amber.
  * `"cleared"`: Transient or dismissed event.

---

## REST Endpoints

### `GET /api/health`
Verifies backend service availability.
* **Response `200 OK`**:
```json
{
  "status": "healthy",
  "service": "osai-backend"
}
```

### `GET /api/status`
Returns live system diagnostics, model state, and adapter availability.
* **Response `200 OK`**:
```json
{
  "status": "operational",
  "backend_version": "0.1.0-prototype",
  "input_mode": "simulation",
  "classifier_available": false,
  "classifier_model": "UnconfiguredPlaceholderClassifier (Training in Google Colab)",
  "localization_available": false,
  "localization_method": "None (Multichannel Array Pending Hardware Confirmation)",
  "active_websocket_connections": 1,
  "total_events_processed": 14,
  "timestamp": "2026-10-30T10:45:00.123456+00:00"
}
```

### `GET /api/events`
Returns recent acoustic events in reverse chronological order.
* **Query Parameters**:
  * `limit` (integer, default: 50, max: 100): Number of events to retrieve.
* **Response `200 OK`**: Array of `AcousticEvent` objects.

### `POST /api/events`
Ingests an acoustic event and immediately broadcasts it to all WebSocket subscribers.
* **Request Body**:
```json
{
  "sound_class": "horn",
  "confidence": 0.92,
  "direction": "front_left",
  "direction_confidence": 0.85,
  "source": "simulation",
  "alert_state": "active"
}
```
* **Response `201 Created`**: The full `AcousticEvent` object with assigned `event_id` and `timestamp`.

### `POST /api/simulation/trigger`
Triggers a preset simulation event.
* **Request Body**:
```json
{
  "preset": "horn_front_left"
}
```
* **Available Presets**:
  * `"horn_front_left"`
  * `"horn_rear"`
  * `"siren_front_right"`
  * `"non_horn_sound"`
  * `"uncertain_classification"`
  * `"unknown_direction"`
* **Response `200 OK`**: Generated `AcousticEvent`.

---

## WebSocket Stream

### Endpoint: `/ws/events`
Real-time bidirectional WebSocket connection.

1. **Upon Connection**:
The server sends an initial `SNAPSHOT` payload:
```json
{
  "type": "SNAPSHOT",
  "status": { ... },
  "recent_events": [ ... ]
}
```

2. **On New Event Broadcast**:
Whenever a sound is classified or triggered:
```json
{
  "type": "EVENT",
  "event": {
    "event_id": "evt_a3b2c1d0e9",
    "timestamp": "2026-10-30T10:45:00.000Z",
    "sound_class": "horn",
    "confidence": 0.94,
    "direction": "rear",
    "direction_confidence": 0.88,
    "source": "simulation",
    "alert_state": "active"
  }
}
```

3. **Heartbeat / Ping**:
Clients may send `"ping"`, to which the server responds with `"pong"`.
