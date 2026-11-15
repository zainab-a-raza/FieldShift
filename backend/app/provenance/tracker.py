"""
Data Provenance and Quality Tracking System for FieldShift.
Tracks origin, resolution, confidence, observation dates, and processing lineage.
"""
from enum import Enum
from typing import Optional, Dict, Any, List
from pydantic import BaseModel, Field
from datetime import datetime, timezone

class DataOriginType(str, Enum):
    DIRECT_SATELLITE = "direct_satellite_observation"
    SATELLITE_DERIVED = "satellite_derived_product"
    MODEL_ESTIMATE = "numerical_model_estimate"
    FARMER_ENTERED = "farmer_entered_information"
    CALCULATED_INDICATOR = "calculated_indicator"

class DataQualityFlag(str, Enum):
    OPTIMAL = "optimal"
    ESTIMATED = "estimated"
    PARTIAL_CLOUD = "partial_cloud_coverage"
    INTERPOLATED = "interpolated"
    SIMULATED_DEMO = "simulated_demo_data"
    UNKNOWN = "unknown"

class ProvenanceRecord(BaseModel):
    metric_id: str
    metric_name: str
    source_name: str  # e.g., "NASA POWER", "ISRIC SoilGrids", "NASA SMAP", "NASA GPM IMERG", "Sentinel-2 MSI"
    product_version: str  # e.g., "POWER Release 2.0.0", "SoilGrids 2.0 (250m)", "GPM_3IMERGDF V07"
    origin_type: DataOriginType
    observation_start: Optional[str] = None
    observation_end: Optional[str] = None
    processing_date: str = Field(default_factory=lambda: datetime.now(timezone.utc).strftime("%Y-%m-%d"))
    spatial_resolution: str  # e.g., "0.5 x 0.5 deg (~50km)", "250m", "10m", "0.1 x 0.1 deg (~10km)"
    temporal_resolution: str = "Daily"
    units: str
    quality_flag: DataQualityFlag = DataQualityFlag.OPTIMAL
    is_missing: bool = False
    is_demo: bool = False
    notes: Optional[str] = None
    scientific_citation: Optional[str] = None

class MetricProvenance(BaseModel):
    value: Optional[float] = None
    unit: str
    provenance: ProvenanceRecord

def create_provenance(
    metric_id: str,
    metric_name: str,
    source_name: str,
    product_version: str,
    origin_type: DataOriginType,
    spatial_resolution: str,
    units: str,
    temporal_resolution: str = "Daily",
    observation_start: Optional[str] = None,
    observation_end: Optional[str] = None,
    quality_flag: DataQualityFlag = DataQualityFlag.OPTIMAL,
    is_demo: bool = False,
    is_missing: bool = False,
    notes: Optional[str] = None,
    citation: Optional[str] = None,
) -> ProvenanceRecord:
    return ProvenanceRecord(
        metric_id=metric_id,
        metric_name=metric_name,
        source_name=source_name,
        product_version=product_version,
        origin_type=origin_type,
        spatial_resolution=spatial_resolution,
        units=units,
        temporal_resolution=temporal_resolution,
        observation_start=observation_start,
        observation_end=observation_end,
        quality_flag=DataQualityFlag.SIMULATED_DEMO if is_demo else quality_flag,
        is_missing=is_missing,
        is_demo=is_demo,
        notes=notes,
        scientific_citation=citation
    )
