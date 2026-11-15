"""USDA NRCS Soil Data Access integration for SSURGO/STATSGO2 properties.

The service resolves the map unit intersecting a WGS84 point and depth-weights
the dominant major component's horizons over 0-30 cm. SSURGO coverage is
primarily U.S. territory, so callers should retain a global fallback.
"""
from typing import Any, Dict, List, Optional

import httpx

from app.config import settings
from app.models.schemas import SoilPropertiesMetrics
from app.provenance.tracker import create_provenance, DataOriginType, DataQualityFlag


class USDASoilDataService:
    def __init__(self, timeout_sec: Optional[float] = None):
        self.base_url = settings.USDA_SOIL_DATA_API_URL
        self.timeout = timeout_sec or settings.USDA_SOIL_TIMEOUT_SECONDS

    async def fetch_soil_profile(
        self, latitude: float, longitude: float
    ) -> Optional[SoilPropertiesMetrics]:
        """Return a live SSURGO profile, or ``None`` outside coverage/on failure."""
        if settings.DEMO_MODE:
            return None

        query = self._build_query(latitude, longitude)
        try:
            async with httpx.AsyncClient(timeout=self.timeout) as client:
                response = await client.post(
                    self.base_url,
                    json={"query": query, "format": "JSON+COLUMNNAME"},
                )
                response.raise_for_status()
                rows = self._table_rows(response.json())
                if rows:
                    return self._profile_from_rows(rows)
        except (httpx.HTTPError, ValueError, TypeError, KeyError):
            return None
        return None

    @staticmethod
    def _build_query(latitude: float, longitude: float) -> str:
        point = f"point ({float(longitude):.6f} {float(latitude):.6f})"
        return f"""
SELECT TOP 100
    mu.mukey, mu.musym, mu.muname,
    c.cokey, c.compname, c.comppct_r,
    ch.chkey, ch.hzname, ch.hzdept_r, ch.hzdepb_r,
    ch.sandtotal_r, ch.silttotal_r, ch.claytotal_r,
    ch.dbthirdbar_r, ch.om_r, ch.ph1to1h2o_r, ch.awc_r,
    ch.wthirdbar_r, ch.wfifteenbar_r
FROM mapunit AS mu
INNER JOIN component AS c ON c.mukey = mu.mukey
INNER JOIN chorizon AS ch ON ch.cokey = c.cokey
WHERE mu.mukey IN (
    SELECT mukey
    FROM SDA_Get_Mukey_from_intersection_with_WktWgs84('{point}')
)
AND c.majcompflag = 'Yes'
AND ch.hzdept_r < 30
AND ch.hzdepb_r > 0
ORDER BY c.comppct_r DESC, ch.hzdept_r ASC
""".strip()

    @staticmethod
    def _table_rows(payload: Dict[str, Any]) -> List[Dict[str, Any]]:
        table = payload.get("Table") or payload.get("table") or []
        if len(table) < 2:
            return []
        columns = [str(column).lower() for column in table[0]]
        return [dict(zip(columns, row)) for row in table[1:] if len(row) == len(columns)]

    @classmethod
    def _profile_from_rows(cls, rows: List[Dict[str, Any]]) -> Optional[SoilPropertiesMetrics]:
        component_rows: Dict[str, List[Dict[str, Any]]] = {}
        for row in rows:
            component_rows.setdefault(str(row.get("cokey", "")), []).append(row)
        if not component_rows:
            return None

        dominant = max(
            component_rows.values(),
            key=lambda values: cls._number(values[0].get("comppct_r")) or 0.0,
        )
        first = dominant[0]

        weighted: Dict[str, float] = {}
        for field in (
            "sandtotal_r", "silttotal_r", "claytotal_r", "dbthirdbar_r",
            "om_r", "ph1to1h2o_r", "awc_r", "wthirdbar_r", "wfifteenbar_r",
        ):
            numerator = 0.0
            denominator = 0.0
            for horizon in dominant:
                top = cls._number(horizon.get("hzdept_r"))
                bottom = cls._number(horizon.get("hzdepb_r"))
                value = cls._number(horizon.get(field))
                if top is None or bottom is None or value is None:
                    continue
                overlap = max(0.0, min(bottom, 30.0) - max(top, 0.0))
                numerator += value * overlap
                denominator += overlap
            if denominator:
                weighted[field] = numerator / denominator

        texture_fields = ("sandtotal_r", "silttotal_r", "claytotal_r")
        if not all(field in weighted for field in texture_fields):
            return None

        organic_matter_pct = weighted.get("om_r", 0.0)
        organic_carbon_g_kg = organic_matter_pct / 1.724 * 10.0
        awc = weighted.get("awc_r")
        if awc is None:
            field_capacity = weighted.get("wthirdbar_r")
            wilting_point = weighted.get("wfifteenbar_r")
            awc = (
                max(0.0, field_capacity - wilting_point) / 100.0
                if field_capacity is not None and wilting_point is not None
                else 0.12
            )

        provenance = create_provenance(
            metric_id="usda_ssurgo_soil_properties_0_30cm",
            metric_name="SSURGO Dominant Component Soil Properties (0-30 cm)",
            source_name="USDA NRCS SSURGO/STATSGO2 via Soil Data Access",
            product_version="SSURGO/STATSGO2 / Soil Data Mart current published survey",
            origin_type=DataOriginType.MODEL_ESTIMATE,
            spatial_resolution="Survey map-unit polygon; component horizon attributes",
            temporal_resolution="Published soil survey baseline",
            units="Multiple (pH, g/kg, %, cg/cm3, mm/m)",
            quality_flag=DataQualityFlag.ESTIMATED,
            is_demo=False,
            citation="USDA NRCS Soil Survey Geographic Database (SSURGO)",
            notes=(
                f"Map unit {first.get('musym', 'unknown')} ({first.get('mukey', 'unknown')}), "
                f"dominant major component {first.get('compname', 'unknown')} "
                f"({first.get('comppct_r', 'unknown')}%). Horizon values are overlap-weighted "
                "over 0-30 cm; organic carbon is estimated from organic matter / 1.724."
            ),
        )

        return SoilPropertiesMetrics(
            organic_carbon_g_kg=round(organic_carbon_g_kg, 1),
            ph_in_h2o=round(weighted.get("ph1to1h2o_r", 7.0), 1),
            sand_fraction_pct=round(weighted["sandtotal_r"], 1),
            silt_fraction_pct=round(weighted["silttotal_r"], 1),
            clay_fraction_pct=round(weighted["claytotal_r"], 1),
            bulk_density_cg_cm3=round(weighted.get("dbthirdbar_r", 1.35) * 100.0, 1),
            available_water_capacity_mm_m=round(max(0.0, awc) * 1000.0, 1),
            depth_interval="0-30 cm",
            provenance=provenance,
        )

    @staticmethod
    def _number(value: Any) -> Optional[float]:
        if value in (None, "", "NULL", "null"):
            return None
        try:
            return float(value)
        except (TypeError, ValueError):
            return None
