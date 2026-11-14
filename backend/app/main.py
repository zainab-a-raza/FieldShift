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
from app.api import farms, environment, rotations, simulation, crops, data_sources, reports

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
    allow_origins=["*"],
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

@app.get("/health")
def health_check():
    return {
        "status": "healthy",
        "service": "FieldShift Agricultural Intelligence Backend",
        "demo_mode": settings.DEMO_MODE,
        "earthdata_configured": bool(settings.NASA_EARTHDATA_USERNAME),
        "gee_configured": bool(settings.GEE_SERVICE_ACCOUNT)
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
