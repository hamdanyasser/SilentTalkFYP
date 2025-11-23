"""
Training Script for CNN-LSTM Sign Language Recognition Model
Supports training, evaluation, and ONNX export
"""

import os
import sys
import argparse
import numpy as np
import tensorflow as tf
from tensorflow import keras
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import LabelEncoder
import tf2onnx
import logging
from pathlib import Path
from typing import Tuple, Dict

# Add parent directory to path
sys.path.append(str(Path(__file__).parent))

from app.models.cnn_lstm_model import CNNLSTMSignLanguageModel, create_callbacks

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)


class SignLanguageDataset:
    """
    Dataset loader for sign language recognition.
    Loads preprocessed landmark sequences and labels.
    """

    def __init__(
        self,
        data_dir: str,
        sequence_length: int = 30,
        num_landmarks: int = 21,
        num_coordinates: int = 3
    ):
        """
        Initialize dataset loader.

        Args:
            data_dir: Directory containing processed data
            sequence_length: Number of frames per sequence
            num_landmarks: Number of hand landmarks
            num_coordinates: Number of coordinates per landmark
        """
        self.data_dir = Path(data_dir)
        self.sequence_length = sequence_length
        self.num_landmarks = num_landmarks
        self.num_coordinates = num_coordinates

        logger.info(f"Dataset loader initialized for {data_dir}")

    def load_data(self) -> Tuple[np.ndarray, np.ndarray]:
        """
        Load preprocessed landmark sequences and labels.

        Returns:
            Tuple of (X, y) where:
            - X: landmarks array (N, seq_length, 21, 3)
            - y: labels array (N,)
        """
        # Check if processed data exists
        sequences_path = self.data_dir / "sequences.npy"
        labels_path = self.data_dir / "labels.npy"

        if sequences_path.exists() and labels_path.exists():
            logger.info("Loading preprocessed data...")
            X = np.load(sequences_path)
            y = np.load(labels_path)
            logger.info(f"Loaded {len(X)} sequences")
            return X, y

        # If not, create dummy data for demonstration
        logger.warning("No preprocessed data found, generating dummy data for testing")
        return self._generate_dummy_data()

    def _generate_dummy_data(
        self,
        num_samples: int = 1000,
        num_classes: int = 26  # A-Z for ASL
    ) -> Tuple[np.ndarray, np.ndarray]:
        """
        Generate dummy data for testing.

        Args:
            num_samples: Number of samples to generate
            num_classes: Number of classes

        Returns:
            Tuple of (X, y)
        """
        logger.info(f"Generating {num_samples} dummy samples with {num_classes} classes")

        # Generate random landmark sequences
        X = np.random.rand(
            num_samples,
            self.sequence_length,
            self.num_landmarks,
            self.num_coordinates
        ).astype(np.float32)

        # Generate random labels
        y = np.random.randint(0, num_classes, size=num_samples)

        return X, y


def prepare_datasets(
    X: np.ndarray,
    y: np.ndarray,
    test_size: float = 0.15,
    val_size: float = 0.15,
    random_state: int = 42
) -> Tuple[Tuple, Tuple, Tuple]:
    """
    Split data into train/validation/test sets (70/15/15).

    Args:
        X: Feature array
        y: Label array
        test_size: Test set size (0.15)
        val_size: Validation set size (0.15)
        random_state: Random seed

    Returns:
        Tuple of (train, val, test) sets
    """
    # Split into train+val and test
    X_temp, X_test, y_temp, y_test = train_test_split(
        X, y, test_size=test_size, random_state=random_state, stratify=y
    )

    # Split train+val into train and val
    val_size_adjusted = val_size / (1 - test_size)
    X_train, X_val, y_train, y_val = train_test_split(
        X_temp, y_temp, test_size=val_size_adjusted, random_state=random_state, stratify=y_temp
    )

    logger.info(f"Dataset split: Train={len(X_train)}, Val={len(X_val)}, Test={len(X_test)}")

    return (X_train, y_train), (X_val, y_val), (X_test, y_test)


def train_model(
    model: CNNLSTMSignLanguageModel,
    train_data: Tuple[np.ndarray, np.ndarray],
    val_data: Tuple[np.ndarray, np.ndarray],
    num_classes: int,
    batch_size: int = 32,
    epochs: int = 100,
    checkpoint_dir: str = "checkpoints",
    log_dir: str = "logs"
) -> Dict:
    """
    Train the CNN-LSTM model.

    Args:
        model: Model to train
        train_data: Tuple of (X_train, y_train)
        val_data: Tuple of (X_val, y_val)
        num_classes: Number of classes
        batch_size: Training batch size
        epochs: Maximum number of epochs
        checkpoint_dir: Directory for model checkpoints
        log_dir: Directory for training logs

    Returns:
        Training history dict
    """
    X_train, y_train = train_data
    X_val, y_val = val_data

    # Convert labels to categorical
    y_train_cat = keras.utils.to_categorical(y_train, num_classes)
    y_val_cat = keras.utils.to_categorical(y_val, num_classes)

    # Create directories
    os.makedirs(checkpoint_dir, exist_ok=True)
    os.makedirs(log_dir, exist_ok=True)

    # Create callbacks
    checkpoint_path = os.path.join(checkpoint_dir, "best_model.h5")
    callbacks = create_callbacks(
        checkpoint_path=checkpoint_path,
        log_dir=log_dir,
        early_stopping_patience=10,
        reduce_lr_patience=5
    )

    # Train model
    logger.info("Starting training...")
    logger.info(f"Batch size: {batch_size}, Max epochs: {epochs}")

    history = model.get_model().fit(
        X_train, y_train_cat,
        validation_data=(X_val, y_val_cat),
        batch_size=batch_size,
        epochs=epochs,
        callbacks=callbacks,
        verbose=1
    )

    logger.info("Training completed")

    return history.history


def evaluate_model(
    model: CNNLSTMSignLanguageModel,
    test_data: Tuple[np.ndarray, np.ndarray],
    num_classes: int
) -> Dict[str, float]:
    """
    Evaluate model on test set.

    Args:
        model: Trained model
        test_data: Tuple of (X_test, y_test)
        num_classes: Number of classes

    Returns:
        Dictionary of evaluation metrics
    """
    X_test, y_test = test_data
    y_test_cat = keras.utils.to_categorical(y_test, num_classes)

    logger.info("Evaluating model on test set...")
    results = model.get_model().evaluate(X_test, y_test_cat, verbose=1)

    # Create results dict
    metrics = dict(zip(model.get_model().metrics_names, results))

    logger.info("Test Results:")
    for metric, value in metrics.items():
        logger.info(f"  {metric}: {value:.4f}")

    return metrics


def export_to_onnx(
    model: CNNLSTMSignLanguageModel,
    output_path: str,
    opset: int = 13
) -> None:
    """
    Export trained model to ONNX format.

    Args:
        model: Trained Keras model
        output_path: Path to save ONNX model
        opset: ONNX opset version
    """
    logger.info(f"Exporting model to ONNX format: {output_path}")

    keras_model = model.get_model()

    # Convert to ONNX
    try:
        onnx_model, _ = tf2onnx.convert.from_keras(
            keras_model,
            opset=opset,
            output_path=output_path
        )

        logger.info(f"Model successfully exported to {output_path}")
        logger.info(f"ONNX model inputs: {[input.name for input in onnx_model.graph.input]}")
        logger.info(f"ONNX model outputs: {[output.name for output in onnx_model.graph.output]}")

    except Exception as e:
        logger.error(f"Failed to export model to ONNX: {e}")
        raise


def main(args):
    """Main training pipeline."""
    logger.info("=" * 80)
    logger.info("Sign Language Recognition Model Training")
    logger.info("=" * 80)

    # Set random seeds for reproducibility
    np.random.seed(args.seed)
    tf.random.set_seed(args.seed)

    # Load dataset
    dataset = SignLanguageDataset(
        data_dir=args.data_dir,
        sequence_length=args.sequence_length,
        num_landmarks=21,
        num_coordinates=3
    )

    X, y = dataset.load_data()
    num_classes = len(np.unique(y))

    logger.info(f"Dataset loaded: {X.shape}, {num_classes} classes")

    # Prepare datasets (70/15/15 split)
    train_data, val_data, test_data = prepare_datasets(
        X, y,
        test_size=0.15,
        val_size=0.15,
        random_state=args.seed
    )

    # Create model
    model = CNNLSTMSignLanguageModel(
        num_classes=num_classes,
        sequence_length=args.sequence_length,
        num_landmarks=21,
        num_coordinates=3,
        lstm_units=128,
        dense_units=256,
        dropout_rate=0.5
    )

    # Build and compile model
    model.build_model()
    model.compile_model(
        learning_rate=args.learning_rate,
        optimizer='adam',
        loss='categorical_crossentropy',
        metrics=['accuracy', 'top_k_categorical_accuracy']
    )

    # Print model summary
    logger.info("Model Architecture:")
    model.summary()

    # Train model
    history = train_model(
        model=model,
        train_data=train_data,
        val_data=val_data,
        num_classes=num_classes,
        batch_size=args.batch_size,
        epochs=args.epochs,
        checkpoint_dir=args.checkpoint_dir,
        log_dir=args.log_dir
    )

    # Evaluate on test set
    test_metrics = evaluate_model(model, test_data, num_classes)

    # Export to ONNX
    if args.export_onnx:
        onnx_path = os.path.join(args.checkpoint_dir, "model.onnx")
        export_to_onnx(model, onnx_path, opset=13)

    logger.info("=" * 80)
    logger.info("Training pipeline completed successfully")
    logger.info("=" * 80)


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Train CNN-LSTM Sign Language Recognition Model")

    # Data parameters
    parser.add_argument("--data-dir", type=str, default="data/processed",
                        help="Directory containing processed data")
    parser.add_argument("--sequence-length", type=int, default=30,
                        help="Number of frames per sequence")

    # Training parameters
    parser.add_argument("--batch-size", type=int, default=32,
                        help="Training batch size")
    parser.add_argument("--epochs", type=int, default=100,
                        help="Maximum number of training epochs")
    parser.add_argument("--learning-rate", type=float, default=1e-3,
                        help="Initial learning rate")

    # Output parameters
    parser.add_argument("--checkpoint-dir", type=str, default="checkpoints",
                        help="Directory for model checkpoints")
    parser.add_argument("--log-dir", type=str, default="logs",
                        help="Directory for training logs")
    parser.add_argument("--export-onnx", action="store_true",
                        help="Export trained model to ONNX format")

    # Other parameters
    parser.add_argument("--seed", type=int, default=42,
                        help="Random seed for reproducibility")

    args = parser.parse_args()

    main(args)
