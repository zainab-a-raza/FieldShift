"""
Application configuration for FieldShift backend.
"""
from pydantic_settings import BaseSettings
from typing import List
import os

class Settings(BaseSettings):
    ENVIRONMENT: str = "development"
    PORT: int = 8000
    HOST: str = "0.0.0.0"
    CORS_ORIGINS: str = "http://localhost:3000,http://127.0.0.1:3000,http://localhost:3001"
    
    # Mode control
    DEMO_MODE: bool = True
    
    # External APIs
    NASA_EARTHDATA_USERNAME: str = ""
    NASA_EARTHDATA_PASSWORD: str = ""
    NASA_POWER_API_URL: str = "https://power.larc.nasa.gov/api/temporal/daily/point"
    SOILGRIDS_API_URL: str = "https://rest.isric.org/soilgrids/v2.0/properties/query"
    
    # Earth Engine
    GEE_SERVICE_ACCOUNT: str = ""
    GEE_PRIVATE_KEY_FILE: str = ""
    
    # Database
    DATABASE_URL: str = "sqlite:///./fieldshift.db"
    SUPABASE_URL: str = ""
    SUPABASE_KEY: str = ""
    
    @property
    def cors_origin_list(self) -> List[str]:
        return [o.strip() for o in self.CORS_ORIGINS.split(",") if o.strip()]

    class Config:
        env_file = ".env"
        extra = "ignore"

settings = Settings()
