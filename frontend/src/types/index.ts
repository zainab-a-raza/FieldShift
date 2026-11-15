export interface ProvenanceRecord {
  metric_id: string;
  metric_name: string;
  source_name: string;
  product_version: string;
  origin_type: string;
  observation_start?: string;
  observation_end?: string;
  processing_date: string;
  spatial_resolution: string;
  temporal_resolution: string;
  units: string;
  quality_flag: string;
  is_missing: boolean;
  is_demo: boolean;
  notes?: string;
  scientific_citation?: string;
}

export interface Farm {
  id: string;
  name: string;
  location_name: string;
  latitude: number;
  longitude: number;
  area_hectares: number;
  boundaries_geojson?: {
    type: string;
    coordinates: number[][][];
  };
  current_crop: string;
  previous_crop_sequence: string[];
  irrigation_type: string;
  primary_priority: string;
  created_at: string;
  updated_at: string;
}

export interface TemperatureMetrics {
  avg_temp_c: number;
  max_temp_c: number;
  min_temp_c: number;
  hot_days_gt_35c: number;
  growing_degree_days: number;
  historical_anomaly_c: number | null;
  provenance: ProvenanceRecord;
}

export interface RainfallMetrics {
  seasonal_precipitation_mm: number;
  annual_precipitation_mm: number;
  variability_index_pct: number;
  heavy_rain_events_gt_25mm: number;
  max_consecutive_dry_days: number;
  rainfall_deficit_pct: number | null;
  provenance: ProvenanceRecord;
}

export interface SoilMoistureMetrics {
  surface_soil_moisture_m3_m3: number;
  root_zone_soil_moisture_m3_m3: number | null;
  soil_moisture_percentile: number | null;
  anomaly_status: string;
  provenance: ProvenanceRecord;
}

export interface VegetationMetrics {
  current_ndvi: number;
  mean_historical_ndvi: number;
  peak_season_ndvi: number;
  ndvi_anomaly: number;
  low_vegetation_months: string[];
  satellite_mission: string;
  cloud_coverage_pct: number;
  provenance: ProvenanceRecord;
}

export interface SoilPropertiesMetrics {
  organic_carbon_g_kg: number;
  ph_in_h2o: number;
  sand_fraction_pct: number;
  silt_fraction_pct: number;
  clay_fraction_pct: number;
  bulk_density_cg_cm3: number;
  available_water_capacity_mm_m: number;
  depth_interval: string;
  provenance: ProvenanceRecord;
}

export interface TerrainMetrics {
  mean_elevation_m: number;
  slope_degrees: number;
  slope_category: string;
  terrain_ruggedness: string;
  erosion_susceptibility: string;
  provenance: ProvenanceRecord;
}

export interface EnvironmentalAlert {
  severity: "high" | "medium" | "low" | "info";
  title: string;
  message: string;
}

export interface EnvironmentalSummary {
  farm_id: string;
  evaluation_date: string;
  temperature: TemperatureMetrics;
  rainfall: RainfallMetrics;
  soil_moisture: SoilMoistureMetrics;
  vegetation: VegetationMetrics;
  soil_properties: SoilPropertiesMetrics;
  terrain: TerrainMetrics;
  environmental_alerts: EnvironmentalAlert[];
  is_demo_data: boolean;
  data_status: "live" | "mixed" | "demo";
  data_messages: string[];
}

export interface SeasonalTrend {
  season: string;
  rainfall_mm: number;
  normal_rainfall_mm: number;
  rainfall_anomaly_pct: number | null;
  avg_temperature_c: number;
  normal_temperature_c: number;
}

export interface EnvironmentalTrends {
  farm_id: string;
  daily_weather_series: {
    dates?: string[];
    t2m?: number[];
    precipitation?: number[];
  };
  historical_seasonal_comparison: SeasonalTrend[];
  status: "live" | "demo_unavailable" | "upstream_error";
  is_demo: boolean;
  message: string;
  metadata: {
    source: string;
    baseline_period?: string | null;
    granularity: string;
  };
}

export interface SystemHealth {
  status: string;
  service: string;
  data_mode: "demo" | "live_with_fallbacks";
  demo_mode: boolean;
  earthdata_configured: boolean;
  earthdata_live_enabled: boolean;
  gee_configured: boolean;
  gee_live_enabled: boolean;
  connectors: Record<string, string>;
  configuration_note: string;
}

export interface SeasonCropSlot {
  year_index: number;
  season_name: string;
  crop_id: string;
  crop_name: string;
  crop_family: string;
  duration_days: number;
  water_demand_mm: number;
  nitrogen_fixation_kg_ha: number;
  erosion_cover: string;
  soil_role: string;
}

export interface CriteriaScores {
  water_resilience: number;
  climate_suitability: number;
  soil_improvement: number;
  erosion_protection: number;
  crop_diversity: number;
  market_suitability: number;
}

export interface RotationStrategy {
  strategy_id: string;
  strategy_type: "baseline" | "soil_restoration" | "water_resilience" | "ga_optimized";
  title: string;
  summary: string;
  crop_sequence: SeasonCropSlot[];
  overall_score: number;
  criteria_scores: CriteriaScores;
  reasons_for_recommendation: string[];
  environmental_evidence: string[];
  potential_benefits: string[];
  potential_risks: string[];
  missing_data_warnings: string[];
  data_confidence_score: number;
  optimization_method: string;
}

export interface RotationComparisonResponse {
  farm_id: string;
  farm_name: string;
  recommended_strategy_id: string;
  criteria_weights: Record<string, number>;
  strategies: RotationStrategy[];
  comparison_notes: string;
  generated_at: string;
}

export interface SimulatedStrategyResult {
  strategy_id: string;
  strategy_title: string;
  original_overall_score: number;
  simulated_overall_score: number;
  score_delta: number;
  original_water_score: number;
  simulated_water_score: number;
  climate_stress_vulnerability: string;
  key_failure_points: string[];
  mitigating_factors: string[];
}

export interface SimulationResponse {
  farm_id: string;
  scenario_parameters: {
    rainfall_change_pct: number;
    temperature_increase_c: number;
    irrigation_reduction_pct: number;
  };
  is_hypothetical_disclaimer: string;
  results: SimulatedStrategyResult[];
  resilience_winner_strategy_id: string;
  simulation_insights: string[];
}

export interface CropTrait {
  id: string;
  name: string;
  family: string;
  category: string;
  temp_min: number;
  temp_max: number;
  temp_optimal_min: number;
  temp_optimal_max: number;
  water_requirement_mm: number;
  water_category: string;
  heat_tolerance: string;
  drought_tolerance: string;
  root_depth_category: string;
  root_depth_cm: number;
  nitrogen_fixing: boolean;
  nitrogen_fixation_kg_ha: number;
  growing_duration_days: number;
  growing_season: string;
  soil_ph_min: number;
  soil_ph_max: number;
  preferred_texture: string[];
  soil_organic_matter_demand: string;
  soil_improvement_contribution: string;
  erosion_protection: string;
  market_liquidity: string;
  local_suitability_notes: string;
  data_source: string;
  source_confidence: number;
}

export interface DataSource {
  id: string;
  name: string;
  agency: string;
  product_name: string;
  resolution: string;
  cadence: string;
  status: string;
  description: string;
  documentation_url: string;
}

export interface ReportCitation {
  metric: string;
  source: string;
  product: string;
  quality_flag: string;
  is_demo: boolean;
  citation?: string | null;
  details: string;
}

export interface DecisionReport {
  report_id: string;
  generated_at: string;
  report_status: "live" | "mixed" | "demo";
  data_messages: string[];
  decision_support_disclaimer: string;
  farm_profile: Record<string, string | number>;
  environmental_diagnostics: Record<string, unknown>;
  rotation_recommendations: {
    recommended_strategy_title: string;
    recommended_score: number;
    recommended_summary: string;
    recommended_reasons: string[];
    missing_data_warnings: string[];
    strategies_overview: Array<{
      title: string;
      overall_score: number;
      crop_sequence: string[];
      water_resilience: number;
      soil_improvement: number;
      market_suitability: number;
    }>;
  };
  scientific_provenance_citations: ReportCitation[];
}
