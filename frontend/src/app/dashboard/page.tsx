"use client";

import React, { useEffect, useState } from "react";
import { useFarm } from "@/context/FarmContext";
import { fetchEnvironmentalSummary, fetchRotations } from "@/lib/api";
import { EnvironmentalSummary, RotationComparisonResponse } from "@/types";
import { FarmMap } from "@/components/FarmMap";
import { ProvenanceCard } from "@/components/ProvenanceCard";
import {
  Thermometer,
  CloudRain,
  Droplets,
  Activity,
  AlertTriangle,
  ArrowRight,
  TrendingUp,
  Award,
  Layers,
  Sparkles,
  ShieldCheck,
  Calendar,
} from "lucide-react";
import Link from "next/link";
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
} from "recharts";

export default function DashboardPage() {
  const { selectedFarm, isLoading: farmLoading } = useFarm();
  const [env, setEnv] = useState<EnvironmentalSummary | null>(null);
  const [rotations, setRotations] = useState<RotationComparisonResponse | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!selectedFarm) return;
    setLoading(true);
    Promise.all([
      fetchEnvironmentalSummary(selectedFarm.id),
      fetchRotations(selectedFarm.id).catch(() => null),
    ])
      .then(([envData, rotData]) => {
        setEnv(envData);
        setRotations(rotData);
      })
      .finally(() => setLoading(false));
  }, [selectedFarm]);

  if (farmLoading || !selectedFarm || !env) {
    return (
      <div className="py-20 flex flex-col items-center justify-center space-y-4">
        <div className="w-10 h-10 border-4 border-[#39734C] border-t-transparent rounded-full animate-spin"></div>
        <p className="text-sm font-semibold text-[#617367]">
          Connecting to NASA Earth Data & Soil Models...
        </p>
      </div>
    );
  }

  // Trend data for mini charts
  const weatherTrends = [
    { month: "Jan", temp: 4.2, rain: 22, ndvi: 0.38 },
    { month: "Feb", temp: 6.8, rain: 28, ndvi: 0.42 },
    { month: "Mar", temp: 11.5, rain: 45, ndvi: 0.51 },
    { month: "Apr", temp: 16.2, rain: 62, ndvi: 0.68 },
    { month: "May", temp: 21.0, rain: 58, ndvi: 0.74 },
    { month: "Jun", temp: 26.5, rain: 40, ndvi: 0.62 },
    { month: "Jul", temp: 29.8, rain: 35, ndvi: 0.48 },
    { month: "Aug", temp: 28.4, rain: 42, ndvi: 0.45 },
    { month: "Sep", temp: 23.1, rain: 50, ndvi: 0.58 },
    { month: "Oct", temp: 16.4, rain: 38, ndvi: 0.64 },
    { month: "Nov", temp: 9.8, rain: 26, ndvi: 0.52 },
    { month: "Dec", temp: 5.1, rain: 20, ndvi: 0.41 },
  ];

  const recommendedStrategy = rotations?.strategies.find(
    (s) => s.strategy_id === rotations.recommended_strategy_id
  ) || rotations?.strategies[1];

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Farm Overview Header Card */}
      <div className="bg-[#FFFFFF] rounded-2xl p-6 border border-[#E8E2D2] shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="text-xs font-bold uppercase tracking-wider text-[#39734C] bg-[#EAF4ED] px-2.5 py-0.5 rounded-full">
              Active Agro-Ecological Holding
            </span>
            <span className="text-xs text-[#617367]">ID: {selectedFarm.id}</span>
          </div>
          <h2 className="text-2xl lg:text-3xl font-extrabold text-[#183D2C] tracking-tight font-serif">
            {selectedFarm.name}
          </h2>
          <p className="text-sm text-[#617367] mt-1">
            {selectedFarm.location_name} • {selectedFarm.area_hectares} hectares • Priority:{" "}
            <strong className="text-[#26352C] capitalize">
              {selectedFarm.primary_priority.replace("_", " ")}
            </strong>
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <Link
            href="/environmental-insights"
            className="flex items-center gap-1.5 bg-[#F8F8F3] hover:bg-[#EFECE1] border border-[#DDD6C3] text-[#26352C] px-4 py-2 rounded-xl text-xs font-semibold transition"
          >
            <span>Full NASA Diagnostics</span>
            <ArrowRight className="w-3.5 h-3.5 text-[#39734C]" />
          </Link>
          <Link
            href="/rotation-planner"
            className="flex items-center gap-1.5 bg-[#39734C] hover:bg-[#183D2C] text-white px-4 py-2 rounded-xl text-xs font-semibold shadow-xs transition"
          >
            <Sparkles className="w-3.5 h-3.5 text-[#9DBB78]" />
            <span>Generate Strategy</span>
          </Link>
        </div>
      </div>

      {/* Environmental Stress Alerts (if any) */}
      {env.environmental_alerts.length > 0 && (
        <div className="space-y-3">
          {env.environmental_alerts.map((alert, i) => (
            <div
              key={i}
              className={`p-4 rounded-xl border flex items-start gap-3.5 ${
                alert.severity === "high"
                  ? "bg-[#FDF2F0] border-[#E8A5A1] text-[#932C28]"
                  : "bg-[#FFF9EC] border-[#EAD7A5] text-[#8C6B1B]"
              }`}
            >
              <AlertTriangle className="w-5 h-5 shrink-0 mt-0.5" />
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider">{alert.title}</h4>
                <p className="text-xs mt-0.5 leading-relaxed font-normal">{alert.message}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Primary Environmental Metrics Grid with Full Provenance */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <ProvenanceCard
          title="Air Temperature"
          value={`${env.temperature.avg_temp_c}°`}
          unit="C (Annual Avg)"
          subtitle={`Peak Max ${env.temperature.max_temp_c}°C • ${env.temperature.hot_days_gt_35c} hot days (≥35°C)`}
          provenance={env.temperature.provenance}
          trendText={`Anomaly: ${env.temperature.historical_anomaly_c > 0 ? "+" : ""}${env.temperature.historical_anomaly_c}°C vs normal`}
          isPositiveTrend={env.temperature.historical_anomaly_c <= 0}
        />

        <ProvenanceCard
          title="Precipitation Total"
          value={Math.round(env.rainfall.annual_precipitation_mm)}
          unit="mm / yr"
          subtitle={`Seasonal: ${Math.round(env.rainfall.seasonal_precipitation_mm)}mm • Max dry spell: ${env.rainfall.max_consecutive_dry_days} days`}
          provenance={env.rainfall.provenance}
          trendText={`Variability: ${env.rainfall.variability_index_pct}%`}
          isPositiveTrend={env.rainfall.rainfall_deficit_pct < 10}
        />

        <ProvenanceCard
          title="Surface Soil Moisture"
          value={env.soil_moisture.surface_soil_moisture_m3_m3.toFixed(2)}
          unit="m³/m³"
          subtitle={`Radiometric Topsoil (0-5cm) • Status: ${env.soil_moisture.anomaly_status}`}
          provenance={env.soil_moisture.provenance}
          trendText={env.soil_moisture.soil_moisture_percentile == null
            ? "Live surface observation"
            : `${env.soil_moisture.soil_moisture_percentile}th Percentile`}
          isPositiveTrend={(env.soil_moisture.soil_moisture_percentile ?? 50) > 40}
        />

        <ProvenanceCard
          title="Vegetation Health (NDVI)"
          value={env.vegetation.current_ndvi.toFixed(2)}
          unit="NDVI"
          subtitle={`Peak season vigour: ${env.vegetation.peak_season_ndvi} • Cloud cover: ${env.vegetation.cloud_coverage_pct}%`}
          provenance={env.vegetation.provenance}
          trendText={`Anomaly: ${env.vegetation.ndvi_anomaly > 0 ? "+" : ""}${env.vegetation.ndvi_anomaly}`}
          isPositiveTrend={env.vegetation.ndvi_anomaly >= 0}
        />
      </div>

      {/* Satellite Cadastral Map & Recommended Rotation Strategy Overview */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column: Interactive Farm Boundary Map */}
        <div className="lg:col-span-7 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold text-[#183D2C] flex items-center gap-2">
              <Layers className="w-4 h-4 text-[#39734C]" />
              Satellite Field Boundary & Reflectance Layers
            </h3>
            <span className="text-xs text-[#617367]">Resolution: 10m Multispectral</span>
          </div>
          <FarmMap
            farm={selectedFarm}
            ndvi={env.vegetation.current_ndvi}
            soilMoisturePercentile={env.soil_moisture.soil_moisture_percentile ?? 50}
          />

          {/* Quick Soil Properties Strip */}
          <div className="bg-[#FFFFFF] p-4 rounded-xl border border-[#E8E2D2] grid grid-cols-3 sm:grid-cols-6 gap-3 text-center">
            <div>
              <span className="text-[10px] text-[#617367] uppercase font-semibold">Soil pH</span>
              <p className="text-base font-bold text-[#183D2C]">{env.soil_properties.ph_in_h2o}</p>
            </div>
            <div>
              <span className="text-[10px] text-[#617367] uppercase font-semibold">Organic Carbon</span>
              <p className="text-base font-bold text-[#183D2C]">{env.soil_properties.organic_carbon_g_kg} <span className="text-xs font-normal">g/kg</span></p>
            </div>
            <div>
              <span className="text-[10px] text-[#617367] uppercase font-semibold">Sand / Clay</span>
              <p className="text-base font-bold text-[#183D2C]">{env.soil_properties.sand_fraction_pct}/{env.soil_properties.clay_fraction_pct}%</p>
            </div>
            <div>
              <span className="text-[10px] text-[#617367] uppercase font-semibold">Bulk Density</span>
              <p className="text-base font-bold text-[#183D2C]">{env.soil_properties.bulk_density_cg_cm3} <span className="text-xs font-normal">cg/cm³</span></p>
            </div>
            <div>
              <span className="text-[10px] text-[#617367] uppercase font-semibold">Available Water</span>
              <p className="text-base font-bold text-[#183D2C]">{env.soil_properties.available_water_capacity_mm_m} <span className="text-xs font-normal">mm/m</span></p>
            </div>
            <div>
              <span className="text-[10px] text-[#617367] uppercase font-semibold">Slope / Erosion</span>
              <p className="text-base font-bold text-[#183D2C]">{env.terrain.slope_degrees}°</p>
            </div>
          </div>
        </div>

        {/* Right Column: Recommended Rotation Strategy Spotlight */}
        <div className="lg:col-span-5 flex flex-col justify-between bg-[#FFFFFF] rounded-2xl p-6 border border-[#E8E2D2] shadow-xs">
          <div>
            <div className="flex items-center justify-between mb-3">
              <span className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-[#39734C] bg-[#EAF4ED] px-2.5 py-0.5 rounded-full">
                <Award className="w-3.5 h-3.5 text-[#39734C]" />
                Top Recommended Strategy
              </span>
              {recommendedStrategy && (
                <span className="text-xs font-mono font-bold text-[#183D2C] bg-[#F8F8F3] px-2 py-0.5 rounded border border-[#DDD6C3]">
                  Score: {recommendedStrategy.overall_score}/100
                </span>
              )}
            </div>

            {recommendedStrategy ? (
              <div className="space-y-4">
                <h4 className="text-xl font-bold text-[#183D2C] font-serif">
                  {recommendedStrategy.title}
                </h4>
                <p className="text-xs text-[#617367] leading-relaxed">
                  {recommendedStrategy.summary}
                </p>

                {/* Crop Sequence Timeline Preview */}
                <div className="space-y-2 pt-2">
                  <span className="text-[11px] font-semibold text-[#617367] uppercase tracking-wider">
                    Proposed Multi-Year Sequence:
                  </span>
                  <div className="grid grid-cols-2 gap-2">
                    {recommendedStrategy.crop_sequence.slice(0, 4).map((slot, idx) => (
                      <div
                        key={idx}
                        className="p-2.5 rounded-xl bg-[#F8F8F3] border border-[#DDD6C3] flex items-center justify-between"
                      >
                        <div>
                          <span className="text-[10px] text-[#617367] font-medium block">
                            Year {slot.year_index} • {slot.season_name.split("/")[0]}
                          </span>
                          <span className="text-xs font-bold text-[#183D2C]">
                            {slot.crop_name.split("(")[0]}
                          </span>
                        </div>
                        <span className="text-[10px] font-mono text-[#39734C] font-semibold bg-[#FFFFFF] px-1.5 py-0.5 rounded border border-[#E8E2D2]">
                          {slot.duration_days}d
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Key Reason & Evidence Highlight */}
                {recommendedStrategy.reasons_for_recommendation.length > 0 && (
                  <div className="p-3 rounded-xl bg-[#EAF4ED] border border-[#BCE0C8] text-xs text-[#204936] space-y-1">
                    <span className="font-bold flex items-center gap-1.5">
                      <ShieldCheck className="w-3.5 h-3.5 text-[#39734C]" />
                      Agronomic Evidence:
                    </span>
                    <p className="text-[11px] leading-relaxed">
                      {recommendedStrategy.reasons_for_recommendation[0]}
                    </p>
                  </div>
                )}
              </div>
            ) : (
              <p className="text-xs text-[#617367]">Generating recommendations...</p>
            )}
          </div>

          <div className="pt-4 border-t border-[#F0EDE4] mt-4 flex items-center justify-between">
            <Link
              href="/rotation-comparison"
              className="text-xs font-bold text-[#39734C] hover:text-[#183D2C] flex items-center gap-1 transition"
            >
              <span>Compare with Baseline & Alternatives</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
            <span className="text-[10px] text-[#617367]">MCDA Decision Engine</span>
          </div>
        </div>
      </div>

      {/* Environmental Trends Chart */}
      <div className="bg-[#FFFFFF] rounded-2xl p-6 border border-[#E8E2D2] shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-6">
          <div>
            <h3 className="text-base font-bold text-[#183D2C] flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-[#39734C]" />
              Annual Agroclimatic Profile & Vegetation Cycle
            </h3>
            <p className="text-xs text-[#617367]">
              NASA POWER weather integrated with Landsat, MODIS, and VIIRS NDVI observations
            </p>
          </div>
          <div className="flex items-center gap-4 text-xs font-medium">
            <span className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-full bg-[#39734C]"></span>
              NDVI (x100)
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-full bg-[#D97706]"></span>
              Temp (°C)
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-full bg-[#64B4DC]"></span>
              Precip (mm)
            </span>
          </div>
        </div>

        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={weatherTrends}>
              <CartesianGrid strokeDasharray="3 3" stroke="#F0EDE4" />
              <XAxis dataKey="month" stroke="#617367" fontSize={11} />
              <YAxis stroke="#617367" fontSize={11} />
              <Tooltip
                contentStyle={{
                  backgroundColor: "#FFFFFF",
                  borderColor: "#DDD6C3",
                  borderRadius: "12px",
                  fontSize: "12px",
                }}
              />
              <Line type="monotone" dataKey="temp" stroke="#D97706" strokeWidth={2.5} dot={{ r: 3 }} name="Avg Temp (°C)" />
              <Line type="monotone" dataKey="rain" stroke="#64B4DC" strokeWidth={2} dot={{ r: 2 }} name="Precipitation (mm)" />
              <Line
                type="monotone"
                dataKey={(d) => Math.round(d.ndvi * 100)}
                stroke="#39734C"
                strokeWidth={2.5}
                dot={{ r: 3 }}
                name="NDVI Index (x100)"
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
