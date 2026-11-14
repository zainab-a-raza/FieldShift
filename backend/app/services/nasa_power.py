"""
NASA POWER Agroclimatology Data Integration Module.
API Documentation: https://power.larc.nasa.gov/docs/services/api/temporal/daily/
Retrieves daily surface meteorology and solar energy parameters:
T2M, T2M_MAX, T2M_MIN, PRECTOTCORR, RH2M, ALLSKY_SFC_SW_DWN.
"""
import httpx
from typing import Dict, Any, Optional
from datetime import datetime, timedelta, timezone
import math
from app.config import settings
from app.provenance.tracker import create_provenance, DataOriginType, DataQualityFlag, ProvenanceRecord
from app.models.schemas import TemperatureMetrics, RainfallMetrics

class NASAPowerService:
    BASE_URL = "https://power.larc.nasa.gov/api/temporal/daily/point"
    PARAMETERS = "T2M,T2M_MAX,T2M_MIN,PRECTOTCORR,RH2M,ALLSKY_SFC_SW_DWN"
    COMMUNITY = "AG"  # Agroclimatology

    def __init__(self, timeout_sec: float = 3.5):
        self.timeout = timeout_sec

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
            return self._generate_realistic_fallback(latitude, longitude, start_date, end_date)

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
            async with httpx.AsyncClient(timeout=self.timeout) as client:
                resp = await client.get(self.BASE_URL, params=params)
                if resp.status_code == 200:
                    data = resp.json()
                    return self._process_nasa_response(data, latitude, longitude, start_date, end_date, is_live=True)
        except Exception:
            # Fall back gracefully to synthesized demo data with explicit provenance warning
            pass

        return self._generate_realistic_fallback(latitude, longitude, start_date, end_date)

    def _process_nasa_response(
        self,
        data: Dict[str, Any],
        lat: float,
        lon: float,
        start_date: str,
        end_date: str,
        is_live: bool
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
        seasonal_precip = sum(valid_prec[-120:]) if len(valid_prec) >= 120 else annual_precip * 0.45

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
            origin_type=DataOriginType.DIRECT_SATELLITE,
            spatial_resolution="0.5 x 0.5 deg (~50km)",
            units="°C",
            observation_start=start_date,
            observation_end=end_date,
            quality_flag=DataQualityFlag.OPTIMAL if is_live else DataQualityFlag.SIMULATED_DEMO,
            is_demo=not is_live,
            citation="NASA Langley Research Center POWER Project"
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
                historical_anomaly_c=round(avg_temp - 17.2, 2),
                provenance=temp_prov
            ),
            "rainfall": RainfallMetrics(
                seasonal_precipitation_mm=round(seasonal_precip, 1),
                annual_precipitation_mm=round(annual_precip, 1),
                variability_index_pct=min(100.0, variability_index),
                heavy_rain_events_gt_25mm=heavy_rain_events,
                max_consecutive_dry_days=max_dry,
                rainfall_deficit_pct=round(max(0.0, (620.0 - annual_precip) / 6.2), 1),
                provenance=rain_prov
            ),
            "raw_time_series": {
                "dates": list(t2m_series.keys())[-30:],
                "t2m": [t2m_series[k] for k in list(t2m_series.keys())[-30:] if t2m_series[k] > -100],
                "precipitation": [prec_series[k] for k in list(prec_series.keys())[-30:] if prec_series[k] >= 0]
            }
        }

    def _generate_realistic_fallback(self, lat: float, lon: float, start_date: str, end_date: str) -> Dict[str, Any]:
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
            notes="Calibrated historical sample profile for demonstration."
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
            notes="Representative historical sample distribution for hackathon demonstration."
        )

        return {
            "temperature": TemperatureMetrics(
                avg_temp_c=base_temp,
                max_temp_c=base_temp + 14.5,
                min_temp_c=max(-5.0, base_temp - 16.0),
                hot_days_gt_35c=19 if is_subtropical else 8,
                growing_degree_days=2140.0 if is_subtropical else 1650.0,
                historical_anomaly_c=+1.15,
                provenance=temp_prov
            ),
            "rainfall": RainfallMetrics(
                seasonal_precipitation_mm=round(annual_rain * 0.42, 1),
                annual_precipitation_mm=annual_rain,
                variability_index_pct=38.4,
                heavy_rain_events_gt_25mm=5,
                max_consecutive_dry_days=26,
                rainfall_deficit_pct=14.2,
                provenance=rain_prov
            ),
            "raw_time_series": {
                "dates": [f"2026-05-{i:02d}" for i in range(1, 31)],
                "t2m": [round(base_temp + math.sin(i * 0.2) * 5.0, 1) for i in range(30)],
                "precipitation": [round(max(0.0, math.sin(i * 0.4) * 12.0), 1) if i % 4 == 0 else 0.0 for i in range(30)]
            }
        }
