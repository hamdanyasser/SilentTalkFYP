"""
Streaming Recognition API with WebSocket
Real-time sign language recognition from video streams
"""

from fastapi import APIRouter, WebSocket, WebSocketDisconnect, HTTPException
from fastapi.responses import JSONResponse
from pydantic import BaseModel, Field
from typing import Optional, List, Dict
import json
import uuid
from datetime import datetime
import logging
import asyncio
import numpy as np

from services.streaming_recognition import get_streaming_service

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/streaming", tags=["streaming"])

# Active WebSocket connections
active_connections: Dict[str, WebSocket] = {}

# Feedback storage (use database in production)
feedback_storage: List[Dict] = []
dataset_storage: List[Dict] = []


# ============================================
# Request/Response Models
# ============================================

class StreamingFeedbackRequest(BaseModel):
    """Feedback for streaming recognition"""
    session_id: str
    timestamp: str
    predicted_sign: Optional[str]
    correct_sign: str
    confidence: float
    was_correct: bool
    user_comment: Optional[str] = None


class DatasetEntry(BaseModel):
    """Entry for dataset append"""
    session_id: str
    correct_sign: str
    landmarks_sequence: List[List[List[float]]]  # (T, 21, 3)
    timestamp: str
    metadata: Optional[Dict] = None


# ============================================
# WebSocket Endpoint
# ============================================

@router.websocket("/ws/recognize")
async def websocket_recognize(websocket: WebSocket):
    """
    WebSocket endpoint for real-time sign language recognition.

    Client sends frames as binary data, receives recognition results as JSON.

    Protocol:
    - Client sends: Binary frame data (JPEG/PNG encoded)
    - Server sends: JSON with {sign, confidence, timestamp, ...}

    Frame rate: 15-30 FPS recommended
    """
    # Accept connection
    await websocket.accept()

    # Generate session ID
    session_id = str(uuid.uuid4())
    active_connections[session_id] = websocket

    # Get streaming service
    service = get_streaming_service()
    service.start_session(session_id)

    try:
        # Send welcome message
        await websocket.send_json({
            "type": "connection",
            "session_id": session_id,
            "message": "Connected to streaming recognition service",
            "timestamp": datetime.utcnow().isoformat()
        })

        logger.info(f"WebSocket connection established: {session_id}")

        # Process frames
        frame_count = 0
        while True:
            # Receive frame data
            data = await websocket.receive()

            if "bytes" in data:
                # Binary frame data
                frame_bytes = data["bytes"]
                frame_count += 1

                # Process frame
                result = await service.process_frame(frame_bytes)

                # Send result if available (sliding window ready)
                if result is not None:
                    result["type"] = "recognition"
                    result["session_id"] = session_id
                    result["frame_count"] = frame_count

                    await websocket.send_json(result)

                    logger.debug(f"Session {session_id}: sign={result.get('sign')}, "
                               f"confidence={result.get('confidence', 0):.2f}")

                # Send heartbeat every 100 frames
                if frame_count % 100 == 0:
                    stats = service.get_performance_stats()
                    await websocket.send_json({
                        "type": "stats",
                        "session_id": session_id,
                        "frame_count": frame_count,
                        "stats": stats,
                        "timestamp": datetime.utcnow().isoformat()
                    })

            elif "text" in data:
                # Text message (control messages)
                message = json.loads(data["text"])
                message_type = message.get("type")

                if message_type == "ping":
                    await websocket.send_json({
                        "type": "pong",
                        "timestamp": datetime.utcnow().isoformat()
                    })

                elif message_type == "get_stats":
                    stats = service.get_performance_stats()
                    await websocket.send_json({
                        "type": "stats",
                        "session_id": session_id,
                        "stats": stats,
                        "timestamp": datetime.utcnow().isoformat()
                    })

                elif message_type == "stop":
                    logger.info(f"Stop requested for session {session_id}")
                    break

    except WebSocketDisconnect:
        logger.info(f"WebSocket disconnected: {session_id}")

    except Exception as e:
        logger.error(f"WebSocket error in session {session_id}: {e}", exc_info=True)
        try:
            await websocket.send_json({
                "type": "error",
                "error": str(e),
                "timestamp": datetime.utcnow().isoformat()
            })
        except:
            pass

    finally:
        # Cleanup
        service.stop_session()

        if session_id in active_connections:
            del active_connections[session_id]

        try:
            await websocket.close()
        except:
            pass

        logger.info(f"Session {session_id} closed. Total frames: {frame_count}")


# ============================================
# Feedback Endpoints
# ============================================

@router.post("/feedback")
async def submit_streaming_feedback(feedback: StreamingFeedbackRequest):
    """
    Submit feedback for streaming recognition results.

    This feedback is used to improve the model through retraining.

    Args:
        feedback: Feedback data with correct sign and confidence

    Returns:
        Confirmation of feedback submission
    """
    try:
        # Store feedback
        feedback_entry = {
            "session_id": feedback.session_id,
            "timestamp": feedback.timestamp,
            "predicted_sign": feedback.predicted_sign,
            "correct_sign": feedback.correct_sign,
            "confidence": feedback.confidence,
            "was_correct": feedback.was_correct,
            "user_comment": feedback.user_comment,
            "submitted_at": datetime.utcnow().isoformat()
        }

        feedback_storage.append(feedback_entry)

        logger.info(f"Feedback received for session {feedback.session_id}: "
                   f"predicted={feedback.predicted_sign}, correct={feedback.correct_sign}, "
                   f"was_correct={feedback.was_correct}")

        return {
            "message": "Feedback received successfully",
            "session_id": feedback.session_id,
            "feedback_id": len(feedback_storage) - 1,
            "timestamp": datetime.utcnow().isoformat()
        }

    except Exception as e:
        logger.error(f"Feedback submission error: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Feedback submission failed: {str(e)}")


@router.post("/dataset/append")
async def append_to_dataset(entry: DatasetEntry):
    """
    Append a labeled sample to the dataset for future retraining.

    This endpoint stores correctly labeled landmark sequences
    that can be used to improve the model.

    Args:
        entry: Dataset entry with landmarks and label

    Returns:
        Confirmation of dataset append
    """
    try:
        # Validate landmarks shape
        landmarks_array = np.array(entry.landmarks_sequence)
        expected_shape = (30, 21, 3)  # (sequence_length, num_landmarks, coordinates)

        if landmarks_array.shape[1:] != expected_shape[1:]:
            raise HTTPException(
                status_code=400,
                detail=f"Invalid landmarks shape. Expected (T, 21, 3), got {landmarks_array.shape}"
            )

        # Store dataset entry
        dataset_entry = {
            "session_id": entry.session_id,
            "correct_sign": entry.correct_sign,
            "landmarks_sequence": entry.landmarks_sequence,
            "timestamp": entry.timestamp,
            "metadata": entry.metadata or {},
            "stored_at": datetime.utcnow().isoformat()
        }

        dataset_storage.append(dataset_entry)

        logger.info(f"Dataset entry added: sign={entry.correct_sign}, "
                   f"sequence_length={len(entry.landmarks_sequence)}")

        # In production, save to file/database
        # Example: save_to_file(dataset_entry)

        return {
            "message": "Dataset entry added successfully",
            "entry_id": len(dataset_storage) - 1,
            "sign": entry.correct_sign,
            "sequence_length": len(entry.landmarks_sequence),
            "timestamp": datetime.utcnow().isoformat()
        }

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Dataset append error: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Dataset append failed: {str(e)}")


@router.get("/dataset/export")
async def export_dataset():
    """
    Export collected dataset entries for retraining.

    Returns:
        Dataset summary and download information
    """
    try:
        # Group by sign
        signs_count = {}
        for entry in dataset_storage:
            sign = entry["correct_sign"]
            signs_count[sign] = signs_count.get(sign, 0) + 1

        return {
            "total_entries": len(dataset_storage),
            "unique_signs": len(signs_count),
            "signs_distribution": signs_count,
            "entries": dataset_storage,  # In production, return download link
            "timestamp": datetime.utcnow().isoformat()
        }

    except Exception as e:
        logger.error(f"Dataset export error: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Dataset export failed: {str(e)}")


@router.get("/feedback/summary")
async def get_feedback_summary():
    """
    Get summary of collected feedback.

    Returns:
        Feedback statistics and accuracy metrics
    """
    try:
        if not feedback_storage:
            return {
                "total_feedback": 0,
                "accuracy": 0.0,
                "message": "No feedback collected yet"
            }

        # Calculate accuracy
        correct_count = sum(1 for f in feedback_storage if f["was_correct"])
        accuracy = correct_count / len(feedback_storage) if feedback_storage else 0.0

        # Group by predicted vs correct
        sign_confusion = {}
        for f in feedback_storage:
            predicted = f["predicted_sign"]
            correct = f["correct_sign"]

            if predicted != correct:
                key = f"{predicted} -> {correct}"
                sign_confusion[key] = sign_confusion.get(key, 0) + 1

        return {
            "total_feedback": len(feedback_storage),
            "correct_predictions": correct_count,
            "incorrect_predictions": len(feedback_storage) - correct_count,
            "accuracy": accuracy,
            "common_confusions": dict(sorted(sign_confusion.items(), key=lambda x: x[1], reverse=True)[:10]),
            "timestamp": datetime.utcnow().isoformat()
        }

    except Exception as e:
        logger.error(f"Feedback summary error: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Feedback summary failed: {str(e)}")


@router.get("/sessions/active")
async def get_active_sessions():
    """
    Get list of active WebSocket sessions.

    Returns:
        List of active session IDs
    """
    return {
        "active_sessions": list(active_connections.keys()),
        "total_active": len(active_connections),
        "timestamp": datetime.utcnow().isoformat()
    }


@router.delete("/sessions/{session_id}")
async def close_session(session_id: str):
    """
    Close a specific WebSocket session.

    Args:
        session_id: Session ID to close

    Returns:
        Confirmation of closure
    """
    if session_id not in active_connections:
        raise HTTPException(status_code=404, detail=f"Session {session_id} not found")

    try:
        websocket = active_connections[session_id]
        await websocket.close()
        del active_connections[session_id]

        return {
            "message": f"Session {session_id} closed successfully",
            "timestamp": datetime.utcnow().isoformat()
        }

    except Exception as e:
        logger.error(f"Error closing session {session_id}: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to close session: {str(e)}")
