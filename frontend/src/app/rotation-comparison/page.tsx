
"use client";

import React, { useCallback, useEffect, useState } from "react";
import { useFarm } from "@/context/FarmContext";
import { fetchRotations, generateCustomRotations } from "@/lib/api";
import { RotationComparisonResponse } from "@/types";
import {
  CheckCircle2,
  AlertTriangle,
  Droplets,
  Sprout,
  Sun,
  Shield,
  Layers,
  CircleDollarSign,
  ChevronDown,
  ArrowRight,
  Info,
  RefreshCw,
  ShieldCheck,
} from "lucide-react";
import Link from "next/link";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from "recharts";

const priorities = [
  {
    id: "balanced",
    label: "Balanced",
    description: "Consider all farming goals equally.",
  },
  {
    id: "water_resilience",
    label: "Save Water",
    description: "Give more importance to water availability.",
  },
  {
    id: "soil_restoration",
    label: "Improve Soil",
    description: "Focus on long-term soil health.",
  },
] as const;

const criteria = [
  {
    key: "water_resilience",
    label: "Water needs",
    icon: Droplets,
    description: "How well the rotation handles limited water.",
  },
  {
    key: "climate_suitability",
    label: "Local climate fit",
    icon: Sun,
    description: "How suitable the crops are for local conditions.",
  },
  {
    key: "soil_improvement",
    label: "Soil improvement",
    icon: Sprout,
    description: "Potential to improve soil fertility.",
  },
  {
    key: "erosion_protection",
    label: "Erosion protection",
    icon: Shield,
    description: "How well crops help protect the soil.",
  },
  {
    key: "crop_diversity",
    label: "Crop variety",
    icon: Layers,
    description: "How much variety the rotation provides.",
  },
  {
    key: "market_suitability",
    label: "Market potential",
    icon: CircleDollarSign,
    description: "How well crops fit market considerations.",
  },
] as const;

type PriorityId =
  (typeof priorities)[number]["id"];

export default function RotationComparisonPage() {
  const { selectedFarm } = useFarm();

  const [data, setData] =
    useState<RotationComparisonResponse | null>(null);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [selectedPriority, setSelectedPriority] =
    useState<PriorityId>("balanced");
  const [isUpdating, setIsUpdating] = useState(false);

  const [retryCount, setRetryCount] = useState(0);

  // Initial data loading and retry
  useEffect(() => {
    if (!selectedFarm) {
      setData(null);
      setLoading(false);
      return;
    }

    let cancelled = false;

    async function loadData() {
      setLoading(true);
      setError(false);

      try {
        const result = await fetchRotations(selectedFarm!.id);

        if (!cancelled) {
          setData(result);

          const farmPriority =
            selectedFarm!.primary_priority || "balanced";

          setSelectedPriority(
            priorities.some((p) => p.id === farmPriority)
              ? (farmPriority as PriorityId)
              : "balanced"
          );
        }
      } catch (err) {
        console.error("Failed to load rotation comparison:", err);

        if (!cancelled) {
          setError(true);
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
  }, [selectedFarm, retryCount]);

  // Update rotations according to farmer priority
  const handlePriorityChange = async (priority: PriorityId) => {
    if (!selectedFarm || isUpdating) return;

    const previousPriority = selectedPriority;

    setSelectedPriority(priority);
    setIsUpdating(true);
    setError(false);

    try {
      const updated = await generateCustomRotations(
        selectedFarm.id,
        priority
      );

      setData(updated);
    } catch (err) {
      console.error("Failed to update comparison:", err);
      setSelectedPriority(previousPriority);
      setError(true);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleRetry = useCallback(() => {
    setRetryCount((count) => count + 1);
  }, []);

  // Loading state
  if (loading) {
    return (
      <div className="min-h-[400px] flex flex-col items-center justify-center gap-3">
        <div className="w-9 h-9 border-[3px] border-[#39734C] border-t-transparent rounded-full animate-spin" />
        <p className="text-sm text-[#617367]">
          Preparing your rotation comparison...
        </p>
      </div>
    );
  }

  // No farm selected
  if (!selectedFarm) {
    return (
      <div className="min-h-[400px] flex flex-col items-center justify-center text-center gap-3">
        <Sprout className="w-10 h-10 text-[#39734C]" />
        <h2 className="text-lg font-bold text-[#183D2C]">
          Select a farm to get started
        </h2>
        <p className="text-sm text-[#617367]">
          Choose a farm to compare its crop rotation options.
        </p>
      </div>
    );
  }

  // Error state
  if (error || !data || !data.strategies?.length) {
    return (
      <div className="min-h-[400px] flex flex-col items-center justify-center text-center gap-3">
        <AlertTriangle className="w-9 h-9 text-[#B77935]" />

        <h2 className="text-lg font-bold text-[#183D2C]">
          Couldn't load your comparison
        </h2>

        <p className="text-sm text-[#617367]">
          Please try again.
        </p>

        <button
          onClick={handleRetry}
          className="flex items-center gap-2 bg-[#39734C] text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-[#285B39]"
        >
          <RefreshCw className="w-4 h-4" />
          Try again
        </button>
      </div>
    );
  }

  const recommended = data.strategies.find(
    (strategy) =>
      strategy.strategy_id === data.recommended_strategy_id
  );

  const chartData = data.strategies.map((strategy) => ({
    name: strategy.title,
    score: strategy.overall_score,
  }));

  return (
    <div className="space-y-8 pb-10">

      {/* HEADER */}

      <section className="space-y-2">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-xs font-semibold bg-[#EAF4ED] text-[#39734C] px-3 py-1 rounded-full">
            Crop Planning
          </span>

          <span className="text-xs text-[#617367]">
            {selectedFarm.name}
          </span>
        </div>

        <h1 className="text-2xl lg:text-3xl font-bold text-[#183D2C] font-serif">
          Compare Crop Rotations
        </h1>

        <p className="text-sm text-[#617367] max-w-2xl">
          See how different crop rotations compare in water use,
          soil health, climate suitability, and other important
          farming considerations.
        </p>
      </section>

      {/* FARMER PRIORITY */}

      <section className="bg-white border border-[#E8E2D2] rounded-2xl p-5 space-y-4">
        <div>
          <h2 className="text-base font-bold text-[#183D2C]">
            What matters most to your farm?
          </h2>

          <p className="text-xs text-[#839087] mt-1">
            Choose a priority to update the comparison.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {priorities.map((priority) => {
            const active = selectedPriority === priority.id;

            return (
              <button
                key={priority.id}
                onClick={() =>
                  handlePriorityChange(priority.id)
                }
                disabled={isUpdating}
                className={`p-4 rounded-xl border text-left transition ${
                  active
                    ? "bg-[#EAF4ED] border-[#39734C] ring-1 ring-[#39734C]/20"
                    : "bg-[#FAFAF7] border-[#E8E2D2] hover:border-[#9DBB78]"
                } ${isUpdating ? "opacity-60 cursor-wait" : ""}`}
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="text-sm font-semibold text-[#183D2C]">
                    {priority.label}
                  </span>

                  {active && (
                    <CheckCircle2 className="w-4 h-4 text-[#39734C]" />
                  )}
                </div>

                <p className="text-xs text-[#617367] mt-1">
                  {priority.description}
                </p>
              </button>
            );
          })}
        </div>

        {isUpdating && (
          <div className="flex items-center gap-2 text-xs text-[#39734C]">
            <div className="w-4 h-4 border-2 border-[#39734C] border-t-transparent rounded-full animate-spin" />
            Updating your comparison...
          </div>
        )}
      </section>

      {/* RECOMMENDED ROTATION */}

      {recommended && (
        <section className="bg-[#EAF4ED] border border-[#BCE0C8] rounded-2xl p-5 sm:p-6 space-y-4">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 bg-white rounded-xl flex items-center justify-center">
              <CheckCircle2 className="w-5 h-5 text-[#39734C]" />
            </div>

            <span className="text-sm font-semibold text-[#285B39]">
              Recommended for your farm
            </span>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-xl font-bold text-[#183D2C] font-serif">
                {recommended.title}
              </h2>

              <p className="text-sm text-[#39734C] mt-1 max-w-2xl">
                {recommended.summary}
              </p>
            </div>

            <div className="bg-white rounded-xl px-5 py-3 text-center shrink-0">
              <p className="text-[10px] font-semibold text-[#839087]">
                SUITABILITY SCORE
              </p>

              <p className="text-3xl font-bold text-[#183D2C]">
                {recommended.overall_score}
                <span className="text-xs font-normal text-[#839087]">
                  /100
                </span>
              </p>
            </div>
          </div>

          {recommended.potential_risks?.length > 0 && (
            <div className="border-t border-[#BCE0C8] pt-3 flex items-start gap-2">
              <Info className="w-4 h-4 text-[#39734C] shrink-0 mt-0.5" />

              <p className="text-xs text-[#285B39] leading-relaxed">
                Keep in mind: {recommended.potential_risks[0]}
              </p>
            </div>
          )}
        </section>
      )}

      {/* OVERALL SCORE COMPARISON */}

      <section className="bg-white border border-[#E8E2D2] rounded-2xl p-5 sm:p-6 space-y-5">
        <div>
          <h2 className="text-lg font-bold text-[#183D2C]">
            How do the rotations compare?
          </h2>

          <p className="text-xs text-[#839087] mt-1">
            Overall suitability scores for each rotation.
          </p>
        </div>

        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={chartData}
              layout="vertical"
              margin={{ top: 5, right: 20, left: 15, bottom: 5 }}
            >
              <CartesianGrid
                strokeDasharray="3 3"
                horizontal={false}
                stroke="#F0EDE4"
              />

              <XAxis
                type="number"
                domain={[0, 100]}
                tick={{ fill: "#839087", fontSize: 11 }}
              />

              <YAxis
                type="category"
                dataKey="name"
                width={125}
                tick={{ fill: "#617367", fontSize: 11 }}
              />

              <Tooltip
                formatter={(value) => [
                  `${value}/100`,
                  "Suitability",
                ]}
                contentStyle={{
                  backgroundColor: "#FFFFFF",
                  borderColor: "#DDD6C3",
                  borderRadius: "10px",
                  fontSize: "12px",
                }}
              />

              <Bar
                dataKey="score"
                name="Suitability"
                fill="#39734C"
                radius={[0, 6, 6, 0]}
                barSize={26}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <p className="text-[11px] text-[#839087] border-t border-[#F0EDE4] pt-3">
          Higher scores indicate a better match for the selected
          priorities. These scores are estimates, not predictions
          of crop yield or financial returns.
        </p>
      </section>

      {/* CRITERIA COMPARISON */}

      <section className="bg-white border border-[#E8E2D2] rounded-2xl p-5 sm:p-6 space-y-5">
        <div>
          <h2 className="text-lg font-bold text-[#183D2C]">
            Where does each rotation perform best?
          </h2>

          <p className="text-xs text-[#839087] mt-1">
            Compare the strengths of each option.
          </p>
        </div>

        <div className="space-y-5">
          {criteria.map((criterion) => {
            const Icon = criterion.icon;

            return (
              <div key={criterion.key} className="space-y-2">
                <div className="flex items-center gap-2">
                  <Icon className="w-4 h-4 text-[#39734C]" />

                  <div>
                    <h3 className="text-sm font-semibold text-[#183D2C]">
                      {criterion.label}
                    </h3>

                    <p className="text-[11px] text-[#839087]">
                      {criterion.description}
                    </p>
                  </div>
                </div>

                <div className="space-y-2 pl-6">
                  {data.strategies.map((strategy) => {
                    const score =
                      strategy.criteria_scores[criterion.key];

                    const isBest = data.strategies.every(
                      (other) =>
                        score >= other.criteria_scores[criterion.key]
                    );

                    return (
                      <div
                        key={strategy.strategy_id}
                        className="grid grid-cols-[minmax(90px,1fr)_2fr_35px] items-center gap-3"
                      >
                        <span className="text-[11px] text-[#617367] truncate">
                          {strategy.title}
                        </span>

                        <div className="h-2 rounded-full bg-[#F0EDE4] overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all ${
                              isBest
                                ? "bg-[#39734C]"
                                : "bg-[#9DBB78]"
                            }`}
                            style={{
                              width: `${Math.min(100, Math.max(0, score))}%`,
                            }}
                          />
                        </div>

                        <span className="text-xs font-semibold text-[#183D2C] text-right">
                          {score}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>

        <div className="flex items-center gap-2 border-t border-[#F0EDE4] pt-3">
          <span className="w-3 h-3 rounded-full bg-[#39734C]" />
          <span className="text-[11px] text-[#617367]">
            Highest score in that category
          </span>
        </div>

        <p className="text-[11px] text-[#839087]">
          Higher scores mean a stronger match for that particular
          consideration, based on the available data.
        </p>
      </section>

      {/* DETAILED COMPARISON */}

      <details className="group bg-white border border-[#E8E2D2] rounded-2xl">
        <summary className="flex items-center justify-between p-5 cursor-pointer list-none">
          <div>
            <h2 className="text-base font-bold text-[#183D2C]">
              Detailed comparison
            </h2>

            <p className="text-xs text-[#839087] mt-1">
              View all scores, crop sequences, and potential risks.
            </p>
          </div>

          <ChevronDown className="w-5 h-5 text-[#617367] transition-transform group-open:rotate-180" />
        </summary>

        <div className="px-5 pb-5 space-y-4">
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left min-w-[650px]">
              <thead className="bg-[#F8F8F3] text-[#617367]">
                <tr>
                  <th className="p-3">Rotation</th>
                  <th className="p-3">Overall</th>
                  <th className="p-3">Water</th>
                  <th className="p-3">Climate</th>
                  <th className="p-3">Soil</th>
                  <th className="p-3">Protection</th>
                  <th className="p-3">Diversity</th>
                  <th className="p-3">Market</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-[#F0EDE4]">
                {data.strategies.map((strategy) => (
                  <tr
                    key={strategy.strategy_id}
                    className={
                      strategy.strategy_id === data.recommended_strategy_id
                        ? "bg-[#EAF4ED]/50"
                        : ""
                    }
                  >
                    <td className="p-3 font-semibold text-[#183D2C]">
                      {strategy.title}
                    </td>

                    <td className="p-3 font-bold text-[#183D2C]">
                      {strategy.overall_score}
                    </td>

                    <td className="p-3">
                      {strategy.criteria_scores.water_resilience}
                    </td>

                    <td className="p-3">
                      {strategy.criteria_scores.climate_suitability}
                    </td>

                    <td className="p-3">
                      {strategy.criteria_scores.soil_improvement}
                    </td>

                    <td className="p-3">
                      {strategy.criteria_scores.erosion_protection}
                    </td>

                    <td className="p-3">
                      {strategy.criteria_scores.crop_diversity}
                    </td>

                    <td className="p-3">
                      {strategy.criteria_scores.market_suitability}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="space-y-3 pt-3 border-t border-[#F0EDE4]">
            {data.strategies.map((strategy) => (
              <div
                key={strategy.strategy_id}
                className="p-3 rounded-xl bg-[#F8F8F3] space-y-2"
              >
                <h3 className="text-sm font-semibold text-[#183D2C]">
                  {strategy.title}
                </h3>

                <p className="text-xs text-[#617367]">
                  Crops:{" "}
                  {strategy.crop_sequence
                    .map((crop) => crop.crop_name)
                    .join(" → ")}
                </p>

                {strategy.potential_risks?.length > 0 && (
                  <p className="text-xs text-[#A66B20]">
                    <AlertTriangle className="w-3.5 h-3.5 inline mr-1" />
                    {strategy.potential_risks.join(" ")}
                  </p>
                )}

                <div className="text-xs text-[#617367] flex items-center gap-2">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  Data confidence:{" "}
                  <strong className="text-[#183D2C]">
                    {Math.round(
                      strategy.data_confidence_score * 100
                    )}%
                  </strong>
                </div>
              </div>
            ))}
          </div>
        </div>
      </details>

      {/* FOOTER NAVIGATION */}

      <section className="flex flex-col sm:flex-row gap-3">
        <Link
          href="/rotation-planner"
          className="flex-1 flex items-center justify-center gap-2 bg-[#39734C] hover:bg-[#285B39] text-white px-5 py-3 rounded-xl text-sm font-semibold transition"
        >
          Back to Rotation Planner
          <ArrowRight className="w-4 h-4" />
        </Link>

        <Link
          href="/climate-simulator"
          className="flex-1 flex items-center justify-center gap-2 bg-white hover:bg-[#F8F8F3] border border-[#DDD6C3] text-[#26352C] px-5 py-3 rounded-xl text-sm font-semibold transition"
        >
          Explore future climate conditions
        </Link>
      </section>

      {/* DISCLAIMER */}

      <p className="text-[11px] text-[#839087] leading-relaxed">
        These scores represent comparative estimates based on
        available data and selected priorities. They do not guarantee
        crop yield, profitability, or future performance. Local
        farming knowledge should also guide the final decision.
      </p>
    </div>
  );
}
