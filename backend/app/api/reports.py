"""
Agricultural Decision Report API Endpoints.
Generates comprehensive exportable summaries of farm status, environmental stress indicators,
rotation strategies, and data provenance citations.
"""
from fastapi import APIRouter, HTTPException
import json
from datetime import datetime, timezone
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
    recommended = next(
        strategy for strategy in rotations.strategies
        if strategy.strategy_id == rotations.recommended_strategy_id
    )
    metric_provenance = {
        "Temperature": env.temperature.provenance,
        "Precipitation": env.rainfall.provenance,
        "Soil moisture": env.soil_moisture.provenance,
        "Vegetation": env.vegetation.provenance,
        "Soil properties": env.soil_properties.provenance,
        "Terrain": env.terrain.provenance,
    }
    citations = []
    for metric, provenance in metric_provenance.items():
        observation_window = ""
        if provenance.observation_start or provenance.observation_end:
            observation_window = (
                f"; observation window {provenance.observation_start or 'unknown'} "
                f"to {provenance.observation_end or 'unknown'}"
            )
        citations.append({
            "metric": metric,
            "source": provenance.source_name,
            "product": provenance.product_version,
            "quality_flag": provenance.quality_flag.value,
            "is_demo": provenance.is_demo,
            "citation": provenance.scientific_citation,
            "details": f"{provenance.spatial_resolution}; {provenance.temporal_resolution}{observation_window}",
        })

    return {
        "report_id": f"REP-{farm_id.upper()}-{datetime.now(timezone.utc).strftime('%Y%m%d')}",
        "generated_at": datetime.now(timezone.utc).strftime("%Y-%m-%d %H:%M:%S UTC"),
        "report_status": env.data_status,
        "data_messages": env.data_messages,
        "decision_support_disclaimer": (
            "Decision-support draft only. Values may include modeled, remotely sensed, cached, or demo inputs. "
            "Confirm recommendations with local observations and a qualified agronomist before operational use."
        ),
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
            "rainfall_source": env.rainfall.provenance.source_name,
            "max_consecutive_dry_days": env.rainfall.max_consecutive_dry_days,
            "hot_days_gt_35c": env.temperature.hot_days_gt_35c,
            "temperature_source": env.temperature.provenance.source_name,
            "surface_soil_moisture": f"{env.soil_moisture.surface_soil_moisture_m3_m3} m³/m³ ({env.soil_moisture.anomaly_status})",
            "soil_moisture_source": env.soil_moisture.provenance.source_name,
            "soil_ph": env.soil_properties.ph_in_h2o,
            "soil_organic_carbon_g_kg": env.soil_properties.organic_carbon_g_kg,
            "soil_properties_source": env.soil_properties.provenance.source_name,
            "topographic_slope": f"{env.terrain.slope_degrees}° ({env.terrain.slope_category})",
            "active_alerts": env.environmental_alerts
        },
        "rotation_recommendations": {
            "recommended_strategy_title": recommended.title,
            "recommended_score": recommended.overall_score,
            "recommended_summary": recommended.summary,
            "recommended_reasons": recommended.reasons_for_recommendation,
            "missing_data_warnings": recommended.missing_data_warnings,
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
        "scientific_provenance_citations": citations,
    }
