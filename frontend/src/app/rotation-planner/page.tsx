"use client";

import React, { useEffect, useState } from "react";
import { useFarm } from "@/context/FarmContext";
import { fetchRotations, generateCustomRotations } from "@/lib/api";
import { PageSkeleton } from "@/components/PageSkeleton";
import { RotationComparisonResponse, RotationStrategy } from "@/types";
import {
  Layers,
  Sparkles,
  Droplets,
  Sprout,
  ShieldCheck,
  CheckCircle2,
  Calendar,
  AlertTriangle,
  ArrowRight,
  Sliders,
  Dna,
} from "lucide-react";
import Link from "next/link";

export default function RotationPlannerPage() {
  const { selectedFarm } = useFarm();
  const [rotations, setRotations] = useState<RotationComparisonResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeStrategyIndex, setActiveStrategyIndex] = useState(0);
  const [selectedPriority, setSelectedPriority] = useState<string>("balanced");
  const [isGenerating, setIsGenerating] = useState(false);

  useEffect(() => {
    if (!selectedFarm) return;
    setLoading(true);
    setError(null);
    fetchRotations(selectedFarm.id)
      .then((data) => {
        setRotations(data);
        setSelectedPriority(selectedFarm.primary_priority);
      })
      .catch((reason) => setError(reason instanceof Error ? reason.message : "Rotation plan failed to load."))
      .finally(() => setLoading(false));
  }, [selectedFarm]);

  const handlePriorityChange = async (priority: string) => {
    if (!selectedFarm) return;
    setSelectedPriority(priority);
    setIsGenerating(true);
    try {
      const updated = await generateCustomRotations(selectedFarm.id, priority);
      setRotations(updated);
    } catch (e) {
      console.error(e);
    } finally {
      setIsGenerating(false);
    }
  };

  if (loading) {
    return <PageSkeleton cards={3} detailPanels={2} />;
  }
  if (error || !rotations || !selectedFarm) {
    return <div className="p-6 rounded-2xl bg-[#FDF2F0] border border-[#E7B8B4] text-sm text-[#8B2F2A]">{error || "No rotation plan is available."}</div>;
  }

  const currentStrategy = rotations.strategies[activeStrategyIndex] || rotations.strategies[0];

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Header and Priority Selector Strip */}
      <div className="bg-[#FFFFFF] rounded-2xl p-6 border border-[#E8E2D2] shadow-xs flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="text-xs font-bold uppercase tracking-wider text-[#39734C] bg-[#EAF4ED] px-2.5 py-0.5 rounded-full">
              Decision-Support Engine
            </span>
            <span className="text-xs text-[#617367]">Farm: {selectedFarm.name}</span>
          </div>
          <h2 className="text-2xl lg:text-3xl font-extrabold text-[#183D2C] tracking-tight font-serif">
            Crop Rotation Strategy Planner
          </h2>
          <p className="text-xs text-[#617367] mt-1 max-w-2xl">
            Generates feasible multi-year rotation scenarios matching your local NASA weather records,
            soil profile, and management objectives.
          </p>
        </div>

        {/* Priority Filter Tabs */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2">
          <span className="text-xs font-semibold text-[#617367] flex items-center gap-1">
            <Sliders className="w-3.5 h-3.5 text-[#39734C]" />
            Farmer Goal:
          </span>
          <div className="bg-[#F8F8F3] p-1 rounded-xl border border-[#DDD6C3] flex items-center gap-1 text-xs font-medium">
            {[
              { id: "balanced", label: "Balanced" },
              { id: "water_resilience", label: "Water Resilience" },
              { id: "soil_restoration", label: "Soil Restoration" },
            ].map((prio) => (
              <button
                key={prio.id}
                onClick={() => handlePriorityChange(prio.id)}
                disabled={isGenerating}
                className={`px-3 py-1.5 rounded-lg transition ${
                  selectedPriority === prio.id
                    ? "bg-[#39734C] text-white font-semibold shadow-xs"
                    : "text-[#26352C] hover:bg-[#EFECE1]"
                }`}
              >
                {prio.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* 3 Mandatory Strategy Selector Tabs */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {rotations.strategies.map((strat, idx) => {
          const isSelected = activeStrategyIndex === idx;
          const isRecommended = strat.strategy_id === rotations.recommended_strategy_id;
          return (
            <button
              key={strat.strategy_id}
              onClick={() => setActiveStrategyIndex(idx)}
              className={`p-5 rounded-2xl border text-left transition relative flex flex-col justify-between shadow-xs ${
                isSelected
                  ? "bg-[#FFFFFF] border-[#39734C] ring-2 ring-[#39734C]/20"
                  : "bg-[#FFFFFF]/75 border-[#E8E2D2] hover:bg-[#FFFFFF] hover:border-[#DDD6C3]"
              }`}
            >
              <div>
                <div className="flex items-center justify-between gap-2 mb-2">
                  <span
                    className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${
                      strat.strategy_type === "baseline"
                        ? "bg-[#F0EDE4] text-[#617367]"
                        : strat.strategy_type === "soil_restoration"
                        ? "bg-[#EAF4ED] text-[#2E6A44]"
                        : "bg-[#E6F3FA] text-[#236894]"
                    }`}
                  >
                    Strategy {idx + 1}: {strat.strategy_type.replace("_", " ")}
                  </span>
                  {isRecommended && (
                    <span className="text-[10px] font-bold text-[#39734C] bg-[#EAF4ED] px-2 py-0.5 rounded-full border border-[#9DBB78]/40">
                      ★ Highest Fit
                    </span>
                  )}
                </div>

                <h3 className="text-base font-bold text-[#183D2C] mb-1 font-serif">
                  {strat.title}
                </h3>
                <p className="text-xs text-[#617367] leading-relaxed line-clamp-2">
                  {strat.summary}
                </p>
              </div>

              <div className="pt-3 border-t border-[#F0EDE4] mt-3 flex items-center justify-between text-xs">
                <span className="text-[#617367]">MCDA Suitability:</span>
                <span className="text-base font-extrabold text-[#183D2C] font-serif">
                  {strat.overall_score} <span className="text-xs font-normal text-[#617367]">/ 100</span>
                </span>
              </div>
            </button>
          );
        })}
      </div>

      {/* Selected Strategy Deep-Dive Details */}
      <div className="bg-[#FFFFFF] rounded-2xl p-6 lg:p-8 border border-[#E8E2D2] shadow-xs space-y-8">
        {/* Strategy Header Banner */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-[#F0EDE4]">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs font-bold uppercase tracking-wider text-[#39734C]">
                Detailed Agronomic Trajectory
              </span>
              <span className="text-xs text-[#617367] font-mono">
                Optimization: {currentStrategy.optimization_method}
              </span>
            </div>
            <h3 className="text-2xl font-extrabold text-[#183D2C] font-serif">
              {currentStrategy.title}
            </h3>
            <p className="text-xs text-[#617367] mt-1 max-w-3xl leading-relaxed">
              {currentStrategy.summary}
            </p>
          </div>

          <div className="bg-[#F8F8F3] px-5 py-3 rounded-2xl border border-[#DDD6C3] text-center shrink-0">
            <span className="text-[10px] text-[#617367] uppercase font-bold tracking-wider block">
              Multi-Criteria Score
            </span>
            <span className="text-3xl font-extrabold text-[#183D2C] font-serif">
              {currentStrategy.overall_score}
            </span>
            <span className="text-xs text-[#617367] block">out of 100</span>
          </div>
        </div>

        {/* Multi-Year Crop Sequence Visual Timeline */}
        <div className="space-y-4">
          <h4 className="text-sm font-bold uppercase tracking-wider text-[#183D2C] flex items-center gap-2">
            <Calendar className="w-4 h-4 text-[#39734C]" />
            Multi-Season Crop Sequence Progression
          </h4>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {currentStrategy.crop_sequence.map((slot, idx) => (
              <div
                key={idx}
                className="p-4 rounded-2xl bg-[#F8F8F3] border border-[#DDD6C3] relative flex flex-col justify-between space-y-3"
              >
                <div>
                  <div className="flex items-center justify-between text-[11px] font-semibold text-[#617367] mb-1">
                    <span>Year {slot.year_index}</span>
                    <span className="text-[#39734C] bg-[#FFFFFF] px-2 py-0.5 rounded border border-[#E8E2D2]">
                      {slot.season_name}
                    </span>
                  </div>

                  <h5 className="text-base font-bold text-[#183D2C]">{slot.crop_name}</h5>
                  <span className="text-[11px] text-[#617367] font-medium block">
                    Family: <em>{slot.crop_family}</em>
                  </span>
                </div>

                <div className="space-y-1.5 pt-2 border-t border-[#DDD6C3] text-[11px]">
                  <div className="flex justify-between">
                    <span className="text-[#617367]">Water Need:</span>
                    <span className="font-semibold">{slot.water_demand_mm} mm</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#617367]">Biological N-Fix:</span>
                    <span className="font-semibold text-[#2E6A44]">
                      {slot.nitrogen_fixation_kg_ha > 0 ? `+${slot.nitrogen_fixation_kg_ha} kg/ha` : "None"}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#617367]">Canopy Cover:</span>
                    <span className="font-semibold">{slot.erosion_cover}</span>
                  </div>
                  <p className="text-[10px] text-[#617367] pt-1 italic border-t border-[#DDD6C3]/50">
                    Role: {slot.soil_role}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Explainability, Evidence & Risks Grid (PART 7 Requirement) */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 pt-4 border-t border-[#F0EDE4]">
          {/* Why Suggested & Benefits */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-[#39734C] flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4" />
              Reasons for Recommendation & Empirical Evidence
            </h4>
            <div className="p-4 rounded-xl bg-[#EAF4ED] border border-[#BCE0C8] space-y-2 text-xs text-[#183D2C]">
              {currentStrategy.reasons_for_recommendation.map((reason, i) => (
                <div key={i} className="flex items-start gap-2">
                  <span className="text-[#39734C] font-bold">•</span>
                  <p className="leading-relaxed">{reason}</p>
                </div>
              ))}
              {currentStrategy.environmental_evidence.map((evidence, i) => (
                <div key={i} className="flex items-start gap-2 pt-1 border-t border-[#BCE0C8]/50">
                  <span className="text-[#39734C] font-bold">✓</span>
                  <p className="leading-relaxed font-mono text-[11px] text-[#26533D]">{evidence}</p>
                </div>
              ))}
            </div>

            <h4 className="text-xs font-bold uppercase tracking-wider text-[#39734C] flex items-center gap-1.5 pt-2">
              <Sparkles className="w-4 h-4" />
              Anticipated Agronomic Benefits
            </h4>
            <div className="space-y-1.5 text-xs text-[#26352C]">
              {currentStrategy.potential_benefits.map((b, i) => (
                <div key={i} className="flex items-start gap-2">
                  <span className="text-[#39734C] font-bold">+</span>
                  <p>{b}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Potential Risks & Missing Information Awareness */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-[#B83E38] flex items-center gap-1.5">
              <AlertTriangle className="w-4 h-4" />
              Potential Risks & Management Vulnerabilities
            </h4>
            <div className="p-4 rounded-xl bg-[#FFF9EC] border border-[#EAD7A5] space-y-2 text-xs text-[#7A5A12]">
              {currentStrategy.potential_risks.map((risk, i) => (
                <div key={i} className="flex items-start gap-2">
                  <span className="font-bold">⚠</span>
                  <p className="leading-relaxed">{risk}</p>
                </div>
              ))}
            </div>

            <h4 className="text-xs font-bold uppercase tracking-wider text-[#617367] flex items-center gap-1.5 pt-2">
              <ShieldCheck className="w-4 h-4" />
              Data Provenance & Missing Coverage Notices
            </h4>
            <div className="p-4 rounded-xl bg-[#F8F8F3] border border-[#DDD6C3] space-y-2 text-xs text-[#617367]">
              {currentStrategy.missing_data_warnings.map((warn, i) => (
                <div key={i} className="flex items-start gap-2">
                  <span className="text-[#39734C] font-bold">ℹ</span>
                  <p className="leading-relaxed">{warn}</p>
                </div>
              ))}
              <div className="pt-2 border-t border-[#DDD6C3] flex items-center justify-between text-[11px]">
                <span>Data Coverage Confidence:</span>
                <strong className="text-[#183D2C]">
                  {Math.round(currentStrategy.data_confidence_score * 100)}%
                </strong>
              </div>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="pt-6 border-t border-[#F0EDE4] flex flex-wrap items-center justify-between gap-4">
          <Link
            href="/rotation-comparison"
            className="flex items-center gap-2 bg-[#39734C] hover:bg-[#183D2C] text-white px-5 py-2.5 rounded-xl text-xs font-semibold shadow-xs transition"
          >
            <span>Proceed to 6-Criteria Radar Comparison</span>
            <ArrowRight className="w-4 h-4" />
          </Link>

          <Link
            href="/climate-simulator"
            className="flex items-center gap-2 bg-[#F8F8F3] hover:bg-[#EFECE1] border border-[#DDD6C3] text-[#26352C] px-4 py-2 rounded-xl text-xs font-semibold transition"
          >
            <Sparkles className="w-3.5 h-3.5 text-[#39734C]" />
            <span>Test Under Simulated Climate Stress</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
