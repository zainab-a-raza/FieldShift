"use client";

import React, { useState } from "react";
import { useFarm } from "@/context/FarmContext";
import { runSimulation } from "@/lib/api";
import { SimulationResponse } from "@/types";
import {
  ThermometerSnowflake,
  Droplets,
  Thermometer,
  AlertTriangle,
  Play,
  RotateCcw,
  ShieldCheck,
  TrendingDown,
  Sparkles,
  Info,
} from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";

export default function ClimateSimulatorPage() {
  const { selectedFarm } = useFarm();

  const [rainfallChange, setRainfallChange] = useState<number>(-20);
  const [tempIncrease, setTempIncrease] = useState<number>(2.5);
  const [irrigationReduction, setIrrigationReduction] = useState<number>(-30);

  const [simulationResult, setSimulationResult] = useState<SimulationResponse | null>(null);
  const [isRunning, setIsRunning] = useState(false);

  const handleSimulate = async () => {
    if (!selectedFarm) return;
    setIsRunning(true);
    try {
      const res = await runSimulation({
        farm_id: selectedFarm.id,
        rainfall_change_pct: rainfallChange,
        temperature_increase_c: tempIncrease,
        irrigation_reduction_pct: irrigationReduction,
      });
      setSimulationResult(res);
    } catch (e) {
      console.error(e);
    } finally {
      setIsRunning(false);
    }
  };

  const handleReset = () => {
    setRainfallChange(0);
    setTempIncrease(0);
    setIrrigationReduction(0);
    setSimulationResult(null);
  };

  // Pre-formatted comparison chart data
  const chartData = simulationResult?.results.map((res) => ({
    name: res.strategy_title.replace("Regenerative ", "").replace("Climate & ", ""),
    BaselineScore: res.original_overall_score,
    SimulatedScore: res.simulated_overall_score,
    ScoreDelta: res.score_delta,
  }));

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2 mb-1">
          <span className="text-xs font-bold uppercase tracking-wider text-[#39734C] bg-[#EAF4ED] px-2.5 py-0.5 rounded-full">
            Hypothetical Stress Testing
          </span>
          <span className="text-xs text-[#617367]">Holding: {selectedFarm?.name}</span>
        </div>
        <h2 className="text-2xl lg:text-3xl font-extrabold text-[#183D2C] tracking-tight font-serif">
          Climate Stress Simulator
        </h2>
        <p className="text-xs text-[#617367] mt-1 max-w-3xl">
          Conduct hypothetical sensitivity analyses by simulating precipitation drops, heat spikes, and
          groundwater restrictions to test the durability of your rotation alternatives.
        </p>
      </div>

      {/* Prominent Scientific Integrity Disclaimer (PART 4 & 12 Requirement) */}
      <div className="p-4 rounded-xl bg-[#FFF9EC] border border-[#EAD7A5] text-xs text-[#7A5A12] leading-relaxed flex items-start gap-3">
        <Info className="w-5 h-5 shrink-0 mt-0.5 text-[#B88714]" />
        <div>
          <span className="font-bold uppercase tracking-wider block text-[11px] mb-0.5">
            Important Scientific Disclaimer:
          </span>
          Simulated outcomes represent <strong>hypothetical sensitivity analyses</strong> to explore operational limits.
          They are <strong>not localized predictive climate forecasts</strong> or authoritative meteorological projections. Results support farmer judgment under what-if scenarios.
        </div>
      </div>

      {/* Simulator Control Sliders Card */}
      <div className="bg-[#FFFFFF] rounded-2xl p-6 lg:p-8 border border-[#E8E2D2] shadow-xs space-y-6">
        <h3 className="text-base font-bold text-[#183D2C] flex items-center gap-2">
          <ThermometerSnowflake className="w-4 h-4 text-[#39734C]" />
          Configure Stress Scenario Parameters
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Rainfall Change Slider */}
          <div className="p-4 rounded-2xl bg-[#F8F8F3] border border-[#DDD6C3] space-y-2">
            <div className="flex items-center justify-between text-xs font-semibold text-[#183D2C]">
              <span className="flex items-center gap-1.5">
                <Droplets className="w-4 h-4 text-[#39734C]" />
                Seasonal Precipitation Change
              </span>
              <span className="font-mono text-sm font-bold text-[#39734C]">
                {rainfallChange > 0 ? `+${rainfallChange}` : rainfallChange}%
              </span>
            </div>
            <input
              type="range"
              min="-50"
              max="40"
              step="5"
              value={rainfallChange}
              onChange={(e) => setRainfallChange(Number(e.target.value))}
              className="w-full accent-[#39734C] cursor-pointer"
            />
            <div className="flex justify-between text-[10px] text-[#617367]">
              <span>-50% (Severe Drought)</span>
              <span>0% (Historical Normal)</span>
              <span>+40% (Surplus)</span>
            </div>
          </div>

          {/* Temperature Increase Slider */}
          <div className="p-4 rounded-2xl bg-[#F8F8F3] border border-[#DDD6C3] space-y-2">
            <div className="flex items-center justify-between text-xs font-semibold text-[#183D2C]">
              <span className="flex items-center gap-1.5">
                <Thermometer className="w-4 h-4 text-[#D97706]" />
                Temperature Rise Spike
              </span>
              <span className="font-mono text-sm font-bold text-[#D97706]">
                +{tempIncrease.toFixed(1)}°C
              </span>
            </div>
            <input
              type="range"
              min="0"
              max="5.0"
              step="0.5"
              value={tempIncrease}
              onChange={(e) => setTempIncrease(Number(e.target.value))}
              className="w-full accent-[#D97706] cursor-pointer"
            />
            <div className="flex justify-between text-[10px] text-[#617367]">
              <span>+0.0°C (Current)</span>
              <span>+2.5°C (Moderate Shift)</span>
              <span>+5.0°C (Extreme Heat)</span>
            </div>
          </div>

          {/* Irrigation Availability Reduction Slider */}
          <div className="p-4 rounded-2xl bg-[#F8F8F3] border border-[#DDD6C3] space-y-2">
            <div className="flex items-center justify-between text-xs font-semibold text-[#183D2C]">
              <span className="flex items-center gap-1.5">
                <Droplets className="w-4 h-4 text-[#64B4DC]" />
                Irrigation Water Curtailment
              </span>
              <span className="font-mono text-sm font-bold text-[#64B4DC]">
                {irrigationReduction}%
              </span>
            </div>
            <input
              type="range"
              min="-100"
              max="0"
              step="10"
              value={irrigationReduction}
              onChange={(e) => setIrrigationReduction(Number(e.target.value))}
              className="w-full accent-[#64B4DC] cursor-pointer"
            />
            <div className="flex justify-between text-[10px] text-[#617367]">
              <span>-100% (Full Rainfed)</span>
              <span>-50% (Rationed)</span>
              <span>0% (Full Capacity)</span>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-end gap-3 pt-4 border-t border-[#F0EDE4]">
          <button
            onClick={handleReset}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold text-[#617367] hover:text-[#26352C] transition"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset Baseline</span>
          </button>

          <button
            onClick={handleSimulate}
            disabled={isRunning}
            className="flex items-center gap-2 bg-[#39734C] hover:bg-[#183D2C] text-white px-6 py-2.5 rounded-xl text-xs font-semibold shadow-xs transition"
          >
            <Play className="w-4 h-4 fill-white" />
            <span>{isRunning ? "Simulating Recalculation..." : "Run Stress Simulation"}</span>
          </button>
        </div>
      </div>

      {/* Simulation Results Section */}
      {simulationResult && (
        <div className="space-y-6 animate-fadeIn">
          {/* Winners & Insights Banner */}
          <div className="bg-[#FFFFFF] rounded-2xl p-6 border border-[#E8E2D2] shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div>
              <div className="flex items-center gap-2 mb-1.5">
                <span className="text-xs font-bold uppercase tracking-wider text-[#39734C] bg-[#EAF4ED] px-2.5 py-0.5 rounded-full">
                  Resilience Benchmark Result
                </span>
                <span className="text-xs text-[#617367]">
                  Scenario: {rainfallChange > 0 ? `+${rainfallChange}` : rainfallChange}% Rain, +{tempIncrease}°C Temp
                </span>
              </div>
              <h3 className="text-2xl font-bold text-[#183D2C] font-serif">
                Winner: {simulationResult.results.find((r) => r.strategy_id === simulationResult.resilience_winner_strategy_id)?.strategy_title}
              </h3>
              <p className="text-xs text-[#617367] mt-1 max-w-2xl leading-relaxed">
                {simulationResult.simulation_insights[0]}
              </p>
            </div>
          </div>

          {/* Comparative Chart */}
          <div className="bg-[#FFFFFF] rounded-2xl p-6 border border-[#E8E2D2] shadow-xs space-y-4">
            <h3 className="text-base font-bold text-[#183D2C]">
              Original Score vs Simulated Stress Score
            </h3>
            <div className="h-72 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData}>
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
                  <Bar dataKey="BaselineScore" fill="#DDD6C3" radius={[6, 6, 0, 0]} name="Baseline Normal Score" />
                  <Bar dataKey="SimulatedScore" fill="#39734C" radius={[6, 6, 0, 0]} name="Simulated Under Stress" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Strategy Impact Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {simulationResult.results.map((item) => (
              <div
                key={item.strategy_id}
                className="bg-[#FFFFFF] rounded-2xl p-6 border border-[#E8E2D2] shadow-xs space-y-4 flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-[#617367]">
                      {item.climate_stress_vulnerability}
                    </span>
                    <span
                      className={`text-xs font-mono font-bold px-2 py-0.5 rounded ${
                        item.score_delta >= 0
                          ? "bg-[#EAF4ED] text-[#2E6A44]"
                          : "bg-[#FDF2F0] text-[#B83E38]"
                      }`}
                    >
                      {item.score_delta > 0 ? `+${item.score_delta}` : item.score_delta} pts
                    </span>
                  </div>

                  <h4 className="text-lg font-bold text-[#183D2C] font-serif mb-1">
                    {item.strategy_title}
                  </h4>
                  <div className="flex items-baseline gap-2 mb-3">
                    <span className="text-2xl font-extrabold text-[#183D2C] font-serif">
                      {item.simulated_overall_score}
                    </span>
                    <span className="text-xs text-[#617367] line-through">
                      was {item.original_overall_score}
                    </span>
                  </div>

                  {/* Failure points & Mitigators */}
                  <div className="space-y-2 text-xs pt-3 border-t border-[#F0EDE4]">
                    {item.key_failure_points.length > 0 && (
                      <div className="space-y-1">
                        <span className="text-[10px] font-bold uppercase text-[#B83E38] block">
                          Vulnerability Triggers:
                        </span>
                        {item.key_failure_points.map((pt, i) => (
                          <p key={i} className="text-[#617367] text-[11px] leading-relaxed">
                            • {pt}
                          </p>
                        ))}
                      </div>
                    )}
                    {item.mitigating_factors.length > 0 && (
                      <div className="space-y-1 pt-1">
                        <span className="text-[10px] font-bold uppercase text-[#39734C] block">
                          Resilience Buffers:
                        </span>
                        {item.mitigating_factors.map((mf, i) => (
                          <p key={i} className="text-[#26533D] text-[11px] leading-relaxed">
                            ✓ {mf}
                          </p>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
