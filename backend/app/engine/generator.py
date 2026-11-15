"""
Strategy Generator for FieldShift.
Generates the three mandatory comparative strategies:
1. Existing Rotation (Baseline)
2. Soil Restoration Strategy
3. Water Resilience Strategy
"""
from typing import List, Dict, Any, Optional
from app.models.schemas import CropTrait, EnvironmentalSummary, RotationStrategy, RotationComparisonResponse
from app.engine.mcda import MCDAEngine, DEFAULT_WEIGHTS
from app.engine.rules import AgronomicRulesEngine

class StrategyGenerator:
    def __init__(self, crop_catalog: List[CropTrait]):
        self.crop_catalog = {c.id: c for c in crop_catalog}
        self.all_crops = crop_catalog

    def generate_all_strategies(
        self,
        farm_id: str,
        farm_name: str,
        current_crop_id: str,
        previous_sequence: List[str],
        env: EnvironmentalSummary,
        irrigation_type: str,
        farmer_priority: str = "balanced",
        custom_weights: Optional[Dict[str, float]] = None
    ) -> RotationComparisonResponse:
        """
        Synthesizes the three strategies tailored to the farm's conditions and preferences.
        """
        # Determine weights based on farmer priority or custom sliders
        weights = dict(custom_weights or DEFAULT_WEIGHTS)
        if farmer_priority == "water_resilience":
            weights["water_resilience"] = 0.40
            weights["climate_suitability"] = 0.25
            weights["soil_improvement"] = 0.15
        elif farmer_priority == "soil_restoration":
            weights["soil_improvement"] = 0.40
            weights["erosion_protection"] = 0.20
            weights["water_resilience"] = 0.15

        engine = MCDAEngine(weights=weights)

        # Filter feasible crops for this farm
        feasible_crops, disqualified = AgronomicRulesEngine.filter_feasible_crops(
            self.all_crops, env, irrigation_type
        )
        feasible_map = {c.id: c for c in feasible_crops}

        # 1. BASELINE STRATEGY
        # Use previous sequence and current crop, repeating to form a 4-season sequence
        baseline_ids = previous_sequence if previous_sequence else [current_crop_id]
        if current_crop_id not in baseline_ids:
            baseline_ids.append(current_crop_id)
        while len(baseline_ids) < 4:
            baseline_ids.extend(baseline_ids)
        baseline_ids = baseline_ids[:4]

        baseline_crop_objs = []
        for cid in baseline_ids:
            if cid in self.crop_catalog:
                baseline_crop_objs.append(self.crop_catalog[cid])
            else:
                # Default to wheat if unknown
                baseline_crop_objs.append(self.crop_catalog.get("wheat", self.all_crops[0]))

        strategy_baseline = engine.evaluate_rotation(
            strategy_id="strat_baseline",
            strategy_type="baseline",
            title="Existing Rotation (Baseline)",
            summary="Continues your current cropping pattern and historical monoculture/rotation practices.",
            crops=baseline_crop_objs,
            env=env,
            irrigation_type=irrigation_type,
            optimization_method="Baseline Practice Observation"
        )

        # 2. SOIL RESTORATION STRATEGY
        # Emphasizes legumes (Chickpea, Soybean, Mung bean, Alfalfa) and biofumigant mustard
        soil_candidates = ["soybean", "wheat", "chickpea", "mustard", "mung_bean", "alfalfa"]
        soil_crop_objs = []
        for cid in soil_candidates:
            if cid in feasible_map:
                soil_crop_objs.append(feasible_map[cid])
            elif cid in self.crop_catalog:
                soil_crop_objs.append(self.crop_catalog[cid])
            if len(soil_crop_objs) == 4:
                break
        if len(soil_crop_objs) < 4:
            soil_crop_objs = baseline_crop_objs

        strategy_soil = engine.evaluate_rotation(
            strategy_id="strat_soil_restoration",
            strategy_type="soil_restoration",
            title="Regenerative Soil Restoration",
            summary="Prioritizes biological nitrogen fixation, deep root channels, biofumigation, and soil organic carbon accumulation.",
            crops=soil_crop_objs,
            env=env,
            irrigation_type=irrigation_type,
            optimization_method="MCDA Soil-Maximizing Multi-Objective"
        )

        # 3. WATER RESILIENCE STRATEGY
        # Emphasizes drought tolerance: Pearl Millet, Sorghum, Chickpea, Mung bean
        water_candidates = ["sorghum", "chickpea", "millet", "mung_bean", "mustard"]
        water_crop_objs = []
        for cid in water_candidates:
            if cid in feasible_map:
                water_crop_objs.append(feasible_map[cid])
            elif cid in self.crop_catalog:
                water_crop_objs.append(self.crop_catalog[cid])
            if len(water_crop_objs) == 4:
                break
        if len(water_crop_objs) < 4:
            water_crop_objs = baseline_crop_objs

        strategy_water = engine.evaluate_rotation(
            strategy_id="strat_water_resilience",
            strategy_type="water_resilience",
            title="Climate & Water Resilience",
            summary="Employs drought-tolerant C4 cereals and deep-taproot legumes to dramatically reduce irrigation dependency and withstand rainfall anomalies.",
            crops=water_crop_objs,
            env=env,
            irrigation_type=irrigation_type,
            optimization_method="MCDA Hydrological Stress Minimization"
        )

        all_strats = [strategy_baseline, strategy_soil, strategy_water]
        # Rank by overall score
        ranked = sorted(all_strats, key=lambda s: s.overall_score, reverse=True)
        recommended_id = ranked[0].strategy_id

        notes = (
            f"Evaluated 3 crop rotation strategies against {'synthetic sample inputs' if env.is_demo_data else 'the available environmental inputs'}. "
            f"'{ranked[0].title}' ranked highest overall ({ranked[0].overall_score}/100) "
            f"for this farm's environmental vulnerabilities."
        )

        return RotationComparisonResponse(
            farm_id=farm_id,
            farm_name=farm_name,
            recommended_strategy_id=recommended_id,
            criteria_weights=weights,
            strategies=all_strats,
            comparison_notes=notes,
            generated_at=env.evaluation_date
        )
