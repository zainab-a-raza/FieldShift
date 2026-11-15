"""Shared NASA Earthdata CMR discovery and authenticated download helpers."""
from __future__ import annotations

from dataclasses import dataclass
from datetime import datetime, timezone
from typing import Any, Dict, List, Optional

import httpx

from app.config import settings


@dataclass(frozen=True)
class EarthdataGranule:
    granule_id: str
    title: str
    time_start: Optional[str]
    time_end: Optional[str]
    data_url: str


class EarthdataClient:
    """Discovers NASA granules through CMR and downloads them with Earthdata auth."""

    DATA_REL = "http://esipfed.org/ns/fedsearch/1.1/data#"

    def __init__(self, token: Optional[str] = None):
        self.token = token or settings.NASA_EARTHDATA_TOKEN
        self.timeout = settings.EARTHDATA_TIMEOUT_SECONDS

    @property
    def can_download(self) -> bool:
        return bool(self.token)

    async def search_granules(
        self,
        short_name: str,
        version: str,
        latitude: float,
        longitude: float,
        temporal_start: str,
        temporal_end: str,
        page_size: int = 1,
    ) -> List[EarthdataGranule]:
        params = {
            "short_name": short_name,
            "version": version,
            "point": f"{longitude:.6f},{latitude:.6f}",
            "temporal": f"{temporal_start},{temporal_end}",
            "page_size": str(page_size),
            "sort_key": "-start_date",
        }
        headers = {"User-Agent": "FieldShift/1.0 (NASA Space Apps)"}
        async with httpx.AsyncClient(timeout=self.timeout, follow_redirects=True) as client:
            response = await client.get(settings.NASA_CMR_API_URL, params=params, headers=headers)
            response.raise_for_status()

        granules: List[EarthdataGranule] = []
        for entry in response.json().get("feed", {}).get("entry", []):
            data_url = self._select_data_url(entry.get("links", []))
            if not data_url:
                continue
            granules.append(EarthdataGranule(
                granule_id=entry.get("id", "unknown"),
                title=entry.get("title", entry.get("producer_granule_id", "NASA granule")),
                time_start=entry.get("time_start"),
                time_end=entry.get("time_end"),
                data_url=data_url,
            ))
        return granules

    async def download(self, granule: EarthdataGranule) -> bytes:
        if not self.token:
            raise RuntimeError("NASA_EARTHDATA_TOKEN is required for live granule downloads.")

        headers = {
            "Authorization": f"Bearer {self.token}",
            "User-Agent": "FieldShift/1.0 (NASA Space Apps)",
        }
        max_bytes = settings.EARTHDATA_MAX_DOWNLOAD_MB * 1024 * 1024
        chunks: List[bytes] = []
        total = 0

        async with httpx.AsyncClient(timeout=self.timeout, follow_redirects=True) as client:
            async with client.stream("GET", granule.data_url, headers=headers) as response:
                response.raise_for_status()
                async for chunk in response.aiter_bytes():
                    total += len(chunk)
                    if total > max_bytes:
                        raise ValueError(
                            f"Earthdata granule exceeds configured {settings.EARTHDATA_MAX_DOWNLOAD_MB} MB limit."
                        )
                    chunks.append(chunk)
        return b"".join(chunks)

    @classmethod
    def _select_data_url(cls, links: List[Dict[str, Any]]) -> Optional[str]:
        candidates = []
        for link in links:
            href = link.get("href", "")
            if not href or link.get("inherited") is True:
                continue
            rel = link.get("rel", "")
            title = link.get("title", "").lower()
            if rel == cls.DATA_REL or "download" in title or "get data" in title:
                candidates.append(href)

        # Prefer the native HDF5/NetCDF/HGT archive instead of browse or OPeNDAP pages.
        native = [
            url for url in candidates
            if any(ext in url.lower() for ext in (".h5", ".hdf5", ".nc4", ".zip"))
            and "opendap" not in url.lower()
        ]
        return (native or candidates or [None])[0]


def utc_iso(dt: datetime) -> str:
    return dt.astimezone(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")
