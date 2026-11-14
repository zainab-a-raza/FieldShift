import {
  Farm,
  EnvironmentalSummary,
  RotationComparisonResponse,
  SimulationResponse,
  CropTrait,
  DataSource,
  AuthResponse,
  AuthUser,
} from "@/types";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

async function authRequest(path: string, options: RequestInit = {}): Promise<Response> {
  return fetch(`${API_BASE_URL}/api/auth${path}`, {
    ...options,
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      ...(options.headers || {}),
    },
  });
}

export async function signIn(email: string, password: string): Promise<AuthResponse> {
  const res = await authRequest("/login", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });
  if (!res.ok) {
    const body = await res.json().catch(() => null);
    throw new Error(body?.detail || "Unable to sign in.");
  }
  return res.json();
}

export async function signUp(fullName: string, email: string, password: string): Promise<AuthResponse> {
  const res = await authRequest("/signup", {
    method: "POST",
    body: JSON.stringify({ full_name: fullName, email, password }),
  });
  if (!res.ok) {
    const body = await res.json().catch(() => null);
    throw new Error(body?.detail || "Unable to create account.");
  }
  return res.json();
}

export async function fetchCurrentUser(): Promise<AuthUser | null> {
  const res = await authRequest("/me");
  if (res.status === 401) return null;
  if (!res.ok) throw new Error("Unable to load your profile.");
  return res.json();
}

export async function signOut(): Promise<void> {
  const res = await authRequest("/logout", { method: "POST" });
  if (!res.ok) throw new Error("Unable to sign out.");
}

// Fallback demo farm when backend server is starting
const DEFAULT_FALLBACK_FARM: Farm = {
  id: "farm_kansas_01",
  name: "Salina Prairie Grain Holding",
  location_name: "Salina, Kansas, United States",
  latitude: 38.8403,
  longitude: -97.6114,
  area_hectares: 128.5,
  boundaries_geojson: {
    type: "Polygon",
    coordinates: [[
      [-97.6150, 38.8380],
      [-97.6070, 38.8380],
      [-97.6070, 38.8430],
      [-97.6150, 38.8430],
      [-97.6150, 38.8380]
    ]]
  },
  current_crop: "wheat",
  previous_crop_sequence: ["wheat", "wheat", "wheat"],
  irrigation_type: "rainfed",
  primary_priority: "water_resilience",
  created_at: "2026-01-15T08:00:00Z",
  updated_at: "2026-05-10T14:30:00Z"
};

export async function fetchFarms(): Promise<Farm[]> {
  try {
    const res = await fetch(`${API_BASE_URL}/api/farms`, { cache: "no-store" });
    if (!res.ok) throw new Error("Failed to fetch farms");
    return await res.json();
  } catch (err) {
    console.warn("Backend API unreachable, using local benchmark farms:", err);
    return [
      DEFAULT_FALLBACK_FARM,
      {
        id: "farm_punjab_02",
        name: "Green Valley Agro Research Plot",
        location_name: "Ludhiana, Punjab, India",
        latitude: 30.9010,
        longitude: 75.8573,
        area_hectares: 32.0,
        current_crop: "rice",
        previous_crop_sequence: ["rice", "wheat", "rice", "wheat"],
        irrigation_type: "groundwater_well",
        primary_priority: "soil_restoration",
        created_at: "2026-02-01T10:00:00Z",
        updated_at: "2026-05-12T09:15:00Z"
      },
      {
        id: "farm_andalusia_03",
        name: "Hacienda del Sol Olive & Field Crop",
        location_name: "Seville, Andalusia, Spain",
        latitude: 37.3891,
        longitude: -5.9845,
        area_hectares: 48.0,
        current_crop: "wheat",
        previous_crop_sequence: ["wheat", "wheat"],
        irrigation_type: "drip",
        primary_priority: "balanced",
        created_at: "2026-03-10T11:20:00Z",
        updated_at: "2026-05-14T16:00:00Z"
      }
    ];
  }
}

export async function fetchFarmById(farmId: string): Promise<Farm> {
  try {
    const res = await fetch(`${API_BASE_URL}/api/farms/${farmId}`, { cache: "no-store" });
    if (!res.ok) throw new Error("Failed to fetch farm");
    return await res.json();
  } catch {
    return DEFAULT_FALLBACK_FARM;
  }
}

export async function createFarm(farmData: Partial<Farm>): Promise<Farm> {
  const res = await fetch(`${API_BASE_URL}/api/farms`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(farmData),
  });
  if (!res.ok) throw new Error("Failed to create farm");
  return await res.json();
}

export async function fetchEnvironmentalSummary(farmId: string): Promise<EnvironmentalSummary> {
  try {
    const res = await fetch(`${API_BASE_URL}/api/farms/${farmId}/environment`, { cache: "no-store" });
    if (!res.ok) throw new Error("Failed to fetch environmental summary");
    return await res.json();
  } catch (err) {
    console.warn("Using fallback environment summary:", err);
    return {
      farm_id: farmId,
      evaluation_date: new Date().toISOString().split("T")[0],
      temperature: {
        avg_temp_c: 15.8,
        max_temp_c: 30.3,
        min_temp_c: -0.2,
        hot_days_gt_35c: 8,
        growing_degree_days: 1650.0,
        historical_anomaly_c: 1.15,
        provenance: {
          metric_id: "t2m_metrics",
          metric_name: "Agroclimatology Temperature at 2m (Demo Mode)",
          source_name: "NASA POWER (Calibrated Benchmark)",
          product_version: "POWER 2.0 Benchmark Model",
          origin_type: "numerical_model_estimate",
          spatial_resolution: "0.5 x 0.5 deg (~50km)",
          temporal_resolution: "Daily",
          units: "°C",
          quality_flag: "simulated_demo_data",
          is_missing: false,
          is_demo: true,
          processing_date: new Date().toISOString().split("T")[0]
        }
      },
      rainfall: {
        seasonal_precipitation_mm: 226.8,
        annual_precipitation_mm: 540.0,
        variability_index_pct: 38.4,
        heavy_rain_events_gt_25mm: 5,
        max_consecutive_dry_days: 26,
        rainfall_deficit_pct: 14.2,
        provenance: {
          metric_id: "precipitation_metrics",
          metric_name: "Corrected Total Precipitation (Demo Mode)",
          source_name: "NASA POWER (Calibrated Benchmark)",
          product_version: "PRECTOTCORR Benchmark Model",
          origin_type: "numerical_model_estimate",
          spatial_resolution: "0.5 x 0.5 deg (~50km)",
          temporal_resolution: "Daily",
          units: "mm",
          quality_flag: "simulated_demo_data",
          is_missing: false,
          is_demo: true,
          processing_date: new Date().toISOString().split("T")[0]
        }
      },
      soil_moisture: {
        surface_soil_moisture_m3_m3: 0.22,
        root_zone_soil_moisture_m3_m3: 0.26,
        soil_moisture_percentile: 34.0,
        anomaly_status: "Deficit (-1.4 sigma)",
        provenance: {
          metric_id: "smap_surface_rootzone_moisture",
          metric_name: "SMAP Level-3 Radiometer Global Soil Moisture (SPL3SMP_E)",
          source_name: "NASA SMAP / NSIDC DAAC",
          product_version: "Version 5 (Enhanced 9km)",
          origin_type: "direct_satellite_observation",
          spatial_resolution: "9 km x 9 km (Native gridded)",
          temporal_resolution: "Daily",
          units: "m³/m³ (Volumetric fraction)",
          quality_flag: "simulated_demo_data",
          is_missing: false,
          is_demo: true,
          processing_date: new Date().toISOString().split("T")[0]
        }
      },
      vegetation: {
        current_ndvi: 0.52,
        mean_historical_ndvi: 0.47,
        peak_season_ndvi: 0.76,
        ndvi_anomaly: 0.05,
        low_vegetation_months: ["June", "July", "November"],
        satellite_mission: "Sentinel-2A/B MSI",
        cloud_coverage_pct: 3.8,
        provenance: {
          metric_id: "sentinel2_ndvi_series",
          metric_name: "Sentinel-2 MSI Level-2A Surface Reflectance NDVI (Calibrated Profile)",
          source_name: "Copernicus Sentinel-2 / Google Earth Engine (Demo Profile)",
          product_version: "S2_SR_HARMONIZED Level-2A",
          origin_type: "satellite_derived_product",
          spatial_resolution: "10m x 10m Multispectral",
          temporal_resolution: "5-day revisit",
          units: "Unitless (-1.0 to 1.0)",
          quality_flag: "simulated_demo_data",
          is_missing: false,
          is_demo: true,
          processing_date: new Date().toISOString().split("T")[0]
        }
      },
      soil_properties: {
        organic_carbon_g_kg: 14.8,
        ph_in_h2o: 6.8,
        sand_fraction_pct: 36.0,
        silt_fraction_pct: 44.0,
        clay_fraction_pct: 20.0,
        bulk_density_cg_cm3: 132.0,
        available_water_capacity_mm_m: 145.0,
        depth_interval: "0-30 cm",
        provenance: {
          metric_id: "soil_properties_0_30cm",
          metric_name: "Digital Soil Properties (Demo Benchmark)",
          source_name: "ISRIC SoilGrids (Regional Benchmark)",
          product_version: "SoilGrids 2.0 Benchmark Profile",
          origin_type: "numerical_model_estimate",
          spatial_resolution: "250m x 250m",
          temporal_resolution: "Aggregated Baseline",
          units: "Multiple (pH, g/kg, %, cg/cm³)",
          quality_flag: "simulated_demo_data",
          is_missing: false,
          is_demo: true,
          processing_date: new Date().toISOString().split("T")[0]
        }
      },
      terrain: {
        mean_elevation_m: 365.0,
        slope_degrees: 2.4,
        slope_category: "Gently Undulating (2-5°)",
        terrain_ruggedness: "Low Ridge & Swale",
        erosion_susceptibility: "Moderate Runoff Susceptibility",
        provenance: {
          metric_id: "srtm_elevation_slope",
          metric_name: "SRTM 1 Arc-Second Digital Elevation & Slope",
          source_name: "NASA JPL / USGS EROS",
          product_version: "SRTMGL1 V003 (30m)",
          origin_type: "direct_satellite_observation",
          spatial_resolution: "1 arc-second (~30m x 30m)",
          temporal_resolution: "Static Benchmark",
          units: "Meters (Elevation), Degrees (Slope)",
          quality_flag: "optimal",
          is_missing: false,
          is_demo: false,
          processing_date: new Date().toISOString().split("T")[0]
        }
      },
      environmental_alerts: [
        {
          severity: "medium",
          title: "Root-Zone Moisture Deficit",
          message: "NASA SMAP reports surface soil moisture in the 34th percentile (Deficit -1.4 sigma). Fallow soil will rapidly dry out without organic mulch."
        }
      ],
      is_demo_data: true
    };
  }
}

export async function fetchRotations(farmId: string): Promise<RotationComparisonResponse> {
  const res = await fetch(`${API_BASE_URL}/api/farms/${farmId}/rotations`, { cache: "no-store" });
  if (!res.ok) throw new Error("Failed to fetch rotations");
  return await res.json();
}

export async function generateCustomRotations(
  farmId: string,
  priority: string,
  weights?: Record<string, number>
): Promise<RotationComparisonResponse> {
  const res = await fetch(`${API_BASE_URL}/api/farms/${farmId}/rotations/generate`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ priority, weights }),
  });
  if (!res.ok) throw new Error("Failed to generate custom rotations");
  return await res.json();
}

export async function runSimulation(payload: {
  farm_id: string;
  rainfall_change_pct: number;
  temperature_increase_c: number;
  irrigation_reduction_pct: number;
}): Promise<SimulationResponse> {
  const res = await fetch(`${API_BASE_URL}/api/scenarios/simulate`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error("Simulation failed");
  return await res.json();
}

export async function fetchCrops(): Promise<CropTrait[]> {
  const res = await fetch(`${API_BASE_URL}/api/crops`, { cache: "no-store" });
  if (!res.ok) throw new Error("Failed to fetch crops");
  return await res.json();
}

export async function fetchDataSources(): Promise<{ sources: DataSource[]; transparency_principles: string[] }> {
  const res = await fetch(`${API_BASE_URL}/api/data-sources`, { cache: "no-store" });
  if (!res.ok) throw new Error("Failed to fetch data sources");
  return await res.json();
}

export async function fetchReport(farmId: string): Promise<any> {
  const res = await fetch(`${API_BASE_URL}/api/reports/${farmId}`, { cache: "no-store" });
  if (!res.ok) throw new Error("Failed to fetch report");
  return await res.json();
}
