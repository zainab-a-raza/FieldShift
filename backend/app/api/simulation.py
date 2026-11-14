"""
Climate Sensitivity Simulator API Endpoint.
Evaluates rotation robustness under hypothetical precipitation deficits, temperature spikes,
and irrigation curtailments.
"""
from fastapi import APIRouter, HTTPException
from typing import List
import json
from app.models.database import get_connection
from app.models.schemas import SimulationRequest, SimulationResponse, SimulatedStrategyResult
from app.api.environment import get_or_calculate_env_summary
from app.engine.generator import StrategyGenerator
from app.api.rotations import load_all_crops

router = APIRouter(prefix="/api/scenarios", tags=["Climate Simulator"])

@router.post("/simulate", response_model=SimulationResponse)
async def run_climate_stress_simulation(request: SimulationRequest):
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM farms WHERE id = ?", (request.farm_id,))
    farm = cursor.fetchone()
    conn.close()

    if not farm:
        raise HTTPException(status_code=404, detail=f"Farm '{request.farm_id}' not found.")

    # 1. Retrieve baseline environmental summary
    base_env = await get_or_calculate_env_summary(request.farm_id)
    all_crops = load_all_crops()
    generator = StrategyGenerator(all_crops)
    previous_seq = json.loads(farm["previous_crop_sequence"]) if farm["previous_crop_sequence"] else []

    base_comparison = generator.generate_all_strategies(
        farm_id=request.farm_id,
        farm_name=farm["name"],
        current_crop_id=farm["current_crop"],
        previous_sequence=previous_seq,
        env=base_env,
        irrigation_type=farm["irrigation_type"],
        farmer_priority=farm["primary_priority"]
    )

    # 2. Construct perturbed hypothetical environment
    sim_env = base_env.model_copy(deep=True)
    sim_env.temperature.avg_temp_c += request.temperature_increase_c
    sim_env.temperature.max_temp_c += request.temperature_increase_c * 1.2
    if request.temperature_increase_c > 1.5:
        sim_env.temperature.hot_days_gt_35c += int(request.temperature_increase_c * 6)

    rain_factor = 1.0 + (request.rainfall_change_pct / 100.0)
    sim_env.rainfall.annual_precipitation_mm = round(sim_env.rainfall.annual_precipitation_mm * rain_factor, 1)
    sim_env.rainfall.seasonal_precipitation_mm = round(sim_env.rainfall.seasonal_precipitation_mm * rain_factor, 1)
    if request.rainfall_change_pct < -15.0:
        sim_env.rainfall.max_consecutive_dry_days += int(abs(request.rainfall_change_pct) * 0.4)

    # Evaluate perturbed strategies
    sim_comparison = generator.generate_all_strategies(
        farm_id=request.farm_id,
        farm_name=farm["name"],
        current_crop_id=farm["current_crop"],
        previous_sequence=previous_seq,
        env=sim_env,
        irrigation_type="rainfed" if request.irrigation_reduction_pct < -50 else farm["irrigation_type"],
        farmer_priority=farm["primary_priority"]
    )

    results: List[SimulatedStrategyResult] = []
    winner_id = sim_comparison.recommended_strategy_id

    for base_strat, sim_strat in zip(base_comparison.strategies, sim_comparison.strategies):
        delta = round(sim_strat.overall_score - base_strat.overall_score, 1)
        
        failure_points = []
        mitigators = []

        if base_strat.strategy_type == "baseline":
            if request.rainfall_change_pct < -15:
                failure_points.append("Severe water deficit during grain filling in standard monoculture phase.")
            if request.temperature_increase_c >= 2.0:
                failure_points.append("Terminal heat stress above 34°C impairs pollen fertility in current crop.")
            mitigators.append("None inherent to baseline; requires emergency external supplemental water pumping.")
            vuln = "High Vulnerability (Fragile to Climate Shocks)"

        elif base_strat.strategy_type == "soil_restoration":
            if request.rainfall_change_pct < -25:
                failure_points.append("Rhizobial nitrogen fixation efficiency drops significantly during extreme prolonged drought.")
            mitigators.append("Deep taproots and higher soil organic matter buffer root-zone moisture holding capacity.")
            vuln = "Moderate Vulnerability (Buffer Capacity Available)"

        else: # water_resilience
            mitigators.append("C4 photosynthetic pathway in millet/sorghum maintains high water-use efficiency under elevated heat.")
            mitigators.append("Deep root system extracts moisture from deep vadose zone.")
            if request.rainfall_change_pct < -40:
                failure_points.append("Extreme historic megadrought pushes biomass yields below commercial breakeven.")
            vuln = "High Resilience (Superior Stress Tolerance)"

        results.append(SimulatedStrategyResult(
            strategy_id=base_strat.strategy_id,
            strategy_title=base_strat.title,
            original_overall_score=base_strat.overall_score,
            simulated_overall_score=sim_strat.overall_score,
            score_delta=delta,
            original_water_score=base_strat.criteria_scores.water_resilience,
            simulated_water_score=sim_strat.criteria_scores.water_resilience,
            climate_stress_vulnerability=vuln,
            key_failure_points=failure_points,
            mitigating_factors=mitigators
        ))

    insights = [
        f"Under simulated {request.rainfall_change_pct:+.1f}% rainfall and {request.temperature_increase_c:+.1f}°C temperature shifts, water resilience strategy degrades {abs(results[2].score_delta)} pts vs {abs(results[0].score_delta)} pts in the baseline.",
        "Soil restoration practices preserve moisture holding capacity, providing a secondary buffer against intermittent heat spells."
    ]

    return SimulationResponse(
        farm_id=request.farm_id,
        scenario_parameters={
            "rainfall_change_pct": request.rainfall_change_pct,
            "temperature_increase_c": request.temperature_increase_c,
            "irrigation_reduction_pct": request.irrigation_reduction_pct
        },
        results=results,
        resilience_winner_strategy_id=winner_id,
        simulation_insights=insights
    )
