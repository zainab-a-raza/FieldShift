"use client";

import React, { useEffect, useState } from "react";
import { useFarm } from "@/context/FarmContext";
import { fetchRotations, generateCustomRotations } from "@/lib/api";
import { RotationComparisonResponse } from "@/types";
import {
  Scale,
  Radar,
  Sliders,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  ShieldCheck,
  TrendingUp,
  Droplets,
  Sprout,
  Sun,
  Shield,
  Layers,
  CircleDollarSign,
} from "lucide-react";
import Link from "next/link";
import {
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar as RechartsRadar,
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from "recharts";

export default function RotationComparisonPage() {
  const { selectedFarm } = useFarm();
  const [data, setData] = useState<RotationComparisonResponse | null>(null);
  const [loading, setLoading] = useState(true);

  // Dynamic weight sliders
  const [weights, setWeights] = useState({
    water_resilience: 25,
    climate_suitability: 20,
    soil_improvement: 20,
    erosion_protection: 15,
    crop_diversity: 10,
    market_suitability: 10,
  });

  const [isUpdating, setIsUpdating] = useState(false);

  useEffect(() => {
    if (!selectedFarm) return;
    setLoading(true);
    fetchRotations(selectedFarm.id)
      .then(setData)
      .finally(() => setLoading(false));
  }, [selectedFarm]);

  const handleWeightChange = async (key: string, val: number) => {
    const nextWeights = { ...weights, [key]: val };
    setWeights(nextWeights);

    if (!selectedFarm) return;
    setIsUpdating(true);
    try {
      // Normalize to sum = 1.0
      const total = Object.values(nextWeights).reduce((a, b) => a + b, 0);
      const normalizedWeights: Record<string, number> = {};
      for (const [k, v] of Object.entries(nextWeights)) {
        normalizedWeights[k] = v / total;
      }
      const updated = await generateCustomRotations(
        selectedFarm.id,
        selectedFarm.primary_priority,
        normalizedWeights
      );
      setData(updated);
    } catch (e) {
      console.error(e);
    } finally {
      setIsUpdating(false);
    }
  };

  if (loading || !data || !selectedFarm) {
    return (
      <div className="py-20 flex flex-col items-center justify-center space-y-4">
        <div className="w-10 h-10 border-4 border-[#39734C] border-t-transparent rounded-full animate-spin"></div>
        <p className="text-sm font-semibold text-[#617367]">
          Assembling Multi-Criteria Radar Matrices...
        </p>
      </div>
    );
  }

  const baseline = data.strategies[0];
  const soilStrat = data.strategies[1];
  const waterStrat = data.strategies[2];

  // Radar chart formatted data
  const radarData = [
    {
      criterion: "Water Resilience",
      Baseline: baseline?.criteria_scores.water_resilience || 45,
      "Soil Restoration": soilStrat?.criteria_scores.water_resilience || 65,
      "Water Resilience": waterStrat?.criteria_scores.water_resilience || 95,
      fullMark: 100,
    },
    {
      criterion: "Climate Fit",
      Baseline: baseline?.criteria_scores.climate_suitability || 60,
      "Soil Restoration": soilStrat?.criteria_scores.climate_suitability || 80,
      "Water Resilience": waterStrat?.criteria_scores.climate_suitability || 90,
      fullMark: 100,
    },
    {
      criterion: "Soil Health",
      Baseline: baseline?.criteria_scores.soil_improvement || 40,
      "Soil Restoration": soilStrat?.criteria_scores.soil_improvement || 95,
      "Water Resilience": waterStrat?.criteria_scores.soil_improvement || 70,
      fullMark: 100,
    },
    {
      criterion: "Erosion Guard",
      Baseline: baseline?.criteria_scores.erosion_protection || 50,
      "Soil Restoration": soilStrat?.criteria_scores.erosion_protection || 85,
      "Water Resilience": waterStrat?.criteria_scores.erosion_protection || 75,
      fullMark: 100,
    },
    {
      criterion: "Crop Diversity",
      Baseline: baseline?.criteria_scores.crop_diversity || 30,
      "Soil Restoration": soilStrat?.criteria_scores.crop_diversity || 90,
      "Water Resilience": waterStrat?.criteria_scores.crop_diversity || 85,
      fullMark: 100,
    },
    {
      criterion: "Market Liquidity",
      Baseline: baseline?.criteria_scores.market_suitability || 95,
      "Soil Restoration": soilStrat?.criteria_scores.market_suitability || 85,
      "Water Resilience": waterStrat?.criteria_scores.market_suitability || 75,
      fullMark: 100,
    },
  ];

  // Bar chart side-by-side comparison
  const barData = data.strategies.map((strat) => ({
    name: strat.title.replace("Regenerative ", "").replace("Climate & ", ""),
    Overall: strat.overall_score,
    Water: strat.criteria_scores.water_resilience,
    Soil: strat.criteria_scores.soil_improvement,
    Market: strat.criteria_scores.market_suitability,
  }));

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Page Header */}
      <div>
        <div className="flex items-center gap-2 mb-1">
          <span className="text-xs font-bold uppercase tracking-wider text-[#39734C] bg-[#EAF4ED] px-2.5 py-0.5 rounded-full">
            MCDA Comparative Evaluation
          </span>
          <span className="text-xs text-[#617367]">Holding: {selectedFarm.name}</span>
        </div>
        <h2 className="text-2xl lg:text-3xl font-extrabold text-[#183D2C] tracking-tight font-serif">
          Rotation Strategy Comparison
        </h2>
        <p className="text-xs text-[#617367] mt-1 max-w-3xl">
          Side-by-side multi-criteria analysis of your existing rotation against soil-restoration
          and drought-resilient alternatives.
        </p>
      </div>

      {/* Interactive Weight Tuning Controls */}
      <div className="bg-[#FFFFFF] rounded-2xl p-6 border border-[#E8E2D2] shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h3 className="text-sm font-bold uppercase tracking-wider text-[#183D2C] flex items-center gap-2">
              <Sliders className="w-4 h-4 text-[#39734C]" />
              Adjust Farmer Preference Weights (Must Total 100%)
            </h3>
            <p className="text-[11px] text-[#617367]">
              Sliders dynamically reweight the Multi-Criteria Decision Engine to reflect your operational priorities.
            </p>
          </div>
          <span className="text-xs font-mono font-bold text-[#39734C] bg-[#EAF4ED] px-3 py-1 rounded-full border border-[#9DBB78]/40">
            Current Total: {Object.values(weights).reduce((a, b) => a + b, 0)}%
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4 text-xs">
          {[
            { key: "water_resilience", label: "Water Resilience", icon: Droplets },
            { key: "climate_suitability", label: "Climate Fit", icon: Sun },
            { key: "soil_improvement", label: "Soil Health", icon: Sprout },
            { key: "erosion_protection", label: "Erosion Guard", icon: Shield },
            { key: "crop_diversity", label: "Diversity", icon: Layers },
            { key: "market_suitability", label: "Market Viability", icon: CircleDollarSign },
          ].map((item) => {
            const Icon = item.icon;
            const val = (weights as any)[item.key];
            return (
              <div key={item.key} className="p-3 rounded-xl bg-[#F8F8F3] border border-[#DDD6C3]">
                <div className="flex items-center justify-between font-semibold text-[#183D2C] mb-1.5">
                  <span className="flex items-center gap-1">
                    <Icon className="w-3.5 h-3.5 text-[#39734C]" />
                    {item.label}
                  </span>
                  <span className="font-mono text-[#39734C]">{val}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="50"
                  step="5"
                  value={val}
                  onChange={(e) => handleWeightChange(item.key, Number(e.target.value))}
                  className="w-full accent-[#39734C] cursor-pointer"
                />
              </div>
            );
          })}
        </div>
      </div>

      {/* Visualizations: Radar Chart & Side-by-Side Bar Chart */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Radar Chart */}
        <div className="lg:col-span-6 bg-[#FFFFFF] rounded-2xl p-6 border border-[#E8E2D2] shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-bold text-[#183D2C] flex items-center gap-2">
                <Radar className="w-4 h-4 text-[#39734C]" />
                6-Criteria Agronomic Balance (Radar Profile)
              </h3>
            </div>
            <div className="h-80 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart outerRadius="75%" data={radarData}>
                  <PolarGrid stroke="#DDD6C3" />
                  <PolarAngleAxis dataKey="criterion" stroke="#617367" fontSize={11} />
                  <PolarRadiusAxis angle={30} domain={[0, 100]} stroke="#C4BEAD" fontSize={10} />
                  <RechartsRadar
                    name="Existing Rotation (Baseline)"
                    dataKey="Baseline"
                    stroke="#9E9885"
                    fill="#9E9885"
                    fillOpacity={0.2}
                  />
                  <RechartsRadar
                    name="Soil Restoration"
                    dataKey="Soil Restoration"
                    stroke="#39734C"
                    fill="#39734C"
                    fillOpacity={0.35}
                  />
                  <RechartsRadar
                    name="Water Resilience"
                    dataKey="Water Resilience"
                    stroke="#2A5978"
                    fill="#2A5978"
                    fillOpacity={0.3}
                  />
                  <Legend wrapperStyle={{ fontSize: "11px", paddingTop: "12px" }} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "#FFFFFF",
                      borderColor: "#DDD6C3",
                      borderRadius: "12px",
                      fontSize: "12px",
                    }}
                  />
                </RadarChart>
              </ResponsiveContainer>
            </div>
          </div>
          <p className="text-[11px] text-[#617367] mt-3 leading-relaxed border-t border-[#F0EDE4] pt-3">
            Note how Soil Restoration maximizes biological nitrogen and organic carbon, while Water Resilience excels in drought tolerance during low-rainfall phases. Baseline dominates market familiarity but scores lowest in disease breaks.
          </p>
        </div>

        {/* Side-by-Side Scores Bar Chart */}
        <div className="lg:col-span-6 bg-[#FFFFFF] rounded-2xl p-6 border border-[#E8E2D2] shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-bold text-[#183D2C] flex items-center gap-2">
                <Scale className="w-4 h-4 text-[#39734C]" />
                Comparative Strategy Scores
              </h3>
            </div>
            <div className="h-80 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={barData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#F0EDE4" />
                  <XAxis dataKey="name" stroke="#617367" fontSize={11} />
                  <YAxis domain={[0, 100]} stroke="#617367" fontSize={11} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "#FFFFFF",
                      borderColor: "#DDD6C3",
                      borderRadius: "12px",
                      fontSize: "12px",
                    }}
                  />
                  <Legend wrapperStyle={{ fontSize: "11px", paddingTop: "12px" }} />
                  <Bar dataKey="Overall" fill="#183D2C" radius={[6, 6, 0, 0]} name="Weighted Overall" />
                  <Bar dataKey="Water" fill="#64B4DC" radius={[6, 6, 0, 0]} name="Water Resilience" />
                  <Bar dataKey="Soil" fill="#9DBB78" radius={[6, 6, 0, 0]} name="Soil Improvement" />
                  <Bar dataKey="Market" fill="#E8A555" radius={[6, 6, 0, 0]} name="Market Liquidity" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
          <p className="text-[11px] text-[#617367] mt-3 leading-relaxed border-t border-[#F0EDE4] pt-3">
            Overall rankings are synthesized with 100% normalized weight coverage across all six agronomic dimensions.
          </p>
        </div>
      </div>

      {/* Comprehensive Comparative Table */}
      <div className="bg-[#FFFFFF] rounded-2xl p-6 border border-[#E8E2D2] shadow-xs space-y-4">
        <h3 className="text-base font-bold text-[#183D2C] flex items-center gap-2">
          <Scale className="w-4 h-4 text-[#39734C]" />
          Strategy Performance & Trade-Off Matrix
        </h3>

        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-[#F8F8F3] text-[#617367] uppercase font-semibold border-b border-[#DDD6C3]">
              <tr>
                <th className="p-3">Strategy Strategy</th>
                <th className="p-3">Overall Score</th>
                <th className="p-3">Water Resilience</th>
                <th className="p-3">Soil Restoration</th>
                <th className="p-3">Erosion Guard</th>
                <th className="p-3">Market Liquidity</th>
                <th className="p-3">Primary Trade-Off / Risk</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#F0EDE4]">
              {data.strategies.map((strat) => {
                const isWinner = strat.strategy_id === data.recommended_strategy_id;
                return (
                  <tr key={strat.strategy_id} className={isWinner ? "bg-[#EAF4ED]/40 font-medium" : ""}>
                    <td className="p-3">
                      <div className="font-bold text-[#183D2C] flex items-center gap-1.5">
                        {strat.title}
                        {isWinner && (
                          <span className="text-[10px] bg-[#39734C] text-white px-2 py-0.5 rounded-full font-sans">
                            Recommended
                          </span>
                        )}
                      </div>
                      <span className="text-[11px] text-[#617367]">
                        {strat.crop_sequence.map((c) => c.crop_name.split("(")[0]).join(" → ")}
                      </span>
                    </td>
                    <td className="p-3 font-serif font-bold text-base text-[#183D2C]">
                      {strat.overall_score}
                    </td>
                    <td className="p-3 font-mono">{strat.criteria_scores.water_resilience}</td>
                    <td className="p-3 font-mono">{strat.criteria_scores.soil_improvement}</td>
                    <td className="p-3 font-mono">{strat.criteria_scores.erosion_protection}</td>
                    <td className="p-3 font-mono">{strat.criteria_scores.market_suitability}</td>
                    <td className="p-3 text-[11px] text-[#617367] max-w-xs leading-relaxed">
                      {strat.potential_risks[0] || "None noted"}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
