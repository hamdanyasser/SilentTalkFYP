"""
MediaPipe Hand Landmark Extraction Service
Extracts 21-point hand landmarks from video frames
"""

import cv2
import mediapipe as mp
import numpy as np
from typing import Optional, Tuple, List
import logging

logger = logging.getLogger(__name__)


class MediaPipeHandExtractor:
    """
    Extract 21-point hand landmarks using MediaPipe Hands solution.

    Landmarks (0-20):
    - 0: WRIST
    - 1-4: THUMB (CMC, MCP, IP, TIP)
    - 5-8: INDEX (MCP, PIP, DIP, TIP)
    - 9-12: MIDDLE (MCP, PIP, DIP, TIP)
    - 13-16: RING (MCP, PIP, DIP, TIP)
    - 17-20: PINKY (MCP, PIP, DIP, TIP)
    """

    def __init__(
        self,
        static_image_mode: bool = False,
        max_num_hands: int = 2,
        model_complexity: int = 1,
        min_detection_confidence: float = 0.5,
        min_tracking_confidence: float = 0.5
    ):
        """
        Initialize MediaPipe Hands detector.

        Args:
            static_image_mode: Whether to treat inputs as static images
            max_num_hands: Maximum number of hands to detect
            model_complexity: Complexity of the hand landmark model (0 or 1)
            min_detection_confidence: Minimum confidence for hand detection
            min_tracking_confidence: Minimum confidence for hand tracking
        """
        self.mp_hands = mp.solutions.hands
        self.mp_drawing = mp.solutions.drawing_utils
        self.mp_drawing_styles = mp.solutions.drawing_styles

        self.hands = self.mp_hands.Hands(
            static_image_mode=static_image_mode,
            max_num_hands=max_num_hands,
            model_complexity=model_complexity,
            min_detection_confidence=min_detection_confidence,
            min_tracking_confidence=min_tracking_confidence
        )

        logger.info("MediaPipe Hand Extractor initialized")

    def extract_landmarks(
        self,
        frame: np.ndarray,
        normalize: bool = True
    ) -> Optional[Tuple[np.ndarray, str]]:
        """
        Extract hand landmarks from a single frame.

        Args:
            frame: Input image (BGR format from OpenCV)
            normalize: Whether to normalize landmarks to [0, 1]

        Returns:
            Tuple of (landmarks_array, handedness) or None if no hands detected
            - landmarks_array: shape (21, 3) for x, y, z coordinates
            - handedness: 'Left' or 'Right'
        """
        # Convert BGR to RGB
        image_rgb = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)

        # Process the image
        results = self.hands.process(image_rgb)

        if not results.multi_hand_landmarks:
            return None

        # Get the first hand (primary hand for sign language)
        hand_landmarks = results.multi_hand_landmarks[0]
        handedness = results.multi_handedness[0].classification[0].label

        # Extract landmarks as numpy array
        landmarks = []
        for landmark in hand_landmarks.landmark:
            landmarks.append([landmark.x, landmark.y, landmark.z])

        landmarks_array = np.array(landmarks, dtype=np.float32)

        # Normalize if not already (MediaPipe outputs normalized by default)
        # Optionally denormalize for visualization
        if not normalize:
            h, w, _ = frame.shape
            landmarks_array[:, 0] *= w
            landmarks_array[:, 1] *= h

        return landmarks_array, handedness

    def extract_landmarks_batch(
        self,
        frames: List[np.ndarray],
        normalize: bool = True
    ) -> List[Optional[Tuple[np.ndarray, str]]]:
        """
        Extract hand landmarks from multiple frames.

        Args:
            frames: List of input images (BGR format)
            normalize: Whether to normalize landmarks

        Returns:
            List of (landmarks_array, handedness) tuples or None for each frame
        """
        results = []
        for frame in frames:
            landmarks = self.extract_landmarks(frame, normalize=normalize)
            results.append(landmarks)
        return results

    def extract_landmarks_sequence(
        self,
        frames: List[np.ndarray],
        sequence_length: int = 30,
        normalize: bool = True
    ) -> Optional[np.ndarray]:
        """
        Extract landmarks from a sequence of frames for temporal modeling.

        Args:
            frames: List of input frames
            sequence_length: Expected sequence length (pad or truncate)
            normalize: Whether to normalize landmarks

        Returns:
            Landmarks array of shape (sequence_length, 21, 3) or None if extraction fails
        """
        landmarks_sequence = []

        for frame in frames:
            result = self.extract_landmarks(frame, normalize=normalize)
            if result is None:
                # Use zero padding for missing frames
                landmarks_sequence.append(np.zeros((21, 3), dtype=np.float32))
            else:
                landmarks_array, _ = result
                landmarks_sequence.append(landmarks_array)

        # Convert to numpy array
        landmarks_sequence = np.array(landmarks_sequence, dtype=np.float32)

        # Pad or truncate to sequence_length
        current_length = len(landmarks_sequence)
        if current_length < sequence_length:
            # Pad with zeros
            padding = np.zeros((sequence_length - current_length, 21, 3), dtype=np.float32)
            landmarks_sequence = np.concatenate([landmarks_sequence, padding], axis=0)
        elif current_length > sequence_length:
            # Truncate
            landmarks_sequence = landmarks_sequence[:sequence_length]

        return landmarks_sequence

    def draw_landmarks(
        self,
        frame: np.ndarray,
        landmarks: np.ndarray,
        handedness: str = "Right"
    ) -> np.ndarray:
        """
        Draw hand landmarks on the frame for visualization.

        Args:
            frame: Input frame
            landmarks: Landmarks array (21, 3)
            handedness: 'Left' or 'Right'

        Returns:
            Frame with drawn landmarks
        """
        annotated_frame = frame.copy()
        h, w, _ = frame.shape

        # Draw landmarks
        for i, (x, y, z) in enumerate(landmarks):
            # Convert normalized coordinates to pixel coordinates
            px, py = int(x * w), int(y * h)

            # Draw circle for each landmark
            cv2.circle(annotated_frame, (px, py), 5, (0, 255, 0), -1)

            # Draw landmark index
            cv2.putText(
                annotated_frame,
                str(i),
                (px + 5, py + 5),
                cv2.FONT_HERSHEY_SIMPLEX,
                0.3,
                (255, 255, 255),
                1
            )

        # Draw connections
        connections = self.mp_hands.HAND_CONNECTIONS
        for connection in connections:
            start_idx, end_idx = connection
            start_point = (
                int(landmarks[start_idx][0] * w),
                int(landmarks[start_idx][1] * h)
            )
            end_point = (
                int(landmarks[end_idx][0] * w),
                int(landmarks[end_idx][1] * h)
            )
            cv2.line(annotated_frame, start_point, end_point, (0, 255, 0), 2)

        # Add handedness label
        cv2.putText(
            annotated_frame,
            handedness,
            (10, 30),
            cv2.FONT_HERSHEY_SIMPLEX,
            1,
            (0, 255, 0),
            2
        )

        return annotated_frame

    def close(self):
        """Release MediaPipe resources."""
        self.hands.close()
        logger.info("MediaPipe Hand Extractor closed")
