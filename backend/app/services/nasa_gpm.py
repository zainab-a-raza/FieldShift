"""NASA GPM IMERG Version 07 live precipitation integration."""
from __future__ import annotations

import calendar
from datetime import datetime, timedelta, timezone
from io import BytesIO
from typing import Optional

import h5py
import numpy as np

from app.config import settings
from app.models.schemas import RainfallMetrics
from app.provenance.tracker import create_provenance, DataOriginType, DataQualityFlag
from app.services.earthdata import EarthdataClient, EarthdataGranule, utc_iso


class NASAGPMService:
    SHORT_NAME = "GPM_3IMERGM"
    VERSION = "07"
    RESOURCE_URL = "https://gpm.nasa.gov/data"

    def __init__(self, token: Optional[str] = None):
        self.earthdata = EarthdataClient(token=token)
        self._cache: dict[tuple[float, float, str], RainfallMetrics] = {}

    async def get_precipitation_climatology(
        self,
        latitude: float,
        longitude: float,
        fallback_metrics: Optional[RainfallMetrics] = None,
    ) -> Optional[RainfallMetrics]:
        """Read up to 12 recent IMERG Final monthly granules at the farm point.

        IMERG supplies the precipitation totals. Daily spell diagnostics that are not
        present in the monthly product are retained from the passed NASA POWER metrics
        and identified as such in provenance notes.
        """
        if settings.DEMO_MODE or not self.earthdata.can_download:
            return None

        cache_key = (round(latitude, 3), round(longitude, 3), datetime.now(timezone.utc).strftime("%Y-%m"))
        if cache_key in self._cache:
            return self._cache[cache_key]

        try:
            result = await self._get_live_metrics(latitude, longitude, fallback_metrics)
            self._cache[cache_key] = result
            return result
        except Exception:
            return None

    async def _get_live_metrics(
        self,
        latitude: float,
        longitude: float,
        fallback: Optional[RainfallMetrics],
    ) -> RainfallMetrics:
        end = datetime.now(timezone.utc)
        start = end - timedelta(days=550)
        requested_months = max(4, min(12, settings.GPM_MONTHS_TO_ANALYZE))
        granules = await self.earthdata.search_granules(
            self.SHORT_NAME,
            self.VERSION,
            latitude,
            longitude,
            utc_iso(start),
            utc_iso(end),
            page_size=requested_months,
        )
        if len(granules) < 4:
            raise LookupError("Fewer than four GPM IMERG monthly granules were available.")

        totals = []
        used_granules = []
        for granule in granules:
            try:
                payload = await self.earthdata.download(granule)
                totals.append(self._read_monthly_total(payload, latitude, longitude, granule))
                used_granules.append(granule)
            except Exception:
                continue

        if len(totals) < 4:
            raise LookupError("GPM IMERG granules contained insufficient valid point observations.")

        # CMR returns newest first. A 12-month set is an observed annual total;
        # shorter windows are scaled and explicitly marked estimated.
        observed_total = float(sum(totals))
        annual_total = observed_total if len(totals) >= 12 else observed_total * (12.0 / len(totals))
        seasonal_total = float(sum(totals[:4]))
        quality = DataQualityFlag.OPTIMAL if len(totals) >= 12 else DataQualityFlag.ESTIMATED

        base = fallback
        variability = base.variability_index_pct if base else 0.0
        heavy_events = base.heavy_rain_events_gt_25mm if base else 0
        dry_days = base.max_consecutive_dry_days if base else 0
        deficit = base.rainfall_deficit_pct if base else 0.0

        oldest = used_granules[-1]
        newest = used_granules[0]
        prov = create_provenance(
            metric_id="gpm_imerg_monthly_precipitation",
            metric_name="GPM IMERG Final Monthly Precipitation at Farm Grid Cell",
            source_name="NASA GPM IMERG / GES DISC via Earthdata CMR",
            product_version="GPM_3IMERGM Version 07",
            origin_type=DataOriginType.SATELLITE_DERIVED,
            spatial_resolution="0.1° x 0.1° (~10 km)",
            units="mm",
            observation_start=oldest.time_start,
            observation_end=newest.time_end,
            quality_flag=quality,
            is_demo=False,
            citation="NASA GES DISC, GPM IMERG Final Precipitation L3 Monthly V07, DOI 10.5067/GPM/IMERG/3B-MONTH/07.",
            notes=(
                f"Precipitation totals use {len(totals)} real IMERG Final monthly granules. "
                "Heavy-event, dry-spell, variability, and deficit diagnostics remain from NASA POWER daily data. "
                f"Resource: {self.RESOURCE_URL}"
            ),
        )
        return RainfallMetrics(
            seasonal_precipitation_mm=round(seasonal_total, 1),
            annual_precipitation_mm=round(annual_total, 1),
            variability_index_pct=variability,
            heavy_rain_events_gt_25mm=heavy_events,
            max_consecutive_dry_days=dry_days,
            rainfall_deficit_pct=deficit,
            provenance=prov,
        )

    @classmethod
    def _read_monthly_total(
        cls,
        payload: bytes,
        latitude: float,
        longitude: float,
        granule: EarthdataGranule,
    ) -> float:
        with h5py.File(BytesIO(payload), "r") as h5:
            precip = cls._find_dataset(h5, "precipitation")
            lat_ds = cls._find_dataset(h5, "lat")
            lon_ds = cls._find_dataset(h5, "lon")
            if precip is None or lat_ds is None or lon_ds is None:
                raise ValueError("IMERG NetCDF is missing precipitation/lat/lon variables.")

            lats = np.asarray(lat_ds[:], dtype=float).reshape(-1)
            lons = np.asarray(lon_ds[:], dtype=float).reshape(-1)
            lat_index = int(np.argmin(np.abs(lats - latitude)))
            lon_delta = np.abs(((lons - longitude + 180.0) % 360.0) - 180.0)
            lon_index = int(np.argmin(lon_delta))

            slices = []
            lat_axis_used = False
            lon_axis_used = False
            for size in precip.shape:
                if size == len(lats) and not lat_axis_used:
                    slices.append(lat_index)
                    lat_axis_used = True
                elif size == len(lons) and not lon_axis_used:
                    slices.append(lon_index)
                    lon_axis_used = True
                else:
                    slices.append(0)
            value = float(np.asarray(precip[tuple(slices)]).squeeze())
            if not np.isfinite(value) or value < 0:
                raise ValueError("IMERG point precipitation is missing or invalid.")

            units_raw = precip.attrs.get("units", "mm/hr")
            units = units_raw.decode() if isinstance(units_raw, bytes) else str(units_raw)
            if "mm/hr" in units.lower() or "mm h-1" in units.lower():
                observation = granule.time_start or ""
                try:
                    observed = datetime.fromisoformat(observation.replace("Z", "+00:00"))
                    days = calendar.monthrange(observed.year, observed.month)[1]
                except ValueError:
                    days = 30
                value *= 24.0 * days
            return round(value, 3)

    @staticmethod
    def _find_dataset(h5: h5py.File, basename: str):
        found = []

        def visitor(name, obj):
            if isinstance(obj, h5py.Dataset) and name.rsplit("/", 1)[-1].lower() == basename.lower():
                found.append(obj)

        h5.visititems(visitor)
        return found[0] if found else None
