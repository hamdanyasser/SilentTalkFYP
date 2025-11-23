"""
ONNX Runtime Inference Engine for Sign Language Recognition
Optimized for low-latency inference (target: ≤100ms per frame)
"""

import numpy as np
from typing import List, Tuple, Optional, Dict
import time
import logging
from pathlib import Path

# Try to import onnxruntime, but allow service to start without it
try:
    import onnxruntime as ort
    ONNX_AVAILABLE = True
except ImportError as e:
    logger_temp = logging.getLogger(__name__)
    logger_temp.warning(f"ONNX Runtime not available: {e}")
    logger_temp.warning("Service will start but model inference will not be available")
    ONNX_AVAILABLE = False
    ort = None  # type: ignore

logger = logging.getLogger(__name__)


class ONNXInferenceEngine:
    """
    ONNX Runtime inference engine for sign language recognition.
    Optimized for low latency with session configurations.
    """

    def __init__(
        self,
        model_path: str,
        class_names: Optional[List[str]] = None,
        providers: Optional[List[str]] = None
    ):
        """
        Initialize ONNX inference engine.

        Args:
            model_path: Path to ONNX model file
            class_names: List of class names (optional)
            providers: List of execution providers (e.g., ['CUDAExecutionProvider', 'CPUExecutionProvider'])
        """
        if not ONNX_AVAILABLE or ort is None:
            raise RuntimeError(
                "ONNX Runtime is not available. Cannot create inference engine. "
                "This may be due to Docker executable stack restrictions."
            )

        self.model_path = model_path

        # Set execution providers
        if providers is None:
            # Try CUDA first, fall back to CPU
            providers = ['CPUExecutionProvider']
            if ort.get_device() == 'GPU':
                providers = ['CUDAExecutionProvider', 'CPUExecutionProvider']

        # Session options for optimization
        sess_options = ort.SessionOptions()
        sess_options.graph_optimization_level = ort.GraphOptimizationLevel.ORT_ENABLE_ALL
        sess_options.intra_op_num_threads = 4  # Adjust based on CPU cores
        sess_options.inter_op_num_threads = 4

        # Create inference session
        try:
            self.session = ort.InferenceSession(
                model_path,
                sess_options=sess_options,
                providers=providers
            )
            logger.info(f"ONNX model loaded from {model_path}")
            logger.info(f"Execution providers: {self.session.get_providers()}")
        except Exception as e:
            logger.error(f"Failed to load ONNX model: {e}")
            raise

        # Get model metadata
        self.input_name = self.session.get_inputs()[0].name
        self.output_name = self.session.get_outputs()[0].name

        input_shape = self.session.get_inputs()[0].shape
        output_shape = self.session.get_outputs()[0].shape

        logger.info(f"Input name: {self.input_name}, shape: {input_shape}")
        logger.info(f"Output name: {self.output_name}, shape: {output_shape}")

        # Class names
        self.class_names = class_names
        if class_names:
            self.num_classes = len(class_names)
        else:
            self.num_classes = output_shape[-1] if len(output_shape) > 1 else None

        # Performance tracking
        self.inference_times: List[float] = []

    def predict(
        self,
        landmarks_sequence: np.ndarray,
        top_k: int = 5,
        return_timing: bool = False
    ) -> Tuple[List[Tuple[int, str, float]], Optional[float]]:
        """
        Predict sign language class from landmark sequence.

        Args:
            landmarks_sequence: Input landmarks (seq_length, 21, 3)
            top_k: Number of top predictions to return
            return_timing: Whether to return inference time

        Returns:
            Tuple of (predictions, inference_time)
            - predictions: List of (class_idx, class_name, confidence)
            - inference_time: Inference time in milliseconds (if return_timing=True)
        """
        # Add batch dimension if needed
        if landmarks_sequence.ndim == 3:
            landmarks_sequence = np.expand_dims(landmarks_sequence, axis=0)

        # Ensure correct dtype
        landmarks_sequence = landmarks_sequence.astype(np.float32)

        # Run inference
        start_time = time.time()

        try:
            outputs = self.session.run(
                [self.output_name],
                {self.input_name: landmarks_sequence}
            )
            predictions = outputs[0][0]  # Remove batch dimension

        except Exception as e:
            logger.error(f"Inference failed: {e}")
            raise

        end_time = time.time()
        inference_time_ms = (end_time - start_time) * 1000

        # Track inference time
        self.inference_times.append(inference_time_ms)

        # Get top-k predictions
        top_k_indices = np.argsort(predictions)[-top_k:][::-1]
        top_k_probs = predictions[top_k_indices]

        # Format results
        results = []
        for idx, prob in zip(top_k_indices, top_k_probs):
            class_name = self.class_names[idx] if self.class_names else f"class_{idx}"
            results.append((int(idx), class_name, float(prob)))

        if return_timing:
            return results, inference_time_ms
        else:
            return results, None

    def predict_batch(
        self,
        landmarks_sequences: np.ndarray,
        top_k: int = 5
    ) -> List[List[Tuple[int, str, float]]]:
        """
        Predict for a batch of sequences.

        Args:
            landmarks_sequences: Batch of landmarks (batch, seq_length, 21, 3)
            top_k: Number of top predictions per sequence

        Returns:
            List of predictions for each sequence
        """
        # Ensure correct dtype
        landmarks_sequences = landmarks_sequences.astype(np.float32)

        # Run inference
        start_time = time.time()

        try:
            outputs = self.session.run(
                [self.output_name],
                {self.input_name: landmarks_sequences}
            )
            predictions_batch = outputs[0]

        except Exception as e:
            logger.error(f"Batch inference failed: {e}")
            raise

        end_time = time.time()
        inference_time_ms = (end_time - start_time) * 1000
        logger.info(f"Batch inference time: {inference_time_ms:.2f}ms for {len(landmarks_sequences)} sequences")

        # Process each prediction
        results = []
        for predictions in predictions_batch:
            top_k_indices = np.argsort(predictions)[-top_k:][::-1]
            top_k_probs = predictions[top_k_indices]

            sequence_results = []
            for idx, prob in zip(top_k_indices, top_k_probs):
                class_name = self.class_names[idx] if self.class_names else f"class_{idx}"
                sequence_results.append((int(idx), class_name, float(prob)))

            results.append(sequence_results)

        return results

    def get_performance_stats(self) -> Dict[str, float]:
        """
        Get inference performance statistics.

        Returns:
            Dictionary with performance metrics
        """
        if not self.inference_times:
            return {
                "mean_ms": 0.0,
                "median_ms": 0.0,
                "min_ms": 0.0,
                "max_ms": 0.0,
                "p95_ms": 0.0,
                "p99_ms": 0.0,
                "total_inferences": 0
            }

        inference_times = np.array(self.inference_times)

        return {
            "mean_ms": float(np.mean(inference_times)),
            "median_ms": float(np.median(inference_times)),
            "min_ms": float(np.min(inference_times)),
            "max_ms": float(np.max(inference_times)),
            "p95_ms": float(np.percentile(inference_times, 95)),
            "p99_ms": float(np.percentile(inference_times, 99)),
            "total_inferences": len(self.inference_times)
        }

    def reset_performance_stats(self):
        """Reset performance statistics."""
        self.inference_times = []
        logger.info("Performance statistics reset")

    def benchmark(
        self,
        num_iterations: int = 100,
        sequence_length: int = 30
    ) -> Dict[str, float]:
        """
        Benchmark inference performance.

        Args:
            num_iterations: Number of iterations to run
            sequence_length: Sequence length for benchmark

        Returns:
            Performance statistics
        """
        logger.info(f"Starting benchmark with {num_iterations} iterations...")

        # Reset stats
        self.reset_performance_stats()

        # Generate random input
        dummy_input = np.random.rand(1, sequence_length, 21, 3).astype(np.float32)

        # Warm-up
        for _ in range(10):
            self.predict(dummy_input[0], return_timing=False)

        # Benchmark
        times = []
        for _ in range(num_iterations):
            start = time.time()
            self.predict(dummy_input[0], return_timing=False)
            end = time.time()
            times.append((end - start) * 1000)

        # Calculate stats
        times = np.array(times)
        stats = {
            "iterations": num_iterations,
            "mean_ms": float(np.mean(times)),
            "median_ms": float(np.median(times)),
            "min_ms": float(np.min(times)),
            "max_ms": float(np.max(times)),
            "std_ms": float(np.std(times)),
            "p95_ms": float(np.percentile(times, 95)),
            "p99_ms": float(np.percentile(times, 99)),
            "target_met": float(np.median(times)) <= 100.0
        }

        logger.info("Benchmark Results:")
        logger.info(f"  Mean: {stats['mean_ms']:.2f}ms")
        logger.info(f"  Median: {stats['median_ms']:.2f}ms")
        logger.info(f"  P95: {stats['p95_ms']:.2f}ms")
        logger.info(f"  P99: {stats['p99_ms']:.2f}ms")
        logger.info(f"  Target (≤100ms): {'✓ MET' if stats['target_met'] else '✗ NOT MET'}")

        return stats


class MockInferenceEngine:
    """
    Mock inference engine for when ONNX model is not available.
    Provides friendly error messages and demo predictions.
    """

    def __init__(self, class_names: Optional[List[str]] = None):
        """Initialize mock engine."""
        self.class_names = class_names or [chr(i) for i in range(ord('A'), ord('Z') + 1)]
        self.num_classes = len(self.class_names)
        logger.info("🚧 Mock inference engine initialized (model training pending)")
        logger.info("📝 To add a trained model: Place ONNX file at checkpoints/model.onnx")

    def predict(
        self,
        landmarks_sequence: np.ndarray,
        top_k: int = 5,
        return_timing: bool = False
    ) -> Tuple[List[Tuple[int, str, float]], Optional[float]]:
        """
        Return mock predictions for demo purposes.

        Returns random predictions with a friendly message in logs.
        """
        logger.info("ℹ️ Using mock predictions - ML model not yet trained")

        # Generate mock predictions (random but deterministic based on input shape)
        np.random.seed(int(landmarks_sequence.sum() * 1000) % 1000)
        predictions = np.random.dirichlet(np.ones(self.num_classes))

        # Get top-k
        top_k_indices = np.argsort(predictions)[-top_k:][::-1]
        top_k_probs = predictions[top_k_indices]

        # Format results
        results = []
        for idx, prob in zip(top_k_indices, top_k_probs):
            class_name = self.class_names[idx] if idx < len(self.class_names) else f"class_{idx}"
            results.append((int(idx), class_name, float(prob)))

        # Mock timing (realistic but fake)
        mock_time = 25.0 + np.random.rand() * 20.0

        if return_timing:
            return results, mock_time
        else:
            return results, None

    def get_performance_stats(self) -> Dict[str, float]:
        """Return mock performance stats."""
        return {
            "mean_ms": 35.0,
            "median_ms": 32.0,
            "min_ms": 20.0,
            "max_ms": 50.0,
            "p95_ms": 45.0,
            "p99_ms": 48.0,
            "total_inferences": 0,
            "mock": True,
            "message": "Model training in progress - these are demo predictions"
        }

    def benchmark(self, num_iterations: int = 100, sequence_length: int = 30) -> Dict[str, float]:
        """Return mock benchmark stats."""
        logger.info("🚧 Mock benchmark (model not available)")
        return {
            "iterations": num_iterations,
            "mean_ms": 35.0,
            "median_ms": 32.0,
            "min_ms": 20.0,
            "max_ms": 50.0,
            "std_ms": 8.5,
            "p95_ms": 45.0,
            "p99_ms": 48.0,
            "target_met": True,
            "mock": True,
            "message": "Model training in progress"
        }


# Singleton pattern for model loading
_inference_engine: Optional[ONNXInferenceEngine] = None
_mock_engine: Optional[MockInferenceEngine] = None
_use_mock: bool = False


def get_inference_engine(
    model_path: Optional[str] = None,
    class_names: Optional[List[str]] = None,
    allow_mock: bool = True
) -> ONNXInferenceEngine:
    """
    Get or create inference engine singleton.

    If ONNX model is not available, returns a mock engine that provides
    demo predictions and friendly error messages.

    Args:
        model_path: Path to ONNX model (optional)
        class_names: List of class names
        allow_mock: If True, return mock engine when model unavailable

    Returns:
        ONNXInferenceEngine or MockInferenceEngine instance
    """
    global _inference_engine, _mock_engine, _use_mock

    # If we already have a real engine, return it
    if _inference_engine is not None:
        return _inference_engine

    # If we're already using mock, return it
    if _use_mock and _mock_engine is not None:
        return _mock_engine

    # Try to create real engine
    if model_path and ONNX_AVAILABLE:
        try:
            _inference_engine = ONNXInferenceEngine(
                model_path=model_path,
                class_names=class_names
            )
            logger.info("✅ Real ONNX inference engine loaded successfully")
            return _inference_engine
        except Exception as e:
            logger.warning(f"Failed to load ONNX model: {e}")
            if not allow_mock:
                raise

    # Fall back to mock engine
    if allow_mock:
        if _mock_engine is None:
            _mock_engine = MockInferenceEngine(class_names=class_names)
        _use_mock = True
        return _mock_engine
    else:
        raise RuntimeError("ONNX model not available and mock engine disabled")


def is_mock_engine() -> bool:
    """Check if currently using mock inference engine."""
    return _use_mock
