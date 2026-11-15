
"use client";

import React, { useEffect, useState } from "react";
import { useFarm } from "@/context/FarmContext";
import { fetchRotations, generateCustomRotations } from "@/lib/api";
import { RotationComparisonResponse } from "@/types";
import {
  Sprout,
  Droplets,
  Leaf,
  ShieldCheck,
  CheckCircle2,
  Calendar,
  AlertTriangle,
  ArrowRight,
  ChevronDown,
  Sparkles,
  Info,
  RefreshCw,
  Wheat,
} from "lucide-react";
import Link from "next/link";

const priorities = [
  {
    id: "balanced",
    label: "Balanced",
    description: "A balance between soil, water, and productivity",
  },
  {
    id: "water_resilience",
    label: "Save Water",
    description: "Give more importance to water availability",
  },
  {
    id: "soil_restoration",
    label: "Improve Soil",
    description: "Focus on soil health and long-term fertility",
  },
];

export default function RotationPlannerPage() {
  const { selectedFarm } = useFarm();

  const [rotations, setRotations] =
    useState<RotationComparisonResponse | null>(null);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [activeStrategyIndex, setActiveStrategyIndex] = useState(0);
  const [selectedPriority, setSelectedPriority] =
    useState("balanced");
  const [isGenerating, setIsGenerating] = useState(false);

  // Load rotation strategies
  useEffect(() => {
    if (!selectedFarm) {
      setRotations(null);
      setLoading(false);
      return;
    }

    let cancelled = false;

    async function loadRotations() {
      setLoading(true);
      setError(false);

      try {
        const data = await fetchRotations(selectedFarm!.id);

        if (!cancelled) {
          setRotations(data);
          setSelectedPriority(selectedFarm!.primary_priority);
          setActiveStrategyIndex(0);
        }
      } catch (err) {
        console.error("Failed to load rotations:", err);

        if (!cancelled) {
          setError(true);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    loadRotations();

    return () => {
      cancelled = true;
    };
  }, [selectedFarm]);

  // Generate strategies based on farmer priority
  const handlePriorityChange = async (priority: string) => {
    if (!selectedFarm || isGenerating) return;

    setSelectedPriority(priority);
    setIsGenerating(true);

    try {
      const updated = await generateCustomRotations(
        selectedFarm.id,
        priority
      );

      setRotations(updated);
      setActiveStrategyIndex(0);
    } catch (err) {
      console.error("Failed to generate rotations:", err);
      setError(true);
    } finally {
      setIsGenerating(false);
    }
  };

  // Loading state
  if (loading) {
    return (
      <div className="min-h-[400px] flex flex-col items-center justify-center gap-3">
        <div className="w-9 h-9 border-[3px] border-[#39734C] border-t-transparent rounded-full animate-spin" />
        <p className="text-sm text-[#617367]">
          Finding suitable crop rotations for your farm...
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
        <p className="text-sm text-[#617367] max-w-sm">
          Choose a farm to explore crop rotation options suited to
          its environmental conditions.
        </p>
      </div>
    );
  }

  // Error state
  if (error || !rotations || !rotations.strategies?.length) {
    return (
      <div className="min-h-[400px] flex flex-col items-center justify-center text-center gap-3">
        <AlertTriangle className="w-9 h-9 text-[#B77935]" />

        <h2 className="text-lg font-bold text-[#183D2C]">
          Couldn't load your crop rotations
        </h2>

        <p className="text-sm text-[#617367]">
          Something went wrong. Please try again.
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

  const currentStrategy =
    rotations.strategies[activeStrategyIndex] ||
    rotations.strategies[0];

  const isRecommended =
    currentStrategy.strategy_id === rotations.recommended_strategy_id;

  return (
    <div className="space-y-6 pb-10">

      {/* ==========================================
          PAGE HEADER
      ========================================== */}

      <section className="flex flex-col justify-between gap-4 border-b border-[#E1E6DF] pb-5 md:flex-row md:items-end">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-[#377C52]">Crop planning</p>
          <h1 className="mt-1 text-2xl font-semibold tracking-tight text-[#19382A] lg:text-3xl">
            Plan your next rotation
          </h1>
          <p className="mt-1 max-w-2xl text-sm text-[#718078]">
            Choose what matters most, then review a crop plan suited to {selectedFarm.name}.
          </p>
        </div>
        <span className="text-xs font-medium text-[#718078]">Step 1 of 3 · Your goal</span>
      </section>


      {/* ==========================================
          FARMER PRIORITY
      ========================================== */}

      <section className="rounded-2xl border border-[#E1E6DF] bg-white p-5 shadow-[0_2px_8px_rgba(27,61,43,0.03)] sm:p-6">

        <div>
          <h2 className="text-lg font-semibold text-[#19382A]">
            What is most important for this season?
          </h2>

          <p className="mt-1 text-xs text-[#718078]">
            We will adjust the suggestions to match your farming goal.
          </p>
        </div>

        <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-3">

          {priorities.map((priority) => {
            const selected = selectedPriority === priority.id;

            return (
              <button
                key={priority.id}
                onClick={() => handlePriorityChange(priority.id)}
                disabled={isGenerating}
                className={`p-4 rounded-xl border text-left transition ${
                  selected
                    ? "bg-[#F1F7EE] border-[#377C52] ring-1 ring-[#377C52]/20"
                    : "bg-[#FAFBF8] border-[#E1E6DF] hover:border-[#A7C77D]"
                } ${isGenerating ? "opacity-60 cursor-wait" : ""}`}
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="text-sm font-semibold text-[#19382A]">
                    {priority.label}
                  </span>

                  {selected && (
                    <CheckCircle2 className="w-4 h-4 text-[#39734C]" />
                  )}
                </div>

                <p className="mt-1 text-xs leading-relaxed text-[#718078]">
                  {priority.description}
                </p>
              </button>
            );
          })}

        </div>

        {isGenerating && (
          <div className="mt-4 flex items-center gap-2 text-xs text-[#377C52]">
            <div className="h-4 w-4 animate-spin rounded-full border-2 border-[#377C52] border-t-transparent" />
            Updating your crop rotation options...
          </div>
        )}

      </section>


      {/* ==========================================
          ROTATION OPTIONS
      ========================================== */}

      <section className="space-y-4">

        <div>
          <div className="flex items-end justify-between gap-3">
            <div>
          <h2 className="text-lg font-semibold text-[#19382A]">
            Step 2 · Choose a plan
          </h2>

          <p className="mt-1 text-sm text-[#718078]">
            Select a plan to see its crops, score, and trade-offs.
          </p>
            </div>
            <span className="hidden text-xs text-[#718078] sm:block">Tap a card to view details</span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">

          {rotations.strategies.map((strategy, index) => {
            const selected = activeStrategyIndex === index;

            const recommended =
              strategy.strategy_id === rotations.recommended_strategy_id;

            return (
              <button
                key={strategy.strategy_id}
                onClick={() => setActiveStrategyIndex(index)}
                className={`relative p-5 rounded-2xl border text-left transition flex flex-col ${
                  selected
                    ? "bg-white border-[#377C52] ring-2 ring-[#377C52]/15 shadow-sm"
                    : "bg-white border-[#E1E6DF] hover:border-[#A7C77D]"
                }`}
              >
                {recommended && (
                  <span className="absolute -top-2.5 right-4 rounded-full bg-[#377C52] px-3 py-1 text-[10px] font-semibold text-white">
                    Recommended
                  </span>
                )}

                <div className="flex items-center gap-2 mb-3">
                  <div className="w-9 h-9 rounded-lg bg-[#EAF4ED] flex items-center justify-center">
                    {strategy.strategy_type === "baseline" ? (
                      <Wheat className="w-4 h-4 text-[#39734C]" />
                    ) : strategy.strategy_type === "soil_restoration" ? (
                      <Sprout className="w-4 h-4 text-[#39734C]" />
                    ) : (
                      <Droplets className="w-4 h-4 text-[#39734C]" />
                    )}
                  </div>

                  <span className="text-[11px] text-[#839087]">
                    Option {index + 1}
                  </span>
                </div>

                <h3 className="text-base font-bold text-[#183D2C]">
                  {strategy.title}
                </h3>

                <p className="text-xs text-[#617367] leading-relaxed mt-2 flex-1">
                  {strategy.summary}
                </p>

                <div className="flex items-center justify-between border-t border-[#F0EDE4] pt-3 mt-4">
                  <span className="text-xs text-[#617367]">
                    Suitability score
                  </span>

                  <span className="text-lg font-bold text-[#183D2C]">
                    {strategy.overall_score}
                    <span className="text-xs font-normal text-[#839087]">
                      /100
                    </span>
                  </span>
                </div>

                {selected && (
                  <div className="text-xs font-semibold text-[#39734C] mt-3 flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    Currently viewing
                  </div>
                )}
              </button>
            );
          })}

        </div>

        <p className="text-[11px] text-[#839087]">
          Scores are comparative suitability estimates based on the
          available data and selected priorities, not guaranteed crop yields.
        </p>

      </section>


      {/* ==========================================
          SELECTED ROTATION
      ========================================== */}

      <section className="bg-white rounded-2xl border border-[#E8E2D2] p-5 sm:p-7 space-y-7">

        {/* Selected strategy heading */}

        <div className="flex flex-col justify-between gap-4 border-b border-[#F0EDE4] pb-5 sm:flex-row sm:items-start">
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              {isRecommended && (
                <span className="rounded-full bg-[#EAF4ED] px-2.5 py-1 text-xs font-semibold text-[#39734C]">
                  Recommended for your farm
                </span>
              )}
              {currentStrategy.strategy_type === "baseline" && (
                <span className="rounded-full bg-[#F1F2EE] px-2.5 py-1 text-xs font-medium text-[#617367]">
                  Current approach
                </span>
              )}
            </div>
            <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-[#377C52]">
              Step 3 · Review this plan
            </p>
            <h2 className="text-xl font-semibold text-[#19382A] sm:text-2xl">
              {currentStrategy.title}
            </h2>
            <p className="max-w-2xl text-sm leading-relaxed text-[#617367]">
              {currentStrategy.summary}
            </p>
          </div>

          <div className="bg-[#F8F8F3] rounded-xl p-4 text-center shrink-0 min-w-[110px]">
            <p className="text-[10px] text-[#839087] font-semibold">
              SUITABILITY
            </p>

            <p className="text-3xl font-bold text-[#183D2C] mt-1">
              {currentStrategy.overall_score}
            </p>

            <p className="text-xs text-[#839087]">
              out of 100
            </p>
          </div>

        </div>


        {/* Crop sequence */}

        <div className="space-y-4">

          <div>
            <h3 className="text-base font-bold text-[#183D2C] flex items-center gap-2">
              <Calendar className="w-4 h-4 text-[#39734C]" />
              Your crop sequence
            </h3>

            <p className="text-xs text-[#839087] mt-1">
              See which crops are planned for each season.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">

            {currentStrategy.crop_sequence.map((slot, index) => (
              <div
                key={`${slot.year_index}-${slot.season_name}-${index}`}
                className="bg-[#F8F8F3] rounded-xl border border-[#E8E2D2] p-4 space-y-3"
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs font-semibold text-[#617367]">
                    Year {slot.year_index}
                  </span>

                  <span className="text-[10px] font-semibold text-[#39734C] bg-[#EAF4ED] px-2 py-1 rounded-full">
                    {slot.season_name}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <div className="w-9 h-9 rounded-lg bg-white flex items-center justify-center">
                    <Sprout className="w-5 h-5 text-[#39734C]" />
                  </div>

                  <div>
                    <h4 className="text-sm font-bold text-[#183D2C]">
                      {slot.crop_name}
                    </h4>

                    <p className="text-[10px] text-[#839087]">
                      {slot.crop_family}
                    </p>
                  </div>
                </div>

                <div className="space-y-2 border-t border-[#E8E2D2] pt-3">

                  <div className="flex items-center justify-between text-xs">
                    <span className="flex items-center gap-1.5 text-[#617367]">
                      <Droplets className="w-3.5 h-3.5" />
                      Water needed
                    </span>

                    <strong className="text-[#183D2C]">
                      {slot.water_demand_mm} mm
                    </strong>
                  </div>

                  <div className="flex items-center justify-between text-xs">
                    <span className="flex items-center gap-1.5 text-[#617367]">
                      <Leaf className="w-3.5 h-3.5" />
                      Nitrogen added
                    </span>

                    <strong className="text-[#39734C]">
                      {slot.nitrogen_fixation_kg_ha > 0
                        ? `${slot.nitrogen_fixation_kg_ha} kg/ha`
                        : "None"}
                    </strong>
                  </div>

                  <div className="flex items-center justify-between text-xs">
                    <span className="text-[#617367]">
                      Soil cover
                    </span>

                    <strong className="text-[#183D2C]">
                      {slot.erosion_cover}
                    </strong>
                  </div>

                </div>

                <div className="bg-white rounded-lg p-2.5">
                  <p className="text-[10px] text-[#839087] font-semibold mb-1">
                    WHY THIS CROP?
                  </p>

                  <p className="text-xs text-[#617367] leading-relaxed">
                    {slot.soil_role}
                  </p>
                </div>

              </div>
            ))}

          </div>
        </div>


        {/* Why this rotation */}

        <div className="border-t border-[#F0EDE4] pt-6 space-y-4">

          <div>
            <h3 className="text-base font-bold text-[#183D2C]">
              Why consider this rotation?
            </h3>

            <p className="text-xs text-[#839087] mt-1">
              Understand what makes this option suitable for your farm.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

            {/* Reasons */}

            <div className="bg-[#EAF4ED] rounded-xl p-4 space-y-3">
              <h4 className="text-sm font-semibold text-[#285B39] flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4" />
                Reasons for this suggestion
              </h4>

              <div className="space-y-2">
                {currentStrategy.reasons_for_recommendation.map(
                  (reason, index) => (
                    <div key={index} className="flex gap-2 text-xs text-[#285B39]">
                      <span className="font-bold">•</span>
                      <p className="leading-relaxed">{reason}</p>
                    </div>
                  )
                )}
              </div>

              {currentStrategy.environmental_evidence.length > 0 && (
                <div className="border-t border-[#BCE0C8] pt-3 space-y-2">
                  <p className="text-[11px] font-semibold text-[#285B39]">
                    Supporting farm data
                  </p>

                  {currentStrategy.environmental_evidence.map(
                    (evidence, index) => (
                      <p
                        key={index}
                        className="text-xs text-[#39734C] leading-relaxed"
                      >
                        • {evidence}
                      </p>
                    )
                  )}
                </div>
              )}
            </div>


            {/* Benefits */}

            <div className="bg-[#F8F8F3] rounded-xl p-4 space-y-3">
              <h4 className="text-sm font-semibold text-[#183D2C] flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-[#39734C]" />
                Potential benefits
              </h4>

              <div className="space-y-2">
                {currentStrategy.potential_benefits.map(
                  (benefit, index) => (
                    <div key={index} className="flex gap-2 text-xs text-[#617367]">
                      <span className="text-[#39734C] font-bold">+</span>
                      <p className="leading-relaxed">{benefit}</p>
                    </div>
                  )
                )}
              </div>
            </div>

          </div>
        </div>


        {/* Risks and data limitations */}

        <div className="border-t border-[#F0EDE4] pt-6 space-y-3">

          <h3 className="text-base font-bold text-[#183D2C]">
            Things to keep in mind
          </h3>

          <details className="group bg-[#FFF9EC] border border-[#EAD7A5] rounded-xl">

            <summary className="flex items-center justify-between p-4 cursor-pointer list-none">
              <span className="flex items-center gap-2 text-sm font-semibold text-[#7A5A12]">
                <AlertTriangle className="w-4 h-4" />
                Possible risks
              </span>

              <ChevronDown className="w-4 h-4 text-[#7A5A12] transition-transform group-open:rotate-180" />
            </summary>

            <div className="px-4 pb-4 space-y-2">
              {currentStrategy.potential_risks.map((risk, index) => (
                <div key={index} className="flex gap-2 text-xs text-[#7A5A12]">
                  <span>•</span>
                  <p className="leading-relaxed">{risk}</p>
                </div>
              ))}
            </div>

          </details>


          <details className="group bg-[#F8F8F3] border border-[#E8E2D2] rounded-xl">

            <summary className="flex items-center justify-between p-4 cursor-pointer list-none">
              <span className="flex items-center gap-2 text-sm font-semibold text-[#617367]">
                <Info className="w-4 h-4" />
                Data limitations and reliability
              </span>

              <ChevronDown className="w-4 h-4 text-[#617367] transition-transform group-open:rotate-180" />
            </summary>

            <div className="px-4 pb-4 space-y-3">

              <div className="space-y-2">
                {currentStrategy.missing_data_warnings.map(
                  (warning, index) => (
                    <p key={index} className="text-xs text-[#617367] leading-relaxed">
                      • {warning}
                    </p>
                  )
                )}
              </div>

              <div className="pt-3 border-t border-[#E8E2D2] flex items-center justify-between">
                <span className="text-xs text-[#617367]">
                  Data confidence
                </span>

                <span className="text-sm font-bold text-[#183D2C]">
                  {Math.round(currentStrategy.data_confidence_score * 100)}%
                </span>
              </div>

              <p className="text-[11px] text-[#839087]">
                Confidence reflects the availability and quality of
                the data used in this suggestion. It does not guarantee
                the success of a crop or growing season.
              </p>

            </div>

          </details>

        </div>


        {/* Footer links */}

        <div className="border-t border-[#F0EDE4] pt-5 flex flex-col sm:flex-row gap-3">

          <Link
            href="/rotation-comparison"
            className="flex-1 flex items-center justify-center gap-2 bg-[#39734C] hover:bg-[#285B39] text-white px-5 py-3 rounded-xl text-sm font-semibold transition"
          >
            Compare all rotations
            <ArrowRight className="w-4 h-4" />
          </Link>

          <Link
            href="/climate-simulator"
            className="flex-1 flex items-center justify-center gap-2 bg-[#F8F8F3] hover:bg-[#EFECE1] border border-[#DDD6C3] text-[#26352C] px-5 py-3 rounded-xl text-sm font-semibold transition"
          >
            <Sparkles className="w-4 h-4 text-[#39734C]" />
            Explore future climate conditions
          </Link>

        </div>

      </section>


      {/* Disclaimer */}

      <p className="text-[11px] text-[#839087] leading-relaxed flex items-start gap-2">
        <ShieldCheck className="w-4 h-4 shrink-0" />
        These rotation options are planning suggestions based on available
        environmental and crop data. Actual results depend on local
        conditions, farming practices, water availability, and other
        factors. Consult local agricultural guidance before making
        major changes.
      </p>

    </div>
  );
}
