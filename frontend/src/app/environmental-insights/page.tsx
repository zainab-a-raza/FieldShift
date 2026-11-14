"use client";

import React, { useEffect, useState } from "react";
import { useFarm } from "@/context/FarmContext";
import { fetchEnvironmentalSummary } from "@/lib/api";
import { EnvironmentalSummary } from "@/types";
import { ProvenanceCard } from "@/components/ProvenanceCard";
import {
  Thermometer,
  CloudRain,
  Droplets,
  Sprout,
  Mountain,
  Satellite,
  Compass,
  TrendingUp,
  AlertCircle,
  Layers,
  History,
} from "lucide-react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  Legend,
} from "recharts";

export default function EnvironmentalInsightsPage() {
  const { selectedFarm } = useFarm();
  const [env, setEnv] = useState<EnvironmentalSummary | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!selectedFarm) return;
    setLoading(true);
    fetchEnvironmentalSummary(selectedFarm.id)
      .then(setEnv)
      .finally(() => setLoading(false));
  }, [selectedFarm]);

  if (loading || !env || !selectedFarm) {
    return (
      <div className="py-20 flex flex-col items-center justify-center space-y-4">
        <div className="w-10 h-10 border-4 border-[#39734C] border-t-transparent rounded-full animate-spin"></div>
        <p className="text-sm font-semibold text-[#617367]">
          Retrieving Multi-Mission NASA Observations...
        </p>
      </div>
    );
  }

  // 4-Season Historical Anomaly Data (2023 - 2026)
  const seasonalComparison = [
    { season: "Kharif 2023", rainfall: 410, normalRain: 440, temp: 28.2, normalTemp: 27.5, soilMoisture: 28 },
    { season: "Rabi 2023-24", rainfall: 115, normalRain: 120, temp: 16.5, normalTemp: 16.0, soilMoisture: 24 },
    { season: "Kharif 2024", rainfall: 340, normalRain: 440, temp: 29.8, normalTemp: 27.5, soilMoisture: 21 },
    { season: "Rabi 2024-25", rainfall: 95, normalRain: 120, temp: 17.8, normalTemp: 16.0, soilMoisture: 20 },
    { season: "Kharif 2025", rainfall: 310, normalRain: 440, temp: 30.5, normalTemp: 27.5, soilMoisture: 19 },
    { season: "Rabi 2025-26", rainfall: 88, normalRain: 120, temp: 18.2, normalTemp: 16.0, soilMoisture: 18 },
  ];

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2 mb-1">
          <span className="text-xs font-bold uppercase tracking-wider text-[#39734C] bg-[#EAF4ED] px-2.5 py-0.5 rounded-full">
            Earth Observation Diagnostics
          </span>
          <span className="text-xs text-[#617367]">Holding: {selectedFarm.name}</span>
        </div>
        <h2 className="text-2xl lg:text-3xl font-extrabold text-[#183D2C] tracking-tight font-serif">
          Environmental Insights & Satellite Observations
        </h2>
        <p className="text-xs text-[#617367] mt-1 max-w-3xl">
          Multi-sensor analysis integrating NASA POWER daily agrometeorology, NASA SMAP soil moisture radiometry,
          Copernicus Sentinel-2 surface reflectance, and ISRIC SoilGrids pedometrics.
        </p>
      </div>

      {/* Grid of All Core NASA & Earth Metrics with Provenance Metadata */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
        <ProvenanceCard
          title="Air Temperature (2m)"
          value={`${env.temperature.avg_temp_c}°`}
          unit="C"
          subtitle={`Extreme Max ${env.temperature.max_temp_c}°C • Min ${env.temperature.min_temp_c}°C`}
          provenance={env.temperature.provenance}
          trendText={`${env.temperature.hot_days_gt_35c} days ≥35°C (Heat Stress)`}
          isPositiveTrend={env.temperature.hot_days_gt_35c < 10}
        />

        <ProvenanceCard
          title="Total Precipitation"
          value={Math.round(env.rainfall.annual_precipitation_mm)}
          unit="mm / yr"
          subtitle={`Seasonal ${Math.round(env.rainfall.seasonal_precipitation_mm)}mm • ${env.rainfall.heavy_rain_events_gt_25mm} heavy rain bursts (>25mm)`}
          provenance={env.rainfall.provenance}
          trendText={`Deficit: ${env.rainfall.rainfall_deficit_pct}%`}
          isPositiveTrend={env.rainfall.rainfall_deficit_pct <= 10}
        />

        <ProvenanceCard
          title="Soil Moisture (SMAP 9km)"
          value={env.soil_moisture.surface_soil_moisture_m3_m3.toFixed(2)}
          unit="m³/m³"
          subtitle={`Root-zone: ${env.soil_moisture.root_zone_soil_moisture_m3_m3.toFixed(2)} m³/m³ • Radiometric L-band 0-5cm`}
          provenance={env.soil_moisture.provenance}
          trendText={env.soil_moisture.anomaly_status}
          isPositiveTrend={!env.soil_moisture.anomaly_status.includes("Deficit")}
        />

        <ProvenanceCard
          title="Vegetation Index (NDVI)"
          value={env.vegetation.current_ndvi.toFixed(2)}
          unit="NDVI"
          subtitle={`Historical Mean: ${env.vegetation.mean_historical_ndvi} • Peak Vigour: ${env.vegetation.peak_season_ndvi}`}
          provenance={env.vegetation.provenance}
          trendText={`Anomaly: ${env.vegetation.ndvi_anomaly > 0 ? "+" : ""}${env.vegetation.ndvi_anomaly}`}
          isPositiveTrend={env.vegetation.ndvi_anomaly >= 0}
        />

        <ProvenanceCard
          title="Soil Organic Carbon"
          value={env.soil_properties.organic_carbon_g_kg}
          unit="g / kg"
          subtitle={`pH: ${env.soil_properties.ph_in_h2o} • Available Water: ${env.soil_properties.available_water_capacity_mm_m} mm/m`}
          provenance={env.soil_properties.provenance}
          trendText={`Bulk Density: ${env.soil_properties.bulk_density_cg_cm3} cg/cm³`}
          isPositiveTrend={env.soil_properties.organic_carbon_g_kg > 12.0}
        />

        <ProvenanceCard
          title="Topographic Slope & Erosion"
          value={env.terrain.slope_degrees}
          unit="Degrees"
          subtitle={`Elevation: ${env.terrain.mean_elevation_m}m • Category: ${env.terrain.slope_category}`}
          provenance={env.terrain.provenance}
          trendText={env.terrain.erosion_susceptibility}
          isPositiveTrend={env.terrain.slope_degrees < 4.0}
        />
      </div>

      {/* Multi-Year Seasonal Rainfall & Temperature Historical Comparison */}
      <div className="bg-[#FFFFFF] rounded-2xl p-6 border border-[#E8E2D2] shadow-xs space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 className="text-base font-bold text-[#183D2C] flex items-center gap-2">
              <History className="w-4 h-4 text-[#39734C]" />
              Multi-Year Seasonal Rainfall vs 30-Year Climatological Normal
            </h3>
            <p className="text-xs text-[#617367]">
              Observed seasonal precipitation (mm) against historical baseline showing drying anomalies
            </p>
          </div>
          <div className="flex items-center gap-4 text-xs">
            <span className="flex items-center gap-1.5 font-medium">
              <span className="w-3 h-3 rounded-md bg-[#39734C]"></span>
              Observed Rainfall (mm)
            </span>
            <span className="flex items-center gap-1.5 font-medium">
              <span className="w-3 h-3 rounded-md bg-[#DDD6C3]"></span>
              Historical Normal (mm)
            </span>
          </div>
        </div>

        <div className="h-72 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={seasonalComparison}>
              <CartesianGrid strokeDasharray="3 3" stroke="#F0EDE4" />
              <XAxis dataKey="season" stroke="#617367" fontSize={11} />
              <YAxis stroke="#617367" fontSize={11} />
              <Tooltip
                contentStyle={{
                  backgroundColor: "#FFFFFF",
                  borderColor: "#DDD6C3",
                  borderRadius: "12px",
                  fontSize: "12px",
                }}
              />
              <Bar dataKey="rainfall" fill="#39734C" radius={[6, 6, 0, 0]} name="Observed Rainfall (mm)" />
              <Bar dataKey="normalRain" fill="#DDD6C3" radius={[6, 6, 0, 0]} name="Normal Baseline (mm)" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Analytical takeaway alert */}
        <div className="p-4 rounded-xl bg-[#F8F8F3] border border-[#DDD6C3] text-xs text-[#26352C] leading-relaxed flex items-start gap-3">
          <AlertCircle className="w-4 h-4 text-[#39734C] shrink-0 mt-0.5" />
          <div>
            <span className="font-bold">Agroclimatic Trend Analysis:</span> Seasonal rainfall over Kharif 2024 and 2025 exhibits a 22-29% precipitation deficit below the long-term normal. Maximum consecutive dry days have expanded from 16 to 26 days. This empirical shift underscores the vulnerability of continuing high-water cereal monocultures without rotation diversification.
          </div>
        </div>
      </div>

      {/* Soil Texture & Profile Distribution */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-[#FFFFFF] rounded-2xl p-6 border border-[#E8E2D2] shadow-xs space-y-4">
          <h3 className="text-sm font-bold text-[#183D2C] uppercase tracking-wider flex items-center gap-2">
            <Sprout className="w-4 h-4 text-[#39734C]" />
            ISRIC Soil Texture Fractions (0-30cm Horizon)
          </h3>
          <div className="space-y-3">
            <div>
              <div className="flex justify-between text-xs font-semibold mb-1">
                <span>Sand Fraction</span>
                <span>{env.soil_properties.sand_fraction_pct}%</span>
              </div>
              <div className="w-full h-2.5 rounded-full bg-[#F0EDE4] overflow-hidden">
                <div
                  className="h-full bg-[#E8A555] rounded-full"
                  style={{ width: `${env.soil_properties.sand_fraction_pct}%` }}
                ></div>
              </div>
            </div>

            <div>
              <div className="flex justify-between text-xs font-semibold mb-1">
                <span>Silt Fraction</span>
                <span>{env.soil_properties.silt_fraction_pct}%</span>
              </div>
              <div className="w-full h-2.5 rounded-full bg-[#F0EDE4] overflow-hidden">
                <div
                  className="h-full bg-[#9DBB78] rounded-full"
                  style={{ width: `${env.soil_properties.silt_fraction_pct}%` }}
                ></div>
              </div>
            </div>

            <div>
              <div className="flex justify-between text-xs font-semibold mb-1">
                <span>Clay Fraction</span>
                <span>{env.soil_properties.clay_fraction_pct}%</span>
              </div>
              <div className="w-full h-2.5 rounded-full bg-[#F0EDE4] overflow-hidden">
                <div
                  className="h-full bg-[#39734C] rounded-full"
                  style={{ width: `${env.soil_properties.clay_fraction_pct}%` }}
                ></div>
              </div>
            </div>
          </div>
          <p className="text-[11px] text-[#617367] leading-relaxed pt-2 border-t border-[#F0EDE4]">
            Pedological classification: <strong>Loam / Silt Loam</strong>. High water retention potential (145 mm/m) but vulnerable to surface crusting under heavy raindrop impact during early spring fallow.
          </p>
        </div>

        <div className="bg-[#FFFFFF] rounded-2xl p-6 border border-[#E8E2D2] shadow-xs space-y-4">
          <h3 className="text-sm font-bold text-[#183D2C] uppercase tracking-wider flex items-center gap-2">
            <Mountain className="w-4 h-4 text-[#39734C]" />
            Topographic Relief & Catchment Vulnerability
          </h3>
          <div className="grid grid-cols-2 gap-4 text-xs">
            <div className="p-3.5 rounded-xl bg-[#F8F8F3] border border-[#DDD6C3]">
              <span className="text-[#617367] block text-[11px]">Mean Elevation:</span>
              <strong className="text-base text-[#183D2C]">{env.terrain.mean_elevation_m} meters</strong>
              <span className="text-[10px] text-[#617367] block mt-0.5">SRTMGL1 (30m)</span>
            </div>
            <div className="p-3.5 rounded-xl bg-[#F8F8F3] border border-[#DDD6C3]">
              <span className="text-[#617367] block text-[11px]">Slope Gradient:</span>
              <strong className="text-base text-[#183D2C]">{env.terrain.slope_degrees}°</strong>
              <span className="text-[10px] text-[#617367] block mt-0.5">{env.terrain.slope_category}</span>
            </div>
          </div>
          <p className="text-[11px] text-[#617367] leading-relaxed pt-2 border-t border-[#F0EDE4]">
            Topographical erosion susceptibility: <strong>{env.terrain.erosion_susceptibility}</strong>. The gentle undulating slope creates localized swales where runoff concentrates during intense convective rain bursts. Maintaining continuous crop or residue canopy is essential to eliminate rill formation.
          </p>
        </div>
      </div>
    </div>
  );
}
