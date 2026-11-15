"""
Main FastAPI Application Entrypoint for FieldShift Backend.
NASA Space Apps Challenge 2026: Field Shift - Adapting Farms with NASA Data.
"""
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
from app.config import settings
from app.models.database import init_db
from app.data.seed_data import seed_database
from app.api import farms, environment, rotations, simulation, crops, data_sources, reports, auth

@asynccontextmanager
async def lifespan(app: FastAPI):
    init_db()
    seed_database()
    yield

app = FastAPI(
    title="FieldShift API",
    description="Intelligent Agricultural Decision-Support Platform with NASA Earth Observations & Explainable Rotation Planning",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
    lifespan=lifespan
)

# CORS setup
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origin_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include API Routers
app.include_router(farms.router)
app.include_router(environment.router)
app.include_router(rotations.router)
app.include_router(simulation.router)
app.include_router(crops.router)
app.include_router(data_sources.router)
app.include_router(reports.router)
app.include_router(auth.router)

@app.get("/health")
def health_check():
    earthdata_enabled = not settings.DEMO_MODE and bool(settings.NASA_EARTHDATA_TOKEN)
    gee_enabled = (
        not settings.DEMO_MODE
        and bool(settings.GEE_SERVICE_ACCOUNT)
        and bool(settings.GEE_PRIVATE_KEY_FILE)
    )
    return {
        "status": "healthy",
        "service": "FieldShift Agricultural Intelligence Backend",
        "data_mode": "demo" if settings.DEMO_MODE else "live_with_fallbacks",
        "demo_mode": settings.DEMO_MODE,
        "earthdata_configured": bool(settings.NASA_EARTHDATA_TOKEN),
        "earthdata_live_enabled": earthdata_enabled,
        "gee_configured": bool(settings.GEE_SERVICE_ACCOUNT and settings.GEE_PRIVATE_KEY_FILE),
        "gee_live_enabled": gee_enabled,
        "connectors": {
            "nasa_power": "demo_disabled" if settings.DEMO_MODE else "enabled_no_key_required",
            "usda_soil_data": "demo_disabled" if settings.DEMO_MODE else "enabled_no_key_required",
            "soilgrids": "demo_disabled" if settings.DEMO_MODE else "enabled_no_key_required",
            "nasa_earthdata": "enabled" if earthdata_enabled else "not_enabled",
            "google_earth_engine": "enabled" if gee_enabled else "not_enabled",
        },
        "configuration_note": "Credentials are read only from backend environment variables; the browser never stores them.",
    }

@app.get("/")
def root():
    return {
        "app": "FieldShift",
        "challenge": "2026 NASA Space Apps Challenge: Field Shift: Adapting Farms with NASA Data",
        "docs": "/docs",
        "health": "/health"
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app.main:app", host="0.0.0.0", port=8000, reload=True)
