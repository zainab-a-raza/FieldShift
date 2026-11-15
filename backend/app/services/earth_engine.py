"""Multi-mission vegetation observations through Google Earth Engine.

Uses official public collections for USGS Landsat Collection 2, NASA MODIS
MOD13Q1, and NASA/NOAA VIIRS VNP13A1. A service account is required for live
reductions; otherwise the result is explicitly marked as demo data.
"""
from datetime import datetime, timedelta, timezone
from typing import Any, Callable, Dict, Optional, Tuple

from app.config import settings
from app.models.schemas import VegetationMetrics
from app.provenance.tracker import create_provenance, DataOriginType, DataQualityFlag


class EarthEngineService:
    def __init__(self, service_account: Optional[str] = None, private_key_file: Optional[str] = None):
        self.service_account = service_account or settings.GEE_SERVICE_ACCOUNT
        self.private_key_file = private_key_file or settings.GEE_PRIVATE_KEY_FILE
        self.ee_initialized = False

    def initialize_ee(self) -> bool:
        """Initialize Earth Engine only with explicit service-account credentials."""
        if settings.DEMO_MODE or not self.service_account or not self.private_key_file:
            return False
        if self.ee_initialized:
            return True
        try:
            import ee

            credentials = ee.ServiceAccountCredentials(self.service_account, self.private_key_file)
            ee.Initialize(credentials)
            self.ee_initialized = True
            return True
        except Exception:
            self.ee_initialized = False
            return False

    async def get_vegetation_metrics(
        self,
        latitude: float,
        longitude: float,
        polygon_geojson: Optional[Dict[str, Any]] = None,
    ) -> VegetationMetrics:
        """Retrieve NDVI from Landsat, then MODIS or VIIRS when configured live."""
        if self.initialize_ee():
            try:
                return self._get_live_metrics(latitude, longitude, polygon_geojson)
            except Exception as exc:
                return self._fallback(
                    f"Earth Engine vegetation request failed ({type(exc).__name__}); demo NDVI is shown instead."
                )
        reason = (
            "Application DEMO_MODE is enabled; no Earth Engine request was made."
            if settings.DEMO_MODE
            else "Earth Engine service-account credentials are not configured; demo NDVI is shown instead."
        )
        return self._fallback(reason)

    def _get_live_metrics(
        self,
        latitude: float,
        longitude: float,
        polygon_geojson: Optional[Dict[str, Any]],
    ) -> VegetationMetrics:
        import ee

        point = ee.Geometry.Point([longitude, latitude])
        geometry = point
        if polygon_geojson:
            candidate = polygon_geojson.get("geometry", polygon_geojson)
            if candidate.get("type") in {"Polygon", "MultiPolygon"}:
                geometry = ee.Geometry(candidate)

        end_date = datetime.now(timezone.utc).date()
        start_date = end_date - timedelta(days=548)
        recent_start = end_date - timedelta(days=120)
        providers: Tuple[Tuple[str, str, str, int, Callable[..., Any]], ...] = (
            (
                "USGS Landsat 8/9 OLI/TIRS",
                "Landsat Collection 2 Level-2 Surface Reflectance",
                "30 m",
                30,
                self._landsat_collection,
            ),
            (
                "NASA MODIS Terra",
                "MOD13Q1 Version 6.1 Vegetation Indices",
                "250 m",
                250,
                self._modis_collection,
            ),
            (
                "NASA/NOAA VIIRS Suomi NPP",
                "VNP13A1 Version 2 Vegetation Indices",
                "500 m",
                500,
                self._viirs_collection,
            ),
        )

        for mission, product, resolution, scale, collection_factory in providers:
            collection = collection_factory(ee, geometry, str(start_date), str(end_date))
            if int(collection.size().getInfo() or 0) == 0:
                continue
            recent = collection.filterDate(str(recent_start), str(end_date))
            if int(recent.size().getInfo() or 0) == 0:
                recent = collection
            summary_image = (
                recent.select("NDVI").median().rename("current")
                .addBands(collection.select("NDVI").mean().rename("historical_mean"))
                .addBands(collection.select("NDVI").max().rename("peak"))
            )
            values = summary_image.reduceRegion(
                reducer=ee.Reducer.mean(),
                geometry=geometry,
                scale=scale,
                bestEffort=True,
                maxPixels=1_000_000,
            ).getInfo()
            current = values.get("current")
            historical = values.get("historical_mean")
            peak = values.get("peak")
            if current is None or historical is None or peak is None:
                continue

            provenance = create_provenance(
                metric_id="multi_mission_ndvi",
                metric_name="Cloud/quality-masked Normalized Difference Vegetation Index",
                source_name=f"{mission} via Google Earth Engine",
                product_version=product,
                origin_type=DataOriginType.SATELLITE_DERIVED,
                spatial_resolution=resolution,
                temporal_resolution="16-day composite or acquisition-based",
                units="Unitless (-1.0 to 1.0)",
                observation_start=str(start_date),
                observation_end=str(end_date),
                quality_flag=DataQualityFlag.OPTIMAL,
                is_demo=False,
                citation="USGS Landsat / NASA LP DAAC vegetation-index collections",
                notes=(
                    "Current NDVI is the median of the latest 120 days; historical mean and "
                    "peak use the preceding 18 months. Landsat cloud/shadow pixels and MODIS "
                    "summary-QA pixels are excluded. Provider order is Landsat, MODIS, VIIRS."
                ),
            )
            current_value = float(current)
            historical_value = float(historical)
            return VegetationMetrics(
                current_ndvi=round(current_value, 3),
                mean_historical_ndvi=round(historical_value, 3),
                peak_season_ndvi=round(float(peak), 3),
                ndvi_anomaly=round(current_value - historical_value, 3),
                low_vegetation_months=[],
                satellite_mission=mission,
                cloud_coverage_pct=0.0,
                provenance=provenance,
            )
        raise ValueError("No quality-screened Landsat, MODIS, or VIIRS observations were available")

    @staticmethod
    def _landsat_collection(ee: Any, geometry: Any, start: str, end: str) -> Any:
        def prepare(image: Any) -> Any:
            qa = image.select("QA_PIXEL")
            clear = qa.bitwiseAnd(1 << 1).eq(0)
            clear = clear.And(qa.bitwiseAnd(1 << 2).eq(0))
            clear = clear.And(qa.bitwiseAnd(1 << 3).eq(0))
            clear = clear.And(qa.bitwiseAnd(1 << 4).eq(0))
            clear = clear.And(image.select("QA_RADSAT").eq(0))
            red = image.select("SR_B4").multiply(0.0000275).add(-0.2)
            nir = image.select("SR_B5").multiply(0.0000275).add(-0.2)
            ndvi = nir.subtract(red).divide(nir.add(red)).rename("NDVI")
            return ndvi.updateMask(clear).copyProperties(image, ["system:time_start"])

        landsat8 = ee.ImageCollection("LANDSAT/LC08/C02/T1_L2")
        landsat9 = ee.ImageCollection("LANDSAT/LC09/C02/T1_L2")
        return landsat8.merge(landsat9).filterBounds(geometry).filterDate(start, end).map(prepare)

    @staticmethod
    def _modis_collection(ee: Any, geometry: Any, start: str, end: str) -> Any:
        def prepare(image: Any) -> Any:
            ndvi = image.select("NDVI").multiply(0.0001).rename("NDVI")
            return ndvi.updateMask(image.select("SummaryQA").lte(1)).copyProperties(
                image, ["system:time_start"]
            )

        return ee.ImageCollection("MODIS/061/MOD13Q1").filterBounds(geometry).filterDate(start, end).map(prepare)

    @staticmethod
    def _viirs_collection(ee: Any, geometry: Any, start: str, end: str) -> Any:
        def prepare(image: Any) -> Any:
            raw = image.select("NDVI")
            valid = raw.gte(-2000).And(raw.lte(10000))
            return raw.multiply(0.0001).rename("NDVI").updateMask(valid).copyProperties(
                image, ["system:time_start"]
            )

        return ee.ImageCollection("NASA/VIIRS/002/VNP13A1").filterBounds(geometry).filterDate(start, end).map(prepare)

    @staticmethod
    def _fallback(reason: str = "Demo benchmark requested.") -> VegetationMetrics:
        provenance = create_provenance(
            metric_id="multi_mission_ndvi",
            metric_name="Multi-mission NDVI (Calibrated Demo Profile)",
            source_name="USGS Landsat / NASA MODIS & VIIRS (Demo Profile)",
            product_version="Landsat C2 L2, MOD13Q1 V061, VNP13A1 V002",
            origin_type=DataOriginType.SATELLITE_DERIVED,
            spatial_resolution="30-500 m depending on mission",
            temporal_resolution="Acquisition / 16-day composite",
            units="Unitless (-1.0 to 1.0)",
            quality_flag=DataQualityFlag.SIMULATED_DEMO,
            is_demo=True,
            citation="USGS EarthExplorer and NASA LP DAAC product catalogs",
            notes=reason,
        )
        return VegetationMetrics(
            current_ndvi=0.52,
            mean_historical_ndvi=0.47,
            peak_season_ndvi=0.76,
            ndvi_anomaly=0.05,
            low_vegetation_months=["June", "July", "November"],
            satellite_mission="Landsat 8/9 + MODIS/VIIRS",
            cloud_coverage_pct=0.0,
            provenance=provenance,
        )
