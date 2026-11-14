import sys
import asyncio
import os
import httpx

print("Starting verify_endpoints.py script...")
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from app.main import app
print("Imported app successfully.")

async def test_all():
    print("Beginning test_all coroutine...")
    transport = httpx.ASGITransport(app=app)
    async with httpx.AsyncClient(transport=transport, base_url="http://testserver") as client:
        print("Checking /health...")
        h = await client.get("/health")
        print("HEALTH:", h.status_code, h.json())
        assert h.status_code == 200

        print("Checking /api/farms...")
        f = await client.get("/api/farms")
        print("FARMS:", f.status_code, "Count:", len(f.json()))
        assert f.status_code == 200

        print("Checking /api/farms/farm_kansas_01/environment...")
        env = await client.get("/api/farms/farm_kansas_01/environment")
        print("ENVIRONMENT:", env.status_code, "Avg Temp:", env.json()["temperature"]["avg_temp_c"])
        assert env.status_code == 200

        print("Checking /api/farms/farm_kansas_01/rotations...")
        rot = await client.get("/api/farms/farm_kansas_01/rotations")
        print("ROTATIONS:", rot.status_code, "Strategies:", [s["title"] for s in rot.json()["strategies"]])
        assert rot.status_code == 200

        print("Checking /api/scenarios/simulate...")
        sim_payload = {
            "farm_id": "farm_kansas_01",
            "rainfall_change_pct": -20.0,
            "temperature_increase_c": 2.0,
            "irrigation_reduction_pct": -25.0
        }
        sim = await client.post("/api/scenarios/simulate", json=sim_payload)
        print("SIMULATION:", sim.status_code, "Winner:", sim.json()["resilience_winner_strategy_id"])
        assert sim.status_code == 200

        print("Checking /api/data-sources...")
        ds = await client.get("/api/data-sources")
        print("DATA SOURCES:", ds.status_code, "Count:", len(ds.json()["sources"]))
        assert ds.status_code == 200

        print("\n>>> ALL BACKEND API ENDPOINTS VERIFIED SUCCESSFULLY! <<<")

if __name__ == "__main__":
    asyncio.run(test_all())
