import os
from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    PROJECT_NAME: str = "eRTMAC-NWIS"
    PROJECT_TITLE: str = "AI-Powered Nearby Wells Intelligence & Proactive Drilling Risk Decision Support Platform"
    OPERATOR: str = "Oil India Limited (OIL)"
    API_V1_STR: str = "/api"
    SECRET_KEY: str = "oil_india_ertmac_nwis_secret_key_2026_super_secure_jwt"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24  # 24 hours
    
    # SQLite default for instant zero-config prototype run, PostgreSQL ready
    # On Vercel serverless, only /tmp is writable
    DATABASE_URL: str = os.getenv(
        "DATABASE_URL",
        "sqlite:////tmp/ertmac_nwis.db" if os.getenv("VERCEL") else "sqlite:///./ertmac_nwis.db"
    )

    
    # Simulation defaults
    DEFAULT_LOOKAHEAD_METERS: float = 50.0
    RISK_THRESHOLD_MODERATE: float = 0.30
    RISK_THRESHOLD_HIGH: float = 0.60
    RISK_THRESHOLD_CRITICAL: float = 0.80
    
    # Default Similarity Model Weights (S_ij = w1*Spatial + w2*Trajectory + w3*Stratigraphic + w4*Architecture)
    WEIGHT_SPATIAL: float = 0.35
    WEIGHT_TRAJECTORY: float = 0.20
    WEIGHT_STRATIGRAPHIC: float = 0.30
    WEIGHT_ARCHITECTURE: float = 0.15

    class Config:
        case_sensitive = True

settings = Settings()
