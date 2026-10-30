from abc import ABC, abstractmethod
from typing import Tuple
from backend.app.schemas.event import SoundClass


class BaseClassifier(ABC):
    """Abstract interface for audio sound classification."""

    @property
    @abstractmethod
    def name(self) -> str:
        """Name or architecture identifier of the classifier."""
        pass

    @property
    @abstractmethod
    def is_available(self) -> bool:
        """Indicates whether a trained weight model is loaded and ready."""
        pass

    @abstractmethod
    def classify(self, audio_chunk: bytes) -> Tuple[SoundClass, float]:
        """
        Classifies an audio chunk.
        Returns:
            Tuple[SoundClass, float]: (predicted_sound_class, confidence_score [0.0 - 1.0])
        """
        pass


class PlaceholderClassifier(BaseClassifier):
    """
    Explicit placeholder classifier used before trained weights are provided.
    Returns ('unknown', 0.0) safely without fabricating inference.
    """

    @property
    def name(self) -> str:
        return "UnconfiguredPlaceholderClassifier (Training in Google Colab)"

    @property
    def is_available(self) -> bool:
        return False

    def classify(self, audio_chunk: bytes) -> Tuple[SoundClass, float]:
        # Truthful placeholder: returns unknown until trained model weights are plugged in
        return "unknown", 0.0
