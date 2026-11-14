"""
Rotation Planner, MCDA Comparison, and Genetic Optimizer API Endpoints.
"""
from fastapi import APIRouter, HTTPException, Body
from typing import Dict, Any, List, Optional
import json
from app.models.database import get_connection
from app.models.schemas import (
    RotationComparisonResponse, CropTrait, GeneticOptimizerRequest, GeneticOptimizerResponse
)
from app.api.environment import get_or_calculate_env_summary
from app.engine.generator import StrategyGenerator
from app.engine.genetic_algo import CropSequenceGeneticOptimizer

router = APIRouter(tags=["Rotation Planner & Recommendations"])

def load_all_crops() -> List[CropTrait]:
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT data_json FROM crop_catalog")
    rows = cursor.fetchall()
    conn.close()
    crops = []
    for r in rows:
        c_dict = json.loads(r["data_json"])
        crops.append(CropTrait(**c_dict))
    return crops

@router.get("/api/farms/{farm_id}/rotations", response_model=RotationComparisonResponse)
async def get_farm_rotations(farm_id: str):
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM farms WHERE id = ?", (farm_id,))
    farm = cursor.fetchone()
    conn.close()

    if not farm:
        raise HTTPException(status_code=404, detail=f"Farm '{farm_id}' not found.")

    env = await get_or_calculate_env_summary(farm_id)
    all_crops = load_all_crops()
    generator = StrategyGenerator(all_crops)

    previous_seq = json.loads(farm["previous_crop_sequence"]) if farm["previous_crop_sequence"] else []

    comparison = generator.generate_all_strategies(
        farm_id=farm_id,
        farm_name=farm["name"],
        current_crop_id=farm["current_crop"],
        previous_sequence=previous_seq,
        env=env,
        irrigation_type=farm["irrigation_type"],
        farmer_priority=farm["primary_priority"]
    )

    return comparison

@router.post("/api/farms/{farm_id}/rotations/generate", response_model=RotationComparisonResponse)
async def generate_custom_rotations(
    farm_id: str,
    payload: Dict[str, Any] = Body(default_factory=dict)
):
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM farms WHERE id = ?", (farm_id,))
    farm = cursor.fetchone()
    conn.close()

    if not farm:
        raise HTTPException(status_code=404, detail=f"Farm '{farm_id}' not found.")

    env = await get_or_calculate_env_summary(farm_id)
    all_crops = load_all_crops()
    generator = StrategyGenerator(all_crops)

    custom_weights = payload.get("weights")
    priority = payload.get("priority", farm["primary_priority"])
    previous_seq = json.loads(farm["previous_crop_sequence"]) if farm["previous_crop_sequence"] else []

    return generator.generate_all_strategies(
        farm_id=farm_id,
        farm_name=farm["name"],
        current_crop_id=farm["current_crop"],
        previous_sequence=previous_seq,
        env=env,
        irrigation_type=farm["irrigation_type"],
        farmer_priority=priority,
        custom_weights=custom_weights
    )

@router.post("/api/rotations/optimize-ga", response_model=GeneticOptimizerResponse)
async def optimize_rotation_with_ga(request: GeneticOptimizerRequest):
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM farms WHERE id = ?", (request.farm_id,))
    farm = cursor.fetchone()
    conn.close()

    if not farm:
        raise HTTPException(status_code=404, detail=f"Farm '{request.farm_id}' not found.")

    env = await get_or_calculate_env_summary(request.farm_id)
    all_crops = load_all_crops()

    optimizer = CropSequenceGeneticOptimizer(all_crops, env, farm["irrigation_type"])
    return optimizer.run_optimization(request)
