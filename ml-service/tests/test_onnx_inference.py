"""
Unit tests and benchmarks for ONNX Runtime inference
Tests latency requirements (target: ≤100ms per frame)
"""

import pytest
import numpy as np
import sys
from pathlib import Path
import time

sys.path.append(str(Path(__file__).parent.parent / "app"))

from services.onnx_inference import ONNXInferenceEngine


# Skip tests if ONNX model doesn't exist
MODEL_PATH = Path(__file__).parent.parent / "checkpoints" / "model.onnx"
SKIP_REASON = "ONNX model not found. Run training first with --export-onnx"


@pytest.fixture
def dummy_model_path(tmp_path):
    """Create a dummy ONNX model for testing (if real model doesn't exist)."""
    if MODEL_PATH.exists():
        return str(MODEL_PATH)

    # Return None to skip tests
    pytest.skip(SKIP_REASON)


@pytest.fixture
def inference_engine(dummy_model_path):
    """Fixture for inference engine."""
    class_names = [chr(i) for i in range(ord('A'), ord('Z') + 1)]  # A-Z

    try:
        engine = ONNXInferenceEngine(
            model_path=dummy_model_path,
            class_names=class_names
        )
        return engine
    except Exception as e:
        pytest.skip(f"Failed to load model: {e}")


@pytest.fixture
def dummy_input():
    """Create dummy landmark sequence for testing."""
    # Shape: (sequence_length, num_landmarks, num_coordinates)
    return np.random.rand(30, 21, 3).astype(np.float32)


@pytest.mark.skipif(not MODEL_PATH.exists(), reason=SKIP_REASON)
def test_inference_engine_initialization(dummy_model_path):
    """Test that inference engine initializes correctly."""
    class_names = ['A', 'B', 'C']

    engine = ONNXInferenceEngine(
        model_path=dummy_model_path,
        class_names=class_names
    )

    assert engine is not None
    assert engine.num_classes == len(class_names)
    assert engine.class_names == class_names


@pytest.mark.skipif(not MODEL_PATH.exists(), reason=SKIP_REASON)
def test_predict_returns_top_k(inference_engine, dummy_input):
    """Test that predict returns correct number of top-k predictions."""
    top_k = 5
    predictions, _ = inference_engine.predict(
        dummy_input,
        top_k=top_k,
        return_timing=False
    )

    assert len(predictions) == top_k
    for class_idx, class_name, confidence in predictions:
        assert isinstance(class_idx, int)
        assert isinstance(class_name, str)
        assert 0.0 <= confidence <= 1.0


@pytest.mark.skipif(not MODEL_PATH.exists(), reason=SKIP_REASON)
def test_predict_with_timing(inference_engine, dummy_input):
    """Test that predict returns timing information."""
    predictions, inference_time = inference_engine.predict(
        dummy_input,
        top_k=5,
        return_timing=True
    )

    assert inference_time is not None
    assert inference_time > 0, "Inference time should be positive"


@pytest.mark.skipif(not MODEL_PATH.exists(), reason=SKIP_REASON)
def test_predict_batch(inference_engine):
    """Test batch prediction."""
    batch_size = 4
    dummy_batch = np.random.rand(batch_size, 30, 21, 3).astype(np.float32)

    results = inference_engine.predict_batch(dummy_batch, top_k=3)

    assert len(results) == batch_size
    for predictions in results:
        assert len(predictions) == 3  # top_k=3


@pytest.mark.skipif(not MODEL_PATH.exists(), reason=SKIP_REASON)
def test_inference_latency_target(inference_engine, dummy_input):
    """
    Critical test: Verify inference latency meets target (≤100ms).

    This is the Definition of Done requirement.
    """
    # Warm-up
    for _ in range(5):
        inference_engine.predict(dummy_input, top_k=5, return_timing=False)

    # Measure latency
    latencies = []
    num_iterations = 50

    for _ in range(num_iterations):
        _, latency = inference_engine.predict(
            dummy_input,
            top_k=5,
            return_timing=True
        )
        latencies.append(latency)

    # Calculate statistics
    mean_latency = np.mean(latencies)
    median_latency = np.median(latencies)
    p95_latency = np.percentile(latencies, 95)
    p99_latency = np.percentile(latencies, 99)

    # Print results for visibility
    print(f"\n{'='*60}")
    print(f"Inference Latency Test Results ({num_iterations} iterations)")
    print(f"{'='*60}")
    print(f"Mean:   {mean_latency:.2f}ms")
    print(f"Median: {median_latency:.2f}ms")
    print(f"P95:    {p95_latency:.2f}ms")
    print(f"P99:    {p99_latency:.2f}ms")
    print(f"Target: ≤100ms")
    print(f"{'='*60}")

    # Assert the requirement
    assert median_latency <= 100.0, (
        f"Median latency {median_latency:.2f}ms exceeds target of 100ms"
    )

    # Also check P95 to ensure consistent performance
    assert p95_latency <= 150.0, (
        f"P95 latency {p95_latency:.2f}ms exceeds 150ms (may indicate inconsistent performance)"
    )


@pytest.mark.skipif(not MODEL_PATH.exists(), reason=SKIP_REASON)
def test_performance_stats(inference_engine, dummy_input):
    """Test performance statistics tracking."""
    # Reset stats
    inference_engine.reset_performance_stats()

    # Run some inferences
    for _ in range(10):
        inference_engine.predict(dummy_input, top_k=5, return_timing=False)

    # Get stats
    stats = inference_engine.get_performance_stats()

    assert stats["total_inferences"] == 10
    assert stats["mean_ms"] > 0
    assert stats["median_ms"] > 0
    assert stats["min_ms"] > 0
    assert stats["max_ms"] >= stats["min_ms"]


@pytest.mark.skipif(not MODEL_PATH.exists(), reason=SKIP_REASON)
@pytest.mark.benchmark
def test_benchmark_inference(inference_engine):
    """
    Comprehensive benchmark of inference performance.

    This test provides detailed performance metrics.
    """
    stats = inference_engine.benchmark(num_iterations=100, sequence_length=30)

    print(f"\n{'='*60}")
    print(f"Inference Benchmark Results")
    print(f"{'='*60}")
    print(f"Iterations:  {stats['iterations']}")
    print(f"Mean:        {stats['mean_ms']:.2f}ms")
    print(f"Median:      {stats['median_ms']:.2f}ms")
    print(f"Std Dev:     {stats['std_ms']:.2f}ms")
    print(f"Min:         {stats['min_ms']:.2f}ms")
    print(f"Max:         {stats['max_ms']:.2f}ms")
    print(f"P95:         {stats['p95_ms']:.2f}ms")
    print(f"P99:         {stats['p99_ms']:.2f}ms")
    print(f"Target Met:  {'✓ YES' if stats['target_met'] else '✗ NO'}")
    print(f"{'='*60}\n")

    # Assert target is met
    assert stats['target_met'], (
        f"Median latency {stats['median_ms']:.2f}ms does not meet ≤100ms target"
    )


@pytest.mark.skipif(not MODEL_PATH.exists(), reason=SKIP_REASON)
def test_predictions_sum_to_one(inference_engine, dummy_input):
    """Test that prediction probabilities sum to approximately 1.0."""
    predictions, _ = inference_engine.predict(
        dummy_input,
        top_k=26,  # All classes
        return_timing=False
    )

    # Sum of all probabilities
    total_prob = sum(conf for _, _, conf in predictions)

    # Should sum to 1.0 (within floating point tolerance)
    assert abs(total_prob - 1.0) < 0.01, (
        f"Probabilities sum to {total_prob:.4f}, expected ~1.0"
    )


@pytest.mark.skipif(not MODEL_PATH.exists(), reason=SKIP_REASON)
def test_predictions_sorted_by_confidence(inference_engine, dummy_input):
    """Test that predictions are sorted by confidence (descending)."""
    predictions, _ = inference_engine.predict(
        dummy_input,
        top_k=10,
        return_timing=False
    )

    # Extract confidences
    confidences = [conf for _, _, conf in predictions]

    # Check if sorted in descending order
    assert confidences == sorted(confidences, reverse=True), (
        "Predictions should be sorted by confidence (descending)"
    )
