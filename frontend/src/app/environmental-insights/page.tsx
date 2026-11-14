
"use client";

import React, { useEffect, useState } from "react";
import { useFarm } from "@/context/FarmContext";
import { fetchEnvironmentalSummary } from "@/lib/api";
import { EnvironmentalSummary } from "@/types";
import {
  ThermometerSun,
  CloudRain,
  Droplets,
  Sprout,
  Mountain,
  Layers,
  AlertTriangle,
  CheckCircle2,
  Info,
  ChevronDown,
  Satellite,
  Leaf,
  RefreshCw,
  MapPin,
} from "lucide-react";

// --------------------------------------------------
// Reusable metric card
// --------------------------------------------------

interface MetricCardProps {
  title: string;
  value: string;
  status: string;
  description: string;
  icon: React.ElementType;
  statusType?: "good" | "warning" | "neutral";
}

function MetricCard({
  title,
  value,
  status,
  description,
  icon: Icon,
  statusType = "neutral",
}: MetricCardProps) {
  const statusColors = {
    good: "bg-[#EAF4ED] text-[#39734C]",
    warning: "bg-[#FFF4E5] text-[#A66B20]",
    neutral: "bg-[#F1F2EE] text-[#617367]",
  };

  return (
    <div className="bg-white rounded-2xl border border-[#E8E2D2] p-5 hover:shadow-sm transition-shadow">
      <div className="flex items-start justify-between">
        <div className="w-10 h-10 rounded-xl bg-[#EAF4ED] flex items-center justify-center">
          <Icon className="w-5 h-5 text-[#39734C]" />
        </div>

        <span
          className={`text-xs font-semibold px-2.5 py-1 rounded-full ${statusColors[statusType]}`}
        >
          {status}
        </span>
      </div>

      <p className="text-sm text-[#617367] mt-4">{title}</p>

      <h3 className="text-2xl font-bold text-[#183D2C] mt-1">
        {value}
      </h3>

      <p className="text-xs text-[#839087] mt-2 leading-relaxed">
        {description}
      </p>
    </div>
  );
}

// --------------------------------------------------
// Main page
// --------------------------------------------------

export default function EnvironmentalInsightsPage() {
  const { selectedFarm } = useFarm();

  const [env, setEnv] = useState<EnvironmentalSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (!selectedFarm) {
      setEnv(null);
      setLoading(false);
      return;
    }

    let cancelled = false;

    async function loadData() {
      setLoading(true);
      setError(false);

      try {
        const result = await fetchEnvironmentalSummary(selectedFarm!.id);

        if (!cancelled) {
          setEnv(result);
        }
      } catch (err) {
        console.error("Failed to load environmental data:", err);

        if (!cancelled) {
          setError(true);
          setEnv(null);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    loadData();

    return () => {
      cancelled = true;
    };
  }, [selectedFarm]);

  // --------------------------------------------------
  // Loading state
  // --------------------------------------------------

  if (loading) {
    return (
      <div className="min-h-[400px] flex flex-col items-center justify-center gap-3">
        <div className="w-9 h-9 border-[3px] border-[#39734C] border-t-transparent rounded-full animate-spin" />
        <p className="text-sm text-[#617367]">
          Loading your farm conditions...
        </p>
      </div>
    );
  }

  // --------------------------------------------------
  // No farm selected
  // --------------------------------------------------

  if (!selectedFarm) {
    return (
      <div className="min-h-[400px] flex flex-col items-center justify-center text-center gap-3">
        <Sprout className="w-10 h-10 text-[#39734C]" />
        <h3 className="text-lg font-bold text-[#183D2C]">
          Select a farm to get started
        </h3>
        <p className="text-sm text-[#617367] max-w-sm">
          Choose one of your farms to explore its environmental conditions.
        </p>
      </div>
    );
  }

  // --------------------------------------------------
  // Error state
  // --------------------------------------------------

  if (error || !env) {
    return (
      <div className="min-h-[400px] flex flex-col items-center justify-center text-center gap-3">
        <AlertTriangle className="w-9 h-9 text-[#B77935]" />

        <h3 className="text-lg font-bold text-[#183D2C]">
          Couldn't load farm conditions
        </h3>

        <p className="text-sm text-[#617367]">
          Something went wrong while retrieving your environmental data.
          Please try again.
        </p>

        <button
          onClick={() => window.location.reload()}
          className="flex items-center gap-2 bg-[#39734C] text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-[#285B39]"
        >
          <RefreshCw className="w-4 h-4" />
          Try again
        </button>
      </div>
    );
  }

  // --------------------------------------------------
  // Environmental observations
  // --------------------------------------------------

  const rainfallDeficit = env.rainfall.rainfall_deficit_pct;
  const hotDays = env.temperature.hot_days_gt_35c;
  const moistureStatus = env.soil_moisture.anomaly_status;
  const ndviAnomaly = env.vegetation.ndvi_anomaly;

  const observations = [
    ...(rainfallDeficit > 0
      ? [
          {
            title: "Rainfall is below average",
            description: `Your farm has received ${rainfallDeficit}% less rainfall than its historical average. This may affect crops that depend heavily on rainfall.`,
            type: "warning" as const,
          },
        ]
      : [
          {
            title: "Rainfall conditions look favorable",
            description:
              "Rainfall is not showing a deficit against the historical average.",
            type: "good" as const,
          },
        ]),

    ...(hotDays > 0
      ? [
          {
            title: "Hot days are affecting your growing conditions",
            description: `There have been ${hotDays} days with temperatures above 35°C. Heat-sensitive crops may need extra attention.`,
            type: "warning" as const,
          },
        ]
      : []),

    ...(moistureStatus.toLowerCase().includes("deficit")
      ? [
          {
            title: "Soil moisture is lower than usual",
            description:
              "Less moisture is available in the measured soil layer. Consider water availability when planning your next crop.",
            type: "warning" as const,
          },
        ]
      : []),

    ...(ndviAnomaly < 0
      ? [
          {
            title: "Vegetation growth is below its usual level",
            description:
              "Satellite vegetation measurements are lower than the historical average. This can indicate changes in vegetation conditions.",
            type: "warning" as const,
          },
        ]
      : []),
  ];

  // --------------------------------------------------
  // Data sources
  // --------------------------------------------------

  const dataSources = [
    {
      name: "NASA POWER",
      description: "Temperature and weather conditions",
    },
    {
      name: "NASA SMAP",
      description: "Soil moisture observations",
    },
    {
      name: "Sentinel-2",
      description: "Satellite vegetation measurements",
    },
    {
      name: "SoilGrids",
      description: "Soil properties and composition",
    },
    {
      name: "SRTM",
      description: "Land elevation and slope",
    },
  ];

  return (
    <div className="space-y-8 pb-10">

      {/* ==========================================
          HEADER
      ========================================== */}

      <div className="space-y-2">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-semibold bg-[#EAF4ED] text-[#39734C] px-3 py-1 rounded-full">
            Farm Overview
          </span>

          <span className="flex items-center gap-1 text-xs text-[#617367]">
            <MapPin className="w-3 h-3" />
            {selectedFarm.name}
          </span>
        </div>

        <h1 className="text-2xl lg:text-3xl font-bold text-[#183D2C] font-serif">
          Farm Conditions
        </h1>

        <p className="text-sm text-[#617367] max-w-2xl">
          Understand the environmental conditions affecting your farm
          and what they could mean for your next growing season.
        </p>
      </div>


      {/* ==========================================
          ENVIRONMENTAL OVERVIEW
      ========================================== */}

      <section className="space-y-4">

        <div>
          <h2 className="text-lg font-bold text-[#183D2C]">
            Here's what we're seeing
          </h2>

          <p className="text-sm text-[#839087] mt-1">
            A quick look at your farm's environmental conditions.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">

          <MetricCard
            title="Temperature"
            value={`${env.temperature.avg_temp_c}°C`}
            status={hotDays > 0 ? "Hot days recorded" : "No extreme heat days"}
            statusType={hotDays > 0 ? "warning" : "neutral"}
            description={`${hotDays} days above 35°C`}
            icon={ThermometerSun}
          />

          <MetricCard
            title="Annual Rainfall"
            value={`${Math.round(env.rainfall.annual_precipitation_mm)} mm`}
            status={
              rainfallDeficit > 0
                ? "Below average"
                : "No rainfall deficit"
            }
            statusType={rainfallDeficit > 0 ? "warning" : "good"}
            description={`${rainfallDeficit}% rainfall deficit compared with the historical average`}
            icon={CloudRain}
          />

          <MetricCard
            title="Soil Moisture"
            value={env.soil_moisture.surface_soil_moisture_m3_m3.toFixed(2)}
            status={moistureStatus}
            statusType={
              moistureStatus.toLowerCase().includes("deficit")
                ? "warning"
                : "neutral"
            }
            description="Measured moisture in the upper soil layer"
            icon={Droplets}
          />

          <MetricCard
            title="Vegetation Health"
            value={env.vegetation.current_ndvi.toFixed(2)}
            status={
              ndviAnomaly < 0 ? "Below usual level" : "At or above usual level"
            }
            statusType={ndviAnomaly < 0 ? "warning" : "good"}
            description="Satellite indicator of vegetation growth"
            icon={Sprout}
          />

        </div>
      </section>


      {/* ==========================================
          WHAT WE'VE NOTICED
      ========================================== */}

      <section className="space-y-4">

        <div>
          <h2 className="text-lg font-bold text-[#183D2C]">
            What we've noticed
          </h2>

          <p className="text-sm text-[#839087] mt-1">
            Environmental changes worth paying attention to.
          </p>
        </div>

        {observations.length > 0 ? (
          <div className="space-y-3">

            {observations.slice(0, 3).map((item, index) => (
              <div
                key={index}
                className="flex items-start gap-3 p-4 bg-white rounded-xl border border-[#E8E2D2]"
              >
                <div
                  className={`w-9 h-9 shrink-0 rounded-full flex items-center justify-center ${
                    item.type === "warning"
                      ? "bg-[#FFF4E5] text-[#B77935]"
                      : "bg-[#EAF4ED] text-[#39734C]"
                  }`}
                >
                  {item.type === "warning" ? (
                    <AlertTriangle className="w-4 h-4" />
                  ) : (
                    <CheckCircle2 className="w-4 h-4" />
                  )}
                </div>

                <div className="flex-1 space-y-1">
                  <h3 className="text-sm font-semibold text-[#183D2C]">
                    {item.title}
                  </h3>

                  <p className="text-sm text-[#617367] leading-relaxed">
                    {item.description}
                  </p>
                </div>
              </div>
            ))}

          </div>
        ) : (
          <div className="p-4 bg-[#EAF4ED] rounded-xl flex items-center gap-3">
            <CheckCircle2 className="w-5 h-5 text-[#39734C]" />
            <p className="text-sm text-[#285B39]">
              No major environmental concerns were identified
              from the available indicators.
            </p>
          </div>
        )}

      </section>


      {/* ==========================================
          SOIL AND LAND
      ========================================== */}

      <section className="space-y-4">

        <div>
          <h2 className="text-lg font-bold text-[#183D2C]">
            Your soil and land
          </h2>

          <p className="text-sm text-[#839087] mt-1">
            Get to know the ground you're growing on.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

          {/* Soil card */}

          <div className="bg-white rounded-2xl border border-[#E8E2D2] p-5 space-y-4">

            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-[#F8F0E5] flex items-center justify-center">
                <Layers className="w-5 h-5 text-[#A66B36]" />
              </div>

              <div>
                <h3 className="font-bold text-[#183D2C]">
                  Soil Quality
                </h3>
                <p className="text-xs text-[#839087]">
                  Your soil's composition
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">

              <div>
                <p className="text-xs text-[#839087]">Organic Carbon</p>
                <p className="text-xl font-bold text-[#183D2C] mt-1">
                  {env.soil_properties.organic_carbon_g_kg}
                  <span className="text-xs font-normal text-[#839087] ml-1">
                    g/kg
                  </span>
                </p>
              </div>

              <div>
                <p className="text-xs text-[#839087]">Soil pH</p>
                <p className="text-xl font-bold text-[#183D2C] mt-1">
                  {env.soil_properties.ph_in_h2o}
                </p>
              </div>

              <div className="col-span-2">
                <p className="text-xs text-[#839087]">
                  Water-holding capacity
                </p>
                <p className="text-lg font-bold text-[#183D2C] mt-1">
                  {env.soil_properties.available_water_capacity_mm_m}
                  <span className="text-xs font-normal text-[#839087] ml-1">
                    mm/m
                  </span>
                </p>
              </div>

            </div>

            <details className="group border-t border-[#F0EDE4] pt-3">
              <summary className="flex items-center justify-between cursor-pointer text-xs font-semibold text-[#39734C] list-none">
                View soil composition
                <ChevronDown className="w-4 h-4 transition-transform group-open:rotate-180" />
              </summary>

              <div className="space-y-3 mt-4">

                {[
                  {
                    label: "Sand",
                    value: env.soil_properties.sand_fraction_pct,
                    color: "bg-[#E8A555]",
                  },
                  {
                    label: "Silt",
                    value: env.soil_properties.silt_fraction_pct,
                    color: "bg-[#9DBB78]",
                  },
                  {
                    label: "Clay",
                    value: env.soil_properties.clay_fraction_pct,
                    color: "bg-[#39734C]",
                  },
                ].map((item) => (
                  <div key={item.label}>
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-[#617367]">{item.label}</span>
                      <span className="font-semibold text-[#183D2C]">
                        {item.value}%
                      </span>
                    </div>

                    <div className="h-2 rounded-full bg-[#F0EDE4] overflow-hidden">
                      <div
                        className={`h-full rounded-full ${item.color}`}
                        style={{
                          width: `${Math.min(100, Math.max(0, item.value))}%`,
                        }}
                      />
                    </div>
                  </div>
                ))}

              </div>
            </details>

          </div>


          {/* Land card */}

          <div className="bg-white rounded-2xl border border-[#E8E2D2] p-5 space-y-4">

            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-[#EAF4ED] flex items-center justify-center">
                <Mountain className="w-5 h-5 text-[#39734C]" />
              </div>

              <div>
                <h3 className="font-bold text-[#183D2C]">
                  Land & Erosion
                </h3>
                <p className="text-xs text-[#839087]">
                  Your farm's terrain
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">

              <div>
                <p className="text-xs text-[#839087]">Elevation</p>
                <p className="text-xl font-bold text-[#183D2C] mt-1">
                  {env.terrain.mean_elevation_m}
                  <span className="text-xs font-normal text-[#839087] ml-1">
                    m
                  </span>
                </p>
              </div>

              <div>
                <p className="text-xs text-[#839087]">Land Slope</p>
                <p className="text-xl font-bold text-[#183D2C] mt-1">
                  {env.terrain.slope_degrees}°
                </p>
              </div>

            </div>

            <div className="bg-[#F8F8F3] rounded-xl p-3">
              <p className="text-xs text-[#839087] mb-1">
                Erosion risk
              </p>

              <p className="text-sm font-semibold text-[#183D2C]">
                {env.terrain.erosion_susceptibility}
              </p>

              <p className="text-xs text-[#617367] mt-1">
                Maintaining vegetation cover and crop residues
                can help protect soil from erosion.
              </p>
            </div>

            <p className="text-xs text-[#839087]">
              {env.terrain.slope_category}
            </p>

          </div>

        </div>
      </section>


      {/* ==========================================
          CROP ROTATION CONNECTION
      ========================================== */}

      <section className="bg-[#F1F5EF] border border-[#DCE9DC] rounded-2xl p-5 sm:p-6 space-y-4">

        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center">
            <Leaf className="w-5 h-5 text-[#39734C]" />
          </div>

          <div>
            <h2 className="font-bold text-[#183D2C]">
              What this means for your next crop
            </h2>

            <p className="text-xs text-[#617367] mt-0.5">
              Things to consider when planning your rotation.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">

          {rainfallDeficit > 0 && (
            <div className="bg-white rounded-xl p-4 flex gap-3">
              <Droplets className="w-5 h-5 text-[#39734C] shrink-0" />

              <div>
                <h3 className="text-sm font-semibold text-[#183D2C]">
                  Think about water-efficient crops
                </h3>
                <p className="text-xs text-[#617367] mt-1 leading-relaxed">
                  Below-average rainfall makes water requirements
                  an important factor in your next crop choice.
                </p>
              </div>
            </div>
          )}

          {ndviAnomaly < 0 && (
            <div className="bg-white rounded-xl p-4 flex gap-3">
              <Sprout className="w-5 h-5 text-[#39734C] shrink-0" />

              <div>
                <h3 className="text-sm font-semibold text-[#183D2C]">
                  Consider improving soil cover
                </h3>
                <p className="text-xs text-[#617367] mt-1 leading-relaxed">
                  Cover crops and retained crop residues can
                  help protect soil and reduce moisture loss.
                </p>
              </div>
            </div>
          )}

          <div className="bg-white rounded-xl p-4 flex gap-3">
            <Leaf className="w-5 h-5 text-[#39734C] shrink-0" />

            <div>
              <h3 className="text-sm font-semibold text-[#183D2C]">
                Explore legume crops
              </h3>
              <p className="text-xs text-[#617367] mt-1 leading-relaxed">
                Suitable legumes can contribute nitrogen
                and diversify your crop rotation.
              </p>
            </div>
          </div>

        </div>

        <p className="text-[11px] text-[#617367] leading-relaxed">
          These are general considerations based on environmental
          indicators, not final crop recommendations. Local growing
          seasons, soil conditions, water access and market suitability
          should also be considered.
        </p>

      </section>


      {/* ==========================================
          DATA SOURCES
      ========================================== */}

      <details className="bg-white rounded-2xl border border-[#E8E2D2] group">

        <summary className="flex items-center justify-between p-5 cursor-pointer list-none">

          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-[#EAF4ED] flex items-center justify-center">
              <Satellite className="w-4 h-4 text-[#39734C]" />
            </div>

            <div>
              <h3 className="text-sm font-bold text-[#183D2C]">
                Where does this information come from?
              </h3>

              <p className="text-xs text-[#839087] mt-0.5">
                Learn about the data behind your farm insights.
              </p>
            </div>
          </div>

          <ChevronDown className="w-5 h-5 text-[#617367] transition-transform group-open:rotate-180" />

        </summary>

        <div className="px-5 pb-5 border-t border-[#F0EDE4]">

          <div className="divide-y divide-[#F0EDE4]">

            {dataSources.map((source) => (
              <div
                key={source.name}
                className="flex items-center justify-between gap-3 py-3"
              >
                <div>
                  <p className="text-sm font-semibold text-[#183D2C]">
                    {source.name}
                  </p>

                  <p className="text-xs text-[#839087]">
                    {source.description}
                  </p>
                </div>

                <CheckCircle2 className="w-4 h-4 text-[#39734C] shrink-0" />
              </div>
            ))}

          </div>

          <div className="flex items-start gap-2 mt-3 bg-[#F8F8F3] p-3 rounded-lg">
            <Info className="w-4 h-4 text-[#617367] shrink-0 mt-0.5" />

            <p className="text-xs text-[#617367] leading-relaxed">
              Satellite observations and soil datasets provide
              estimates of environmental conditions. They may not
              capture every variation within an individual field.
              Ground measurements and local agricultural knowledge
              can help validate these findings.
            </p>
          </div>

        </div>

      </details>

    </div>
  );
}
