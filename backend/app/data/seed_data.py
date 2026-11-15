"""
Database Seeding Script for FieldShift.
Populates crop catalog, satellite data source registry, and representative demo farms.
"""
import json
import os
import uuid
from datetime import datetime
from app.models.database import get_connection

DATA_DIR = os.path.dirname(os.path.abspath(__file__))

def seed_database():
    conn = get_connection()
    cursor = conn.cursor()

    # 1. Seed Crops
    crop_catalog_path = os.path.join(DATA_DIR, "crop_catalog.json")
    if os.path.exists(crop_catalog_path):
        with open(crop_catalog_path, "r", encoding="utf-8") as f:
            crops = json.load(f)
            for c in crops:
                cursor.execute("""
                INSERT OR REPLACE INTO crop_catalog (id, name, family, category, data_json)
                VALUES (?, ?, ?, ?, ?)
                """, (c["id"], c["name"], c["family"], c["category"], json.dumps(c)))

    # 2. Seed Data Sources
    data_sources = [
        {
            "id": "nasa-power",
            "name": "NASA POWER",
            "agency": "NASA Langley Research Center",
            "product_name": "Agroclimatology Daily Point API (MERRA-2 / GEOS)",
            "resolution": "0.5° x 0.5° (~50 km)",
            "cadence": "Daily (with 3-4 day latency)",
            "status": "Operational / Live",
            "description": "Daily surface solar radiation, air temperature (mean, min, max), precipitation, and relative humidity for global agricultural decision making.",
            "documentation_url": "https://power.larc.nasa.gov/"
        },
        {
            "id": "isric-soilgrids",
            "name": "ISRIC SoilGrids",
            "agency": "ISRIC - World Soil Information",
            "product_name": "SoilGrids 2.0 Global Digital Soil Mapping",
            "resolution": "250m x 250m",
            "cadence": "Multi-year aggregated baseline (Machine Learning)",
            "status": "Operational / Live REST API",
            "description": "Global predictions for soil organic carbon, pH in H2O, sand/silt/clay fractions, and bulk density at 6 standardized depth intervals.",
            "documentation_url": "https://docs.isric.org/globaldata/soilgrids/"
        },
        {
            "id": "usda-nrcs-ssurgo",
            "name": "USDA NRCS SSURGO / STATSGO2",
            "agency": "USDA Natural Resources Conservation Service",
            "product_name": "Soil Survey Geographic Database via Soil Data Access",
            "resolution": "Survey map-unit polygons and component horizons",
            "cadence": "Published soil-survey baseline",
            "status": "Operational / Live REST API (U.S. coverage)",
            "description": "Point-intersected soil map units with depth-weighted 0-30 cm texture, pH, organic matter, bulk density, and available water capacity; SoilGrids is the global fallback.",
            "documentation_url": "https://www.nrcs.usda.gov/resources/data-and-reports/soils"
        },
        {
            "id": "nasa-smap",
            "name": "NASA SMAP",
            "agency": "NASA Jet Propulsion Laboratory / GSFC",
            "product_name": "SMAP Enhanced L3 Radiometer Global Daily 9 km (SPL3SMP_E V006)",
            "resolution": "9 km x 9 km",
            "cadence": "Daily (2-3 day revisit)",
            "status": "Live via Earthdata CMR when token is configured",
            "description": "Surface volumetric soil moisture (0-5 cm depth) measured with L-band microwave radiometer, indicating regional soil saturation and dry spells.",
            "documentation_url": "https://www.earthdata.nasa.gov/data/platforms/space-based-platforms/smap"
        },
        {
            "id": "nasa-gpm",
            "name": "NASA GPM IMERG",
            "agency": "NASA Goddard Space Flight Center",
            "product_name": "GPM IMERG Final Precipitation L3 V07 (GPM_3IMERGM / GPM_3IMERGDF)",
            "resolution": "0.1° x 0.1° (~10 km)",
            "cadence": "Daily (calibrated monthly)",
            "status": "Live via Earthdata CMR when token is configured",
            "description": "Global precipitation estimates combining radar, microwave, infrared satellite sensors with surface rain-gauge validation.",
            "documentation_url": "https://gpm.nasa.gov/data"
        },
        {
            "id": "usgs-landsat",
            "name": "USGS Landsat 8/9",
            "agency": "U.S. Geological Survey / NASA",
            "product_name": "Landsat Collection 2 Level-2 Surface Reflectance",
            "resolution": "30m multispectral",
            "cadence": "8-day combined Landsat 8/9 revisit",
            "status": "Operational via Earth Engine when configured",
            "description": "Cloud- and shadow-masked red/NIR surface reflectance used to calculate field-scale NDVI, historical mean, peak, and anomaly.",
            "documentation_url": "https://earthexplorer.usgs.gov/"
        },
        {
            "id": "nasa-modis",
            "name": "NASA MODIS",
            "agency": "NASA LP DAAC",
            "product_name": "MOD13Q1 V061 Terra Vegetation Indices",
            "resolution": "250m",
            "cadence": "16-day composites",
            "status": "Operational fallback via Earth Engine when configured",
            "description": "Quality-screened Terra NDVI composites provide vegetation continuity when usable Landsat observations are unavailable.",
            "documentation_url": "https://lpdaac.usgs.gov/products/"
        },
        {
            "id": "nasa-viirs",
            "name": "NASA / NOAA VIIRS",
            "agency": "NASA LP DAAC / NOAA",
            "product_name": "VNP13A1 V002 Suomi NPP Vegetation Indices",
            "resolution": "500m",
            "cadence": "16-day composites",
            "status": "Operational fallback via Earth Engine when configured",
            "description": "Quality-screened VIIRS NDVI composites provide a second vegetation continuity layer after Landsat and MODIS.",
            "documentation_url": "https://search.earthdata.nasa.gov/search?q=VIIRS"
        },
        {
            "id": "copernicus-sentinel2",
            "name": "Copernicus Sentinel-2",
            "agency": "European Space Agency (ESA) & Google Earth Engine",
            "product_name": "Sentinel-2 MSI Level-2A Surface Reflectance (Harmonized)",
            "resolution": "10m x 10m Multispectral",
            "cadence": "5-day revisit",
            "status": "Operational / GEE Catalog",
            "description": "High-resolution optical imagery for Normalized Difference Vegetation Index (NDVI), canopy vigor, and field cover tracking.",
            "documentation_url": "https://developers.google.com/earth-engine/datasets/catalog/COPERNICUS_S2_SR_HARMONIZED"
        },
        {
            "id": "nasa-srtm",
            "name": "NASA SRTM",
            "agency": "NASA Jet Propulsion Laboratory / USGS",
            "product_name": "SRTM Global 1 Arc-Second V003 (SRTMGL1)",
            "resolution": "1 arc-second (~30m)",
            "cadence": "Static Global Benchmark",
            "status": "Live via Earthdata CMR when token is configured",
            "description": "Digital elevation and derived topographic slope gradient for estimating rainfall runoff and terrain-based erosion risk.",
            "documentation_url": "https://www.earthdata.nasa.gov/data/instruments/srtm"
        }
    ]

    # Remove the earlier combined registry row now that MODIS and VIIRS have
    # separate official documentation links and provenance entries.
    cursor.execute("DELETE FROM data_sources WHERE id = ?", ("nasa-modis-viirs",))

    for ds in data_sources:
        cursor.execute("""
        INSERT OR REPLACE INTO data_sources (id, name, agency, product_name, resolution, cadence, status, description, documentation_url)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, (
            ds["id"], ds["name"], ds["agency"], ds["product_name"],
            ds["resolution"], ds["cadence"], ds["status"], ds["description"], ds["documentation_url"]
        ))

    # 3. Seed Realistic Demo Farms
    demo_farms = [
        {
            "id": "farm_kansas_01",
            "name": "Salina Prairie Grain Holding",
            "location_name": "Salina, Kansas, United States",
            "latitude": 38.8403,
            "longitude": -97.6114,
            "area_hectares": 128.5,
            "boundaries_geojson": {
                "type": "Polygon",
                "coordinates": [[
                    [-97.6150, 38.8380],
                    [-97.6070, 38.8380],
                    [-97.6070, 38.8430],
                    [-97.6150, 38.8430],
                    [-97.6150, 38.8380]
                ]]
            },
            "current_crop": "wheat",
            "previous_crop_sequence": ["wheat", "wheat", "wheat"],
            "irrigation_type": "rainfed",
            "primary_priority": "water_resilience",
            "created_at": "2026-01-15T08:00:00Z",
            "updated_at": "2026-05-10T14:30:00Z"
        },
        {
            "id": "farm_punjab_02",
            "name": "Green Valley Agro Research Plot",
            "location_name": "Ludhiana, Punjab, India",
            "latitude": 30.9010,
            "longitude": 75.8573,
            "area_hectares": 32.0,
            "boundaries_geojson": {
                "type": "Polygon",
                "coordinates": [[
                    [75.8540, 30.8980],
                    [75.8600, 30.8980],
                    [75.8600, 30.9040],
                    [75.8540, 30.9040],
                    [75.8540, 30.8980]
                ]]
            },
            "current_crop": "rice",
            "previous_crop_sequence": ["rice", "wheat", "rice", "wheat"],
            "irrigation_type": "groundwater_well",
            "primary_priority": "soil_restoration",
            "created_at": "2026-02-01T10:00:00Z",
            "updated_at": "2026-05-12T09:15:00Z"
        },
        {
            "id": "farm_andalusia_03",
            "name": "Hacienda del Sol Olive & Field Crop",
            "location_name": "Seville, Andalusia, Spain",
            "latitude": 37.3891,
            "longitude": -5.9845,
            "area_hectares": 48.0,
            "boundaries_geojson": {
                "type": "Polygon",
                "coordinates": [[
                    [-5.9880, 37.3860],
                    [-5.9810, 37.3860],
                    [-5.9810, 37.3920],
                    [-5.9880, 37.3920],
                    [-5.9880, 37.3860]
                ]]
            },
            "current_crop": "wheat",
            "previous_crop_sequence": ["wheat", "wheat"],
            "irrigation_type": "drip",
            "primary_priority": "balanced",
            "created_at": "2026-03-10T11:20:00Z",
            "updated_at": "2026-05-14T16:00:00Z"
        }
    ]

    for farm in demo_farms:
        cursor.execute("""
        INSERT OR REPLACE INTO farms (
            id, name, location_name, latitude, longitude, area_hectares,
            boundaries_geojson, current_crop, previous_crop_sequence,
            irrigation_type, primary_priority, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, (
            farm["id"], farm["name"], farm["location_name"], farm["latitude"], farm["longitude"],
            farm["area_hectares"], json.dumps(farm["boundaries_geojson"]), farm["current_crop"],
            json.dumps(farm["previous_crop_sequence"]), farm["irrigation_type"], farm["primary_priority"],
            farm["created_at"], farm["updated_at"]
        ))

    conn.commit()
    conn.close()
    print("Database seeding completed successfully.")

if __name__ == "__main__":
    seed_database()
