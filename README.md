# OSAI — AI-Powered Acoustic Awareness & Directional Alert Prototype

OSAI is a software-first assistive automotive prototype providing real-time acoustic awareness and directional visual alerts for deaf and hard-of-hearing drivers.

The system continuously classifies external vehicular acoustic cues (such as vehicle horns and emergency sirens) and localizes their direction of arrival, projecting high-contrast visual alerts onto an in-cabin cockpit HUD.

---

## Current Development Scope & Status

| Subsystem | Status | Implementation Details |
| :--- | :--- | :--- |
| **Automotive HUD & Radar** | **Implemented** | React 19 + TypeScript + Vite. 360° 8-sector directional compass, active alert hero card, event history, and diagnostic telemetry. |
| **Backend & Event Engine** | **Implemented** | FastAPI + Pydantic + WebSockets. Ingests, validates, manages alert states, and streams events with zero polling latency. |
| **Simulation Engine** | **Implemented** | Both FastAPI REST/WebSocket simulation endpoints and an isolated client-side mock fallback engine. |
| **AI Classifier Model** | **Placeholder (Truthful)** | Interface and safe unconfigured placeholder. Model training is executed separately in Google Colab; weights plug in via `BaseClassifier`. |
| **Directional Localization** | **Placeholder (Truthful)** | Multi-sector DoA interface. Marked as `unknown` unless synchronized multichannel microphone array hardware is connected. |
| **Hardware Microphone Array**| **Pending Specs** | Hardware adapter stub. Requirements documented in [`docs/hardware-integration.md`](docs/hardware-integration.md). |

---

## Architecture & Documentation

* **[Architecture Document](docs/architecture.md)**: Component boundaries, data flow diagrams, and adapter patterns.
* **[API & Data Contract](docs/api-contract.md)**: Pydantic schemas, REST endpoints, and WebSocket payload formats.
* **[Hardware Integration Guide](docs/hardware-integration.md)**: Microphone array requirements (channel count, geometry, synchronization, framing).

---

## Quick Start / Local Run Instructions

### Prerequisites
* Python 3.10+ (tested on Python 3.14)
* Node.js v18+ and npm (tested on Node v26 and npm 12)

### 1. Start Backend (FastAPI)
```bash
# Set up virtual environment
python3 -m venv backend/.venv
source backend/.venv/bin/activate

# Install dependencies
pip install -r backend/requirements.txt

# Run backend server (starts on http://localhost:8000)
uvicorn backend.app.main:app --host 0.0.0.0 --port 8000 --reload
```

Backend endpoints:
* API Health: [http://localhost:8000/api/health](http://localhost:8000/api/health)
* System Diagnostics: [http://localhost:8000/api/status](http://localhost:8000/api/status)
* Interactive Swagger Docs: [http://localhost:8000/docs](http://localhost:8000/docs)
* WebSocket Stream: `ws://localhost:8000/ws/events`

### 2. Start Frontend (React + Vite)
In a separate terminal:
```bash
# Install frontend dependencies
npm --prefix frontend install

# Start local dev server (default: http://localhost:5173)
npm --prefix frontend run dev
```

Open [http://localhost:5173](http://localhost:5173) in your browser.

---

## Running Verification Tests

### Backend Unit & Integration Tests
```bash
backend/.venv/bin/pytest backend/tests
```
Runs 10 automated tests covering:
* AcousticEvent schema validation and boundary constraints (e.g., confidence range `0.0`–`1.0`, valid sound classes)
* Health and status API diagnostics
* REST event creation, storage, and retrieval
* Event history limit capping and simulation preset generation

### Frontend Type Check & Production Build
```bash
npm --prefix frontend run build
```
Compiles TypeScript with zero errors and generates optimized production bundle in `frontend/dist/`.

---

## Design Principles & Truthfulness
1. **Visual Alerts Only:** No speculative haptic/vibration mechanisms are implemented at this stage.
2. **Honest Directional Reporting:** Sound classification is decoupled from direction estimation. Direction is marked as `unknown` when multichannel synchronized hardware is absent.
3. **Transparent Simulation Labeling:** All mock and simulator records are explicitly labeled with `"source": "simulation"`.
