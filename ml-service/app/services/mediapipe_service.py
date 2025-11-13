import mediapipe as mp
import numpy as np
from typing import Optional, List
import cv2

from app.core.config import settings


class MediaPipeService:
    """
    Service for hand landmark detection using MediaPipe
    Maps to FR-002: Hand landmark extraction with 21 points
    """

    def __init__(self):
        self.mp_hands = mp.solutions.hands
        self.hands = self.mp_hands.Hands(
            static_image_mode=False,
            max_num_hands=2,
            model_complexity=settings.MEDIAPIPE_MODEL_COMPLEXITY,
            min_detection_confidence=settings.MEDIAPIPE_MIN_DETECTION_CONFIDENCE,
            min_tracking_confidence=settings.MEDIAPIPE_MIN_TRACKING_CONFIDENCE
        )
        self.mp_drawing = mp.solutions.drawing_utils
        self.mp_drawing_styles = mp.solutions.drawing_styles

    def extract_hand_landmarks(self, frame: np.ndarray) -> Optional[np.ndarray]:
        """
        Extract 21-point hand landmarks from video frame

        Args:
            frame: Input video frame (BGR format)

        Returns:
            Numpy array of shape (21, 3) containing x, y, z coordinates
            or None if no hands detected
        """
        # Convert BGR to RGB
        frame_rgb = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)

        # Process the frame
        results = self.hands.process(frame_rgb)

        if not results.multi_hand_landmarks:
            return None

        # Extract landmarks from first detected hand
        hand_landmarks = results.multi_hand_landmarks[0]

        # Convert landmarks to numpy array
        landmarks = []
        for landmark in hand_landmarks.landmark:
            landmarks.append([landmark.x, landmark.y, landmark.z])

        return np.array(landmarks)

    def extract_all_hands(self, frame: np.ndarray) -> List[np.ndarray]:
        """
        Extract landmarks from all detected hands

        Args:
            frame: Input video frame (BGR format)

        Returns:
            List of numpy arrays, each containing 21 landmarks
        """
        frame_rgb = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
        results = self.hands.process(frame_rgb)

        if not results.multi_hand_landmarks:
            return []

        all_landmarks = []
        for hand_landmarks in results.multi_hand_landmarks:
            landmarks = []
            for landmark in hand_landmarks.landmark:
                landmarks.append([landmark.x, landmark.y, landmark.z])
            all_landmarks.append(np.array(landmarks))

        return all_landmarks

    def draw_landmarks(self, frame: np.ndarray) -> np.ndarray:
        """
        Draw hand landmarks on frame for visualization

        Args:
            frame: Input video frame (BGR format)

        Returns:
            Frame with landmarks drawn
        """
        frame_rgb = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
        results = self.hands.process(frame_rgb)

        if results.multi_hand_landmarks:
            for hand_landmarks in results.multi_hand_landmarks:
                self.mp_drawing.draw_landmarks(
                    frame,
                    hand_landmarks,
                    self.mp_hands.HAND_CONNECTIONS,
                    self.mp_drawing_styles.get_default_hand_landmarks_style(),
                    self.mp_drawing_styles.get_default_hand_connections_style()
                )

        return frame

    def __del__(self):
        """
        Cleanup MediaPipe resources
        """
        if hasattr(self, 'hands'):
            self.hands.close()
