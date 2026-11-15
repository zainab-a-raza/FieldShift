"""NASA SRTMGL1 Version 3 live elevation and slope integration."""
from __future__ import annotations

import math
from datetime import datetime, timezone
from io import BytesIO
from typing import Optional, Tuple
from zipfile import ZipFile

import numpy as np

from app.config import settings
from app.models.schemas import TerrainMetrics
from app.provenance.tracker import create_provenance, DataOriginType, DataQualityFlag
from app.services.earthdata import EarthdataClient, EarthdataGranule


class SRTMService:
    SHORT_NAME = "SRTMGL1"
    VERSION = "003"
    RESOURCE_URL = "https://www.earthdata.nasa.gov/data/instruments/srtm"
    TILE_SIZE = 3601

    def __init__(self, token: Optional[str] = None):
        self.earthdata = EarthdataClient(token=token)
        self._cache: dict[tuple[float, float], TerrainMetrics] = {}

    async def get_terrain_metrics(self, latitude: float, longitude: float) -> TerrainMetrics:
        cache_key = (round(latitude, 4), round(longitude, 4))
        if cache_key in self._cache:
            return self._cache[cache_key]

        if not settings.DEMO_MODE and self.earthdata.can_download and -60.0 <= latitude <= 60.0:
            try:
                result = await self._get_live_metrics(latitude, longitude)
                self._cache[cache_key] = result
                return result
            except Exception as exc:
                return self._fallback(
                    f"SRTM live retrieval failed ({type(exc).__name__}); demo terrain is shown instead."
                )
        reason = (
            "Application DEMO_MODE is enabled; no SRTM request was made."
            if settings.DEMO_MODE
            else "SRTM coverage/token requirements were not met; demo terrain is shown instead."
        )
        return self._fallback(reason)

    async def _get_live_metrics(self, latitude: float, longitude: float) -> TerrainMetrics:
        granules = await self.earthdata.search_granules(
            self.SHORT_NAME,
            self.VERSION,
            latitude,
            longitude,
            "2000-02-11T00:00:00Z",
            "2000-02-22T23:59:59Z",
            page_size=3,
        )
        if not granules:
            raise LookupError("No SRTMGL1 tile was found for the farm coordinate.")

        last_error: Optional[Exception] = None
        for granule in granules:
            try:
                payload = await self.earthdata.download(granule)
                elevation, slope = self._read_hgt_tile(payload, latitude, longitude)
                return self._build_metrics(elevation, slope, granule)
            except Exception as exc:
                last_error = exc
        raise ValueError("No usable SRTM HGT tile was returned.") from last_error

    @classmethod
    def _read_hgt_tile(cls, payload: bytes, latitude: float, longitude: float) -> Tuple[float, float]:
        with ZipFile(BytesIO(payload)) as archive:
            hgt_names = [name for name in archive.namelist() if name.lower().endswith(".hgt")]
            if not hgt_names:
                raise ValueError("SRTM archive contains no HGT tile.")
            raw = archive.read(hgt_names[0])

        expected = cls.TILE_SIZE * cls.TILE_SIZE
        elevations = np.frombuffer(raw, dtype=">i2")
        if elevations.size != expected:
            raise ValueError(f"Unexpected SRTM tile size: {elevations.size} samples.")
        elevations = elevations.reshape((cls.TILE_SIZE, cls.TILE_SIZE)).astype(float)
        elevations[elevations <= -32768] = np.nan

        south = math.floor(latitude)
        west = math.floor(longitude)
        row = int(round((south + 1.0 - latitude) * 3600.0))
        col = int(round((longitude - west) * 3600.0))
        row = max(1, min(3599, row))
        col = max(1, min(3599, col))
        window = elevations[row - 1:row + 2, col - 1:col + 2]
        if not np.isfinite(window).all():
            raise ValueError("SRTM neighborhood contains void elevation samples.")

        mean_elevation = float(np.mean(window))
        lat_spacing_m = 111_320.0 / 3600.0
        lon_spacing_m = lat_spacing_m * max(0.1, math.cos(math.radians(latitude)))
        dz_dx = ((window[0, 2] + 2 * window[1, 2] + window[2, 2]) -
                 (window[0, 0] + 2 * window[1, 0] + window[2, 0])) / (8.0 * lon_spacing_m)
        dz_dy = ((window[2, 0] + 2 * window[2, 1] + window[2, 2]) -
                 (window[0, 0] + 2 * window[0, 1] + window[0, 2])) / (8.0 * lat_spacing_m)
        slope_degrees = math.degrees(math.atan(math.sqrt(dz_dx ** 2 + dz_dy ** 2)))
        return round(mean_elevation, 1), round(slope_degrees, 2)

    def _build_metrics(self, elevation: float, slope: float, granule: EarthdataGranule) -> TerrainMetrics:
        category, susceptibility, ruggedness = self._classify_slope(slope)
        prov = create_provenance(
            metric_id="srtm_elevation_slope",
            metric_name="SRTM 1 Arc-Second Elevation and Derived Slope",
            source_name="NASA SRTM / LP DAAC via Earthdata CMR",
            product_version="SRTMGL1 Version 3",
            origin_type=DataOriginType.DIRECT_SATELLITE,
            spatial_resolution="1 arc-second (~30 m)",
            units="m elevation; degrees slope",
            observation_start=granule.time_start,
            observation_end=granule.time_end,
            quality_flag=DataQualityFlag.OPTIMAL,
            is_demo=False,
            citation="NASA JPL SRTM Global 1 Arc Second V003 (SRTMGL1), LP DAAC.",
            notes=f"Elevation and Horn 3x3 slope calculated from {granule.title}. Resource: {self.RESOURCE_URL}",
        )
        return TerrainMetrics(
            mean_elevation_m=elevation,
            slope_degrees=slope,
            slope_category=category,
            terrain_ruggedness=ruggedness,
            erosion_susceptibility=susceptibility,
            provenance=prov,
        )

    def _fallback(self, reason: str = "Demo benchmark requested.") -> TerrainMetrics:
        category, susceptibility, ruggedness = self._classify_slope(2.4)
        prov = create_provenance(
            metric_id="srtm_elevation_slope",
            metric_name="SRTM Elevation and Slope (Demo Benchmark)",
            source_name="NASA SRTM / LP DAAC (Calibrated Demo Profile)",
            product_version="SRTMGL1 Version 3",
            origin_type=DataOriginType.MODEL_ESTIMATE,
            spatial_resolution="1 arc-second (~30 m)",
            units="m elevation; degrees slope",
            quality_flag=DataQualityFlag.SIMULATED_DEMO,
            is_demo=True,
            citation="NASA JPL SRTM Global 1 Arc Second V003 (SRTMGL1), LP DAAC.",
            notes=f"{reason} Resource: {self.RESOURCE_URL}",
        )
        return TerrainMetrics(
            mean_elevation_m=365.0,
            slope_degrees=2.4,
            slope_category=category,
            terrain_ruggedness=ruggedness,
            erosion_susceptibility=susceptibility,
            provenance=prov,
        )

    @staticmethod
    def _classify_slope(slope: float) -> Tuple[str, str, str]:
        if slope < 2.0:
            return "Nearly Level (0-2°)", "Low Runoff Susceptibility", "Uniform Plain"
        if slope < 5.0:
            return "Gently Undulating (2-5°)", "Moderate Runoff Susceptibility", "Low Ridge & Swale"
        if slope < 10.0:
            return "Rolling / Moderate (5-10°)", "High Runoff & Sheet Washout Risk", "Rolling Topography"
        return "Steep (>10°)", "Severe Water Erosion Susceptibility", "Dissected Escarpment"
