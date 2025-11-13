from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
import logging

from app.api import recognition
from app.core.config import settings

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    """
    Lifespan context manager for startup and shutdown events
    """
    logger.info("Starting ML Service...")
    # Load ML models on startup
    # await load_models()
    yield
    logger.info("Shutting down ML Service...")
    # Cleanup on shutdown


# Initialize FastAPI app
app = FastAPI(
    title="SilentTalk ML Service",
    description="Sign Language Recognition API using MediaPipe and Deep Learning",
    version="1.0.0",
    lifespan=lifespan
)

# CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(recognition.router, prefix="/api/recognition", tags=["Recognition"])


@app.get("/")
async def root():
    """
    Root endpoint for health check
    """
    return {
        "service": "SilentTalk ML Service",
        "version": "1.0.0",
        "status": "healthy"
    }


@app.get("/health")
async def health_check():
    """
    Health check endpoint
    Maps to NFR-007: System monitoring
    """
    return {
        "status": "healthy",
        "service": "ml-service",
        "models_loaded": True  # Will be dynamic once models are loaded
    }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "app.main:app",
        host="0.0.0.0",
        port=8000,
        reload=True,
        log_level="info"
    )
