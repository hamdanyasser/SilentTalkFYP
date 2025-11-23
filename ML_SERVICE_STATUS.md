# ML Service Status - SilentTalk

## Current Status: ✅ Running in Demo Mode

The ML service is **operational** and ready to use, running with mock predictions for demonstration purposes.

### Service Status

| Component | Status | Details |
|-----------|--------|---------|
| **Service Health** | ✅ Healthy | FastAPI service running normally |
| **API Endpoints** | ✅ Working | All endpoints functional |
| **MediaPipe Integration** | ✅ Ready | Hand landmark extraction working |
| **ML Model** | 🚧 Demo Mode | Using mock predictions (model training pending) |
| **ONNX Runtime** | ⚠️ Fallback Active | Graceful fallback implemented |

---

## What's Working Right Now

### ✅ Fully Functional Features

1. **Service Health & Status**
   - Health check endpoints: `/health`, `/health/ready`, `/health/live`
   - Detailed status endpoint: `/status` (shows model status)

2. **Recognition API**
   - POST `/recognition/recognize` - Upload images/videos for sign recognition
   - GET `/recognition/results/{session_id}` - Get recognition history
   - POST `/recognition/feedback` - Submit feedback for model improvement
   - All endpoints return results (using demo predictions)

3. **Hand Landmark Extraction**
   - MediaPipe integration working perfectly
   - Real-time hand tracking and landmark extraction
   - 21-point hand landmark detection

4. **Demo Predictions**
   - API returns realistic-looking predictions
   - Confidence scores and top-K results
   - Inference timing (simulated)
   - Perfect for testing frontend integration

---

## Demo Mode Explained

### What are "Demo Predictions"?

The service uses a **mock inference engine** that:
- Returns random but deterministic predictions based on input
- Provides realistic confidence scores
- Simulates ~25-40ms inference time
- Includes all 26 ASL alphabet classes (A-Z)

### Why Mock Predictions?

✅ **Allows the application to work end-to-end** without blocking on ML model training
✅ **Frontend can be developed and tested** with realistic API responses
✅ **Service doesn't crash** if ONNX runtime has issues in Docker
✅ **Clear messaging** to users about demo mode

### How to Tell Demo Mode is Active

**API Responses include:**
```json
{
  "model_status": "demo",
  "message": "🚧 Using demo predictions - ML model training in progress",
  "predictions": [...]
}
```

**Service logs show:**
```
🚧 RUNNING IN DEMO MODE
ML model not available - using mock predictions
Service endpoints work normally with demo predictions
```

**Status endpoint shows:**
```bash
curl http://localhost:8000/status
```
```json
{
  "model": {
    "status": "mock",
    "type": "demo_predictions",
    "message": "🚧 Model training in progress - using demo predictions"
  }
}
```

---

## Adding a Real ML Model

### Prerequisites

1. **Training Data**
   - ASL alphabet gesture videos/images
   - Hand landmarks extracted via MediaPipe
   - Labeled dataset with 26 classes (A-Z)

2. **Training Environment**
   - Python 3.11+
   - TensorFlow 2.15+
   - ONNX export tools

### Step-by-Step Instructions

#### Option A: Train New Model (Recommended for FYP)

1. **Prepare Training Data**
   ```bash
   cd ml-service
   python app/data_preparation/collect_gestures.py --output data/raw
   python app/data_preparation/extract_landmarks.py --input data/raw --output data/processed
   ```

2. **Train the Model**
   ```bash
   # Train CNN-LSTM model
   python app/train.py \
     --data-dir data/processed \
     --epochs 50 \
     --batch-size 32 \
     --model-type cnn_lstm \
     --export-onnx
   ```

   This will:
   - Train the sign language recognition model
   - Export to ONNX format automatically
   - Save to `checkpoints/model.onnx`

3. **Restart the Service**
   ```bash
   # If running in Docker
   docker-compose restart ml-service

   # If running locally
   # Kill the service and start again
   uvicorn app.main:app --reload
   ```

4. **Verify Real Model is Loaded**
   ```bash
   curl http://localhost:8000/status
   # Should show: "status": "loaded"
   ```

#### Option B: Use Pre-trained Model

1. **Download Pre-trained Model** (if available)
   ```bash
   wget https://example.com/pretrained_asl_model.onnx -O ml-service/checkpoints/model.onnx
   ```

2. **Restart Service**
   ```bash
   docker-compose restart ml-service
   ```

#### Option C: Skip for Now (Current State)

✅ **Keep using demo mode**
- Application works end-to-end
- Frontend can be developed
- Model training can be done later as part of FYP Phase 2

---

## Technical Details

### Mock Engine Implementation

**File**: `ml-service/app/services/onnx_inference.py`

```python
class MockInferenceEngine:
    """Provides demo predictions when real model unavailable"""

    def predict(self, landmarks_sequence, top_k=5, return_timing=False):
        # Returns random but deterministic predictions
        # Simulates realistic inference timing
        # Includes confidence scores for all classes
```

**Features:**
- Deterministic predictions (same input → same output)
- Realistic confidence scores using Dirichlet distribution
- Simulated inference time (25-40ms)
- Support for all standard model operations

### Graceful Fallback Logic

**File**: `ml-service/app/services/onnx_inference.py`

```python
def get_inference_engine(model_path=None, class_names=None, allow_mock=True):
    """
    Returns real ONNX engine if model available,
    otherwise returns mock engine for demo mode.
    """
    # Try to load real model
    if model_path and ONNX_AVAILABLE:
        try:
            return ONNXInferenceEngine(model_path, class_names)
        except Exception:
            pass  # Fall through to mock

    # Fallback to mock engine
    return MockInferenceEngine(class_names)
```

### API Response Format

**With Real Model:**
```json
{
  "session_id": "uuid",
  "predictions": [
    {"class_index": 0, "class_name": "A", "confidence": 0.95},
    {"class_index": 1, "class_name": "B", "confidence": 0.03}
  ],
  "inference_time_ms": 28.5,
  "landmarks_detected": true
}
```

**With Mock Model:**
```json
{
  "session_id": "uuid",
  "model_status": "demo",
  "message": "🚧 Using demo predictions - ML model training in progress",
  "predictions": [
    {"class_index": 5, "class_name": "F", "confidence": 0.45},
    {"class_index": 12, "class_name": "M", "confidence": 0.23}
  ],
  "inference_time_ms": 32.1,
  "landmarks_detected": true
}
```

---

## Troubleshooting

### Service Won't Start

**Check logs:**
```bash
docker-compose logs ml-service
```

**Common issues:**
- Port 8000 already in use → Change port in docker-compose.yml
- Python dependencies missing → Rebuild: `docker-compose build ml-service`

### "ONNX Runtime Error" in Logs

✅ **This is expected in demo mode!**
The service automatically falls back to mock engine when ONNX runtime isn't available.

**To confirm demo mode is working:**
```bash
curl http://localhost:8000/status
# Should show: "model_status": "mock"
```

### Predictions Don't Make Sense

✅ **This is expected in demo mode!**
Demo predictions are random and not based on actual sign language recognition.

**To use real predictions:**
- Train and add a real ML model (see "Adding a Real ML Model" above)

---

## API Endpoints Reference

### Health & Status

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/health` | GET | Basic health check |
| `/health/ready` | GET | Readiness probe (for K8s) |
| `/health/live` | GET | Liveness probe (for K8s) |
| `/status` | GET | Detailed service status including model info |

### Recognition

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/recognition/recognize` | POST | Recognize sign from image/video |
| `/recognition/results/{id}` | GET | Get session results |
| `/recognition/feedback` | POST | Submit recognition feedback |
| `/recognition/sessions` | GET | List all sessions |
| `/recognition/sessions/{id}` | DELETE | Delete a session |

### Testing Endpoints

```bash
# Check service status
curl http://localhost:8000/status

# Test recognition (requires multipart file upload)
curl -X POST http://localhost:8000/recognition/recognize \
  -F "file=@test_image.jpg" \
  -F "top_k=5"
```

---

## Next Steps for FYP

### Immediate (Current Sprint)

- [x] ✅ Get ML service running without crashes
- [x] ✅ Implement graceful fallback mechanism
- [x] ✅ Add demo predictions for testing
- [x] ✅ Document service status
- [ ] ⏳ Integrate with frontend
- [ ] ⏳ Test end-to-end workflow

### Short Term (Next Sprint)

- [ ] Collect ASL alphabet training data
- [ ] Extract hand landmarks from training videos
- [ ] Create training dataset pipeline
- [ ] Train baseline CNN-LSTM model

### Long Term (Final FYP Phase)

- [ ] Optimize model for real-time performance (< 100ms)
- [ ] Add word-level recognition (beyond single letters)
- [ ] Implement continuous improvement pipeline
- [ ] Deploy with real model to production

---

## Success Criteria

### ✅ Current Milestone Achieved

- [x] Service runs without errors
- [x] All API endpoints functional
- [x] Frontend can integrate and test
- [x] Clear status indicators
- [x] Graceful error handling

### 🎯 Next Milestone: Real Model

- [ ] Model trained on ASL dataset
- [ ] Inference time < 100ms per frame
- [ ] Accuracy > 90% on test set
- [ ] ONNX export successful
- [ ] Service loads real model automatically

---

## Support & Resources

### Documentation

- FastAPI Docs: http://localhost:8000/docs
- ReDoc: http://localhost:8000/redoc
- This file: `ML_SERVICE_STATUS.md`

### Training Resources

- MediaPipe Hand Tracking: https://google.github.io/mediapipe/solutions/hands.html
- ONNX Runtime: https://onnxruntime.ai/docs/
- TensorFlow to ONNX: https://github.com/onnx/tensorflow-onnx

### Questions?

Check service logs:
```bash
docker-compose logs -f ml-service
```

Check service status:
```bash
curl http://localhost:8000/status | python -m json.tool
```

---

## Summary

**Current State**: ✅ ML service is fully operational in demo mode

**What Works**: All API endpoints, health checks, hand landmark extraction

**What's Mock**: ML predictions (returns random but realistic results)

**When to Add Real Model**: Can be done anytime - service will automatically detect and load it

**Impact on Development**: None! Frontend and backend can be developed and tested fully with demo mode.

---

*Last Updated: 2025-11-23*
*Status: Demo Mode Active - Service Operational*
