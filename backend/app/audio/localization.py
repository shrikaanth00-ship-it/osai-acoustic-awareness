from abc import ABC, abstractmethod
from typing import Optional, Tuple
from backend.app.schemas.event import Direction


class BaseLocalization(ABC):
    """Abstract interface for acoustic direction of arrival (DoA) estimation."""

    @property
    @abstractmethod
    def method_name(self) -> str:
        """Name of the localization algorithm (e.g. GCC-PHAT, MUSIC, SRP-PHAT)."""
        pass

    @property
    @abstractmethod
    def is_available(self) -> bool:
        """Indicates whether valid multichannel synchronized stream is connected."""
        pass

    @abstractmethod
    def estimate_direction(
        self, multichannel_audio_chunk: bytes, num_channels: int
    ) -> Tuple[Direction, Optional[float]]:
        """
        Estimates the acoustic angle/sector of arrival.
        Returns:
            Tuple[Direction, Optional[float]]: (direction_sector, direction_confidence)
        """
        pass


class PlaceholderLocalization(BaseLocalization):
    """
    Explicit placeholder localization adapter.
    Reports direction as 'unknown' with None confidence unless synchronized
    multichannel hardware is connected.
    """

    @property
    def method_name(self) -> str:
        return "None (Multichannel Array Pending Hardware Confirmation)"

    @property
    def is_available(self) -> bool:
        return False

    def estimate_direction(
        self, multichannel_audio_chunk: bytes, num_channels: int
    ) -> Tuple[Direction, Optional[float]]:
        # Without multichannel synchronized audio, direction cannot be estimated
        return "unknown", None
