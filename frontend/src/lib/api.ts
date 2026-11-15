import {
  CropTrait,
  DataSource,
  DecisionReport,
  EnvironmentalSummary,
  EnvironmentalTrends,
  Farm,
  RotationComparisonResponse,
  SimulationResponse,
  SystemHealth,
} from "@/types";

export const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

type BrowserCacheEntry = { expiresAt: number; value: unknown };

const browserCache = new Map<string, BrowserCacheEntry>();
const inFlightRequests = new Map<string, Promise<unknown>>();

export function clearApiCache(): void {
  browserCache.clear();
}

async function apiRequest<T>(
  path: string,
  init?: RequestInit,
  ttlMs = 5 * 60 * 1000,
): Promise<T> {
  const method = (init?.method || "GET").toUpperCase();
  const cacheKey = `${method}:${path}`;
  const isCacheable = method === "GET";
  const cached = browserCache.get(cacheKey);
  if (isCacheable && cached && cached.expiresAt > Date.now()) {
    return cached.value as T;
  }

  const existing = inFlightRequests.get(cacheKey);
  if (isCacheable && existing) {
    return existing as Promise<T>;
  }

  const request = (async () => {
    let response: Response;
    try {
      response = await fetch(`${API_BASE_URL}${path}`, { cache: "no-store", ...init });
    } catch {
      throw new Error(`FieldShift backend is unreachable at ${API_BASE_URL}. No substitute data was loaded.`);
    }
    if (!response.ok) {
      let detail = `${response.status} ${response.statusText}`;
      try {
        const body = await response.json();
        detail = body.detail || detail;
      } catch {
        // The status text remains the most truthful available error detail.
      }
      throw new Error(detail);
    }
    const value = await response.json() as T;
    if (isCacheable) {
      browserCache.set(cacheKey, { expiresAt: Date.now() + ttlMs, value });
    } else {
      clearApiCache();
    }
    return value;
  })();

  if (isCacheable) inFlightRequests.set(cacheKey, request);
  try {
    return await request;
  } finally {
    if (isCacheable) inFlightRequests.delete(cacheKey);
  }
}

export const fetchHealth = () => apiRequest<SystemHealth>("/health", undefined, 60_000);
export const fetchFarms = () => apiRequest<Farm[]>("/api/farms", undefined, 60_000);
export const fetchFarmById = (farmId: string) => apiRequest<Farm>(`/api/farms/${farmId}`, undefined, 60_000);
export const fetchEnvironmentalSummary = (farmId: string) =>
  apiRequest<EnvironmentalSummary>(`/api/farms/${farmId}/environment`);
export const fetchEnvironmentalTrends = (farmId: string) =>
  apiRequest<EnvironmentalTrends>(`/api/farms/${farmId}/environment/trends`, undefined, 15 * 60 * 1000);
export const fetchRotations = (farmId: string) =>
  apiRequest<RotationComparisonResponse>(`/api/farms/${farmId}/rotations`);
export const fetchCrops = () => apiRequest<CropTrait[]>("/api/crops");
export const fetchDataSources = () =>
  apiRequest<{ sources: DataSource[]; transparency_principles: string[] }>("/api/data-sources", undefined, 15 * 60 * 1000);
export const fetchReport = (farmId: string) =>
  apiRequest<DecisionReport>(`/api/reports/${farmId}`);

export function createFarm(farmData: Partial<Farm>): Promise<Farm> {
  return apiRequest<Farm>("/api/farms", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(farmData),
  });
}

export function generateCustomRotations(
  farmId: string,
  priority: string,
  weights?: Record<string, number>,
): Promise<RotationComparisonResponse> {
  return apiRequest<RotationComparisonResponse>(`/api/farms/${farmId}/rotations/generate`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ priority, weights }),
  });
}

export function runSimulation(payload: {
  farm_id: string;
  rainfall_change_pct: number;
  temperature_increase_c: number;
  irrigation_reduction_pct: number;
}): Promise<SimulationResponse> {
  return apiRequest<SimulationResponse>("/api/scenarios/simulate", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
}
