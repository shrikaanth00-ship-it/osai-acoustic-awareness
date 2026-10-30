from abc import ABC, abstractmethod
from typing import Optional
from backend.app.schemas.event import EventSource, AcousticEvent


class BaseInputAdapter(ABC):
    """Abstract interface for audio ingestion / event stream sources."""

    @property
    @abstractmethod
    def source_type(self) -> EventSource:
        pass

    @property
    @abstractmethod
    def is_connected(self) -> bool:
        pass

    @abstractmethod
    def get_status_description(self) -> str:
        pass


class SimulationAdapter(BaseInputAdapter):
    """Generates or injects controlled simulation events for development and validation."""

    @property
    def source_type(self) -> EventSource:
        return "simulation"

    @property
    def is_connected(self) -> bool:
        return True

    def get_status_description(self) -> str:
        return "Active (Software Simulation Mode)"


class AudioFileReplayAdapter(BaseInputAdapter):
    """Future adapter for replaying calibrated WAV/multichannel audio test recordings."""

    def __init__(self, file_path: Optional[str] = None):
        self.file_path = file_path

    @property
    def source_type(self) -> EventSource:
        return "audio_replay"

    @property
    def is_connected(self) -> bool:
        return self.file_path is not None

    def get_status_description(self) -> str:
        if self.file_path:
            return f"Replaying: {self.file_path}"
        return "Unconfigured (File Replay Mode Inactive)"


class HardwareStreamAdapterStub(BaseInputAdapter):
    """
    Hardware adapter stub.
    Explicitly marked unavailable until physical microphone array hardware
    and on-device framing are confirmed and integrated.
    """

    @property
    def source_type(self) -> EventSource:
        return "hardware"

    @property
    def is_connected(self) -> bool:
        return False

    def get_status_description(self) -> str:
        return "Unavailable (Microphone Array Hardware Not Connected)"
