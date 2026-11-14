"""
Data Sources & Provenance Registry API Endpoints.
"""
from fastapi import APIRouter
from typing import List, Dict, Any
from app.models.database import get_connection

router = APIRouter(prefix="/api/data-sources", tags=["Data Provenance & Sources"])

@router.get("")
async def list_data_sources():
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM data_sources")
    rows = cursor.fetchall()
    conn.close()

    sources = []
    for r in rows:
        sources.append({
            "id": r["id"],
            "name": r["name"],
            "agency": r["agency"],
            "product_name": r["product_name"],
            "resolution": r["resolution"],
            "cadence": r["cadence"],
            "status": r["status"],
            "description": r["description"],
            "documentation_url": r["documentation_url"]
        })

    return {
        "sources": sources,
        "transparency_principles": [
            "Every environmental observation explicitly states product version, spatial footprint, and sensor modality.",
            "Coarse-scale satellite radiometric observations (e.g. SMAP 9km, POWER 50km) are never claimed to be pinpoint field sensor probes.",
            "Optical NDVI values masked for clouds and shadows via Sentinel-2 Scene Classification Layer.",
            "All simulated or benchmark values in demo mode are watermarked with SIMULATED_DEMO quality flag."
        ]
    }
