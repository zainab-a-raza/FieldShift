"""
Integration Test for FieldShift FastAPI Endpoints.
"""
import sys
import os
import unittest
from starlette.testclient import TestClient

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from app.main import app

class TestAPIEndpoints(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.client = TestClient(app)

    def test_health(self):
        resp = self.client.get("/health")
        self.assertEqual(resp.status_code, 200)
        self.assertEqual(resp.json()["status"], "healthy")

    def test_list_farms(self):
        resp = self.client.get("/api/farms")
        self.assertEqual(resp.status_code, 200)
        farms = resp.json()
        self.assertGreaterEqual(len(farms), 1)
        farm_ids = [f["id"] for f in farms]
        self.assertIn("farm_kansas_01", farm_ids)

    def test_get_farm_environment(self):
        resp = self.client.get("/api/farms/farm_kansas_01/environment")
        self.assertEqual(resp.status_code, 200)
        data = resp.json()
        self.assertIn("temperature", data)
        self.assertIn("rainfall", data)
        self.assertIn("soil_moisture", data)
        self.assertIn("vegetation", data)
        self.assertIn("soil_properties", data)
        self.assertIn("terrain", data)
        # Check provenance attached
        self.assertIn("provenance", data["temperature"])
        self.assertEqual(data["temperature"]["provenance"]["source_name"][:10], "NASA POWER")

    def test_get_rotations(self):
        resp = self.client.get("/api/farms/farm_kansas_01/rotations")
        self.assertEqual(resp.status_code, 200)
        data = resp.json()
        self.assertEqual(len(data["strategies"]), 3)
        strat_types = [s["strategy_type"] for s in data["strategies"]]
        self.assertIn("baseline", strat_types)
        self.assertIn("soil_restoration", strat_types)
        self.assertIn("water_resilience", strat_types)

    def test_simulate_scenario(self):
        payload = {
            "farm_id": "farm_kansas_01",
            "rainfall_change_pct": -20.0,
            "temperature_increase_c": 2.5,
            "irrigation_reduction_pct": -30.0
        }
        resp = self.client.post("/api/scenarios/simulate", json=payload)
        self.assertEqual(resp.status_code, 200)
        sim = resp.json()
        self.assertEqual(len(sim["results"]), 3)
        self.assertIn("is_hypothetical_disclaimer", sim)

    def test_data_sources_transparency(self):
        resp = self.client.get("/api/data-sources")
        self.assertEqual(resp.status_code, 200)
        sources = resp.json()["sources"]
        self.assertGreaterEqual(len(sources), 4)

if __name__ == "__main__":
    unittest.main()
