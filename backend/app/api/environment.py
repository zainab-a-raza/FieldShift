"""
Environmental Insights & Earth Observation API Endpoints.
Connects NASA POWER, SMAP, GPM IMERG, Landsat/MODIS/VIIRS, SSURGO/SoilGrids, and SRTM.
"""
from fastapi import APIRouter, HTTPException
from typing import Dict, Any, List
import asyncio
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
from app.services.cache import get_json_cache, set_json_cache

router = APIRouter(prefix="/api/farms/{farm_id}", tags=["Environmental Observations"])

nasa_power_svc = NASAPowerService()
soilgrids_svc = SoilGridsService()
usda_soils_svc = USDASoilDataService()
smap_svc = NASASMAPService()
gpm_svc = NASAGPMService()
ee_svc = EarthEngineService()
srtm_svc = SRTMService()

_environment_locks: Dict[str, asyncio.Lock] = {}
_trend_locks: Dict[str, asyncio.Lock] = {}


def _environment_cache_key(farm: Any) -> str:
    connector_profile = (
        f"earthdata={bool(settings.NASA_EARTHDATA_TOKEN)}:"
        f"gee={bool(settings.GEE_SERVICE_ACCOUNT and settings.GEE_PRIVATE_KEY_FILE)}"
    )
    return (
        f"environment:v3:{farm['id']}:{farm['updated_at']}:"
        f"demo={settings.DEMO_MODE}:{connector_profile}"
    )


def _cached_summary(entry: Any) -> EnvironmentalSummary:
    summary = EnvironmentalSummary.model_validate(entry.payload)
    return summary.model_copy(update={
        "cache_status": "stale" if entry.is_stale else "hit",
        "cached_at": entry.fetched_at,
        "cache_expires_at": entry.expires_at,
    })


async def get_or_calculate_env_summary(farm_id: str) -> EnvironmentalSummary:
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM farms WHERE id = ?", (farm_id,))
    farm = cursor.fetchone()
    conn.close()

    if not farm:
        raise HTTPException(status_code=404, detail=f"Farm '{farm_id}' not found.")

    cache_key = _environment_cache_key(farm)
    fresh = get_json_cache(cache_key)
    if fresh is not None:
        return _cached_summary(fresh)

    lock = _environment_locks.setdefault(cache_key, asyncio.Lock())
    async with lock:
        # Several pages can request the same farm at once. Only the first caller
        # performs upstream work; the others consume its newly persisted entry.
        fresh = get_json_cache(cache_key)
        if fresh is not None:
            return _cached_summary(fresh)
        try:
            summary = await _calculate_env_summary(farm_id, farm)
        except Exception:
            stale = get_json_cache(
                cache_key,
                allow_stale_seconds=settings.STALE_CACHE_GRACE_SECONDS,
            )
            if stale is not None:
                return _cached_summary(stale)
            raise

        entry = set_json_cache(
            cache_key,
            summary.model_dump(mode="json"),
            ttl_seconds=settings.ENVIRONMENT_CACHE_TTL_SECONDS,
        )
        return summary.model_copy(update={
            "cache_status": "miss",
            "cached_at": entry.fetched_at,
            "cache_expires_at": entry.expires_at,
        })

async def _calculate_env_summary(farm_id: str, farm: Any) -> EnvironmentalSummary:
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
    cursor.execute("SELECT id, latitude, longitude, updated_at FROM farms WHERE id = ?", (farm_id,))
    farm = cursor.fetchone()
    conn.close()

    if not farm:
        raise HTTPException(status_code=404, detail=f"Farm '{farm_id}' not found.")

    cache_key = (
        f"environment-trends:v2:{farm_id}:{farm['updated_at']}:"
        f"demo={settings.DEMO_MODE}"
    )
    cached = get_json_cache(cache_key)
    if cached is not None:
        payload = cached.payload
        payload["metadata"]["cache_status"] = "hit"
        payload["metadata"]["cached_at"] = cached.fetched_at
        payload["metadata"]["cache_expires_at"] = cached.expires_at
        return payload

    lock = _trend_locks.setdefault(cache_key, asyncio.Lock())
    async with lock:
        cached = get_json_cache(cache_key)
        if cached is not None:
            payload = cached.payload
            payload["metadata"]["cache_status"] = "hit"
            payload["metadata"]["cached_at"] = cached.fetched_at
            payload["metadata"]["cache_expires_at"] = cached.expires_at
            return payload

        power_data = await nasa_power_svc.fetch_daily_agrometeorology(farm["latitude"], farm["longitude"])
        raw_series = power_data.get("raw_time_series", {})
        trend_data = await nasa_power_svc.fetch_seasonal_trends(farm["latitude"], farm["longitude"])

        payload = {
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
                "cache_status": "miss",
            },
        }
        is_live_payload = (
            not power_data["temperature"].provenance.is_demo
            and trend_data["status"] == "live"
        )
        if is_live_payload:
            entry = set_json_cache(
                cache_key,
                payload,
                ttl_seconds=settings.TREND_CACHE_TTL_SECONDS,
            )
            payload["metadata"]["cached_at"] = entry.fetched_at
            payload["metadata"]["cache_expires_at"] = entry.expires_at
        return payload

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
