"""NASA SMAP SPL3SMP_E Version 6 live data integration."""
from __future__ import annotations

from datetime import datetime, timedelta, timezone
from io import BytesIO
from typing import Optional

import h5py
import numpy as np

from app.config import settings
from app.models.schemas import SoilMoistureMetrics
from app.provenance.tracker import create_provenance, DataOriginType, DataQualityFlag
from app.services.earthdata import EarthdataClient, EarthdataGranule, utc_iso


class NASASMAPService:
    SHORT_NAME = "SPL3SMP_E"
    VERSION = "006"
    RESOURCE_URL = "https://www.earthdata.nasa.gov/data/platforms/space-based-platforms/smap"

    def __init__(self, token: Optional[str] = None):
        self.earthdata = EarthdataClient(token=token)
        self._cache: dict[tuple[float, float, str], SoilMoistureMetrics] = {}

    async def get_soil_moisture(
        self,
        latitude: float,
        longitude: float,
        season_months: Optional[list] = None,
    ) -> SoilMoistureMetrics:
        """Return the nearest valid 0-5 cm SPL3SMP_E observation.

        SPL3SMP_E does not measure root-zone moisture, so that field is intentionally
        returned as ``None`` for live observations instead of fabricating a value.
        """
        cache_key = (round(latitude, 3), round(longitude, 3), datetime.now(timezone.utc).strftime("%Y-%m-%d"))
        if cache_key in self._cache:
            return self._cache[cache_key]

        if not settings.DEMO_MODE and self.earthdata.can_download:
            try:
                result = await self._get_live_observation(latitude, longitude)
                self._cache[cache_key] = result
                return result
            except Exception as exc:
                return self._fallback(
                    f"SMAP live retrieval failed ({type(exc).__name__}); demo moisture is shown instead."
                )

        reason = (
            "Application DEMO_MODE is enabled; no SMAP request was made."
            if settings.DEMO_MODE
            else "NASA_EARTHDATA_TOKEN is not configured; demo moisture is shown instead."
        )
        return self._fallback(reason)

    async def _get_live_observation(self, latitude: float, longitude: float) -> SoilMoistureMetrics:
        end = datetime.now(timezone.utc) - timedelta(days=2)
        start = end - timedelta(days=12)
        granules = await self.earthdata.search_granules(
            self.SHORT_NAME,
            self.VERSION,
            latitude,
            longitude,
            utc_iso(start),
            utc_iso(end),
            page_size=5,
        )
        if not granules:
            raise LookupError("No recent SMAP SPL3SMP_E granules were found.")

        last_error: Optional[Exception] = None
        for granule in granules:
            try:
                payload = await self.earthdata.download(granule)
                moisture = self._read_nearest_surface_moisture(payload, latitude, longitude)
                return self._build_live_metrics(moisture, granule)
            except Exception as exc:
                last_error = exc
        raise LookupError("Recent SMAP granules contained no usable observation.") from last_error

    @staticmethod
    def _read_nearest_surface_moisture(payload: bytes, latitude: float, longitude: float) -> float:
        observations = []
        with h5py.File(BytesIO(payload), "r") as h5:
            for group_name in ("Soil_Moisture_Retrieval_Data_AM", "Soil_Moisture_Retrieval_Data_PM"):
                if group_name not in h5:
                    continue
                group = h5[group_name]
                soil_name = next(
                    (name for name in ("soil_moisture", "soil_moisture_dca", "soil_moisture_pm") if name in group),
                    None,
                )
                lat_name = next((name for name in ("latitude", "latitude_pm") if name in group), None)
                lon_name = next((name for name in ("longitude", "longitude_pm") if name in group), None)
                if not soil_name or not lat_name or not lon_name:
                    continue

                soil = np.asarray(group[soil_name][:], dtype=float)
                lats = np.asarray(group[lat_name][:], dtype=float)
                lons = np.asarray(group[lon_name][:], dtype=float)
                valid = np.isfinite(soil) & (soil >= 0.0) & (soil <= 1.0)
                if not valid.any():
                    continue

                lon_delta = ((lons - longitude + 180.0) % 360.0) - 180.0
                distance = (lats - latitude) ** 2 + (lon_delta * np.cos(np.deg2rad(latitude))) ** 2
                distance[~valid] = np.inf
                observations.append(float(soil.flat[int(np.argmin(distance))]))

        if not observations:
            raise ValueError("SMAP granule has no valid AM/PM soil-moisture cell near the farm.")
        return round(float(np.mean(observations)), 4)

    def _build_live_metrics(self, surface_m3: float, granule: EarthdataGranule) -> SoilMoistureMetrics:
        if surface_m3 < 0.12:
            status = "Very dry surface soil"
        elif surface_m3 < 0.20:
            status = "Dry surface soil"
        elif surface_m3 < 0.35:
            status = "Moderate surface moisture"
        else:
            status = "Wet surface soil"

        prov = create_provenance(
            metric_id="smap_surface_moisture",
            metric_name="SMAP Enhanced L3 Daily Surface Soil Moisture",
            source_name="NASA SMAP / NSIDC DAAC via Earthdata CMR",
            product_version="SPL3SMP_E Version 6",
            origin_type=DataOriginType.DIRECT_SATELLITE,
            spatial_resolution="9 km EASE-Grid 2.0",
            units="m³/m³ (0-5 cm volumetric fraction)",
            observation_start=granule.time_start,
            observation_end=granule.time_end,
            quality_flag=DataQualityFlag.OPTIMAL,
            is_demo=False,
            citation="NASA NSIDC DAAC, SMAP Enhanced L3 Radiometer Global Daily 9 km, Version 6.",
            notes=(
                f"Nearest valid AM/PM cell from {granule.title}. SPL3SMP_E measures the top 0-5 cm; "
                f"root-zone moisture and a local historical percentile are not supplied. Resource: {self.RESOURCE_URL}"
            ),
        )
        return SoilMoistureMetrics(
            surface_soil_moisture_m3_m3=surface_m3,
            root_zone_soil_moisture_m3_m3=None,
            soil_moisture_percentile=None,
            anomaly_status=status,
            provenance=prov,
        )

    def _fallback(self, reason: str = "Demo benchmark requested.") -> SoilMoistureMetrics:
        prov = create_provenance(
            metric_id="smap_surface_moisture",
            metric_name="SMAP Surface Soil Moisture (Demo Benchmark)",
            source_name="NASA SMAP / NSIDC DAAC (Calibrated Demo Profile)",
            product_version="SPL3SMP_E Version 6",
            origin_type=DataOriginType.MODEL_ESTIMATE,
            spatial_resolution="9 km EASE-Grid 2.0",
            units="m³/m³ (0-5 cm volumetric fraction)",
            quality_flag=DataQualityFlag.SIMULATED_DEMO,
            is_demo=True,
            citation="NASA NSIDC DAAC, SMAP Enhanced L3 Radiometer Global Daily 9 km, Version 6.",
            notes=f"{reason} Resource: {self.RESOURCE_URL}",
        )
        return SoilMoistureMetrics(
            surface_soil_moisture_m3_m3=0.22,
            root_zone_soil_moisture_m3_m3=0.26,
            soil_moisture_percentile=34.0,
            anomaly_status="Demo moisture deficit benchmark",
            provenance=prov,
        )
