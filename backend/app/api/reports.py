"""
Agricultural Decision Report API Endpoints.
Generates comprehensive exportable summaries of farm status, environmental stress indicators,
rotation strategies, and data provenance citations.
"""
from fastapi import APIRouter, HTTPException
import json
from datetime import datetime
from app.models.database import get_connection
from app.api.environment import get_or_calculate_env_summary
from app.api.rotations import get_farm_rotations

router = APIRouter(prefix="/api/reports", tags=["Reports"])

@router.get("/{farm_id}")
async def generate_farm_report(farm_id: str):
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM farms WHERE id = ?", (farm_id,))
    farm = cursor.fetchone()
    conn.close()

    if not farm:
        raise HTTPException(status_code=404, detail=f"Farm '{farm_id}' not found.")

    env = await get_or_calculate_env_summary(farm_id)
    rotations = await get_farm_rotations(farm_id)

    return {
        "report_id": f"REP-{farm_id.upper()}-{datetime.utcnow().strftime('%Y%m%d')}",
        "generated_at": datetime.utcnow().strftime("%Y-%m-%d %H:%M:%S UTC"),
        "farm_profile": {
            "name": farm["name"],
            "location": farm["location_name"],
            "coordinates": f"{farm['latitude']}°N, {farm['longitude']}°E",
            "area_hectares": farm["area_hectares"],
            "current_crop": farm["current_crop"],
            "irrigation_regime": farm["irrigation_type"],
            "primary_management_goal": farm["primary_priority"]
        },
        "environmental_diagnostics": {
            "annual_rainfall_mm": env.rainfall.annual_precipitation_mm,
            "max_consecutive_dry_days": env.rainfall.max_consecutive_dry_days,
            "hot_days_gt_35c": env.temperature.hot_days_gt_35c,
            "surface_soil_moisture": f"{env.soil_moisture.surface_soil_moisture_m3_m3} m³/m³ ({env.soil_moisture.anomaly_status})",
            "soil_ph": env.soil_properties.ph_in_h2o,
            "soil_organic_carbon_g_kg": env.soil_properties.organic_carbon_g_kg,
            "topographic_slope": f"{env.terrain.slope_degrees}° ({env.terrain.slope_category})",
            "active_alerts": env.environmental_alerts
        },
        "rotation_recommendations": {
            "recommended_strategy_title": [s for s in rotations.strategies if s.strategy_id == rotations.recommended_strategy_id][0].title,
            "recommended_score": [s for s in rotations.strategies if s.strategy_id == rotations.recommended_strategy_id][0].overall_score,
            "strategies_overview": [
                {
                    "title": s.title,
                    "overall_score": s.overall_score,
                    "crop_sequence": [slot.crop_name for slot in s.crop_sequence],
                    "water_resilience": s.criteria_scores.water_resilience,
                    "soil_improvement": s.criteria_scores.soil_improvement,
                    "market_suitability": s.criteria_scores.market_suitability
                }
                for s in rotations.strategies
            ]
        },
        "scientific_provenance_citations": [
            "NASA POWER Daily Agroclimatology (MERRA-2 Data Assimilation)",
            "NASA SMAP Level-3 Radiometer Global Soil Moisture (SPL3SMP_E)",
            "ISRIC SoilGrids 2.0 Global Digital Soil Mapping (250m)",
            "Copernicus Sentinel-2 Harmonized Level-2A Surface Reflectance",
            "NASA SRTM Global 1 Arc-Second Digital Elevation Model"
        ]
    }
