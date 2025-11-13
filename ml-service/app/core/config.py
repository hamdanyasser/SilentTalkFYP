from pydantic_settings import BaseSettings
from typing import List


class Settings(BaseSettings):
    """
    Application settings
    """
    # API Settings
    API_V1_STR: str = "/api"
    PROJECT_NAME: str = "SilentTalk ML Service"

    # CORS
    ALLOWED_ORIGINS: List[str] = [
        "http://localhost:5173",
        "http://localhost:3000",
        "https://localhost:5001"
    ]

    # ML Model Settings
    MODEL_PATH: str = "./models"
    CONFIDENCE_THRESHOLD: float = 0.85
    MAX_FRAME_SIZE: int = 1024 * 1024 * 5  # 5MB

    # MediaPipe Settings
    MEDIAPIPE_MODEL_COMPLEXITY: int = 1
    MEDIAPIPE_MIN_DETECTION_CONFIDENCE: float = 0.5
    MEDIAPIPE_MIN_TRACKING_CONFIDENCE: float = 0.5

    # Performance Settings (NFR-001)
    MAX_INFERENCE_TIME_MS: int = 100  # Maximum inference time in milliseconds

    class Config:
        env_file = ".env"
        case_sensitive = True


settings = Settings()
