"""
Farms API Endpoints.
"""
from fastapi import APIRouter, HTTPException, status
from typing import List, Dict, Any
import json
import uuid
from datetime import datetime
from app.models.database import get_connection
from app.models.schemas import FarmCreate, FarmUpdate, FarmResponse

router = APIRouter(prefix="/api/farms", tags=["Farms"])

def row_to_farm(row) -> FarmResponse:
    return FarmResponse(
        id=row["id"],
        name=row["name"],
        location_name=row["location_name"],
        latitude=row["latitude"],
        longitude=row["longitude"],
        area_hectares=row["area_hectares"],
        boundaries_geojson=json.loads(row["boundaries_geojson"]) if row["boundaries_geojson"] else None,
        current_crop=row["current_crop"],
        previous_crop_sequence=json.loads(row["previous_crop_sequence"]) if row["previous_crop_sequence"] else [],
        irrigation_type=row["irrigation_type"],
        primary_priority=row["primary_priority"],
        created_at=row["created_at"],
        updated_at=row["updated_at"]
    )

@router.get("", response_model=List[FarmResponse])
async def list_farms():
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM farms ORDER BY created_at DESC")
    rows = cursor.fetchall()
    conn.close()
    return [row_to_farm(r) for r in rows]

@router.post("", response_model=FarmResponse, status_code=status.HTTP_201_CREATED)
async def create_farm(farm_in: FarmCreate):
    farm_id = f"farm_{uuid.uuid4().hex[:8]}"
    now_iso = datetime.utcnow().strftime("%Y-%m-%dT%H:%M:%SZ")

    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("""
    INSERT INTO farms (
        id, name, location_name, latitude, longitude, area_hectares,
        boundaries_geojson, current_crop, previous_crop_sequence,
        irrigation_type, primary_priority, created_at, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    """, (
        farm_id, farm_in.name, farm_in.location_name, farm_in.latitude, farm_in.longitude,
        farm_in.area_hectares, json.dumps(farm_in.boundaries_geojson) if farm_in.boundaries_geojson else None,
        farm_in.current_crop, json.dumps(farm_in.previous_crop_sequence),
        farm_in.irrigation_type, farm_in.primary_priority, now_iso, now_iso
    ))
    conn.commit()

    cursor.execute("SELECT * FROM farms WHERE id = ?", (farm_id,))
    row = cursor.fetchone()
    conn.close()

    return row_to_farm(row)

@router.get("/{farm_id}", response_model=FarmResponse)
async def get_farm(farm_id: str):
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM farms WHERE id = ?", (farm_id,))
    row = cursor.fetchone()
    conn.close()

    if not row:
        raise HTTPException(status_code=404, detail=f"Farm '{farm_id}' not found.")
    return row_to_farm(row)

@router.put("/{farm_id}", response_model=FarmResponse)
async def update_farm(farm_id: str, farm_update: FarmUpdate):
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM farms WHERE id = ?", (farm_id,))
    existing = cursor.fetchone()

    if not existing:
        conn.close()
        raise HTTPException(status_code=404, detail=f"Farm '{farm_id}' not found.")

    now_iso = datetime.utcnow().strftime("%Y-%m-%dT%H:%M:%SZ")
    
    name = farm_update.name if farm_update.name is not None else existing["name"]
    loc_name = farm_update.location_name if farm_update.location_name is not None else existing["location_name"]
    lat = farm_update.latitude if farm_update.latitude is not None else existing["latitude"]
    lon = farm_update.longitude if farm_update.longitude is not None else existing["longitude"]
    area = farm_update.area_hectares if farm_update.area_hectares is not None else existing["area_hectares"]
    bounds = json.dumps(farm_update.boundaries_geojson) if farm_update.boundaries_geojson is not None else existing["boundaries_geojson"]
    curr_crop = farm_update.current_crop if farm_update.current_crop is not None else existing["current_crop"]
    prev_seq = json.dumps(farm_update.previous_crop_sequence) if farm_update.previous_crop_sequence is not None else existing["previous_crop_sequence"]
    irr = farm_update.irrigation_type if farm_update.irrigation_type is not None else existing["irrigation_type"]
    prio = farm_update.primary_priority if farm_update.primary_priority is not None else existing["primary_priority"]

    cursor.execute("""
    UPDATE farms SET
        name = ?, location_name = ?, latitude = ?, longitude = ?,
        area_hectares = ?, boundaries_geojson = ?, current_crop = ?,
        previous_crop_sequence = ?, irrigation_type = ?, primary_priority = ?,
        updated_at = ?
    WHERE id = ?
    """, (name, loc_name, lat, lon, area, bounds, curr_crop, prev_seq, irr, prio, now_iso, farm_id))
    conn.commit()

    cursor.execute("SELECT * FROM farms WHERE id = ?", (farm_id,))
    updated_row = cursor.fetchone()
    conn.close()

    return row_to_farm(updated_row)

@router.delete("/{farm_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_farm(farm_id: str):
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM farms WHERE id = ?", (farm_id,))
    if not cursor.fetchone():
        conn.close()
        raise HTTPException(status_code=404, detail=f"Farm '{farm_id}' not found.")
    cursor.execute("DELETE FROM farms WHERE id = ?", (farm_id,))
    conn.commit()
    conn.close()
    return None
