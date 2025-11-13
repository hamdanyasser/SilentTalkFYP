"""
CNN-LSTM Model for Sign Language Recognition
Architecture: Conv blocks → LSTM(128) → Dense(256) → Dropout(0.5) → Softmax
"""

import tensorflow as tf
from tensorflow import keras
from tensorflow.keras import layers, models
from typing import Tuple, Optional
import logging

logger = logging.getLogger(__name__)


class CNNLSTMSignLanguageModel:
    """
    CNN-LSTM model for sequence-based sign language recognition.

    Architecture:
    - Conv2D blocks for spatial feature extraction from hand landmarks
    - LSTM for temporal modeling
    - Dense layers with dropout for classification
    - Softmax output for class probabilities
    """

    def __init__(
        self,
        num_classes: int,
        sequence_length: int = 30,
        num_landmarks: int = 21,
        num_coordinates: int = 3,
        lstm_units: int = 128,
        dense_units: int = 256,
        dropout_rate: float = 0.5
    ):
        """
        Initialize model parameters.

        Args:
            num_classes: Number of sign language classes
            sequence_length: Number of frames in sequence
            num_landmarks: Number of hand landmarks (21 for MediaPipe)
            num_coordinates: Number of coordinates per landmark (3 for x,y,z)
            lstm_units: Number of LSTM units
            dense_units: Number of dense layer units
            dropout_rate: Dropout rate
        """
        self.num_classes = num_classes
        self.sequence_length = sequence_length
        self.num_landmarks = num_landmarks
        self.num_coordinates = num_coordinates
        self.lstm_units = lstm_units
        self.dense_units = dense_units
        self.dropout_rate = dropout_rate

        self.model: Optional[keras.Model] = None

        logger.info(f"CNN-LSTM Model initialized with {num_classes} classes")

    def build_model(self) -> keras.Model:
        """
        Build the CNN-LSTM model architecture.

        Input shape: (batch_size, sequence_length, num_landmarks, num_coordinates)
        Output shape: (batch_size, num_classes)

        Returns:
            Compiled Keras model
        """
        # Input layer
        inputs = layers.Input(
            shape=(self.sequence_length, self.num_landmarks, self.num_coordinates),
            name='landmarks_input'
        )

        # Reshape for TimeDistributed Conv layers
        # (batch, seq, 21, 3) -> (batch, seq, 21, 3, 1) for Conv2D
        x = layers.Reshape((self.sequence_length, self.num_landmarks, self.num_coordinates, 1))(inputs)

        # TimeDistributed Conv blocks for spatial feature extraction
        x = layers.TimeDistributed(
            layers.Conv2D(32, (3, 3), activation='relu', padding='same'),
            name='conv1'
        )(x)
        x = layers.TimeDistributed(
            layers.BatchNormalization(),
            name='bn1'
        )(x)
        x = layers.TimeDistributed(
            layers.MaxPooling2D((2, 2)),
            name='pool1'
        )(x)

        x = layers.TimeDistributed(
            layers.Conv2D(64, (3, 3), activation='relu', padding='same'),
            name='conv2'
        )(x)
        x = layers.TimeDistributed(
            layers.BatchNormalization(),
            name='bn2'
        )(x)
        x = layers.TimeDistributed(
            layers.MaxPooling2D((2, 2)),
            name='pool2'
        )(x)

        x = layers.TimeDistributed(
            layers.Conv2D(128, (3, 3), activation='relu', padding='same'),
            name='conv3'
        )(x)
        x = layers.TimeDistributed(
            layers.BatchNormalization(),
            name='bn3'
        )(x)

        # Flatten spatial dimensions
        x = layers.TimeDistributed(layers.Flatten(), name='flatten')(x)

        # LSTM for temporal modeling
        x = layers.LSTM(
            self.lstm_units,
            return_sequences=False,
            dropout=0.2,
            recurrent_dropout=0.2,
            name='lstm'
        )(x)

        # Dense layers with dropout
        x = layers.Dense(self.dense_units, activation='relu', name='dense1')(x)
        x = layers.Dropout(self.dropout_rate, name='dropout1')(x)

        x = layers.Dense(self.dense_units // 2, activation='relu', name='dense2')(x)
        x = layers.Dropout(self.dropout_rate, name='dropout2')(x)

        # Output layer with softmax
        outputs = layers.Dense(self.num_classes, activation='softmax', name='output')(x)

        # Create model
        model = models.Model(inputs=inputs, outputs=outputs, name='cnn_lstm_sign_language')

        self.model = model

        logger.info("CNN-LSTM model architecture built successfully")
        return model

    def compile_model(
        self,
        learning_rate: float = 1e-3,
        optimizer: str = 'adam',
        loss: str = 'categorical_crossentropy',
        metrics: Optional[list] = None
    ) -> None:
        """
        Compile the model with optimizer and loss function.

        Args:
            learning_rate: Learning rate for optimizer
            optimizer: Optimizer name ('adam', 'sgd', etc.)
            loss: Loss function ('categorical_crossentropy', 'sparse_categorical_crossentropy')
            metrics: List of metrics to track
        """
        if self.model is None:
            raise ValueError("Model must be built before compiling")

        if metrics is None:
            metrics = ['accuracy', 'top_k_categorical_accuracy']

        # Create optimizer
        if optimizer == 'adam':
            opt = keras.optimizers.Adam(learning_rate=learning_rate)
        elif optimizer == 'sgd':
            opt = keras.optimizers.SGD(learning_rate=learning_rate, momentum=0.9)
        else:
            opt = optimizer

        # Compile model
        self.model.compile(
            optimizer=opt,
            loss=loss,
            metrics=metrics
        )

        logger.info(f"Model compiled with {optimizer} optimizer, lr={learning_rate}")

    def summary(self) -> None:
        """Print model summary."""
        if self.model is None:
            raise ValueError("Model must be built first")
        self.model.summary()

    def get_model(self) -> keras.Model:
        """Get the Keras model."""
        if self.model is None:
            raise ValueError("Model not built yet")
        return self.model

    def save_model(self, filepath: str) -> None:
        """
        Save model weights.

        Args:
            filepath: Path to save model
        """
        if self.model is None:
            raise ValueError("Model not built yet")

        self.model.save(filepath)
        logger.info(f"Model saved to {filepath}")

    def load_model(self, filepath: str) -> None:
        """
        Load model weights.

        Args:
            filepath: Path to load model from
        """
        self.model = keras.models.load_model(filepath)
        logger.info(f"Model loaded from {filepath}")

    def predict(
        self,
        landmarks_sequence: tf.Tensor,
        top_k: int = 5
    ) -> Tuple[tf.Tensor, tf.Tensor]:
        """
        Predict sign language class from landmarks sequence.

        Args:
            landmarks_sequence: Input landmarks (batch, seq, 21, 3)
            top_k: Number of top predictions to return

        Returns:
            Tuple of (top_k_probabilities, top_k_classes)
        """
        if self.model is None:
            raise ValueError("Model not built yet")

        # Predict
        predictions = self.model.predict(landmarks_sequence, verbose=0)

        # Get top-k predictions
        top_k_indices = tf.nn.top_k(predictions, k=top_k).indices
        top_k_probs = tf.nn.top_k(predictions, k=top_k).values

        return top_k_probs, top_k_indices


def create_callbacks(
    checkpoint_path: str,
    log_dir: str,
    early_stopping_patience: int = 10,
    reduce_lr_patience: int = 5
) -> list:
    """
    Create training callbacks.

    Args:
        checkpoint_path: Path to save model checkpoints
        log_dir: Directory for TensorBoard logs
        early_stopping_patience: Patience for early stopping
        reduce_lr_patience: Patience for learning rate reduction

    Returns:
        List of Keras callbacks
    """
    callbacks = [
        # Model checkpointing
        keras.callbacks.ModelCheckpoint(
            filepath=checkpoint_path,
            monitor='val_loss',
            save_best_only=True,
            save_weights_only=False,
            mode='min',
            verbose=1
        ),

        # Early stopping
        keras.callbacks.EarlyStopping(
            monitor='val_loss',
            patience=early_stopping_patience,
            restore_best_weights=True,
            verbose=1
        ),

        # Learning rate reduction
        keras.callbacks.ReduceLROnPlateau(
            monitor='val_loss',
            factor=0.5,
            patience=reduce_lr_patience,
            min_lr=1e-6,
            verbose=1
        ),

        # TensorBoard logging
        keras.callbacks.TensorBoard(
            log_dir=log_dir,
            histogram_freq=1,
            write_graph=True,
            write_images=True,
            update_freq='epoch'
        ),

        # CSV logger
        keras.callbacks.CSVLogger(
            filename=f"{log_dir}/training_log.csv",
            append=True
        )
    ]

    return callbacks
