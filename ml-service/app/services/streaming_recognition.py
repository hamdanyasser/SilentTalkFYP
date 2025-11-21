"""
Streaming Sign Language Recognition Service
Handles real-time video streams with sliding window inference
"""

import asyncio
import numpy as np
import cv2
from typing import Optional, List, Tuple, Dict
from collections import deque
from datetime import datetime
import logging

from app.services.mediapipe_extractor import MediaPipeHandExtractor
from app.services.onnx_inference import get_inference_engine

logger = logging.getLogger(__name__)


class SlidingWindowBuffer:
    """
    Sliding window buffer for continuous sequence recognition.
    Maintains a fixed-size window of frames/landmarks.
    """

    def __init__(self, window_size: int = 30, stride: int = 10):
        """
        Initialize sliding window buffer.

        Args:
            window_size: Size of the sliding window (number of frames)
            stride: Number of frames to advance window (for overlap)
        """
        self.window_size = window_size
        self.stride = stride
        self.buffer = deque(maxlen=window_size)
        self.frame_count = 0

        logger.info(f"Sliding window buffer initialized: window_size={window_size}, stride={stride}")

    def add_frame(self, landmarks: Optional[np.ndarray]) -> bool:
        """
        Add landmarks from a new frame to the buffer.

        Args:
            landmarks: Hand landmarks (21, 3) or None

        Returns:
            True if window is ready for inference (buffer is full and stride reached)
        """
        # Add to buffer (use zero padding if no landmarks detected)
        if landmarks is None:
            landmarks = np.zeros((21, 3), dtype=np.float32)

        self.buffer.append(landmarks)
        self.frame_count += 1

        # Check if we should run inference
        # Window must be full and stride interval reached
        is_ready = (len(self.buffer) == self.window_size and
                   (self.frame_count - self.window_size) % self.stride == 0)

        return is_ready

    def get_sequence(self) -> np.ndarray:
        """
        Get current window as a sequence array.

        Returns:
            Landmarks sequence (window_size, 21, 3)
        """
        return np.array(list(self.buffer), dtype=np.float32)

    def reset(self):
        """Reset the buffer."""
        self.buffer.clear()
        self.frame_count = 0
        logger.debug("Buffer reset")


class LightingNormalizer:
    """
    Preprocessing for handling varied lighting conditions.
    Applies histogram equalization and adaptive brightness adjustment.
    """

    @staticmethod
    def normalize_frame(frame: np.ndarray) -> np.ndarray:
        """
        Normalize frame for varied lighting conditions.

        Args:
            frame: Input frame (BGR)

        Returns:
            Normalized frame
        """
        # Convert to LAB color space
        lab = cv2.cvtColor(frame, cv2.COLOR_BGR2LAB)

        # Split LAB channels
        l, a, b = cv2.split(lab)

        # Apply CLAHE (Contrast Limited Adaptive Histogram Equalization) to L channel
        clahe = cv2.createCLAHE(clipLimit=2.0, tileGridSize=(8, 8))
        l_clahe = clahe.apply(l)

        # Merge channels
        lab_clahe = cv2.merge([l_clahe, a, b])

        # Convert back to BGR
        normalized = cv2.cvtColor(lab_clahe, cv2.COLOR_LAB2BGR)

        return normalized

    @staticmethod
    def adjust_brightness(frame: np.ndarray, target_brightness: float = 127.0) -> np.ndarray:
        """
        Adjust frame brightness to target value.

        Args:
            frame: Input frame
            target_brightness: Target mean brightness (0-255)

        Returns:
            Brightness-adjusted frame
        """
        # Calculate current brightness
        gray = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)
        current_brightness = np.mean(gray)

        # Calculate adjustment factor
        if current_brightness > 0:
            factor = target_brightness / current_brightness
            adjusted = cv2.convertScaleAbs(frame, alpha=factor, beta=0)
            return adjusted

        return frame

    @staticmethod
    def preprocess_frame(frame: np.ndarray) -> np.ndarray:
        """
        Apply full preprocessing pipeline.

        Args:
            frame: Input frame

        Returns:
            Preprocessed frame
        """
        # Normalize lighting
        normalized = LightingNormalizer.normalize_frame(frame)

        # Adjust brightness
        adjusted = LightingNormalizer.adjust_brightness(normalized)

        return adjusted


class StreamingRecognitionService:
    """
    Service for real-time streaming sign language recognition.
    Processes continuous video frames with sliding window inference.
    """

    def __init__(
        self,
        window_size: int = 30,
        stride: int = 10,
        fps_target: int = 30,
        min_confidence: float = 0.3,
        preprocess_lighting: bool = True
    ):
        """
        Initialize streaming recognition service.

        Args:
            window_size: Size of sliding window
            stride: Stride for sliding window
            fps_target: Target FPS for processing
            min_confidence: Minimum confidence threshold for predictions
            preprocess_lighting: Whether to apply lighting normalization
        """
        self.window_size = window_size
        self.stride = stride
        self.fps_target = fps_target
        self.min_confidence = min_confidence
        self.preprocess_lighting = preprocess_lighting

        # Initialize components
        self.extractor = MediaPipeHandExtractor(
            static_image_mode=False,  # Use tracking mode for video
            max_num_hands=1,
            min_detection_confidence=0.5,
            min_tracking_confidence=0.5
        )

        self.buffer = SlidingWindowBuffer(window_size=window_size, stride=stride)
        self.normalizer = LightingNormalizer() if preprocess_lighting else None

        # Performance tracking
        self.frame_times: List[float] = []
        self.inference_times: List[float] = []

        # Session state
        self.session_id: Optional[str] = None
        self.is_active = False

        logger.info("Streaming recognition service initialized")

    async def process_frame(
        self,
        frame_bytes: bytes
    ) -> Optional[Dict]:
        """
        Process a single frame from the stream.

        Args:
            frame_bytes: Frame as bytes

        Returns:
            Recognition result if window is ready, None otherwise
        """
        try:
            # Decode frame
            nparr = np.frombuffer(frame_bytes, np.uint8)
            frame = cv2.imdecode(nparr, cv2.IMREAD_COLOR)

            if frame is None:
                logger.warning("Failed to decode frame")
                return None

            # Preprocess for lighting conditions
            if self.preprocess_lighting and self.normalizer:
                frame = self.normalizer.preprocess_frame(frame)

            # Extract landmarks
            result = self.extractor.extract_landmarks(frame, normalize=True)

            landmarks = None
            handedness = "Unknown"
            if result is not None:
                landmarks, handedness = result

            # Add to sliding window buffer
            is_ready = self.buffer.add_frame(landmarks)

            # If window is ready, run inference
            if is_ready:
                sequence = self.buffer.get_sequence()
                return await self._run_inference(sequence, handedness)

            return None

        except Exception as e:
            logger.error(f"Error processing frame: {e}", exc_info=True)
            return None

    async def _run_inference(
        self,
        sequence: np.ndarray,
        handedness: str
    ) -> Dict:
        """
        Run inference on a complete sequence.

        Args:
            sequence: Landmarks sequence (window_size, 21, 3)
            handedness: Hand detected (Left/Right)

        Returns:
            Recognition result dictionary
        """
        try:
            # Get inference engine
            engine = get_inference_engine()

            # Run inference
            predictions, inference_time = engine.predict(
                sequence,
                top_k=5,
                return_timing=True
            )

            # Filter by confidence threshold
            filtered_predictions = [
                {
                    "class_index": idx,
                    "class_name": name,
                    "confidence": float(conf)
                }
                for idx, name, conf in predictions
                if conf >= self.min_confidence
            ]

            # Get top prediction
            top_prediction = filtered_predictions[0] if filtered_predictions else None

            result = {
                "sign": top_prediction["class_name"] if top_prediction else None,
                "confidence": top_prediction["confidence"] if top_prediction else 0.0,
                "timestamp": datetime.utcnow().isoformat(),
                "inference_time_ms": inference_time,
                "handedness": handedness,
                "all_predictions": filtered_predictions,
                "landmarks_detected": True
            }

            # Track inference time
            self.inference_times.append(inference_time)

            return result

        except Exception as e:
            logger.error(f"Inference error: {e}", exc_info=True)
            return {
                "sign": None,
                "confidence": 0.0,
                "timestamp": datetime.utcnow().isoformat(),
                "error": str(e)
            }

    def start_session(self, session_id: str):
        """Start a new recognition session."""
        self.session_id = session_id
        self.is_active = True
        self.buffer.reset()
        logger.info(f"Started streaming session: {session_id}")

    def stop_session(self):
        """Stop the current recognition session."""
        self.is_active = False
        logger.info(f"Stopped streaming session: {self.session_id}")

        # Calculate session statistics
        if self.inference_times:
            avg_inference = np.mean(self.inference_times)
            logger.info(f"Session stats: avg_inference={avg_inference:.2f}ms, "
                       f"total_inferences={len(self.inference_times)}")

    def get_performance_stats(self) -> Dict:
        """
        Get performance statistics for current session.

        Returns:
            Dictionary with performance metrics
        """
        if not self.inference_times:
            return {
                "avg_inference_ms": 0.0,
                "total_inferences": 0,
                "target_fps": self.fps_target
            }

        return {
            "avg_inference_ms": float(np.mean(self.inference_times)),
            "median_inference_ms": float(np.median(self.inference_times)),
            "min_inference_ms": float(np.min(self.inference_times)),
            "max_inference_ms": float(np.max(self.inference_times)),
            "total_inferences": len(self.inference_times),
            "target_fps": self.fps_target,
            "actual_fps": len(self.inference_times) / (len(self.inference_times) / self.fps_target) if self.inference_times else 0
        }

    def cleanup(self):
        """Clean up resources."""
        self.extractor.close()
        logger.info("Streaming service cleaned up")


# Singleton for streaming service
_streaming_service: Optional[StreamingRecognitionService] = None


def get_streaming_service() -> StreamingRecognitionService:
    """
    Get or create streaming recognition service singleton.

    Returns:
        StreamingRecognitionService instance
    """
    global _streaming_service

    if _streaming_service is None:
        _streaming_service = StreamingRecognitionService(
            window_size=30,
            stride=10,
            fps_target=30,
            min_confidence=0.3,
            preprocess_lighting=True
        )

    return _streaming_service
