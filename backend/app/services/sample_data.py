"""Load fictional environmental values without contacting external services."""
import json
from pathlib import Path

from app.models.schemas import (
    EnvironmentalSummary, TemperatureMetrics, RainfallMetrics, SoilMoistureMetrics,
    VegetationMetrics, SoilPropertiesMetrics, TerrainMetrics,
)
from app.provenance.tracker import create_provenance, DataOriginType

DATA_PATH = Path(__file__).resolve().parent.parent / "data" / "sample_environment.json"


def sample_summary(farm_id: str) -> EnvironmentalSummary:
    dataset = json.loads(DATA_PATH.read_text(encoding="utf-8"))
    profiles = dataset["profiles"]
    profile = profiles.get(farm_id, profiles["default"])

    def provenance(metric: str, units: str):
        return create_provenance(
            metric_id=f"sample_{metric}", metric_name=f"Sample {metric}",
            source_name="FieldShift synthetic sample dataset", product_version=dataset["version"],
            origin_type=DataOriginType.MODEL_ESTIMATE, spatial_resolution="Not applicable",
            temporal_resolution="Fictional example", units=units, is_demo=True,
            notes="Fictional sample values; not observations or measurements for this farm.",
        )

    temp, rain = profile["temperature"], profile["rainfall"]
    return EnvironmentalSummary(
        farm_id=farm_id, evaluation_date="Sample dataset",
        temperature=TemperatureMetrics(avg_temp_c=temp, max_temp_c=temp + 14, min_temp_c=temp - 12,
            hot_days_gt_35c=8, growing_degree_days=1650, historical_anomaly_c=None,
            provenance=provenance("temperature", "°C")),
        rainfall=RainfallMetrics(seasonal_precipitation_mm=round(rain * 0.42, 1), annual_precipitation_mm=rain,
            variability_index_pct=38, heavy_rain_events_gt_25mm=5, max_consecutive_dry_days=26,
            rainfall_deficit_pct=None, provenance=provenance("rainfall", "mm")),
        soil_moisture=SoilMoistureMetrics(surface_soil_moisture_m3_m3=profile["moisture"],
            root_zone_soil_moisture_m3_m3=None, soil_moisture_percentile=None,
            anomaly_status="Sample value", provenance=provenance("soil moisture", "m³/m³")),
        vegetation=VegetationMetrics(current_ndvi=profile["ndvi"], mean_historical_ndvi=profile["ndvi"],
            peak_season_ndvi=0.7, ndvi_anomaly=0, low_vegetation_months=[], satellite_mission="Synthetic sample",
            cloud_coverage_pct=0, provenance=provenance("vegetation", "NDVI")),
        soil_properties=SoilPropertiesMetrics(organic_carbon_g_kg=profile["carbon"], ph_in_h2o=profile["ph"],
            sand_fraction_pct=36, silt_fraction_pct=44, clay_fraction_pct=20, bulk_density_cg_cm3=132,
            available_water_capacity_mm_m=145, depth_interval="0-30 cm",
            provenance=provenance("soil properties", "Multiple")),
        terrain=TerrainMetrics(mean_elevation_m=profile["elevation"], slope_degrees=profile["slope"],
            slope_category="Sample terrain", terrain_ruggedness="Sample terrain", erosion_susceptibility="Unknown",
            provenance=provenance("terrain", "m, degrees")),
        environmental_alerts=[], is_demo_data=True, data_status="demo",
        data_messages=["Synthetic sample dataset: values are fictional, not NASA observations or farm measurements."],
    )
