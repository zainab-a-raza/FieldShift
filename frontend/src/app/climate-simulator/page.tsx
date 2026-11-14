
"use client";

import React, { useState } from "react";
import { useFarm } from "@/context/FarmContext";
import { runSimulation } from "@/lib/api";
import { SimulationResponse } from "@/types";
import {
  Droplets,
  Thermometer,
  AlertTriangle,
  Play,
  RotateCcw,
  ShieldCheck,
  Info,
  Sprout,
  RefreshCw,
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

  const [simulationResult, setSimulationResult] =
    useState<SimulationResponse | null>(null);

  const [isRunning, setIsRunning] = useState(false);
  const [error, setError] = useState("");

  const handleSimulate = async () => {
    if (!selectedFarm || isRunning) return;

    setIsRunning(true);
    setError("");

    try {
      const res = await runSimulation({
        farm_id: selectedFarm.id,
        rainfall_change_pct: rainfallChange,
        temperature_increase_c: tempIncrease,
        irrigation_reduction_pct: irrigationReduction,
      });

      setSimulationResult(res);
    } catch (err) {
      console.error("Failed to run climate simulation:", err);
      setError("We couldn't run the simulation. Please try again.");
    } finally {
      setIsRunning(false);
    }
  };

  const handleReset = () => {
    setRainfallChange(0);
    setTempIncrease(0);
    setIrrigationReduction(0);
    setSimulationResult(null);
    setError("");
  };

  const chartData = simulationResult?.results.map((item) => ({
    name: item.strategy_title
      .replace("Regenerative ", "")
      .replace("Climate & ", ""),
    BaselineScore: item.original_overall_score,
    SimulatedScore: item.simulated_overall_score,
  }));

  const winner = simulationResult?.results.find(
    (item) =>
      item.strategy_id ===
      simulationResult.resilience_winner_strategy_id
  );

  // No farm selected
  if (!selectedFarm) {
    return (
      <div className="min-h-[400px] flex flex-col items-center justify-center text-center gap-3">
        <Sprout className="w-10 h-10 text-[#39734C]" />

        <h2 className="text-lg font-bold text-[#183D2C]">
          Select a farm to get started
        </h2>

        <p className="text-sm text-[#617367]">
          Choose a farm to explore how different climate conditions
          could affect your crop rotations.
        </p>
      </div>
    );
  }

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
          Climate Simulator
        </h1>

        <p className="text-sm text-[#617367] max-w-2xl">
          Explore how changes in rainfall, temperature, and irrigation
          could affect your crop rotation options. Adjust the conditions
          and compare the results.
        </p>
      </section>

      {/* SCIENTIFIC DISCLAIMER */}

      <div className="p-4 rounded-xl bg-[#FFF9EC] border border-[#EAD7A5] text-xs text-[#7A5A12] leading-relaxed flex items-start gap-3">
        <Info className="w-5 h-5 shrink-0 mt-0.5 text-[#B88714]" />

        <div>
          <strong className="block text-[11px] mb-1">
            About these simulations
          </strong>

          These are hypothetical scenarios, not actual weather forecasts
          or predictions. They help explore how different farming
          conditions might affect crop rotations. Use the results
          alongside local farming knowledge.
        </div>
      </div>

      {/* SCENARIO CONTROLS */}

      <section className="bg-white rounded-2xl p-5 sm:p-6 border border-[#E8E2D2] space-y-6">

        <div>
          <h2 className="text-lg font-bold text-[#183D2C]">
            Change your farm's conditions
          </h2>

          <p className="text-xs text-[#839087] mt-1">
            Adjust the sliders to create a possible future scenario.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">

          {/* RAINFALL */}

          <div className="p-4 rounded-xl bg-[#F8F8F3] border border-[#E8E2D2] space-y-4">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <Droplets className="w-5 h-5 text-[#39734C]" />
                <span className="text-sm font-semibold text-[#183D2C]">
                  Rainfall
                </span>
              </div>

              <span className="text-base font-bold text-[#39734C]">
                {rainfallChange > 0 ? "+" : ""}
                {rainfallChange}%
              </span>
            </div>

            <input
              type="range"
              min="-50"
              max="40"
              step="5"
              value={rainfallChange}
              onChange={(e) =>
                setRainfallChange(Number(e.target.value))
              }
              className="w-full accent-[#39734C] cursor-pointer"
            />

            <div className="flex justify-between text-[10px] text-[#839087]">
              <span>Less rain</span>
              <span>No change</span>
              <span>More rain</span>
            </div>

            <p className="text-xs text-[#617367]">
              {rainfallChange < 0
                ? `Rainfall decreases by ${Math.abs(rainfallChange)}%.`
                : rainfallChange > 0
                ? `Rainfall increases by ${rainfallChange}%.`
                : "Rainfall stays at its baseline level."}
            </p>
          </div>

          {/* TEMPERATURE */}

          <div className="p-4 rounded-xl bg-[#F8F8F3] border border-[#E8E2D2] space-y-4">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <Thermometer className="w-5 h-5 text-[#D97706]" />
                <span className="text-sm font-semibold text-[#183D2C]">
                  Temperature
                </span>
              </div>

              <span className="text-base font-bold text-[#D97706]">
                +{tempIncrease.toFixed(1)}°C
              </span>
            </div>

            <input
              type="range"
              min="0"
              max="5"
              step="0.5"
              value={tempIncrease}
              onChange={(e) =>
                setTempIncrease(Number(e.target.value))
              }
              className="w-full accent-[#D97706] cursor-pointer"
            />

            <div className="flex justify-between text-[10px] text-[#839087]">
              <span>+0°C</span>
              <span>+2.5°C</span>
              <span>+5°C</span>
            </div>

            <p className="text-xs text-[#617367]">
              {tempIncrease === 0
                ? "Temperature stays at its baseline level."
                : `Temperature increases by ${tempIncrease.toFixed(1)}°C.`}
            </p>
          </div>

          {/* IRRIGATION */}

          <div className="p-4 rounded-xl bg-[#F8F8F3] border border-[#E8E2D2] space-y-4">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <Droplets className="w-5 h-5 text-[#64A7C9]" />
                <span className="text-sm font-semibold text-[#183D2C]">
                  Irrigation water
                </span>
              </div>

              <span className="text-base font-bold text-[#39734C]">
                {irrigationReduction}%
              </span>
            </div>

            <input
              type="range"
              min="-100"
              max="0"
              step="10"
              value={irrigationReduction}
              onChange={(e) =>
                setIrrigationReduction(Number(e.target.value))
              }
              className="w-full accent-[#39734C] cursor-pointer"
            />

            <div className="flex justify-between text-[10px] text-[#839087]">
              <span>No irrigation</span>
              <span>Half supply</span>
              <span>Full supply</span>
            </div>

            <p className="text-xs text-[#617367]">
              {irrigationReduction === 0
                ? "Irrigation remains at full availability."
                : `Available irrigation water decreases by ${Math.abs(irrigationReduction)}%.`}
            </p>
          </div>

        </div>

        {/* SELECTED SCENARIO SUMMARY */}

        <div className="rounded-xl bg-[#F8F8F3] border border-[#E8E2D2] p-4">
          <h3 className="text-sm font-semibold text-[#183D2C] mb-2">
            Your scenario
          </h3>

          <div className="flex flex-wrap gap-2">
            <span className="text-xs bg-white border border-[#E8E2D2] rounded-lg px-3 py-2 text-[#617367]">
              Rainfall: {rainfallChange > 0 ? "+" : ""}
              {rainfallChange}%
            </span>

            <span className="text-xs bg-white border border-[#E8E2D2] rounded-lg px-3 py-2 text-[#617367]">
              Temperature: +{tempIncrease.toFixed(1)}°C
            </span>

            <span className="text-xs bg-white border border-[#E8E2D2] rounded-lg px-3 py-2 text-[#617367]">
              Irrigation: {irrigationReduction}%
            </span>
          </div>
        </div>

        {/* ERROR */}

        {error && (
          <div className="flex items-start gap-2 text-xs text-[#B83E38] bg-[#FDF2F0] border border-[#F1D1CC] rounded-lg p-3">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            {error}
          </div>
        )}

        {/* ACTIONS */}

        <div className="flex flex-col-reverse sm:flex-row items-center justify-end gap-3 pt-4 border-t border-[#F0EDE4]">
          <button
            onClick={() => {
              setRainfallChange(0);
              setTempIncrease(0);
              setIrrigationReduction(0);
              setSimulationResult(null);
              setError("");
            }}
            disabled={isRunning}
            className="w-full sm:w-auto flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium text-[#617367] hover:bg-[#F8F8F3] transition disabled:opacity-50"
          >
            <RotateCcw className="w-4 h-4" />
            Reset
          </button>

          <button
            onClick={handleSimulate}
            disabled={isRunning}
            className="w-full sm:w-auto flex items-center justify-center gap-2 bg-[#39734C] hover:bg-[#285B39] text-white px-6 py-3 rounded-xl text-sm font-semibold transition disabled:opacity-60"
          >
            {isRunning ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                Running simulation...
              </>
            ) : (
              <>
                <Play className="w-4 h-4" />
                Run simulation
              </>
            )}
          </button>
        </div>
      </section>

      {/* SIMULATION RESULTS */}

      {simulationResult && (
        <section className="space-y-6">

          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl bg-[#EAF4ED] flex items-center justify-center">
              <ShieldCheck className="w-5 h-5 text-[#39734C]" />
            </div>

            <div>
              <h2 className="text-lg font-bold text-[#183D2C]">
                Simulation results
              </h2>

              <p className="text-xs text-[#839087]">
                How your crop rotations respond to this scenario.
              </p>
            </div>
          </div>

          {/* WINNING ROTATION */}

          {winner && (
            <div className="bg-[#EAF4ED] border border-[#BCE0C8] rounded-2xl p-5 sm:p-6 space-y-3">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-[#39734C]" />

                <span className="text-sm font-semibold text-[#285B39]">
                  Most resilient rotation in this scenario
                </span>
              </div>

              <h3 className="text-xl font-bold text-[#183D2C] font-serif">
                {winner.strategy_title}
              </h3>

              {simulationResult.simulation_insights?.[0] && (
                <p className="text-sm text-[#39734C] leading-relaxed">
                  {simulationResult.simulation_insights[0]}
                </p>
              )}

              <p className="text-xs text-[#617367]">
                This rotation performed best among the options
                evaluated under the conditions you selected.
              </p>
            </div>
          )}

          {/* SCORE COMPARISON */}

          <div className="bg-white rounded-2xl p-5 sm:p-6 border border-[#E8E2D2] space-y-5">
            <div>
              <h3 className="text-lg font-bold text-[#183D2C]">
                How did the scores change?
              </h3>

              <p className="text-xs text-[#839087] mt-1">
                Compare each rotation before and after applying
                your scenario.
              </p>
            </div>

            <div className="h-72 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={chartData}
                  margin={{ top: 5, right: 10, left: 0, bottom: 5 }}
                >
                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke="#F0EDE4"
                  />

                  <XAxis
                    dataKey="name"
                    stroke="#617367"
                    fontSize={10}
                    interval={0}
                    angle={-12}
                    textAnchor="end"
                    height={65}
                  />

                  <YAxis
                    domain={[0, 100]}
                    stroke="#617367"
                    fontSize={11}
                  />

                  <Tooltip
                    contentStyle={{
                      backgroundColor: "#FFFFFF",
                      borderColor: "#DDD6C3",
                      borderRadius: "12px",
                      fontSize: "12px",
                    }}
                  />

                  <Legend
                    wrapperStyle={{
                      fontSize: "11px",
                      paddingTop: "12px",
                    }}
                  />

                  <Bar
                    dataKey="BaselineScore"
                    fill="#C9C3B4"
                    radius={[5, 5, 0, 0]}
                    name="Original score"
                  />

                  <Bar
                    dataKey="SimulatedScore"
                    fill="#39734C"
                    radius={[5, 5, 0, 0]}
                    name="Scenario score"
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>

            <p className="text-[11px] text-[#839087] border-t border-[#F0EDE4] pt-3">
              Scores are comparative estimates from your simulation,
              not measured crop yields or financial returns.
            </p>
          </div>

          {/* ROTATION IMPACT */}

          <div className="space-y-3">
            <h3 className="text-lg font-bold text-[#183D2C]">
              Impact on each rotation
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {simulationResult.results.map((item) => (
                <div
                  key={item.strategy_id}
                  className="bg-white rounded-2xl p-5 border border-[#E8E2D2] space-y-4"
                >
                  <div>
                    <div className="flex items-center justify-between gap-2 mb-2">
                      <span className="text-[10px] font-semibold uppercase tracking-wide text-[#617367]">
                        {item.climate_stress_vulnerability}
                      </span>

                      <span
                        className={`text-xs font-bold px-2 py-1 rounded-lg ${
                          item.score_delta >= 0
                            ? "bg-[#EAF4ED] text-[#2E6A44]"
                            : "bg-[#FDF2F0] text-[#B83E38]"
                        }`}
                      >
                        {item.score_delta > 0 ? "+" : ""}
                        {item.score_delta} pts
                      </span>
                    </div>

                    <h4 className="text-base font-bold text-[#183D2C] font-serif">
                      {item.strategy_title}
                    </h4>
                  </div>

                  <div className="flex items-center gap-4">
                    <div>
                      <p className="text-[10px] text-[#839087]">
                        Scenario score
                      </p>

                      <p className="text-2xl font-bold text-[#183D2C]">
                        {item.simulated_overall_score}
                        <span className="text-xs font-normal text-[#839087]">
                          /100
                        </span>
                      </p>
                    </div>

                    <div className="border-l border-[#E8E2D2] pl-4">
                      <p className="text-[10px] text-[#839087]">
                        Original score
                      </p>

                      <p className="text-lg font-semibold text-[#617367]">
                        {item.original_overall_score}
                      </p>
                    </div>
                  </div>

                  {/* VULNERABILITIES */}

                  {item.key_failure_points?.length > 0 && (
                    <div className="border-t border-[#F0EDE4] pt-3 space-y-2">
                      <p className="text-xs font-semibold text-[#A64B3F] flex items-center gap-1.5">
                        <AlertTriangle className="w-3.5 h-3.5" />
                        Potential challenges
                      </p>

                      {item.key_failure_points.map((point, index) => (
                        <p
                          key={index}
                          className="text-xs text-[#617367] leading-relaxed"
                        >
                          • {point}
                        </p>
                      ))}
                    </div>
                  )}

                  {/* RESILIENCE FACTORS */}

                  {item.mitigating_factors?.length > 0 && (
                    <div className="border-t border-[#F0EDE4] pt-3 space-y-2">
                      <p className="text-xs font-semibold text-[#39734C] flex items-center gap-1.5">
                        <ShieldCheck className="w-3.5 h-3.5" />
                        Strengths
                      </p>

                      {item.mitigating_factors.map((factor, index) => (
                        <p
                          key={index}
                          className="text-xs text-[#617367] leading-relaxed"
                        >
                          • {factor}
                        </p>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* ADDITIONAL INSIGHTS */}

          {simulationResult.simulation_insights?.length > 1 && (
            <div className="bg-white rounded-2xl p-5 border border-[#E8E2D2] space-y-3">
              <h3 className="text-base font-bold text-[#183D2C]">
                What else should you consider?
              </h3>

              {simulationResult.simulation_insights
                .slice(1)
                .map((insight, index) => (
                  <div
                    key={index}
                    className="flex items-start gap-2 text-sm text-[#617367]"
                  >
                    <Info className="w-4 h-4 text-[#39734C] shrink-0 mt-0.5" />
                    <p className="leading-relaxed">{insight}</p>
                  </div>
                ))}
            </div>
          )}

          {/* RESULTS DISCLAIMER */}

          <p className="text-[11px] text-[#839087] leading-relaxed">
            Results are hypothetical estimates based on the selected
            conditions and available data. They do not guarantee crop
            performance. Actual outcomes also depend on soil conditions,
            crop variety, farming practices, and local weather.
          </p>
        </section>
      )}
    </div>
  );
}
