"""
Data Augmentation Pipeline for Sign Language Recognition
Supports rotation, zoom, brightness, and landmark transformations
"""

import numpy as np
import cv2
from typing import Tuple, Optional
import random
import logging

logger = logging.getLogger(__name__)


class SignLanguageAugmentor:
    """
    Data augmentation for sign language recognition.
    Applies transformations to both images and hand landmarks.
    """

    def __init__(
        self,
        rotation_range: float = 15.0,
        zoom_range: Tuple[float, float] = (0.9, 1.1),
        brightness_range: Tuple[float, float] = (0.8, 1.2),
        horizontal_flip: bool = True,
        noise_std: float = 0.02,
        probability: float = 0.5
    ):
        """
        Initialize augmentor with transformation parameters.

        Args:
            rotation_range: Max rotation angle in degrees
            zoom_range: Zoom factor range (min, max)
            brightness_range: Brightness multiplier range
            horizontal_flip: Whether to apply horizontal flip
            noise_std: Standard deviation for Gaussian noise on landmarks
            probability: Probability of applying each augmentation
        """
        self.rotation_range = rotation_range
        self.zoom_range = zoom_range
        self.brightness_range = brightness_range
        self.horizontal_flip = horizontal_flip
        self.noise_std = noise_std
        self.probability = probability

        logger.info("SignLanguageAugmentor initialized")

    def augment_frame(
        self,
        frame: np.ndarray,
        apply_rotation: bool = True,
        apply_zoom: bool = True,
        apply_brightness: bool = True
    ) -> np.ndarray:
        """
        Apply augmentation to a single frame.

        Args:
            frame: Input image
            apply_rotation: Whether to apply rotation
            apply_zoom: Whether to apply zoom
            apply_brightness: Whether to apply brightness adjustment

        Returns:
            Augmented frame
        """
        augmented = frame.copy()

        # Rotation
        if apply_rotation and random.random() < self.probability:
            angle = random.uniform(-self.rotation_range, self.rotation_range)
            augmented = self._rotate_frame(augmented, angle)

        # Zoom
        if apply_zoom and random.random() < self.probability:
            zoom_factor = random.uniform(*self.zoom_range)
            augmented = self._zoom_frame(augmented, zoom_factor)

        # Brightness
        if apply_brightness and random.random() < self.probability:
            brightness_factor = random.uniform(*self.brightness_range)
            augmented = self._adjust_brightness(augmented, brightness_factor)

        # Horizontal flip
        if self.horizontal_flip and random.random() < self.probability:
            augmented = cv2.flip(augmented, 1)

        return augmented

    def augment_landmarks(
        self,
        landmarks: np.ndarray,
        apply_rotation: bool = True,
        apply_noise: bool = True,
        apply_scale: bool = True
    ) -> np.ndarray:
        """
        Apply augmentation to hand landmarks.

        Args:
            landmarks: Hand landmarks array (21, 3)
            apply_rotation: Whether to apply rotation
            apply_noise: Whether to add noise
            apply_scale: Whether to apply scaling

        Returns:
            Augmented landmarks
        """
        augmented = landmarks.copy()

        # Center the landmarks (subtract mean)
        center = augmented.mean(axis=0)
        augmented_centered = augmented - center

        # Rotation (2D rotation on x-y plane)
        if apply_rotation and random.random() < self.probability:
            angle = random.uniform(-self.rotation_range, self.rotation_range)
            augmented_centered = self._rotate_landmarks(augmented_centered, angle)

        # Scale
        if apply_scale and random.random() < self.probability:
            scale_factor = random.uniform(*self.zoom_range)
            augmented_centered *= scale_factor

        # Add back the center
        augmented = augmented_centered + center

        # Add Gaussian noise
        if apply_noise and random.random() < self.probability:
            noise = np.random.normal(0, self.noise_std, augmented.shape)
            augmented += noise

        # Clip to valid range [0, 1] for normalized landmarks
        augmented = np.clip(augmented, 0.0, 1.0)

        return augmented.astype(np.float32)

    def augment_sequence(
        self,
        frames: np.ndarray,
        landmarks: Optional[np.ndarray] = None
    ) -> Tuple[np.ndarray, Optional[np.ndarray]]:
        """
        Apply consistent augmentation to a sequence of frames and landmarks.

        Args:
            frames: Sequence of frames (T, H, W, C)
            landmarks: Sequence of landmarks (T, 21, 3) or None

        Returns:
            Tuple of (augmented_frames, augmented_landmarks)
        """
        # Sample augmentation parameters once for the entire sequence
        angle = random.uniform(-self.rotation_range, self.rotation_range)
        zoom_factor = random.uniform(*self.zoom_range)
        brightness_factor = random.uniform(*self.brightness_range)
        do_flip = random.random() < self.probability if self.horizontal_flip else False

        # Apply augmentation to all frames
        augmented_frames = []
        for frame in frames:
            aug_frame = frame.copy()

            if random.random() < self.probability:
                aug_frame = self._rotate_frame(aug_frame, angle)
            if random.random() < self.probability:
                aug_frame = self._zoom_frame(aug_frame, zoom_factor)
            if random.random() < self.probability:
                aug_frame = self._adjust_brightness(aug_frame, brightness_factor)
            if do_flip:
                aug_frame = cv2.flip(aug_frame, 1)

            augmented_frames.append(aug_frame)

        augmented_frames = np.array(augmented_frames)

        # Apply augmentation to landmarks if provided
        augmented_landmarks = None
        if landmarks is not None:
            augmented_landmarks = []
            for landmark_frame in landmarks:
                aug_landmarks = self.augment_landmarks(
                    landmark_frame,
                    apply_rotation=True,
                    apply_noise=True,
                    apply_scale=True
                )
                augmented_landmarks.append(aug_landmarks)
            augmented_landmarks = np.array(augmented_landmarks)

        return augmented_frames, augmented_landmarks

    def _rotate_frame(self, frame: np.ndarray, angle: float) -> np.ndarray:
        """Rotate frame by given angle."""
        h, w = frame.shape[:2]
        center = (w // 2, h // 2)

        # Get rotation matrix
        rotation_matrix = cv2.getRotationMatrix2D(center, angle, 1.0)

        # Apply rotation
        rotated = cv2.warpAffine(frame, rotation_matrix, (w, h))

        return rotated

    def _zoom_frame(self, frame: np.ndarray, zoom_factor: float) -> np.ndarray:
        """Zoom frame by given factor."""
        h, w = frame.shape[:2]
        center_x, center_y = w // 2, h // 2

        # Calculate new dimensions
        new_w = int(w / zoom_factor)
        new_h = int(h / zoom_factor)

        # Calculate crop box
        x1 = max(0, center_x - new_w // 2)
        y1 = max(0, center_y - new_h // 2)
        x2 = min(w, center_x + new_w // 2)
        y2 = min(h, center_y + new_h // 2)

        # Crop and resize
        cropped = frame[y1:y2, x1:x2]
        zoomed = cv2.resize(cropped, (w, h))

        return zoomed

    def _adjust_brightness(self, frame: np.ndarray, factor: float) -> np.ndarray:
        """Adjust frame brightness."""
        # Convert to float
        adjusted = frame.astype(np.float32) * factor

        # Clip to valid range
        adjusted = np.clip(adjusted, 0, 255)

        return adjusted.astype(np.uint8)

    def _rotate_landmarks(self, landmarks: np.ndarray, angle: float) -> np.ndarray:
        """Rotate landmarks in 2D (x-y plane)."""
        angle_rad = np.radians(angle)
        cos_angle = np.cos(angle_rad)
        sin_angle = np.sin(angle_rad)

        # 2D rotation matrix
        rotation_matrix = np.array([
            [cos_angle, -sin_angle],
            [sin_angle, cos_angle]
        ])

        # Apply rotation to x-y coordinates
        rotated_xy = landmarks[:, :2] @ rotation_matrix.T

        # Keep z coordinate unchanged
        rotated = np.column_stack([rotated_xy, landmarks[:, 2]])

        return rotated


class TemporalAugmentor:
    """
    Temporal augmentation for video sequences.
    """

    def __init__(
        self,
        time_stretch_range: Tuple[float, float] = (0.9, 1.1),
        time_shift_range: int = 3
    ):
        """
        Initialize temporal augmentor.

        Args:
            time_stretch_range: Time stretching factor range
            time_shift_range: Maximum frames to shift
        """
        self.time_stretch_range = time_stretch_range
        self.time_shift_range = time_shift_range

    def time_stretch(
        self,
        sequence: np.ndarray,
        target_length: int
    ) -> np.ndarray:
        """
        Stretch or compress a sequence in time.

        Args:
            sequence: Input sequence (T, ...)
            target_length: Target sequence length

        Returns:
            Time-stretched sequence
        """
        current_length = len(sequence)

        if current_length == target_length:
            return sequence

        # Create indices for interpolation
        indices = np.linspace(0, current_length - 1, target_length)

        # Interpolate
        stretched = []
        for idx in indices:
            lower_idx = int(np.floor(idx))
            upper_idx = min(int(np.ceil(idx)), current_length - 1)
            weight = idx - lower_idx

            # Linear interpolation
            if lower_idx == upper_idx:
                stretched.append(sequence[lower_idx])
            else:
                interpolated = (1 - weight) * sequence[lower_idx] + weight * sequence[upper_idx]
                stretched.append(interpolated)

        return np.array(stretched)

    def time_shift(self, sequence: np.ndarray) -> np.ndarray:
        """
        Shift sequence in time with circular padding.

        Args:
            sequence: Input sequence (T, ...)

        Returns:
            Time-shifted sequence
        """
        shift = random.randint(-self.time_shift_range, self.time_shift_range)
        return np.roll(sequence, shift, axis=0)
