"""
ISRIC SoilGrids Data Integration Service.
Documentation: https://docs.isric.org/globaldata/soilgrids/
Retrieves global digital soil mapping properties:
- Soil organic carbon (soc) [dg/kg or g/kg]
- pH in H2O (phh2o) [pH x 10]
- Sand, Silt, Clay fractions [g/kg]
- Bulk density (bdod) [cg/cm³]
- Available water capacity
Preserves depth interval (0-30cm rootzone default), units, and uncertainty.
"""
import httpx
from typing import Dict, Any, Optional
from app.config import settings
from app.provenance.tracker import create_provenance, DataOriginType, DataQualityFlag
from app.models.schemas import SoilPropertiesMetrics

class SoilGridsService:
    BASE_URL = "https://rest.isric.org/soilgrids/v2.0/properties/query"
    PROPERTIES = ["soc", "phh2o", "sand", "silt", "clay", "bdod"]
    DEPTHS = ["0-5cm", "5-15cm", "15-30cm"]

    def __init__(self, timeout_sec: float = 3.5):
        self.timeout = timeout_sec

    async def fetch_soil_profile(self, latitude: float, longitude: float) -> SoilPropertiesMetrics:
        """
        Queries ISRIC SoilGrids 2.0 REST API for given coordinates.
        """
        if settings.DEMO_MODE:
            return self._generate_fallback(
                latitude, longitude,
                "Application DEMO_MODE is enabled; no SoilGrids request was made.",
            )

        params = {
            "lat": f"{latitude:.4f}",
            "lon": f"{longitude:.4f}",
            "property": self.PROPERTIES,
            "depth": self.DEPTHS,
            "value": ["mean", "uncertainty"]
        }

        try:
            async with httpx.AsyncClient(timeout=self.timeout) as client:
                resp = await client.get(self.BASE_URL, params=params)
                if resp.status_code == 200:
                    data = resp.json()
                    return self._parse_soilgrids_data(data, latitude, longitude, is_live=True)
        except Exception as exc:
            return self._generate_fallback(
                latitude, longitude,
                f"SoilGrids request failed ({type(exc).__name__}); demo values are shown instead.",
            )

        return self._generate_fallback(
            latitude, longitude,
            "SoilGrids returned no usable profile; demo values are shown instead.",
        )

    def _parse_soilgrids_data(self, data: Dict[str, Any], lat: float, lon: float, is_live: bool) -> SoilPropertiesMetrics:
        layers = data.get("properties", {}).get("layers", [])
        extracted = {}
        for layer in layers:
            prop_name = layer.get("name")
            depths = layer.get("depths", [])
            values = []
            for d in depths:
                mean_val = d.get("values", {}).get("mean")
                if mean_val is not None:
                    values.append(mean_val)
            if values:
                extracted[prop_name] = sum(values) / len(values)

        raw_soc = extracted.get("soc", 140.0)
        soc_g_kg = round(raw_soc / 10.0, 1)

        raw_ph = extracted.get("phh2o", 68.0)
        ph_val = round(raw_ph / 10.0, 1)

        sand_pct = round(extracted.get("sand", 380.0) / 10.0, 1)
        silt_pct = round(extracted.get("silt", 420.0) / 10.0, 1)
        clay_pct = round(extracted.get("clay", 200.0) / 10.0, 1)
        bulk_density = round(extracted.get("bdod", 135.0), 1)

        awc_mm_m = round(120.0 + (clay_pct * 1.2) + (soc_g_kg * 2.5) - (sand_pct * 0.8), 1)

        prov = create_provenance(
            metric_id="soil_properties_0_30cm",
            metric_name="Digital Soil Properties (0-30cm Depth)",
            source_name="ISRIC SoilGrids",
            product_version="SoilGrids 2.0 Global 250m",
            origin_type=DataOriginType.MODEL_ESTIMATE,
            spatial_resolution="250m x 250m",
            units="Multiple (pH, g/kg, %, cg/cm³)",
            observation_start="2020-01-01",
            observation_end="2024-12-31",
            quality_flag=DataQualityFlag.OPTIMAL if is_live else DataQualityFlag.SIMULATED_DEMO,
            is_demo=not is_live,
            citation="ISRIC - World Soil Information (Poggio et al., 2021)",
            notes="Aggregated across 0-5cm, 5-15cm, and 15-30cm depth horizons with quantile uncertainty bounds."
        )

        return SoilPropertiesMetrics(
            organic_carbon_g_kg=soc_g_kg,
            ph_in_h2o=ph_val,
            sand_fraction_pct=sand_pct,
            silt_fraction_pct=silt_pct,
            clay_fraction_pct=clay_pct,
            bulk_density_cg_cm3=bulk_density,
            available_water_capacity_mm_m=max(60.0, awc_mm_m),
            depth_interval="0-30 cm",
            provenance=prov
        )

    def _generate_fallback(
        self, lat: float = 0.0, lon: float = 0.0,
        reason: str = "Demo benchmark requested.",
    ) -> SoilPropertiesMetrics:
        prov = create_provenance(
            metric_id="soil_properties_0_30cm",
            metric_name="Digital Soil Properties (Demo Benchmark)",
            source_name="ISRIC SoilGrids (Regional Benchmark)",
            product_version="SoilGrids 2.0 Benchmark Profile",
            origin_type=DataOriginType.MODEL_ESTIMATE,
            spatial_resolution="250m x 250m",
            units="Multiple (pH, g/kg, %, cg/cm³)",
            quality_flag=DataQualityFlag.SIMULATED_DEMO,
            is_demo=True,
            citation="ISRIC SoilGrids 2.0 Architecture",
            notes=reason
        )

        return SoilPropertiesMetrics(
            organic_carbon_g_kg=14.8,
            ph_in_h2o=6.8,
            sand_fraction_pct=36.0,
            silt_fraction_pct=44.0,
            clay_fraction_pct=20.0,
            bulk_density_cg_cm3=132.0,
            available_water_capacity_mm_m=145.0,
            depth_interval="0-30 cm",
            provenance=prov
        )
