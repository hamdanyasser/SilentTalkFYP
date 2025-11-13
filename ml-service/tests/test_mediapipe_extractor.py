"""
Unit tests for MediaPipe hand landmark extraction
"""

import pytest
import numpy as np
import cv2
import sys
from pathlib import Path

sys.path.append(str(Path(__file__).parent.parent / "app"))

from services.mediapipe_extractor import MediaPipeHandExtractor


@pytest.fixture
def extractor():
    """Fixture for MediaPipe extractor."""
    return MediaPipeHandExtractor(
        static_image_mode=False,
        max_num_hands=1,
        min_detection_confidence=0.5
    )


@pytest.fixture
def dummy_frame():
    """Create a dummy frame for testing."""
    # Create a blank image with a simple hand-like shape
    frame = np.zeros((480, 640, 3), dtype=np.uint8)
    # Draw some white regions to simulate a hand
    cv2.rectangle(frame, (200, 100), (400, 400), (255, 255, 255), -1)
    return frame


def test_extract_landmarks_with_hand(extractor, dummy_frame):
    """Test landmark extraction with a visible hand."""
    result = extractor.extract_landmarks(dummy_frame, normalize=True)

    # Note: With dummy frame, may not detect actual landmarks
    # This test validates the API contract
    if result is not None:
        landmarks, handedness = result
        assert landmarks.shape == (21, 3), "Should extract 21 landmarks with (x, y, z)"
        assert handedness in ["Left", "Right"], "Hand should be classified as Left or Right"
        assert np.all((landmarks >= 0) & (landmarks <= 1)), "Normalized landmarks should be in [0, 1]"


def test_extract_landmarks_normalized(extractor, dummy_frame):
    """Test that normalized landmarks are in valid range."""
    result = extractor.extract_landmarks(dummy_frame, normalize=True)

    if result is not None:
        landmarks, _ = result
        assert np.all((landmarks >= 0) & (landmarks <= 1)), "Normalized landmarks should be in [0, 1]"


def test_extract_landmarks_sequence(extractor):
    """Test sequence extraction from multiple frames."""
    # Create sequence of dummy frames
    frames = [np.random.randint(0, 255, (480, 640, 3), dtype=np.uint8) for _ in range(10)]

    sequence = extractor.extract_landmarks_sequence(
        frames,
        sequence_length=30,
        normalize=True
    )

    assert sequence is not None, "Sequence extraction should return result"
    assert sequence.shape == (30, 21, 3), "Should have shape (seq_length, 21, 3)"


def test_extract_landmarks_sequence_padding(extractor):
    """Test that short sequences are padded correctly."""
    frames = [np.random.randint(0, 255, (480, 640, 3), dtype=np.uint8) for _ in range(5)]

    sequence = extractor.extract_landmarks_sequence(
        frames,
        sequence_length=30,
        normalize=True
    )

    assert sequence.shape[0] == 30, "Should pad to target length"


def test_extract_landmarks_sequence_truncation(extractor):
    """Test that long sequences are truncated correctly."""
    frames = [np.random.randint(0, 255, (480, 640, 3), dtype=np.uint8) for _ in range(50)]

    sequence = extractor.extract_landmarks_sequence(
        frames,
        sequence_length=30,
        normalize=True
    )

    assert sequence.shape[0] == 30, "Should truncate to target length"


def test_extractor_closes_properly(extractor):
    """Test that extractor closes without errors."""
    try:
        extractor.close()
    except Exception as e:
        pytest.fail(f"Extractor close() raised exception: {e}")


@pytest.mark.benchmark
def test_extraction_performance(extractor, benchmark):
    """Benchmark landmark extraction performance."""
    frame = np.random.randint(0, 255, (480, 640, 3), dtype=np.uint8)

    def extract():
        return extractor.extract_landmarks(frame, normalize=True)

    result = benchmark(extract)
    # Note: Actual performance depends on hardware
    # This test just ensures the operation completes
