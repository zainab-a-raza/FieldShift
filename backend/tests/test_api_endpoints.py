"""
Integration Test for FieldShift FastAPI Endpoints.
"""
import sys
import os
import unittest
from httpx import ASGITransport, AsyncClient

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from app.main import app
from app.data.seed_data import seed_database
from app.config import settings

class TestAPIEndpoints(unittest.IsolatedAsyncioTestCase):
    async def asyncSetUp(self):
        self.original_demo_mode = settings.DEMO_MODE
        settings.DEMO_MODE = True
        seed_database()
        self.client = AsyncClient(
            transport=ASGITransport(app=app),
            base_url="http://testserver",
        )

    async def asyncTearDown(self):
        await self.client.aclose()
        settings.DEMO_MODE = self.original_demo_mode

    async def test_health(self):
        resp = await self.client.get("/health")
        self.assertEqual(resp.status_code, 200)
        self.assertEqual(resp.json()["status"], "healthy")

    async def test_list_farms(self):
        resp = await self.client.get("/api/farms")
        self.assertEqual(resp.status_code, 200)
        farms = resp.json()
        self.assertGreaterEqual(len(farms), 1)
        farm_ids = [f["id"] for f in farms]
        self.assertIn("farm_kansas_01", farm_ids)

    async def test_get_farm_environment(self):
        resp = await self.client.get("/api/farms/farm_kansas_01/environment")
        self.assertEqual(resp.status_code, 200)
        data = resp.json()
        self.assertIn("temperature", data)
        self.assertIn("rainfall", data)
        self.assertIn("soil_moisture", data)
        self.assertIn("vegetation", data)
        self.assertIn("soil_properties", data)
        self.assertIn("terrain", data)
        self.assertEqual(data["data_status"], "demo")
        self.assertTrue(data["data_messages"])
        # Check provenance attached
        self.assertIn("provenance", data["temperature"])
        self.assertEqual(data["temperature"]["provenance"]["source_name"][:10], "NASA POWER")
        cached_resp = await self.client.get("/api/farms/farm_kansas_01/environment")
        self.assertEqual(cached_resp.status_code, 200)
        self.assertEqual(cached_resp.json()["cache_status"], "hit")

    async def test_demo_trends_do_not_claim_observed_history(self):
        resp = await self.client.get("/api/farms/farm_kansas_01/environment/trends")
        self.assertEqual(resp.status_code, 200)
        data = resp.json()
        self.assertEqual(data["status"], "demo_unavailable")
        self.assertEqual(data["historical_seasonal_comparison"], [])
        self.assertTrue(data["is_demo"])

    async def test_get_rotations(self):
        resp = await self.client.get("/api/farms/farm_kansas_01/rotations")
        self.assertEqual(resp.status_code, 200)
        data = resp.json()
        self.assertEqual(len(data["strategies"]), 3)
        strat_types = [s["strategy_type"] for s in data["strategies"]]
        self.assertIn("baseline", strat_types)
        self.assertIn("soil_restoration", strat_types)
        self.assertIn("water_resilience", strat_types)

    async def test_simulate_scenario(self):
        payload = {
            "farm_id": "farm_kansas_01",
            "rainfall_change_pct": -20.0,
            "temperature_increase_c": 2.5,
            "irrigation_reduction_pct": -30.0
        }
        resp = await self.client.post("/api/scenarios/simulate", json=payload)
        self.assertEqual(resp.status_code, 200)
        sim = resp.json()
        self.assertEqual(len(sim["results"]), 3)
        self.assertIn("is_hypothetical_disclaimer", sim)

    async def test_data_sources_transparency(self):
        resp = await self.client.get("/api/data-sources")
        self.assertEqual(resp.status_code, 200)
        sources = resp.json()["sources"]
        self.assertGreaterEqual(len(sources), 4)

    async def test_report_uses_metric_provenance_and_disclaimer(self):
        resp = await self.client.get("/api/reports/farm_kansas_01")
        self.assertEqual(resp.status_code, 200)
        report = resp.json()
        self.assertIn("Decision-support draft", report["decision_support_disclaimer"])
        self.assertEqual(report["report_status"], "demo")
        self.assertGreaterEqual(len(report["scientific_provenance_citations"]), 6)
        self.assertIn("source", report["scientific_provenance_citations"][0])

if __name__ == "__main__":
    unittest.main()
