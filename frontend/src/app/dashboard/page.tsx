"use client";

import React, { useEffect, useState } from "react";
import { useFarm } from "@/context/FarmContext";
import { fetchEnvironmentalSummary, fetchEnvironmentalTrends, fetchRotations } from "@/lib/api";
import { EnvironmentalSummary, EnvironmentalTrends, RotationComparisonResponse } from "@/types";
import { FarmMap } from "@/components/FarmMap";
import { ProvenanceCard } from "@/components/ProvenanceCard";
import { PageSkeleton } from "@/components/PageSkeleton";
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
  const [trends, setTrends] = useState<EnvironmentalTrends | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!selectedFarm) return;
    setLoading(true);
    setError(null);
    Promise.all([
      fetchEnvironmentalSummary(selectedFarm.id),
      fetchRotations(selectedFarm.id).catch(() => null),
      fetchEnvironmentalTrends(selectedFarm.id),
    ])
      .then(([envData, rotData, trendData]) => {
        setEnv(envData);
        setRotations(rotData);
        setTrends(trendData);
      })
      .catch((reason) => setError(reason instanceof Error ? reason.message : "Dashboard data failed to load."))
      .finally(() => setLoading(false));
  }, [selectedFarm]);

  if (farmLoading || loading) {
    return <PageSkeleton cards={4} detailPanels={2} />;
  }
  if (error || !selectedFarm || !env) {
    return <div className="p-6 rounded-2xl bg-[#FDF2F0] border border-[#E7B8B4] text-sm text-[#8B2F2A]">{error || "No dashboard data is available."}</div>;
  }

  const dates = trends?.daily_weather_series.dates || [];
  const temperatures = trends?.daily_weather_series.t2m || [];
  const precipitation = trends?.daily_weather_series.precipitation || [];
  const observationCount = Math.min(dates.length, temperatures.length, precipitation.length);
  const weatherTrends = Array.from({ length: observationCount }, (_, index) => ({
    date: dates[index],
    temp: temperatures[index],
    rain: precipitation[index],
  }));

  const recommendedStrategy = rotations?.strategies.find(
    (s) => s.strategy_id === rotations.recommended_strategy_id
  ) || rotations?.strategies[1];

  return (
    <div className="space-y-8 animate-fadeIn">
      <div className={`p-4 rounded-xl border text-xs ${env.data_status === "live" ? "bg-[#EAF4ED] border-[#BCE0C8] text-[#204936]" : "bg-[#FFF7E8] border-[#E8C98B] text-[#7A4A00]"}`}>
        <strong>Data status: {env.data_status}.</strong> {env.data_messages.length ? env.data_messages.join(" ") : "All displayed metrics report live provenance."}
        <span className="ml-1 font-semibold">
          {env.cache_status === "hit" ? "Loaded from the local observation cache." : env.cache_status === "stale" ? "Using the last successful cached observation while an upstream source is unavailable." : "Fresh observation request completed and cached."}
        </span>
      </div>
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
          trendText={env.temperature.historical_anomaly_c == null ? "Climatological anomaly unavailable" : `Anomaly: ${env.temperature.historical_anomaly_c > 0 ? "+" : ""}${env.temperature.historical_anomaly_c}°C vs 1991-2020`}
          isPositiveTrend={env.temperature.historical_anomaly_c == null || env.temperature.historical_anomaly_c <= 0}
        />

        <ProvenanceCard
          title="Precipitation Total"
          value={Math.round(env.rainfall.annual_precipitation_mm)}
          unit="mm / yr"
          subtitle={`Latest 120 days: ${Math.round(env.rainfall.seasonal_precipitation_mm)}mm • Max dry spell: ${env.rainfall.max_consecutive_dry_days} days`}
          provenance={env.rainfall.provenance}
          trendText={`Variability: ${env.rainfall.variability_index_pct}%`}
          isPositiveTrend={env.rainfall.rainfall_deficit_pct == null || env.rainfall.rainfall_deficit_pct >= -10}
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
              Farm Boundary Context
            </h3>
            <span className="text-xs text-[#617367]">Schematic — no raster tiles</span>
          </div>
          <FarmMap
            farm={selectedFarm}
            ndvi={env.vegetation.current_ndvi}
            soilMoisturePercentile={env.soil_moisture.soil_moisture_percentile}
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
              Recent NASA POWER Daily Weather
            </h3>
            <p className="text-xs text-[#617367]">
              {trends?.is_demo ? "Demo daily series — not observed weather" : "Latest available point-grid observations from NASA POWER"}
            </p>
          </div>
          <div className="flex items-center gap-4 text-xs font-medium">
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

        {weatherTrends.length ? <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={weatherTrends}>
              <CartesianGrid strokeDasharray="3 3" stroke="#F0EDE4" />
              <XAxis dataKey="date" stroke="#617367" fontSize={11} tickFormatter={(value) => String(value).slice(4)} />
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
            </LineChart>
          </ResponsiveContainer>
        </div> : <div className="p-6 rounded-xl bg-[#F8F8F3] border border-[#DDD6C3] text-sm text-[#617367]">No daily weather chart is available. No substitute series was generated by the frontend.</div>}
      </div>
    </div>
  );
}
