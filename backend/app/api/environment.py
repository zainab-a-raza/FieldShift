"""
Environmental Insights & Earth Observation API Endpoints.
Connects NASA POWER, SMAP, GPM IMERG, Landsat/MODIS/VIIRS, SSURGO/SoilGrids, and SRTM.
"""
from fastapi import APIRouter, HTTPException
from typing import Dict, Any, List
import json
from datetime import datetime, timezone
from app.models.database import get_connection
from app.models.schemas import EnvironmentalSummary, SoilPropertiesMetrics, VegetationMetrics
from app.config import settings
from app.services.nasa_power import NASAPowerService
from app.services.soilgrids import SoilGridsService
from app.services.usda_soils import USDASoilDataService
from app.services.nasa_smap import NASASMAPService
from app.services.nasa_gpm import NASAGPMService
from app.services.earth_engine import EarthEngineService
from app.services.srtm import SRTMService

router = APIRouter(prefix="/api/farms/{farm_id}", tags=["Environmental Observations"])

nasa_power_svc = NASAPowerService()
soilgrids_svc = SoilGridsService()
usda_soils_svc = USDASoilDataService()
smap_svc = NASASMAPService()
gpm_svc = NASAGPMService()
ee_svc = EarthEngineService()
srtm_svc = SRTMService()

async def get_or_calculate_env_summary(farm_id: str) -> EnvironmentalSummary:
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM farms WHERE id = ?", (farm_id,))
    farm = cursor.fetchone()
    conn.close()

    if not farm:
        raise HTTPException(status_code=404, detail=f"Farm '{farm_id}' not found.")

    lat = farm["latitude"]
    lon = farm["longitude"]
    bounds = json.loads(farm["boundaries_geojson"]) if farm["boundaries_geojson"] else None

    # NASA POWER supplies daily weather/spell diagnostics. Other providers are
    # queried independently so a temporary upstream outage does not block them.
    power_data = await nasa_power_svc.fetch_daily_agrometeorology(lat, lon)
    # SSURGO supplies detailed U.S. survey horizons. SoilGrids preserves global
    # coverage when the coordinate is outside SSURGO or its service is offline.
    soil_data = await usda_soils_svc.fetch_soil_profile(lat, lon)
    used_soilgrids_fallback = soil_data is None
    if soil_data is None:
        soil_data = await soilgrids_svc.fetch_soil_profile(lat, lon)
    smap_data = await smap_svc.get_soil_moisture(lat, lon)
    gpm_data = await gpm_svc.get_precipitation_climatology(
        lat, lon, fallback_metrics=power_data["rainfall"]
    )
    veg_data = await ee_svc.get_vegetation_metrics(lat, lon, bounds)
    terrain_data = await srtm_svc.get_terrain_metrics(lat, lon)
    rainfall_data = gpm_data or power_data["rainfall"]

    # Generate active environmental alerts based on real indicators
    alerts = []
    if power_data["temperature"].hot_days_gt_35c >= 12:
        alerts.append({
            "severity": "high",
            "title": "Severe Heat Stress Exposure",
            "message": f"{power_data['temperature'].hot_days_gt_35c} days exceeded 35°C during this period. Risk of terminal heat shock during flowering or grain-filling stages."
        })
    if smap_data.soil_moisture_percentile is not None and smap_data.soil_moisture_percentile < 35.0:
        alerts.append({
            "severity": "medium",
            "title": "Root-Zone Moisture Deficit",
            "message": f"NASA SMAP reports surface soil moisture in the {smap_data.soil_moisture_percentile:.0f}th percentile ({smap_data.anomaly_status}). Fallow soil will rapidly dry out without organic mulch."
        })
    if terrain_data.slope_degrees > 3.0 and veg_data.current_ndvi < 0.35:
        alerts.append({
            "severity": "medium",
            "title": "Topographic Runoff & Washout Vulnerability",
            "message": f"Slope of {terrain_data.slope_degrees}° with low canopy cover increases sheet erosion risk during heavy convective storm bursts."
        })

    metric_provenance = {
        "temperature": power_data["temperature"].provenance,
        "rainfall": rainfall_data.provenance,
        "soil moisture": smap_data.provenance,
        "soil properties": soil_data.provenance,
        "vegetation": veg_data.provenance,
        "terrain": terrain_data.provenance,
    }
    demo_metrics = [name for name, provenance in metric_provenance.items() if provenance.is_demo]
    is_demo = bool(demo_metrics)
    if len(demo_metrics) == len(metric_provenance):
        data_status = "demo"
    elif demo_metrics:
        data_status = "mixed"
    else:
        data_status = "live"

    data_messages = []
    for name in demo_metrics:
        provenance = metric_provenance[name]
        data_messages.append(f"{name.title()}: {provenance.notes or 'demo fallback in use.'}")
    if not settings.DEMO_MODE and gpm_data is None:
        data_messages.append("GPM IMERG was unavailable or not configured; rainfall metrics use NASA POWER.")
    if not settings.DEMO_MODE and used_soilgrids_fallback:
        data_messages.append("SSURGO/STATSGO2 had no result for this coordinate or was unavailable; SoilGrids was used.")

    return EnvironmentalSummary(
        farm_id=farm_id,
        evaluation_date=datetime.now(timezone.utc).strftime("%Y-%m-%d"),
        temperature=power_data["temperature"],
        rainfall=rainfall_data,
        soil_moisture=smap_data,
        vegetation=veg_data,
        soil_properties=soil_data,
        terrain=terrain_data,
        environmental_alerts=alerts,
        is_demo_data=is_demo,
        data_status=data_status,
        data_messages=data_messages,
    )

@router.get("/environment", response_model=EnvironmentalSummary)
async def get_environment_summary(farm_id: str):
    return await get_or_calculate_env_summary(farm_id)

@router.get("/environment/trends")
async def get_environmental_trends(farm_id: str):
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT latitude, longitude FROM farms WHERE id = ?", (farm_id,))
    farm = cursor.fetchone()
    conn.close()

    if not farm:
        raise HTTPException(status_code=404, detail=f"Farm '{farm_id}' not found.")

    power_data = await nasa_power_svc.fetch_daily_agrometeorology(farm["latitude"], farm["longitude"])
    raw_series = power_data.get("raw_time_series", {})
    trend_data = await nasa_power_svc.fetch_seasonal_trends(farm["latitude"], farm["longitude"])

    return {
        "farm_id": farm_id,
        "daily_weather_series": raw_series,
        "historical_seasonal_comparison": trend_data["seasons"],
        "status": trend_data["status"],
        "is_demo": trend_data["is_demo"],
        "message": trend_data["message"],
        "metadata": {
            "source": trend_data["source"],
            "baseline_period": trend_data.get("baseline_period"),
            "granularity": "Daily recent series and six-month seasonal aggregates",
        },
    }

@router.get("/soil", response_model=SoilPropertiesMetrics)
async def get_farm_soil(farm_id: str):
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT latitude, longitude FROM farms WHERE id = ?", (farm_id,))
    farm = cursor.fetchone()
    conn.close()

    if not farm:
        raise HTTPException(status_code=404, detail=f"Farm '{farm_id}' not found.")

    soil_data = await usda_soils_svc.fetch_soil_profile(farm["latitude"], farm["longitude"])
    if soil_data is not None:
        return soil_data
    return await soilgrids_svc.fetch_soil_profile(farm["latitude"], farm["longitude"])

@router.get("/vegetation", response_model=VegetationMetrics)
async def get_farm_vegetation(farm_id: str):
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT latitude, longitude, boundaries_geojson FROM farms WHERE id = ?", (farm_id,))
    farm = cursor.fetchone()
    conn.close()

    if not farm:
        raise HTTPException(status_code=404, detail=f"Farm '{farm_id}' not found.")

    bounds = json.loads(farm["boundaries_geojson"]) if farm["boundaries_geojson"] else None
    return await ee_svc.get_vegetation_metrics(farm["latitude"], farm["longitude"], bounds)
