"""
Agronomic Rules and Constraint Validation Engine.
Enforces hard biological constraints, thermal windows, pH limits, and crop family disease breaks.
"""
from typing import List, Dict, Any, Tuple
from app.models.schemas import CropTrait, EnvironmentalSummary

class AgronomicRulesEngine:
    @staticmethod
    def filter_feasible_crops(
        crop_catalog: List[CropTrait],
        env: EnvironmentalSummary,
        irrigation_type: str
    ) -> Tuple[List[CropTrait], List[Dict[str, str]]]:
        """
        Filters crops based on physical and biophysical constraints:
        1. Thermal boundaries evaluated relative to the crop's growing season.
        2. Water requirements vs available precipitation + irrigation.
        3. Soil pH tolerance vs SoilGrids observed pH.
        """
        feasible = []
        disqualified = []

        avg_temp = env.temperature.avg_temp_c
        max_temp = env.temperature.max_temp_c
        min_temp = env.temperature.min_temp_c
        annual_water = env.rainfall.annual_precipitation_mm
        
        # Irrigation multiplier
        irrigation_bonus = {
            "rainfed": 0.0,
            "drip": 250.0,
            "sprinkler": 200.0,
            "flood": 350.0,
            "groundwater_well": 300.0
        }.get(irrigation_type.lower(), 50.0)

        effective_water = annual_water + irrigation_bonus
        soil_ph = env.soil_properties.ph_in_h2o

        for crop in crop_catalog:
            # 1. Thermal check based on seasonal window
            is_cool_season = "rabi" in crop.growing_season.lower() or "winter" in crop.growing_season.lower() or "cool" in crop.growing_season.lower()
            is_warm_season = "kharif" in crop.growing_season.lower() or "summer" in crop.growing_season.lower() or "warm" in crop.growing_season.lower()

            if is_cool_season:
                # Cool season crops are planted after summer heat subsides; check against average & chill limits
                if min_temp < crop.temp_min - 6.0:
                    disqualified.append({
                        "crop_id": crop.id,
                        "crop_name": crop.name,
                        "reason": f"Winter minimum temperature ({min_temp}°C) causes severe frost damage below crop tolerance ({crop.temp_min}°C)."
                    })
                    continue
                if avg_temp > crop.temp_max + 8.0:
                    disqualified.append({
                        "crop_id": crop.id,
                        "crop_name": crop.name,
                        "reason": f"Regional average temperature ({avg_temp}°C) is too warm for cool-season crop ceiling ({crop.temp_max}°C)."
                    })
                    continue
            elif is_warm_season:
                # Warm season crops must tolerate summer heat
                if max_temp > crop.temp_max + 5.0:
                    disqualified.append({
                        "crop_id": crop.id,
                        "crop_name": crop.name,
                        "reason": f"Summer maximum temperature ({max_temp}°C) exceeds crop biological ceiling ({crop.temp_max}°C)."
                    })
                    continue
            else: # Perennial or all-season
                if max_temp > crop.temp_max + 4.0 or min_temp < crop.temp_min - 4.0:
                    disqualified.append({
                        "crop_id": crop.id,
                        "crop_name": crop.name,
                        "reason": f"Annual temperature extremes [{min_temp}°C, {max_temp}°C] exceed perennial tolerance."
                    })
                    continue

            # 2. Water check:
            if crop.water_requirement_mm > effective_water * 1.25:
                disqualified.append({
                    "crop_id": crop.id,
                    "crop_name": crop.name,
                    "reason": f"Crop water requirement ({crop.water_requirement_mm} mm) exceeds available effective moisture ({round(effective_water)} mm) under {irrigation_type} regime."
                })
                continue

            # 3. Soil pH check:
            if soil_ph < crop.soil_ph_min - 0.6 or soil_ph > crop.soil_ph_max + 0.6:
                disqualified.append({
                    "crop_id": crop.id,
                    "crop_name": crop.name,
                    "reason": f"Soil pH ({soil_ph}) is outside viable agronomic range [{crop.soil_ph_min} - {crop.soil_ph_max}] for this crop."
                })
                continue

            feasible.append(crop)

        return feasible, disqualified

    @staticmethod
    def validate_sequence_disease_break(sequence: List[CropTrait]) -> Dict[str, Any]:
        """
        Validates crop family rotations. Consecutive plantings of the same family
        elevate risk of persistent soil-borne pathogens (e.g. Fusarium, Rhizoctonia, Nematodes).
        """
        violations = []
        legume_count = 0

        for i in range(1, len(sequence)):
            prev_crop = sequence[i - 1]
            curr_crop = sequence[i]

            if prev_crop.family == curr_crop.family and prev_crop.family != "Fallow":
                violations.append(
                    f"Consecutive planting of family '{curr_crop.family}' ({prev_crop.name} -> {curr_crop.name}) breaks rotational disease break; elevates pathogen and pest persistence."
                )

        for crop in sequence:
            if crop.nitrogen_fixing:
                legume_count += 1

        return {
            "is_valid": len(violations) == 0,
            "violations": violations,
            "legume_ratio": round(legume_count / max(1, len(sequence)), 2),
            "disease_break_score": max(20.0, 100.0 - (len(violations) * 35.0))
        }
