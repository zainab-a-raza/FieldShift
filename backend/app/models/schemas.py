"""
Pydantic Schemas for FieldShift API.
"""
from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any
from datetime import datetime
from app.provenance.tracker import ProvenanceRecord, MetricProvenance

# --- Authentication Schemas ---

class SignUpRequest(BaseModel):
    full_name: str = Field(..., min_length=2, max_length=100)
    email: str = Field(..., min_length=5, max_length=254)
    password: str = Field(..., min_length=8, max_length=128)

class LoginRequest(BaseModel):
    email: str = Field(..., min_length=5, max_length=254)
    password: str = Field(..., min_length=1, max_length=128)

class UserResponse(BaseModel):
    id: str
    full_name: str
    email: str

class AuthResponse(BaseModel):
    user: UserResponse

# --- Farm Schemas ---

class FarmBase(BaseModel):
    name: str = Field(..., description="Name of the farm / holding")
    location_name: str = Field(..., description="Geographic location name (e.g., Salina, Kansas, USA)")
    latitude: float = Field(..., ge=-90.0, le=90.0, description="Latitude in decimal degrees")
    longitude: float = Field(..., ge=-180.0, le=180.0, description="Longitude in decimal degrees")
    area_hectares: float = Field(..., gt=0, description="Farm total area in hectares")
    boundaries_geojson: Optional[Dict[str, Any]] = Field(None, description="GeoJSON Feature or Polygon")
    current_crop: str = Field(..., description="Currently planted crop")
    previous_crop_sequence: List[str] = Field(default_factory=list, description="Historical crop sequence, e.g. ['wheat', 'fallow', 'wheat']")
    irrigation_type: str = Field("rainfed", description="Irrigation status: rainfed, drip, sprinkler, flood, groundwater_well")
    primary_priority: str = Field("balanced", description="Farmer priority: balanced, water_resilience, soil_restoration, profit_maximization")

class FarmCreate(FarmBase):
    pass

class FarmUpdate(BaseModel):
    name: Optional[str] = None
    location_name: Optional[str] = None
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    area_hectares: Optional[float] = None
    boundaries_geojson: Optional[Dict[str, Any]] = None
    current_crop: Optional[str] = None
    previous_crop_sequence: Optional[List[str]] = None
    irrigation_type: Optional[str] = None
    primary_priority: Optional[str] = None

class FarmResponse(FarmBase):
    id: str
    created_at: str
    updated_at: str

# --- Crop Schemas ---

class CropTrait(BaseModel):
    id: str
    name: str
    family: str
    category: str
    temp_min: float
    temp_max: float
    temp_optimal_min: float
    temp_optimal_max: float
    water_requirement_mm: float
    water_category: str
    heat_tolerance: str
    drought_tolerance: str
    root_depth_category: str
    root_depth_cm: float
    nitrogen_fixing: bool
    nitrogen_fixation_kg_ha: float
    growing_duration_days: int
    growing_season: str
    soil_ph_min: float
    soil_ph_max: float
    preferred_texture: List[str]
    soil_organic_matter_demand: str
    soil_improvement_contribution: str
    erosion_protection: str
    market_liquidity: str
    local_suitability_notes: str
    data_source: str
    source_confidence: float

# --- Environmental & Sensor Schemas ---

class TemperatureMetrics(BaseModel):
    avg_temp_c: float
    max_temp_c: float
    min_temp_c: float
    hot_days_gt_35c: int
    growing_degree_days: float
    historical_anomaly_c: float
    provenance: ProvenanceRecord

class RainfallMetrics(BaseModel):
    seasonal_precipitation_mm: float
    annual_precipitation_mm: float
    variability_index_pct: float
    heavy_rain_events_gt_25mm: int
    max_consecutive_dry_days: int
    rainfall_deficit_pct: float
    provenance: ProvenanceRecord

class SoilMoistureMetrics(BaseModel):
    surface_soil_moisture_m3_m3: float  # SMAP surface volumetric moisture 0-5cm
    root_zone_soil_moisture_m3_m3: float # 0-100cm
    soil_moisture_percentile: float     # historical percentile 0-100%
    anomaly_status: str                 # "Deficit (-1.8 sigma)", "Normal", "Surplus"
    provenance: ProvenanceRecord

class VegetationMetrics(BaseModel):
    current_ndvi: float
    mean_historical_ndvi: float
    peak_season_ndvi: float
    ndvi_anomaly: float
    low_vegetation_months: List[str]
    satellite_mission: str
    cloud_coverage_pct: float
    provenance: ProvenanceRecord

class SoilPropertiesMetrics(BaseModel):
    organic_carbon_g_kg: float
    ph_in_h2o: float
    sand_fraction_pct: float
    silt_fraction_pct: float
    clay_fraction_pct: float
    bulk_density_cg_cm3: float
    available_water_capacity_mm_m: float
    depth_interval: str
    provenance: ProvenanceRecord

class TerrainMetrics(BaseModel):
    mean_elevation_m: float
    slope_degrees: float
    slope_category: str
    terrain_ruggedness: str
    erosion_susceptibility: str
    provenance: ProvenanceRecord

class EnvironmentalSummary(BaseModel):
    farm_id: str
    evaluation_date: str
    temperature: TemperatureMetrics
    rainfall: RainfallMetrics
    soil_moisture: SoilMoistureMetrics
    vegetation: VegetationMetrics
    soil_properties: SoilPropertiesMetrics
    terrain: TerrainMetrics
    environmental_alerts: List[Dict[str, Any]]
    is_demo_data: bool

# --- Recommendation Schemas ---

class SeasonCropSlot(BaseModel):
    year_index: int
    season_name: str
    crop_id: str
    crop_name: str
    crop_family: str
    duration_days: int
    water_demand_mm: float
    nitrogen_fixation_kg_ha: float
    erosion_cover: str
    soil_role: str

class CriteriaScores(BaseModel):
    water_resilience: float = Field(..., ge=0, le=100)
    climate_suitability: float = Field(..., ge=0, le=100)
    soil_improvement: float = Field(..., ge=0, le=100)
    erosion_protection: float = Field(..., ge=0, le=100)
    crop_diversity: float = Field(..., ge=0, le=100)
    market_suitability: float = Field(..., ge=0, le=100)

class RotationStrategy(BaseModel):
    strategy_id: str
    strategy_type: str # "baseline", "soil_restoration", "water_resilience", "ga_optimized"
    title: str
    summary: str
    crop_sequence: List[SeasonCropSlot]
    overall_score: float = Field(..., ge=0, le=100)
    criteria_scores: CriteriaScores
    reasons_for_recommendation: List[str]
    environmental_evidence: List[str]
    potential_benefits: List[str]
    potential_risks: List[str]
    missing_data_warnings: List[str]
    data_confidence_score: float # 0.0 - 1.0
    optimization_method: str = "MCDA (Multi-Criteria Decision Analysis)"

class RotationComparisonResponse(BaseModel):
    farm_id: str
    farm_name: str
    recommended_strategy_id: str
    criteria_weights: Dict[str, float]
    strategies: List[RotationStrategy]
    comparison_notes: str
    generated_at: str

# --- Simulation Schemas ---

class SimulationRequest(BaseModel):
    farm_id: str
    rainfall_change_pct: float = Field(0.0, ge=-50.0, le=50.0, description="Percentage change in annual/seasonal rainfall, e.g. -25%")
    temperature_increase_c: float = Field(0.0, ge=0.0, le=5.0, description="Temperature rise in degrees Celsius, e.g. +2.5°C")
    irrigation_reduction_pct: float = Field(0.0, ge=-100.0, le=0.0, description="Reduction in irrigation water access, e.g. -40%")
    strategies_to_simulate: Optional[List[str]] = None

class SimulatedStrategyResult(BaseModel):
    strategy_id: str
    strategy_title: str
    original_overall_score: float
    simulated_overall_score: float
    score_delta: float
    original_water_score: float
    simulated_water_score: float
    climate_stress_vulnerability: str
    key_failure_points: List[str]
    mitigating_factors: List[str]

class SimulationResponse(BaseModel):
    farm_id: str
    scenario_parameters: Dict[str, float]
    is_hypothetical_disclaimer: str = "Hypothetical sensitivity analysis only. Not an official localized scientific climate projection."
    results: List[SimulatedStrategyResult]
    resilience_winner_strategy_id: str
    simulation_insights: List[str]

# --- Genetic Algorithm Schemas ---

class GeneticOptimizerRequest(BaseModel):
    farm_id: str
    number_of_years: int = Field(3, ge=1, le=5)
    seasons_per_year: int = Field(2, ge=1, le=3)
    population_size: int = Field(50, ge=20, le=200)
    generations: int = Field(40, ge=10, le=150)
    mutation_rate: float = Field(0.15, ge=0.01, le=0.5)
    enforce_legume_every_n_seasons: int = Field(2, ge=1, le=4)
    forbid_consecutive_same_family: bool = True

class GeneticOptimizerResponse(BaseModel):
    optimized_strategy: RotationStrategy
    generation_history: List[Dict[str, Any]]
    convergence_generation: int
    algorithm_summary: str
