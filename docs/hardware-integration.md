# OSAI Hardware Integration & Microphone Array Specification

## Purpose
This document outlines the technical interface requirements and questions for the embedded hardware engineering team.

The OSAI software prototype provides a high-framerate visual HUD and alert management engine. To enable **real-time spatial sound localization (Direction of Arrival / DoA)**, the physical microphone array must meet strict synchronization and acoustic geometry constraints.

> **CRITICAL ARCHITECTURAL CONSTRAINT:**  
> Direction estimation requires synchronized multichannel acoustic capture. Single-channel (mono) audio cannot reliably determine sound direction of arrival. Until multichannel synchronized audio is confirmed, the OSAI system will report direction as `unknown`.

---

## Hardware Confirmation Checklist

The hardware team must confirm the following 6 parameters before physical integration:

### 1. Microphone Count and Spatial Geometry
* **Microphone Count:** How many microphones are in the array? (Recommended minimum: 3 or 4 for 2D plane localization; 2 for basic left/right).
* **Physical Placement:**
  * In-cabin (e.g. windshield mount, dashboard edges, rear parcel shelf) vs. exterior roof/bumper mount?
  * Physical array geometry (circular, linear, square, triangular) and inter-microphone spacing (distances in millimeters, critical for TDoA / GCC-PHAT calculation).

### 2. Channel Synchronization & Order
* Are all microphone channels sampled simultaneously with a shared master clock? (Phase jitter or inter-channel clock drift invalidates acoustic time-difference calculations).
* Explicit channel mapping order:
  * Channel 0: [e.g. Front-Left]
  * Channel 1: [e.g. Front-Right]
  * Channel 2: [e.g. Rear-Left]
  * Channel 3: [e.g. Rear-Right]

### 3. Sampling & Framing Parameters
* **Sample Rate:** (Recommended: 16,000 Hz or 44,100 Hz).
* **Bit Depth:** (e.g. 16-bit PCM or 24-bit PCM).
* **Sample Format:** (Signed integer little-endian `int16_le` vs. float `float32`).
* **Chunk / Buffer Duration:** Duration of each audio slice emitted by the hardware driver (e.g., 50 ms, 100 ms, or 250 ms chunks). Shorter chunks reduce alert latency; longer chunks improve frequency resolution.

### 4. Audio Transport & Data Framing
* How is audio delivered to the host system?
  * USB Audio Class 2.0 (multichannel UAC2).
  * Direct I2S / TDM bus via SoC GPIO.
  * Serial over UART / SPI with packet framing.
  * Network / UDP raw socket stream.
* What is the frame packet format (header, payload size, checksum)?

### 5. On-Device Compute Platform
* What compute target will run the edge classifier and localization?
  * Single Board Computer (e.g., Raspberry Pi 4/5, Jetson Orin Nano).
  * Microcontroller (e.g., ESP32-S3, STM32H7, RP2040).
  * Host automotive head unit (Linux / Android Automotive).
* Available memory and inference runtime (TFLite, ONNX Runtime, PyTorch Lite).

### 6. Power, Startup & Failure Recovery
* Boot sequence: Does the microphone array initialize before the host OS boots?
* Reconnection behavior: How does the driver handle hardware disconnections or brownouts?
* Error signaling: How does the hardware indicate a dead microphone element or clipping?

---

## Software Adapter Integration Point

Once the hardware driver or audio daemon is confirmed, implement `backend/app/adapters/input_adapter.py`:

```python
class HardwareMicrophoneStreamAdapter(BaseInputAdapter):
    def __init__(self, device_index: int, num_channels: int = 4, sample_rate: int = 16000):
        self.device_index = device_index
        self.num_channels = num_channels
        self.sample_rate = sample_rate
        # Connect to ALSA / PyAudio / PortAudio stream

    @property
    def source_type(self) -> EventSource:
        return "hardware"

    @property
    def is_connected(self) -> bool:
        # Check active stream status
        return True

    def read_multichannel_chunk(self) -> bytes:
        # Read interleaved PCM bytes
        pass
```
