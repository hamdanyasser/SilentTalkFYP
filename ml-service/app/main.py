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
from app.services.onnx_inference import get_inference_engine

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
        "timestamp": datetime.utcnow().isoformat()
    }


@app.get("/health/ready")
async def readiness_check():
    """Readiness check endpoint"""
    # Add checks for dependencies (Redis, models loaded, etc.)
    return {
        "status": "ready",
        "service": "ml-service",
        "timestamp": datetime.utcnow().isoformat()
    }


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

    # Load ONNX model if available
    model_path = os.getenv("MODEL_PATH", "checkpoints/model.onnx")

    if os.path.exists(model_path):
        try:
            logger.info(f"Loading ONNX model from {model_path}")

            # ASL alphabet classes (A-Z)
            class_names = [chr(i) for i in range(ord('A'), ord('Z') + 1)]

            # Initialize inference engine
            engine = get_inference_engine(
                model_path=model_path,
                class_names=class_names
            )

            # Run benchmark
            logger.info("Running inference benchmark...")
            stats = engine.benchmark(num_iterations=100, sequence_length=30)

            logger.info("Model loaded successfully")
        except Exception as e:
            logger.warning(f"Failed to load ONNX model: {e}")
            logger.warning("Service will start without pre-loaded model")
    else:
        logger.warning(f"ONNX model not found at {model_path}")
        logger.warning("Service will start without pre-loaded model")
        logger.info("Train a model using: python app/train.py --export-onnx")

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
