from fastapi import APIRouter, HTTPException, UploadFile, File
from pydantic import BaseModel
from typing import List, Optional
import base64
import cv2
import numpy as np
import time

from app.services.mediapipe_service import MediaPipeService
from app.core.config import settings

router = APIRouter()
mediapipe_service = MediaPipeService()


class RecognitionRequest(BaseModel):
    """
    Request model for sign language recognition
    Maps to FR-002: Sign Language Recognition
    """
    session_id: str
    frame_data: str  # Base64 encoded image
    timestamp: str


class Prediction(BaseModel):
    sign: str
    confidence: float


class RecognitionResponse(BaseModel):
    """
    Response model for sign language recognition
    Maps to FR-002: Real-time recognition with latency < 500ms
    """
    predictions: List[Prediction]
    processing_time: float  # milliseconds
    landmarks_detected: bool


@router.post("/recognize", response_model=RecognitionResponse)
async def recognize_sign(request: RecognitionRequest):
    """
    Recognize sign language from video frame
    Maps to FR-002: Sign language recognition
    NFR-001: ML inference time ≤ 100ms
    """
    start_time = time.time()

    try:
        # Decode base64 image
        image_data = base64.b64decode(request.frame_data)
        nparr = np.frombuffer(image_data, np.uint8)
        frame = cv2.imdecode(nparr, cv2.IMREAD_COLOR)

        if frame is None:
            raise HTTPException(status_code=400, detail="Invalid image data")

        # Extract hand landmarks using MediaPipe
        landmarks = mediapipe_service.extract_hand_landmarks(frame)

        if landmarks is None:
            return RecognitionResponse(
                predictions=[],
                processing_time=(time.time() - start_time) * 1000,
                landmarks_detected=False
            )

        # TODO: Use trained ML model for actual recognition
        # For now, return mock predictions
        predictions = [
            Prediction(sign="hello", confidence=0.92),
            Prediction(sign="thank_you", confidence=0.85),
            Prediction(sign="yes", confidence=0.78)
        ]

        processing_time = (time.time() - start_time) * 1000

        # Check if processing time meets performance requirements
        if processing_time > settings.MAX_INFERENCE_TIME_MS:
            # Log warning but still return results
            print(f"Warning: Processing time {processing_time}ms exceeds threshold")

        return RecognitionResponse(
            predictions=predictions,
            processing_time=processing_time,
            landmarks_detected=True
        )

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Recognition failed: {str(e)}")


@router.post("/feedback")
async def submit_feedback(session_id: str, frame_id: str, correct_sign: str):
    """
    Submit user feedback for incorrect predictions
    Maps to FR-002.10: User feedback on predictions
    """
    # TODO: Store feedback for model retraining
    return {
        "success": True,
        "message": "Feedback recorded successfully"
    }


@router.get("/supported-languages")
async def get_supported_languages():
    """
    Get list of supported sign languages
    Maps to FR-002.2: Multiple sign languages support
    """
    return {
        "languages": [
            {"code": "ASL", "name": "American Sign Language"},
            {"code": "BSL", "name": "British Sign Language"},
            {"code": "Auslan", "name": "Australian Sign Language"}
        ]
    }
