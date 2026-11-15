"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import {
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  Droplets,
  FileText,
  MapPin,
  Ruler,
  Sparkles,
  ThermometerSun,
  Wheat,
} from "lucide-react";
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { useFarm } from "@/context/FarmContext";
import { fetchEnvironmentalSummary, fetchRotations } from "@/lib/api";
import { EnvironmentalSummary, RotationComparisonResponse } from "@/types";
import { FarmMap } from "@/components/FarmMap";

interface MetricCardProps {
  label: string;
  value: string;
  detail: string;
  icon: React.ElementType;
  tone: "amber" | "blue" | "green" | "red";
}

const toneStyles = {
  amber: "bg-[#FFF5DF] text-[#C37A19]",
  blue: "bg-[#EAF5F7] text-[#3D8791]",
  green: "bg-[#EAF5EC] text-[#4C8A58]",
  red: "bg-[#FDECEA] text-[#C76559]",
};

function MetricCard({ label, value, detail, icon: Icon, tone }: MetricCardProps) {
  return (
    <div className="rounded-2xl border border-[#E1E6DF] bg-white p-5 shadow-[0_2px_8px_rgba(27,61,43,0.03)]">
      <div className={`mb-5 flex h-9 w-9 items-center justify-center rounded-xl ${toneStyles[tone]}`}>
        <Icon className="h-5 w-5" />
      </div>
      <p className="text-xs font-medium text-[#718078]">{label}</p>
      <p className="mt-1 text-[27px] font-bold tracking-tight text-[#19382A]">{value}</p>
      <p className="mt-2 text-[11px] leading-4 text-[#718078]">{detail}</p>
      <span className="mt-4 inline-flex rounded-md bg-[#F1F3EE] px-2 py-1 text-[9px] font-semibold uppercase tracking-wide text-[#7D887F]">
        Preview data
      </span>
    </div>
  );
}

export default function DashboardPage() {
  const { selectedFarm, isLoading: farmLoading } = useFarm();
  const [env, setEnv] = useState<EnvironmentalSummary | null>(null);
  const [rotations, setRotations] = useState<RotationComparisonResponse | null>(null);

  useEffect(() => {
    if (!selectedFarm) return;
    Promise.all([
      fetchEnvironmentalSummary(selectedFarm.id),
      fetchRotations(selectedFarm.id).catch(() => null),
    ]).then(([envData, rotationData]) => {
      setEnv(envData);
      setRotations(rotationData);
    });
  }, [selectedFarm]);

  if (farmLoading || !selectedFarm || !env) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-[#377C52] border-t-transparent" />
        <p className="text-sm font-medium text-[#718078]">Loading your farm overview...</p>
      </div>
    );
  }

  const recommendedStrategy =
    rotations?.strategies.find((strategy) => strategy.strategy_id === rotations.recommended_strategy_id) ||
    rotations?.strategies[1];

  const climateTrend = [
    { month: "Jul", rainfall: 42, temperature: 27 },
    { month: "Aug", rainfall: 51, temperature: 27.5 },
    { month: "Sep", rainfall: 45, temperature: 25 },
    { month: "Oct", rainfall: 62, temperature: 21 },
    { month: "Nov", rainfall: 88, temperature: 17 },
    { month: "Dec", rainfall: 73, temperature: 13 },
    { month: "Jan", rainfall: 58, temperature: 10 },
    { month: "Feb", rainfall: 49, temperature: 12 },
    { month: "Mar", rainfall: 77, temperature: 16 },
    { month: "Apr", rainfall: 68, temperature: 21 },
    { month: "May", rainfall: 54, temperature: 25 },
    { month: "Jun", rainfall: 64, temperature: 28 },
  ];

  const recentAnalyses = [
    { title: "Seasonal water resilience", date: "Jun 21, 2025", status: "Completed", icon: CheckCircle2 },
    { title: "Field vegetation review", date: "Jun 14, 2025", status: "Completed", icon: CheckCircle2 },
    { title: "Soil restoration options", date: "May 28, 2025", status: "Saved draft", icon: FileText },
  ];

  return (
    <div className="animate-fadeIn space-y-6">
      <section className="flex flex-col justify-between gap-4 border-b border-[#E1E6DF] pb-5 md:flex-row md:items-center">
        <div>
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-[#65A15F]" />
            <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-[#377C52]">Farm overview</p>
          </div>
          <h1 className="mt-1 text-2xl font-semibold tracking-tight text-[#19382A] lg:text-3xl">
            Good morning
          </h1>
          <p className="mt-1 text-sm text-[#718078]">
            Here is what is happening across <span className="font-semibold text-[#4C6657]">{selectedFarm.name}</span>.
          </p>
        </div>
        <Link
          href="/rotation-planner"
          className="inline-flex items-center justify-center gap-2 rounded-lg bg-[#377C52] px-4 py-2.5 text-xs font-bold text-white shadow-sm transition hover:bg-[#286342]"
        >
          Analyze my farm
          <Sparkles className="h-4 w-4 text-[#A7C77D]" />
        </Link>
      </section>

      <section className="rounded-2xl border border-[#E1E6DF] bg-white p-4 shadow-[0_2px_8px_rgba(27,61,43,0.03)] lg:p-5">
        <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
              <h2 className="text-lg font-semibold text-[#19382A]">Farm conditions</h2>
              <span className="text-xs font-medium text-[#718078]">{selectedFarm.name}</span>
            </div>
            <div className="mt-1 flex flex-wrap items-center gap-3 text-[11px] text-[#718078]">
              <span className="flex items-center gap-1">
                <MapPin className="h-3.5 w-3.5 text-[#377C52]" />
                {selectedFarm.location_name}
              </span>
              <span className="flex items-center gap-1">
                <Ruler className="h-3.5 w-3.5 text-[#7EA760]" />
                {selectedFarm.area_hectares} hectares
              </span>
            </div>
          </div>
          <Link href="/environmental-insights" className="self-start text-xs font-bold text-[#377C52] sm:self-auto">
            Full map <ArrowRight className="ml-1 inline h-3.5 w-3.5" />
          </Link>
        </div>
        <FarmMap
          farm={selectedFarm}
          ndvi={env.vegetation.current_ndvi}
          soilMoisturePercentile={env.soil_moisture.soil_moisture_percentile}
        />
      </section>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          label="Average temperature"
          value={`${env.temperature.avg_temp_c}°C`}
          detail={env.temperature.historical_anomaly_c == null ? "Historical comparison unavailable" : `${env.temperature.historical_anomaly_c > 0 ? "+" : ""}${env.temperature.historical_anomaly_c}°C vs 1991–2020`}
          icon={ThermometerSun}
          tone="amber"
        />
        <MetricCard
          label="Seasonal rainfall"
          value={`${Math.round(env.rainfall.seasonal_precipitation_mm)} mm`}
          detail={`${env.rainfall.rainfall_deficit_pct}% below the typical season`}
          icon={Droplets}
          tone="blue"
        />
        <MetricCard
          label="How wet your soil is"
          value={env.soil_moisture.anomaly_status.replace("_", " ")}
          detail={env.soil_moisture.soil_moisture_percentile == null ? "Historical percentile unavailable" : `Drier than ${100 - env.soil_moisture.soil_moisture_percentile}% of past seasons`}
          icon={Droplets}
          tone="red"
        />
        <MetricCard
          label="Vegetation greenness"
          value={env.vegetation.current_ndvi.toFixed(2)}
          detail="Current crop health from satellite imagery"
          icon={Wheat}
          tone="green"
        />
      </section>

      <section className="grid items-start gap-6">
        <div className="min-w-0 rounded-2xl border border-[#E1E6DF] bg-white p-5 shadow-[0_2px_8px_rgba(27,61,43,0.03)]">
          <div className="mb-5">
            <h2 className="text-lg font-semibold text-[#19382A]">Environmental alerts</h2>
            <p className="mt-1 text-xs text-[#718078]">
              {env.environmental_alerts.length ? `${env.environmental_alerts.length} items need your attention` : "Nothing needs your attention"}
            </p>
          </div>
          <div className="space-y-5">
            {env.environmental_alerts.length > 0 ? (
              env.environmental_alerts.slice(0, 3).map((alert, index) => (
                <div key={index} className="flex items-start gap-3 border-b border-[#EDF0EB] pb-5 last:border-0 last:pb-0">
                  <span className={`mt-0.5 shrink-0 rounded-xl p-2.5 ${alert.severity === "high" ? "bg-[#FDECEA] text-[#C76559]" : "bg-[#FFF5DF] text-[#C37A19]"}`}>
                    <AlertTriangle className="h-4 w-4" />
                  </span>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold capitalize text-[#19382A]">{alert.title}</p>
                    <p className="mt-1 text-xs leading-5 text-[#718078]">{alert.message}</p>
                    <p className="mt-2 text-[10px] text-[#9AA69D]">Observed from NASA Earth data</p>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-sm text-[#718078]">Your farm looks steady today.</p>
            )}
          </div>
        </div>
      </section>

      <section className="rounded-2xl border border-[#E1E6DF] bg-white p-5 shadow-[0_2px_8px_rgba(27,61,43,0.03)]">
        <div className="mb-5 flex flex-col justify-between gap-3 sm:flex-row sm:items-start">
          <div>
            <h2 className="text-lg font-semibold text-[#19382A]">Climate trends</h2>
            <p className="mt-1 text-xs text-[#718078]">Rainfall and average temperature · past 12 months</p>
          </div>
          <span className="rounded-lg border border-[#E1E6DF] px-3 py-2 text-[11px] font-medium text-[#718078]">12 months</span>
        </div>
        <div className="mb-3 flex flex-wrap gap-4 text-[11px] text-[#718078]">
          <span className="flex items-center gap-2"><span className="h-2.5 w-2.5 rounded-sm bg-[#4C8A58]" /> Rainfall (mm)</span>
          <span className="flex items-center gap-2"><span className="h-2.5 w-2.5 rounded-sm bg-[#D99A2B]" /> Temperature (°C)</span>
          <span className="ml-auto text-[#9AA69D]">NASA POWER · Preview</span>
        </div>
        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={climateTrend} margin={{ top: 8, right: 12, left: -20, bottom: 0 }}>
              <CartesianGrid stroke="#EDF0EB" vertical={false} />
              <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fill: "#718078", fontSize: 10 }} />
              <YAxis axisLine={false} tickLine={false} tick={{ fill: "#718078", fontSize: 10 }} />
              <Tooltip
                contentStyle={{ border: "1px solid #E1E6DF", borderRadius: "10px", fontSize: "11px" }}
              />
              <Line type="monotone" dataKey="rainfall" stroke="#4C8A58" strokeWidth={2.5} dot={false} name="Rainfall (mm)" />
              <Line type="monotone" dataKey="temperature" stroke="#D99A2B" strokeWidth={2} strokeDasharray="4 4" dot={false} name="Temperature (°C)" />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </section>

      <section className="rounded-2xl border border-[#E1E6DF] bg-white p-5 shadow-[0_2px_8px_rgba(27,61,43,0.03)]">
        <div className="mb-3 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-[#19382A]">Recent analyses</h2>
            <p className="mt-1 text-xs text-[#718078]">Your latest farm decision work</p>
          </div>
          <Link href="/reports" className="text-xs font-bold text-[#377C52]">
            View history <ArrowRight className="ml-1 inline h-3.5 w-3.5" />
          </Link>
        </div>
        <div className="divide-y divide-[#EDF0EB]">
          {recentAnalyses.map((analysis) => {
            const Icon = analysis.icon;
            return (
              <div key={analysis.title} className="flex items-center gap-3 py-4 first:pt-3 last:pb-2">
                <span className="rounded-xl bg-[#EAF5EC] p-2 text-[#4C8A58]"><Icon className="h-4 w-4" /></span>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-[#19382A]">{analysis.title}</p>
                  <p className="mt-1 text-[11px] text-[#9AA69D]">{analysis.date}</p>
                </div>
                <span className="rounded-full bg-[#F1F7EE] px-2.5 py-1 text-[10px] font-semibold text-[#5F8A62]">{analysis.status}</span>
                <ArrowRight className="h-4 w-4 text-[#9AA69D]" />
              </div>
            );
          })}
        </div>
      </section>

      {recommendedStrategy && (
        <section className="rounded-2xl border border-[#DDE8DB] bg-[#F1F7EE] p-5">
          <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-[#377C52]">Suggested next step</p>
              <h2 className="mt-2 text-xl font-semibold text-[#19382A]">{recommendedStrategy.title}</h2>
              <p className="mt-1 max-w-2xl text-sm text-[#5F7567]">{recommendedStrategy.summary}</p>
            </div>
            <Link href="/rotation-comparison" className="inline-flex shrink-0 items-center justify-center gap-2 rounded-lg border border-[#BFD6BD] bg-white px-4 py-2.5 text-xs font-bold text-[#377C52] hover:bg-[#EAF5E8]">
              See recommendation
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </section>
      )}
    </div>
  );
}
