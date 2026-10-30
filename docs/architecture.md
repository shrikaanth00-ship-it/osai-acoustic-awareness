# OSAI System Architecture

## Overview
OSAI (**OSAI Acoustic Awareness & Directional Alert System**) is an assistive automotive prototype designed to convert external acoustic warnings (such as vehicle horns and emergency sirens) into real-time, directional visual alerts on an in-cabin display for deaf and hard-of-hearing drivers.

This document describes the software architecture, data flow, adapter boundaries, and integration interfaces.

---

## High-Level Architecture

```
+-----------------------------------------------------------------------------------+
|                              INPUT ADAPTER LAYER                                  |
|                                                                                   |
|  +--------------------+   +-----------------------+   +------------------------+  |
|  | Simulation Adapter |   |  Audio Replay Adapter |   | Hardware Stream Stub   |  |
|  |  (Active/Controls) |   |    (File Playback)    |   | (Awaiting mic array)   |  |
|  +---------+----------+   +-----------+-----------+   +-----------+------------+  |
+------------|--------------------------|---------------------------|---------------+
             |                          |                           |
             +--------------------------+---------------------------+
                                        |
                                        v
+-----------------------------------------------------------------------------------+
|                               FASTAPI CORE ENGINE                                 |
|                                                                                   |
|   +-----------------------+     +------------------------+                        |
|   | Classifier Interface  |     | Localization Interface |                        |
|   | (Placeholder: Colab)  |     | (8-Sector DoA Array)   |                        |
|   +-----------+-----------+     +-----------+------------+                        |
|               |                             |                                     |
|               +--------------+--------------+                                     |
|                              |                                                    |
|                              v                                                    |
|                  +-----------------------+                                        |
|                  |     EventManager      |                                        |
|                  | (Alert lifecycle,     |                                        |
|                  |  history, broadcast)  |                                        |
|                  +-----------+-----------+                                        |
|                              |                                                    |
|               +--------------+---------------+                                    |
|               |                              |                                    |
|               v                              v                                    |
|     +-------------------+          +--------------------+                         |
|     |  REST API Endpoints|         |  WebSocket Server  |                         |
|     |  /api/health      |          |  /ws/events        |                         |
|     |  /api/status      |          |  (Real-time JSON   |                         |
|     |  /api/events      |          |   streaming)       |                         |
|     +---------+---------+          +---------+----------+                         |
+---------------|------------------------------|------------------------------------+
                |                              |
                v                              v
+-----------------------------------------------------------------------------------+
|                        REACT + TYPESCRIPT AUTOMOTIVE HUD                          |
|                                                                                   |
|  +-----------------------+  +-----------------------+  +-----------------------+  |
|  | 360° Radar Compass    |  | Active Hero Alert     |  | Simulation Controls   |  |
|  | (8 Direction Sectors) |  | (Visual HUD warnings) |  | (Horn, Siren, Ambience|  |
|  +-----------------------+  +-----------------------+  +-----------------------+  |
|  +-----------------------+  +-----------------------+  +-----------------------+  |
|  | Diagnostics & Telemetry| | Event History Log     |  | Client Mock Fallback  |  |
|  | (Truthful status)     |  | (Filterable feed)     |  | (Offline resiliency)  |  |
|  +-----------------------+  +-----------------------+  +-----------------------+  |
+-----------------------------------------------------------------------------------+
```

---

## Architectural Principles

### 1. Truthful Reporting & Decoupled Inference
* **Separation of Classification and Direction:** Sound classification (identifying a horn vs. ambient sound) and Direction of Arrival (DoA) estimation are separate tasks. Direction must be reported as `unknown` unless a valid multichannel synchronized microphone array is present. Mono input cannot provide spatial localization.
* **No Fabricated Inference:** Unconfigured models report `classifier_available: false` and return safe `unknown` values rather than synthetic pseudo-predictions.
* **Uncalibrated Confidence:** Confidence scores (0.0 to 1.0) are explicitly presented as uncalibrated model scores until rigorous statistical calibration has been performed.

### 2. Adapter Pattern for Input Sources
* `BaseInputAdapter` defines the source interface:
  * `SimulationAdapter`: Injects controlled events for development, UI verification, and user testing.
  * `AudioFileReplayAdapter`: Replays multi-channel WAV files captured in real driving conditions.
  * `HardwareStreamAdapterStub`: Interface ready for embedded hardware integration (e.g. I2S/USB multichannel microphone arrays).

### 3. Dual-Channel Communication (REST + WebSocket)
* **REST Endpoints:** Used for querying system health (`GET /api/health`), detailed diagnostics (`GET /api/status`), event logs (`GET /api/events`), and manual simulation triggers (`POST /api/simulation/trigger`).
* **WebSocket Stream (`/ws/events`):** Pushes events instantly to the HUD with zero polling latency, supporting instant visual feedback.

### 4. Client-Side Resilience
* If the FastAPI backend is disconnected or offline, the frontend seamlessly switches to an internal **Client-Side Simulation Fallback**, maintaining full responsiveness while clearly displaying an offline status banner.
