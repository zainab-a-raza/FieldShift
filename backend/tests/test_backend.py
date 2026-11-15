"""
Comprehensive Unit Tests for FieldShift Backend Engine and Services.
"""
import sys
import os
import unittest
from io import BytesIO

import h5py
import numpy as np

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from app.models.schemas import CropTrait, EnvironmentalSummary, TemperatureMetrics, RainfallMetrics, SoilMoistureMetrics, VegetationMetrics, SoilPropertiesMetrics, TerrainMetrics, GeneticOptimizerRequest
from app.provenance.tracker import create_provenance, DataOriginType
from app.engine.mcda import MCDAEngine, DEFAULT_WEIGHTS
from app.engine.rules import AgronomicRulesEngine
from app.engine.generator import StrategyGenerator
from app.engine.genetic_algo import CropSequenceGeneticOptimizer
from app.services.earthdata import EarthdataClient, EarthdataGranule
from app.services.nasa_smap import NASASMAPService
from app.services.nasa_gpm import NASAGPMService
from app.services.srtm import SRTMService
from app.services.usda_soils import USDASoilDataService
from app.services.nasa_power import NASAPowerService
from app.services.cache import delete_json_cache, get_json_cache, set_json_cache

def get_mock_environment():
    prov = create_provenance("test", "test", "NASA Test", "v1", DataOriginType.DIRECT_SATELLITE, "10m", "units")
    return EnvironmentalSummary(
        farm_id="test_farm",
        evaluation_date="2026-05-14",
        temperature=TemperatureMetrics(
            avg_temp_c=22.0, max_temp_c=36.0, min_temp_c=12.0,
            hot_days_gt_35c=14, growing_degree_days=1800.0, historical_anomaly_c=1.2,
            provenance=prov
        ),
        rainfall=RainfallMetrics(
            seasonal_precipitation_mm=260.0, annual_precipitation_mm=540.0,
            variability_index_pct=35.0, heavy_rain_events_gt_25mm=4,
            max_consecutive_dry_days=22, rainfall_deficit_pct=12.0,
            provenance=prov
        ),
        soil_moisture=SoilMoistureMetrics(
            surface_soil_moisture_m3_m3=0.19, root_zone_soil_moisture_m3_m3=0.23,
            soil_moisture_percentile=31.0, anomaly_status="Deficit",
            provenance=prov
        ),
        vegetation=VegetationMetrics(
            current_ndvi=0.48, mean_historical_ndvi=0.46, peak_season_ndvi=0.72,
            ndvi_anomaly=0.02, low_vegetation_months=["June", "November"],
            satellite_mission="Sentinel-2", cloud_coverage_pct=3.0,
            provenance=prov
        ),
        soil_properties=SoilPropertiesMetrics(
            organic_carbon_g_kg=15.2, ph_in_h2o=6.8, sand_fraction_pct=38.0,
            silt_fraction_pct=42.0, clay_fraction_pct=20.0, bulk_density_cg_cm3=130.0,
            available_water_capacity_mm_m=140.0, depth_interval="0-30 cm",
            provenance=prov
        ),
        terrain=TerrainMetrics(
            mean_elevation_m=340.0, slope_degrees=2.5, slope_category="Gently Undulating",
            terrain_ruggedness="Low Swale", erosion_susceptibility="Moderate",
            provenance=prov
        ),
        environmental_alerts=[],
        is_demo_data=False,
        data_status="live",
        data_messages=[],
    )

def get_mock_crops():
    return [
        CropTrait(
            id="wheat", name="Wheat", family="Poaceae", category="Cereal",
            temp_min=10.0, temp_max=28.0, temp_optimal_min=15.0, temp_optimal_max=23.0,
            water_requirement_mm=450, water_category="Moderate", heat_tolerance="Moderate",
            drought_tolerance="Moderate", root_depth_category="Medium", root_depth_cm=120,
            nitrogen_fixing=False, nitrogen_fixation_kg_ha=0, growing_duration_days=130,
            growing_season="Rabi", soil_ph_min=6.0, soil_ph_max=7.5, preferred_texture=["Loam"],
            soil_organic_matter_demand="Moderate", soil_improvement_contribution="Residue",
            erosion_protection="Moderate", market_liquidity="Very High", local_suitability_notes="Staple",
            data_source="FAO", source_confidence=0.95
        ),
        CropTrait(
            id="chickpea", name="Chickpea", family="Fabaceae", category="Pulse",
            temp_min=8.0, temp_max=30.0, temp_optimal_min=18.0, temp_optimal_max=26.0,
            water_requirement_mm=300, water_category="Low", heat_tolerance="Moderate",
            drought_tolerance="High", root_depth_category="Deep", root_depth_cm=120,
            nitrogen_fixing=True, nitrogen_fixation_kg_ha=65, growing_duration_days=105,
            growing_season="Rabi", soil_ph_min=6.0, soil_ph_max=8.0, preferred_texture=["Loam"],
            soil_organic_matter_demand="Low", soil_improvement_contribution="Nitrogen Fixation",
            erosion_protection="Moderate", market_liquidity="High", local_suitability_notes="Resilient",
            data_source="ICRISAT", source_confidence=0.95
        ),
        CropTrait(
            id="millet", name="Pearl Millet", family="Poaceae", category="Millet",
            temp_min=16.0, temp_max=45.0, temp_optimal_min=28.0, temp_optimal_max=38.0,
            water_requirement_mm=250, water_category="Very Low", heat_tolerance="Very High",
            drought_tolerance="Very High", root_depth_category="Deep", root_depth_cm=160,
            nitrogen_fixing=False, nitrogen_fixation_kg_ha=0, growing_duration_days=85,
            growing_season="Kharif", soil_ph_min=5.5, soil_ph_max=8.3, preferred_texture=["Sand"],
            soil_organic_matter_demand="Low", soil_improvement_contribution="Fodder Residue",
            erosion_protection="Moderate", market_liquidity="Moderate", local_suitability_notes="Dryland",
            data_source="ICRISAT", source_confidence=0.95
        )
    ]

class TestFieldShiftEngine(unittest.TestCase):
    def setUp(self):
        self.env = get_mock_environment()
        self.crops = get_mock_crops()

    def test_agronomic_rule_filtering(self):
        feasible, disq = AgronomicRulesEngine.filter_feasible_crops(self.crops, self.env, "rainfed")
        self.assertTrue(len(feasible) >= 2)
        crop_ids = [c.id for c in feasible]
        self.assertIn("chickpea", crop_ids)

    def test_mcda_evaluation_bounds(self):
        engine = MCDAEngine()
        strat = engine.evaluate_rotation(
            strategy_id="strat_test",
            strategy_type="soil_restoration",
            title="Test Soil Strat",
            summary="Test",
            crops=self.crops,
            env=self.env,
            irrigation_type="rainfed"
        )
        self.assertGreaterEqual(strat.overall_score, 0.0)
        self.assertLessEqual(strat.overall_score, 100.0)
        self.assertGreaterEqual(strat.criteria_scores.soil_improvement, 0.0)
        self.assertLessEqual(strat.criteria_scores.soil_improvement, 100.0)
        self.assertIn("chickpea", [s.crop_id for s in strat.crop_sequence])
        self.assertTrue(len(strat.environmental_evidence) >= 2)

    def test_disease_break_consecutive_family_penalty(self):
        # Two Poaceae consecutive
        seq = [self.crops[0], self.crops[2]] # wheat (Poaceae) -> millet (Poaceae)
        res = AgronomicRulesEngine.validate_sequence_disease_break(seq)
        self.assertFalse(res["is_valid"])
        self.assertTrue(len(res["violations"]) > 0)

    def test_genetic_optimizer_run(self):
        optimizer = CropSequenceGeneticOptimizer(self.crops, self.env, "rainfed")
        req = GeneticOptimizerRequest(
            farm_id="test_farm",
            number_of_years=2,
            seasons_per_year=2,
            population_size=20,
            generations=15,
            mutation_rate=0.2
        )
        res = optimizer.run_optimization(req)
        self.assertEqual(len(res.optimized_strategy.crop_sequence), 4)
        self.assertGreaterEqual(res.optimized_strategy.overall_score, 40.0)

    def test_earthdata_prefers_native_download_link(self):
        links = [
            {"href": "https://example.test/opendap/file.h5", "rel": EarthdataClient.DATA_REL},
            {"href": "https://example.test/archive/file.h5", "rel": EarthdataClient.DATA_REL},
        ]
        self.assertEqual(
            EarthdataClient._select_data_url(links),
            "https://example.test/archive/file.h5",
        )

    def test_smap_hdf5_nearest_cell_reader(self):
        buffer = BytesIO()
        with h5py.File(buffer, "w") as h5:
            group = h5.create_group("Soil_Moisture_Retrieval_Data_AM")
            group.create_dataset("latitude", data=np.array([[10.0, 10.0], [11.0, 11.0]]))
            group.create_dataset("longitude", data=np.array([[20.0, 21.0], [20.0, 21.0]]))
            group.create_dataset("soil_moisture", data=np.array([[0.1, 0.2], [0.3, 0.4]]))
        value = NASASMAPService._read_nearest_surface_moisture(buffer.getvalue(), 10.9, 20.9)
        self.assertAlmostEqual(value, 0.4, places=3)

    def test_gpm_monthly_point_reader_converts_rate_to_total(self):
        buffer = BytesIO()
        with h5py.File(buffer, "w") as h5:
            h5.create_dataset("lat", data=np.array([10.0, 20.0, 30.0]))
            h5.create_dataset("lon", data=np.array([100.0, 110.0, 120.0, 130.0]))
            precip = h5.create_dataset("precipitation", data=np.ones((1, 4, 3)))
            precip.attrs["units"] = "mm/hr"
        granule = EarthdataGranule(
            granule_id="test",
            title="test",
            time_start="2024-02-01T00:00:00Z",
            time_end="2024-02-29T23:59:59Z",
            data_url="https://example.test/file.nc4",
        )
        total = NASAGPMService._read_monthly_total(buffer.getvalue(), 20.1, 109.9, granule)
        self.assertEqual(total, 696.0)

    def test_srtm_fallback_is_explicitly_demo(self):
        terrain = SRTMService()._fallback()
        self.assertTrue(terrain.provenance.is_demo)
        self.assertEqual(terrain.provenance.quality_flag.value, "simulated_demo_data")

    def test_ssurgo_horizons_are_depth_weighted(self):
        rows = [
            {
                "mukey": "123", "musym": "LoA", "cokey": "456",
                "compname": "Test loam", "comppct_r": "80",
                "hzdept_r": "0", "hzdepb_r": "10", "sandtotal_r": "40",
                "silttotal_r": "40", "claytotal_r": "20", "dbthirdbar_r": "1.2",
                "om_r": "3.0", "ph1to1h2o_r": "6.5", "awc_r": "0.18",
                "wthirdbar_r": "30", "wfifteenbar_r": "12",
            },
            {
                "mukey": "123", "musym": "LoA", "cokey": "456",
                "compname": "Test loam", "comppct_r": "80",
                "hzdept_r": "10", "hzdepb_r": "40", "sandtotal_r": "30",
                "silttotal_r": "45", "claytotal_r": "25", "dbthirdbar_r": "1.4",
                "om_r": "1.0", "ph1to1h2o_r": "7.0", "awc_r": "0.12",
                "wthirdbar_r": "28", "wfifteenbar_r": "16",
            },
        ]
        soil = USDASoilDataService._profile_from_rows(rows)
        self.assertIsNotNone(soil)
        self.assertAlmostEqual(soil.sand_fraction_pct, 33.3, places=1)
        self.assertAlmostEqual(soil.clay_fraction_pct, 23.3, places=1)
        self.assertAlmostEqual(soil.available_water_capacity_mm_m, 140.0, places=1)
        self.assertAlmostEqual(soil.bulk_density_cg_cm3, 133.3, places=1)
        self.assertFalse(soil.provenance.is_demo)
        self.assertIn("SSURGO/STATSGO2", soil.provenance.source_name)

    def test_power_monthly_parser_converts_precipitation_rate_to_total(self):
        payload = {
            "properties": {"parameter": {
                "T2M": {"202301": 10.0, "202302": 12.0, "202313": 11.0},
                "PRECTOTCORR": {"202301": 2.0, "202302": 1.0, "202313": 1.5},
            }}
        }
        parsed = NASAPowerService._parse_monthly_response(payload)
        self.assertEqual(parsed[(2023, 1)]["precipitation_mm"], 62.0)
        self.assertEqual(parsed[(2023, 2)]["precipitation_mm"], 28.0)
        self.assertNotIn((2023, 13), parsed)

    def test_durable_json_cache_round_trip(self):
        cache_key = "test:durable-cache-round-trip"
        delete_json_cache(cache_key)
        written = set_json_cache(cache_key, {"source": "NASA", "value": 42}, ttl_seconds=60)
        cached = get_json_cache(cache_key)
        self.assertIsNotNone(cached)
        self.assertEqual(cached.payload, {"source": "NASA", "value": 42})
        self.assertEqual(cached.fetched_at, written.fetched_at)
        self.assertFalse(cached.is_stale)
        delete_json_cache(cache_key)

if __name__ == "__main__":
    unittest.main()
