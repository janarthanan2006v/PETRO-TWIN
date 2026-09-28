import os
from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    PROJECT_NAME: str = "PETRO-TWIN: Heavy-Oil CSS + SRP Digital Twin"
    API_V1_STR: str = "/api/v1"
    SECRET_KEY: str = "petro-twin-super-secret-key-for-sih-2026"
    DATABASE_URL: str = os.getenv("DATABASE_URL", "sqlite:///./petro_twin.db")
    
    # Heavy Oil Reservoir Baseline Settings (e.g. Baghewala / Rajasthan context)
    DEFAULT_API_GRAVITY: float = 14.5  # Heavy oil (12-18 API)
    DEFAULT_INITIAL_TEMP_C: float = 55.0
    DEFAULT_STEAM_TEMP_C: float = 280.0
    DEFAULT_STEAM_PRESSURE_BAR: float = 65.0
    DEFAULT_RESERVOIR_DEPTH_M: float = 1100.0
    DEFAULT_PLUNGER_DIA_IN: float = 2.25
    DEFAULT_ROD_RATING_LBS: float = 28000.0
    
    CORS_ORIGINS: list[str] = ["http://localhost:3000", "http://localhost:5173", "http://127.0.0.1:5173", "*"]

    class Config:
        case_sensitive = True

settings = Settings()
