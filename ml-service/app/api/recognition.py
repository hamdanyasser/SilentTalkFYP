"""
Recognition API Endpoints
Handles real-time sign language recognition from video streams/frames
"""

from fastapi import APIRouter, File, UploadFile, HTTPException, BackgroundTasks
from fastapi.responses import JSONResponse
from pydantic import BaseModel, Field
from typing import List, Optional, Dict
import numpy as np
import cv2
import uuid
from datetime import datetime
import logging
import io

# Import services
import sys
from pathlib import Path
sys.path.append(str(Path(__file__).parent.parent))

from app.services.mediapipe_extractor import MediaPipeHandExtractor
from app.services.onnx_inference import get_inference_engine, is_mock_engine

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/recognition", tags=["recognition"])

# In-memory storage for session results (use Redis in production)
recognition_sessions: Dict[str, Dict] = {}


# ============================================
# Request/Response Models
# ============================================

class RecognitionRequest(BaseModel):
    """Request model for video stream recognition"""
    session_id: Optional[str] = Field(None, description="Session ID for tracking")
    sequence_length: int = Field(30, description="Number of frames to process")
    top_k: int = Field(5, description="Number of top predictions to return")


class PredictionResult(BaseModel):
    """Single prediction result"""
    class_index: int
    class_name: str
    confidence: float


class RecognitionResponse(BaseModel):
    """Response model for recognition"""
    session_id: str
    predictions: List[PredictionResult]
    inference_time_ms: float
    timestamp: str
    landmarks_detected: bool


class FeedbackRequest(BaseModel):
    """Feedback on recognition results"""
    session_id: str
    correct_class: Optional[str] = None
    correct_class_index: Optional[int] = None
    was_correct: bool
    user_comment: Optional[str] = None


class SessionResultsResponse(BaseModel):
    """Results for a recognition session"""
    session_id: str
    total_frames: int
    predictions_history: List[Dict]
    created_at: str
    last_updated: str


# ============================================
# API Endpoints
# ============================================

@router.post("/recognize", response_model=RecognitionResponse)
async def recognize_sign(
    file: UploadFile = File(..., description="Video file or image frames"),
    session_id: Optional[str] = None,
    sequence_length: int = 30,
    top_k: int = 5
):
    """
    Recognize sign language from uploaded video/image.

    This endpoint:
    1. Extracts hand landmarks using MediaPipe
    2. Runs inference using ONNX Runtime
    3. Returns top-k predictions with confidence scores

    Args:
        file: Uploaded video file or image
        session_id: Optional session ID for tracking
        sequence_length: Number of frames to process
        top_k: Number of top predictions

    Returns:
        Recognition results with predictions and timing
    """
    try:
        # Generate session ID if not provided
        if session_id is None:
            session_id = str(uuid.uuid4())

        # Read uploaded file
        contents = await file.read()

        # Process based on file type
        if file.content_type.startswith('image/'):
            # Single frame
            landmarks_sequence = await process_image(contents, sequence_length)
        elif file.content_type.startswith('video/'):
            # Video sequence
            landmarks_sequence = await process_video(contents, sequence_length)
        else:
            raise HTTPException(status_code=400, detail="Unsupported file type")

        if landmarks_sequence is None:
            return JSONResponse(
                status_code=200,
                content={
                    "session_id": session_id,
                    "predictions": [],
                    "inference_time_ms": 0.0,
                    "timestamp": datetime.utcnow().isoformat(),
                    "landmarks_detected": False,
                    "message": "No hand landmarks detected in the input"
                }
            )

        # Run inference
        inference_engine = get_inference_engine()
        predictions, inference_time = inference_engine.predict(
            landmarks_sequence,
            top_k=top_k,
            return_timing=True
        )

        # Check if using mock engine
        using_mock = is_mock_engine()

        # Format predictions
        pred_results = [
            PredictionResult(
                class_index=idx,
                class_name=name,
                confidence=conf
            )
            for idx, name, conf in predictions
        ]

        # Store session results
        if session_id not in recognition_sessions:
            recognition_sessions[session_id] = {
                "session_id": session_id,
                "created_at": datetime.utcnow().isoformat(),
                "predictions_history": []
            }

        recognition_sessions[session_id]["predictions_history"].append({
            "predictions": predictions,
            "inference_time_ms": inference_time,
            "timestamp": datetime.utcnow().isoformat(),
            "mock": using_mock
        })
        recognition_sessions[session_id]["last_updated"] = datetime.utcnow().isoformat()

        logger.info(f"Recognition completed for session {session_id}: {inference_time:.2f}ms (mock={using_mock})")

        # Build response
        response_dict = {
            "session_id": session_id,
            "predictions": pred_results,
            "inference_time_ms": inference_time,
            "timestamp": datetime.utcnow().isoformat(),
            "landmarks_detected": True
        }

        # Add mock warning if using demo predictions
        if using_mock:
            response_dict["model_status"] = "demo"
            response_dict["message"] = "🚧 Using demo predictions - ML model training in progress"

        return JSONResponse(content=response_dict)

    except Exception as e:
        logger.error(f"Recognition error: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Recognition failed: {str(e)}")


@router.get("/results/{session_id}", response_model=SessionResultsResponse)
async def get_session_results(session_id: str):
    """
    Get recognition results for a session.

    Args:
        session_id: Session ID to retrieve

    Returns:
        Complete recognition history for the session
    """
    if session_id not in recognition_sessions:
        raise HTTPException(status_code=404, detail=f"Session {session_id} not found")

    session_data = recognition_sessions[session_id]

    return SessionResultsResponse(
        session_id=session_id,
        total_frames=len(session_data["predictions_history"]),
        predictions_history=session_data["predictions_history"],
        created_at=session_data["created_at"],
        last_updated=session_data.get("last_updated", session_data["created_at"])
    )


@router.post("/feedback")
async def submit_feedback(feedback: FeedbackRequest, background_tasks: BackgroundTasks):
    """
    Submit feedback on recognition results for model improvement.

    Args:
        feedback: Feedback data including correct class and user comments

    Returns:
        Confirmation of feedback submission
    """
    try:
        # Validate session exists
        if feedback.session_id not in recognition_sessions:
            raise HTTPException(status_code=404, detail=f"Session {feedback.session_id} not found")

        # Store feedback (in production, save to database)
        if "feedback" not in recognition_sessions[feedback.session_id]:
            recognition_sessions[feedback.session_id]["feedback"] = []

        recognition_sessions[feedback.session_id]["feedback"].append({
            "correct_class": feedback.correct_class,
            "correct_class_index": feedback.correct_class_index,
            "was_correct": feedback.was_correct,
            "user_comment": feedback.user_comment,
            "timestamp": datetime.utcnow().isoformat()
        })

        logger.info(f"Feedback received for session {feedback.session_id}")

        # Background task to process feedback for model retraining
        background_tasks.add_task(process_feedback, feedback.session_id)

        return {
            "message": "Feedback received successfully",
            "session_id": feedback.session_id,
            "timestamp": datetime.utcnow().isoformat()
        }

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Feedback submission error: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Feedback submission failed: {str(e)}")


@router.get("/sessions")
async def list_sessions():
    """
    List all active recognition sessions.

    Returns:
        List of session IDs and their metadata
    """
    sessions = [
        {
            "session_id": sid,
            "created_at": data["created_at"],
            "last_updated": data.get("last_updated", data["created_at"]),
            "total_predictions": len(data["predictions_history"]),
            "has_feedback": "feedback" in data
        }
        for sid, data in recognition_sessions.items()
    ]

    return {
        "total_sessions": len(sessions),
        "sessions": sessions
    }


@router.delete("/sessions/{session_id}")
async def delete_session(session_id: str):
    """
    Delete a recognition session.

    Args:
        session_id: Session ID to delete

    Returns:
        Confirmation of deletion
    """
    if session_id not in recognition_sessions:
        raise HTTPException(status_code=404, detail=f"Session {session_id} not found")

    del recognition_sessions[session_id]

    return {
        "message": f"Session {session_id} deleted successfully",
        "timestamp": datetime.utcnow().isoformat()
    }


# ============================================
# Helper Functions
# ============================================

async def process_image(image_bytes: bytes, sequence_length: int) -> Optional[np.ndarray]:
    """
    Process a single image and extract landmark sequence.

    Args:
        image_bytes: Image file bytes
        sequence_length: Target sequence length (will pad/repeat)

    Returns:
        Landmarks array (sequence_length, 21, 3) or None
    """
    try:
        # Decode image
        nparr = np.frombuffer(image_bytes, np.uint8)
        frame = cv2.imdecode(nparr, cv2.IMREAD_COLOR)

        if frame is None:
            logger.error("Failed to decode image")
            return None

        # Extract landmarks
        extractor = MediaPipeHandExtractor()
        result = extractor.extract_landmarks(frame, normalize=True)
        extractor.close()

        if result is None:
            logger.warning("No hand landmarks detected in image")
            return None

        landmarks, handedness = result

        # Repeat single frame to create sequence
        landmarks_sequence = np.tile(landmarks, (sequence_length, 1, 1))

        return landmarks_sequence

    except Exception as e:
        logger.error(f"Image processing error: {e}")
        return None


async def process_video(video_bytes: bytes, sequence_length: int) -> Optional[np.ndarray]:
    """
    Process a video and extract landmark sequence.

    Args:
        video_bytes: Video file bytes
        sequence_length: Target sequence length

    Returns:
        Landmarks array (sequence_length, 21, 3) or None
    """
    try:
        # Save video temporarily
        import tempfile
        with tempfile.NamedTemporaryFile(suffix='.mp4', delete=False) as tmp:
            tmp.write(video_bytes)
            tmp_path = tmp.name

        # Open video
        cap = cv2.VideoCapture(tmp_path)

        if not cap.isOpened():
            logger.error("Failed to open video")
            return None

        # Extract frames
        frames = []
        while len(frames) < sequence_length:
            ret, frame = cap.read()
            if not ret:
                break
            frames.append(frame)

        cap.release()

        # Clean up temp file
        import os
        os.unlink(tmp_path)

        if len(frames) == 0:
            logger.warning("No frames extracted from video")
            return None

        # Extract landmarks from frames
        extractor = MediaPipeHandExtractor()
        landmarks_sequence = extractor.extract_landmarks_sequence(
            frames,
            sequence_length=sequence_length,
            normalize=True
        )
        extractor.close()

        return landmarks_sequence

    except Exception as e:
        logger.error(f"Video processing error: {e}")
        return None


async def process_feedback(session_id: str):
    """
    Background task to process user feedback.

    In production, this would:
    - Save feedback to database
    - Queue data for model retraining
    - Update model performance metrics

    Args:
        session_id: Session ID with feedback
    """
    logger.info(f"Processing feedback for session {session_id} (background task)")
    # Implementation would go here
    pass
