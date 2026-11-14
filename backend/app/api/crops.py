"""
Crop Catalog API Endpoints.
"""
from fastapi import APIRouter, HTTPException
from typing import List
import json
from app.models.database import get_connection
from app.models.schemas import CropTrait

router = APIRouter(prefix="/api/crops", tags=["Crop Catalog"])

@router.get("", response_model=List[CropTrait])
async def list_crops():
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT data_json FROM crop_catalog")
    rows = cursor.fetchall()
    conn.close()
    return [CropTrait(**json.loads(r["data_json"])) for r in rows]

@router.get("/{crop_id}", response_model=CropTrait)
async def get_crop(crop_id: str):
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT data_json FROM crop_catalog WHERE id = ?", (crop_id,))
    row = cursor.fetchone()
    conn.close()
    if not row:
        raise HTTPException(status_code=404, detail=f"Crop '{crop_id}' not found in catalog.")
    return CropTrait(**json.loads(row["data_json"]))
