"""
SilentTalk ML Service - FastAPI Application
Main entry point for the sign language recognition service
"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from datetime import datetime
import logging
import os
from pathlib import Path

# Import API routers
from app.api.recognition import router as recognition_router
from app.api.streaming import router as streaming_router
from app.services.onnx_inference import get_inference_engine, is_mock_engine

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)

logger = logging.getLogger(__name__)

# Create FastAPI app
app = FastAPI(
    title="SilentTalk ML Service",
    description="Sign Language Recognition API using MediaPipe and CNN-LSTM",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc"
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Configure appropriately for production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(recognition_router)
app.include_router(streaming_router)


@app.get("/")
async def root():
    """Root endpoint"""
    return {
        "service": "SilentTalk ML Service",
        "version": "1.0.0",
        "status": "running",
        "timestamp": datetime.utcnow().isoformat()
    }


@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {
        "status": "healthy",
        "service": "ml-service",
        "timestamp": datetime.utcnow().isoformat(),
        "model_status": "mock" if is_mock_engine() else "loaded"
    }


@app.get("/health/ready")
async def readiness_check():
    """Readiness check endpoint"""
    # Service is always ready, even with mock model
    return {
        "status": "ready",
        "service": "ml-service",
        "model_status": "mock" if is_mock_engine() else "loaded",
        "timestamp": datetime.utcnow().isoformat()
    }


@app.get("/status")
async def get_status():
    """Get detailed ML service status"""
    using_mock = is_mock_engine()

    status = {
        "service": "SilentTalk ML Service",
        "version": "1.0.0",
        "timestamp": datetime.utcnow().isoformat(),
        "model": {
            "status": "mock" if using_mock else "loaded",
            "type": "demo_predictions" if using_mock else "onnx_runtime",
            "message": "🚧 Model training in progress - using demo predictions" if using_mock else "✅ Real model loaded"
        },
        "capabilities": {
            "recognition": True,
            "streaming": True,
            "real_predictions": not using_mock
        }
    }

    if using_mock:
        status["model"]["instructions"] = {
            "step_1": "Train a model using: python app/train.py --export-onnx",
            "step_2": "Place the trained model at: checkpoints/model.onnx",
            "step_3": "Restart the service to load the real model",
            "documentation": "See ML_SERVICE_STATUS.md for details"
        }

    return status


@app.get("/health/live")
async def liveness_check():
    """Liveness check endpoint"""
    return {
        "status": "alive",
        "service": "ml-service",
        "timestamp": datetime.utcnow().isoformat()
    }


@app.on_event("startup")
async def startup_event():
    """Startup event handler"""
    logger.info("=" * 80)
    logger.info("Starting SilentTalk ML Service")
    logger.info("=" * 80)

    # ASL alphabet classes (A-Z)
    class_names = [chr(i) for i in range(ord('A'), ord('Z') + 1)]

    # Load ONNX model if available
    model_path = os.getenv("MODEL_PATH", "checkpoints/model.onnx")

    # Try to load real model, fall back to mock
    try:
        logger.info(f"Checking for ONNX model at {model_path}")

        if os.path.exists(model_path):
            logger.info(f"Found model file, attempting to load...")

            # Initialize inference engine (will use real model if available, mock otherwise)
            engine = get_inference_engine(
                model_path=model_path,
                class_names=class_names,
                allow_mock=True
            )

            if not is_mock_engine():
                # Run benchmark for real model
                logger.info("Running inference benchmark...")
                stats = engine.benchmark(num_iterations=100, sequence_length=30)
                logger.info("✅ Real model loaded and benchmarked successfully")
        else:
            logger.info(f"No model file found at {model_path}")
            # Initialize mock engine
            engine = get_inference_engine(
                class_names=class_names,
                allow_mock=True
            )

        # Check final status
        if is_mock_engine():
            logger.warning("=" * 80)
            logger.warning("🚧 RUNNING IN DEMO MODE")
            logger.warning("=" * 80)
            logger.warning("ML model not available - using mock predictions")
            logger.warning("")
            logger.warning("To add a trained model:")
            logger.warning("  1. Train model: python app/train.py --export-onnx")
            logger.warning("  2. Place model at: checkpoints/model.onnx")
            logger.warning("  3. Restart service")
            logger.warning("")
            logger.warning("Service endpoints work normally with demo predictions")
            logger.warning("=" * 80)
        else:
            logger.info("✅ Service ready with real ML model")

    except Exception as e:
        logger.error(f"Error during model initialization: {e}")
        logger.warning("Falling back to mock engine for demo mode")

        # Ensure mock engine is initialized
        engine = get_inference_engine(class_names=class_names, allow_mock=True)

    logger.info("SilentTalk ML Service started successfully")
    logger.info("=" * 80)


@app.on_event("shutdown")
async def shutdown_event():
    """Shutdown event handler"""
    logger.info("Shutting down SilentTalk ML Service")
    # Cleanup resources


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
