"""
NASA POWER Agroclimatology Data Integration Module.
API Documentation: https://power.larc.nasa.gov/docs/services/api/temporal/daily/
Retrieves daily surface meteorology and solar energy parameters:
T2M, T2M_MAX, T2M_MIN, PRECTOTCORR, RH2M, ALLSKY_SFC_SW_DWN.
"""
import asyncio
import calendar
import httpx
from typing import Dict, Any, Optional
from datetime import datetime, timedelta, timezone
import math
from app.config import settings
from app.provenance.tracker import create_provenance, DataOriginType, DataQualityFlag, ProvenanceRecord
from app.models.schemas import TemperatureMetrics, RainfallMetrics

class NASAPowerService:
    BASE_URL = "https://power.larc.nasa.gov/api/temporal/daily/point"
    MONTHLY_URL = "https://power.larc.nasa.gov/api/temporal/monthly/point"
    PARAMETERS = "T2M,T2M_MAX,T2M_MIN,PRECTOTCORR,RH2M,ALLSKY_SFC_SW_DWN"
    COMMUNITY = "AG"  # Agroclimatology

    def __init__(self, timeout_sec: float = 20.0):
        self.timeout = timeout_sec
        self.base_url = settings.NASA_POWER_API_URL
        self._baseline_cache: Dict[tuple, Dict[str, Any]] = {}

    async def fetch_daily_agrometeorology(
        self,
        latitude: float,
        longitude: float,
        start_date: Optional[str] = None,
        end_date: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Fetches daily weather parameters from NASA POWER.
        Dates in format YYYYMMDD.
        """
        if not end_date:
            end_dt = datetime.now(timezone.utc) - timedelta(days=5) # NASA POWER daily data lag ~3-5 days
            end_date = end_dt.strftime("%Y%m%d")
        if not start_date:
            start_dt = datetime.strptime(end_date, "%Y%m%d") - timedelta(days=365)
            start_date = start_dt.strftime("%Y%m%d")

        # In explicit Demo Mode or when network is disabled, deliver calibrated benchmark profile instantly
        if settings.DEMO_MODE:
            return self._generate_realistic_fallback(
                latitude, longitude, start_date, end_date,
                reason="Application DEMO_MODE is enabled; no NASA POWER request was made.",
            )

        params = {
            "parameters": self.PARAMETERS,
            "community": self.COMMUNITY,
            "longitude": f"{longitude:.4f}",
            "latitude": f"{latitude:.4f}",
            "start": start_date,
            "end": end_date,
            "format": "JSON"
        }

        try:
            daily_task = self._request_json(self.base_url, params)
            baseline_task = self._get_climate_baseline(latitude, longitude)
            data, baseline = await asyncio.gather(daily_task, baseline_task)
            return self._process_nasa_response(
                data, latitude, longitude, start_date, end_date,
                is_live=True, climate_baseline=baseline,
            )
        except Exception as exc:
            return self._generate_realistic_fallback(
                latitude, longitude, start_date, end_date,
                reason=f"NASA POWER request failed ({type(exc).__name__}); demo values are shown instead.",
            )

    async def _request_json(self, url: str, params: Dict[str, Any]) -> Dict[str, Any]:
        async with httpx.AsyncClient(timeout=self.timeout) as client:
            response = await client.get(url, params=params)
            response.raise_for_status()
            return response.json()

    async def _get_climate_baseline(self, latitude: float, longitude: float) -> Dict[str, Any]:
        key = (round(latitude, 2), round(longitude, 2))
        if key in self._baseline_cache:
            return self._baseline_cache[key]
        data = await self._request_json(self.MONTHLY_URL, {
            "parameters": "T2M,PRECTOTCORR",
            "community": self.COMMUNITY,
            "longitude": f"{longitude:.4f}",
            "latitude": f"{latitude:.4f}",
            "start": "1991",
            "end": "2020",
            "format": "JSON",
        })
        monthly = self._parse_monthly_response(data)
        baseline = self._monthly_climatology(monthly)
        self._baseline_cache[key] = baseline
        return baseline

    def _process_nasa_response(
        self,
        data: Dict[str, Any],
        lat: float,
        lon: float,
        start_date: str,
        end_date: str,
        is_live: bool,
        climate_baseline: Optional[Dict[str, Any]] = None,
    ) -> Dict[str, Any]:
        properties = data.get("properties", {}).get("parameter", {})
        t2m_series = properties.get("T2M", {})
        t2m_max_series = properties.get("T2M_MAX", {})
        t2m_min_series = properties.get("T2M_MIN", {})
        prec_series = properties.get("PRECTOTCORR", {})

        valid_t2m = [v for v in t2m_series.values() if v > -100]
        valid_tmax = [v for v in t2m_max_series.values() if v > -100]
        valid_tmin = [v for v in t2m_min_series.values() if v > -100]
        valid_prec = [v for v in prec_series.values() if v >= 0]

        avg_temp = sum(valid_t2m) / len(valid_t2m) if valid_t2m else 18.5
        max_temp = max(valid_tmax) if valid_tmax else 34.2
        min_temp = min(valid_tmin) if valid_tmin else 2.1
        hot_days = sum(1 for v in valid_tmax if v >= 35.0)

        gdd = sum(max(0.0, v - 10.0) for v in valid_t2m)

        annual_precip = sum(valid_prec) if valid_prec else 580.0
        seasonal_precip = sum(valid_prec[-120:]) if len(valid_prec) >= 120 else annual_precip

        heavy_rain_events = sum(1 for v in valid_prec if v >= 25.0)

        current_dry = 0
        max_dry = 0
        for p in valid_prec:
            if p < 1.0:
                current_dry += 1
                if current_dry > max_dry:
                    max_dry = current_dry
            else:
                current_dry = 0

        if valid_prec and len(valid_prec) > 1:
            p_mean = sum(valid_prec) / len(valid_prec)
            variance = sum((x - p_mean) ** 2 for x in valid_prec) / len(valid_prec)
            std_dev = math.sqrt(variance)
            variability_index = round((std_dev / (p_mean + 0.001)) * 100.0, 1)
        else:
            variability_index = 42.0

        temp_prov = create_provenance(
            metric_id="t2m_metrics",
            metric_name="Agroclimatology Temperature at 2m",
            source_name="NASA POWER",
            product_version="Release 2.0.0 (MERRA-2 Assimilation)",
            origin_type=DataOriginType.MODEL_ESTIMATE,
            spatial_resolution="0.5 x 0.5 deg (~50km)",
            units="°C",
            observation_start=start_date,
            observation_end=end_date,
            quality_flag=DataQualityFlag.OPTIMAL if is_live else DataQualityFlag.SIMULATED_DEMO,
            is_demo=not is_live,
            citation="NASA Langley Research Center POWER Project",
            notes="Meteorological parameters are derived from NASA GMAO MERRA-2 assimilation."
        )

        rain_prov = create_provenance(
            metric_id="precipitation_metrics",
            metric_name="Corrected Total Precipitation",
            source_name="NASA POWER / GMAO",
            product_version="PRECTOTCORR Version 2",
            origin_type=DataOriginType.SATELLITE_DERIVED,
            spatial_resolution="0.5 x 0.5 deg (~50km)",
            units="mm",
            observation_start=start_date,
            observation_end=end_date,
            quality_flag=DataQualityFlag.OPTIMAL if is_live else DataQualityFlag.SIMULATED_DEMO,
            is_demo=not is_live,
            citation="GMAO MERRA-2 Global Modeling and Assimilation Office"
        )

        return {
            "temperature": TemperatureMetrics(
                avg_temp_c=round(avg_temp, 1),
                max_temp_c=round(max_temp, 1),
                min_temp_c=round(min_temp, 1),
                hot_days_gt_35c=hot_days,
                growing_degree_days=round(gdd, 1),
                historical_anomaly_c=(
                    round(avg_temp - climate_baseline["annual_temperature_c"], 2)
                    if climate_baseline and climate_baseline.get("annual_temperature_c") is not None
                    else None
                ),
                provenance=temp_prov
            ),
            "rainfall": RainfallMetrics(
                seasonal_precipitation_mm=round(seasonal_precip, 1),
                annual_precipitation_mm=round(annual_precip, 1),
                variability_index_pct=min(100.0, variability_index),
                heavy_rain_events_gt_25mm=heavy_rain_events,
                max_consecutive_dry_days=max_dry,
                rainfall_deficit_pct=(
                    round(
                        (annual_precip - climate_baseline["annual_precipitation_mm"])
                        / climate_baseline["annual_precipitation_mm"] * 100.0,
                        1,
                    )
                    if climate_baseline and climate_baseline.get("annual_precipitation_mm", 0) > 0
                    else None
                ),
                provenance=rain_prov
            ),
            "raw_time_series": {
                "dates": list(t2m_series.keys())[-30:],
                "t2m": [t2m_series[k] for k in list(t2m_series.keys())[-30:] if t2m_series[k] > -100],
                "precipitation": [prec_series[k] for k in list(prec_series.keys())[-30:] if prec_series[k] >= 0]
            }
        }

    async def fetch_seasonal_trends(self, latitude: float, longitude: float) -> Dict[str, Any]:
        """Return farm-specific recent seasons against a 1991-2020 POWER baseline."""
        if settings.DEMO_MODE:
            return {
                "status": "demo_unavailable",
                "is_demo": True,
                "seasons": [],
                "message": "Historical trend observations are unavailable while DEMO_MODE is enabled.",
                "source": "NASA POWER monthly API (not queried in demo mode)",
            }

        current_year = datetime.now(timezone.utc).year
        try:
            recent_data, baseline = await asyncio.gather(
                self._request_json(self.MONTHLY_URL, {
                    "parameters": "T2M,PRECTOTCORR",
                    "community": self.COMMUNITY,
                    "longitude": f"{longitude:.4f}",
                    "latitude": f"{latitude:.4f}",
                    "start": str(current_year - 4),
                    "end": str(current_year - 1),
                    "format": "JSON",
                }),
                self._get_climate_baseline(latitude, longitude),
            )
            recent = self._parse_monthly_response(recent_data)
            seasons = self._build_seasons(recent, baseline, latitude)
            if not seasons:
                raise ValueError("NASA POWER returned no complete recent seasons")
            return {
                "status": "live",
                "is_demo": False,
                "seasons": seasons,
                "message": "Recent POWER monthly values compared with the 1991-2020 coordinate-specific baseline.",
                "source": "NASA POWER Monthly API / MERRA-2",
                "baseline_period": "1991-2020",
            }
        except Exception as exc:
            return {
                "status": "upstream_error",
                "is_demo": False,
                "seasons": [],
                "message": f"NASA POWER historical trend request failed ({type(exc).__name__}). No trend was substituted.",
                "source": "NASA POWER Monthly API / MERRA-2",
            }

    @staticmethod
    def _parse_monthly_response(data: Dict[str, Any]) -> Dict[tuple, Dict[str, float]]:
        parameters = data.get("properties", {}).get("parameter", {})
        temperatures = parameters.get("T2M", {})
        precipitation = parameters.get("PRECTOTCORR", {})
        parsed: Dict[tuple, Dict[str, float]] = {}
        for raw_key, raw_temp in temperatures.items():
            key = str(raw_key)
            if len(key) != 6 or not key.isdigit() or key[-2:] == "13":
                continue
            year, month = int(key[:4]), int(key[4:])
            raw_precip = precipitation.get(raw_key, precipitation.get(key))
            try:
                temp = float(raw_temp)
                precip_rate = float(raw_precip)
            except (TypeError, ValueError):
                continue
            if temp <= -100 or precip_rate < 0:
                continue
            days = calendar.monthrange(year, month)[1]
            parsed[(year, month)] = {
                "temperature_c": temp,
                "precipitation_mm": precip_rate * days,
                "days": float(days),
            }
        return parsed

    @staticmethod
    def _monthly_climatology(monthly: Dict[tuple, Dict[str, float]]) -> Dict[str, Any]:
        by_month: Dict[int, list] = {month: [] for month in range(1, 13)}
        for (_, month), values in monthly.items():
            by_month[month].append(values)
        climate_months: Dict[int, Dict[str, float]] = {}
        for month, values in by_month.items():
            if not values:
                continue
            climate_months[month] = {
                "temperature_c": sum(v["temperature_c"] for v in values) / len(values),
                "precipitation_mm": sum(v["precipitation_mm"] for v in values) / len(values),
            }
        if len(climate_months) != 12:
            raise ValueError("Incomplete 1991-2020 NASA POWER monthly baseline")
        return {
            "months": climate_months,
            "annual_temperature_c": sum(v["temperature_c"] for v in climate_months.values()) / 12.0,
            "annual_precipitation_mm": sum(v["precipitation_mm"] for v in climate_months.values()),
        }

    @staticmethod
    def _build_seasons(
        monthly: Dict[tuple, Dict[str, float]], baseline: Dict[str, Any], latitude: float
    ) -> list:
        climate_months = baseline["months"]
        years = sorted({year for year, _ in monthly})
        results = []
        # Use neutral hemispheric seasons instead of region-specific Kharif/Rabi labels.
        definitions = (
            [("Warm", (4, 5, 6, 7, 8, 9)), ("Cool", (10, 11, 12, 1, 2, 3))]
            if latitude >= 0
            else [("Cool", (4, 5, 6, 7, 8, 9)), ("Warm", (10, 11, 12, 1, 2, 3))]
        )
        for year in years:
            for label, months in definitions:
                pairs = [
                    (year if month >= months[0] else year + 1, month)
                    if months[0] == 10 else (year, month)
                    for month in months
                ]
                if not all(pair in monthly for pair in pairs):
                    continue
                values = [monthly[pair] for pair in pairs]
                total_days = sum(v["days"] for v in values)
                normal_rain = sum(climate_months[month]["precipitation_mm"] for month in months)
                observed_rain = sum(v["precipitation_mm"] for v in values)
                normal_temp = sum(climate_months[month]["temperature_c"] for month in months) / len(months)
                observed_temp = sum(v["temperature_c"] * v["days"] for v in values) / total_days
                end_year = pairs[-1][0]
                season_name = f"{label} {year}" if end_year == year else f"{label} {year}-{str(end_year)[-2:]}"
                results.append({
                    "season": season_name,
                    "rainfall_mm": round(observed_rain, 1),
                    "normal_rainfall_mm": round(normal_rain, 1),
                    "rainfall_anomaly_pct": round((observed_rain - normal_rain) / normal_rain * 100.0, 1) if normal_rain else None,
                    "avg_temperature_c": round(observed_temp, 1),
                    "normal_temperature_c": round(normal_temp, 1),
                })
        return results[-6:]

    def _generate_realistic_fallback(
        self, lat: float, lon: float, start_date: str, end_date: str,
        reason: str = "Demo benchmark requested.",
    ) -> Dict[str, Any]:
        """
        Precomputed realistic sample data based on latitude/longitude climate zones.
        Clearly tagged as DEMO data to avoid scientific misrepresentation.
        """
        is_subtropical = abs(lat) < 32
        base_temp = 24.5 if is_subtropical else 15.8
        annual_rain = 710.0 if is_subtropical else 540.0

        temp_prov = create_provenance(
            metric_id="t2m_metrics",
            metric_name="Agroclimatology Temperature at 2m (Demo Mode)",
            source_name="NASA POWER (Calibrated Benchmark)",
            product_version="POWER 2.0 Benchmark Model",
            origin_type=DataOriginType.MODEL_ESTIMATE,
            spatial_resolution="0.5 x 0.5 deg (~50km)",
            units="°C",
            observation_start=start_date,
            observation_end=end_date,
            quality_flag=DataQualityFlag.SIMULATED_DEMO,
            is_demo=True,
            notes=reason
        )

        rain_prov = create_provenance(
            metric_id="precipitation_metrics",
            metric_name="Corrected Total Precipitation (Demo Mode)",
            source_name="NASA POWER (Calibrated Benchmark)",
            product_version="PRECTOTCORR Benchmark Model",
            origin_type=DataOriginType.MODEL_ESTIMATE,
            spatial_resolution="0.5 x 0.5 deg (~50km)",
            units="mm",
            observation_start=start_date,
            observation_end=end_date,
            quality_flag=DataQualityFlag.SIMULATED_DEMO,
            is_demo=True,
            notes=reason
        )

        return {
            "temperature": TemperatureMetrics(
                avg_temp_c=base_temp,
                max_temp_c=base_temp + 14.5,
                min_temp_c=max(-5.0, base_temp - 16.0),
                hot_days_gt_35c=19 if is_subtropical else 8,
                growing_degree_days=2140.0 if is_subtropical else 1650.0,
                historical_anomaly_c=None,
                provenance=temp_prov
            ),
            "rainfall": RainfallMetrics(
                seasonal_precipitation_mm=round(annual_rain * 0.42, 1),
                annual_precipitation_mm=annual_rain,
                variability_index_pct=38.4,
                heavy_rain_events_gt_25mm=5,
                max_consecutive_dry_days=26,
                rainfall_deficit_pct=None,
                provenance=rain_prov
            ),
            "raw_time_series": {
                "dates": [f"2026-05-{i:02d}" for i in range(1, 31)],
                "t2m": [round(base_temp + math.sin(i * 0.2) * 5.0, 1) for i in range(30)],
                "precipitation": [round(max(0.0, math.sin(i * 0.4) * 12.0), 1) if i % 4 == 0 else 0.0 for i in range(30)]
            }
        }
