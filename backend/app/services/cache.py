"""Small durable JSON cache for upstream Earth-observation responses."""
from __future__ import annotations

import json
from dataclasses import dataclass
from datetime import datetime, timedelta, timezone
from typing import Any, Optional

from app.models.database import get_connection


@dataclass(frozen=True)
class CacheEntry:
    payload: Any
    fetched_at: str
    expires_at: str
    is_stale: bool


def _utc_now() -> datetime:
    return datetime.now(timezone.utc)


def get_json_cache(
    cache_key: str,
    *,
    allow_stale_seconds: int = 0,
) -> Optional[CacheEntry]:
    """Return a fresh entry, or a bounded stale entry when explicitly allowed."""
    conn = get_connection()
    try:
        row = conn.execute(
            "SELECT payload_json, fetched_at, expires_at FROM data_cache WHERE cache_key = ?",
            (cache_key,),
        ).fetchone()
    finally:
        conn.close()

    if row is None:
        return None

    expires_at = datetime.fromisoformat(row["expires_at"])
    now = _utc_now()
    is_stale = expires_at <= now
    if is_stale and now > expires_at + timedelta(seconds=max(0, allow_stale_seconds)):
        return None

    try:
        payload = json.loads(row["payload_json"])
    except json.JSONDecodeError:
        delete_json_cache(cache_key)
        return None

    return CacheEntry(
        payload=payload,
        fetched_at=row["fetched_at"],
        expires_at=row["expires_at"],
        is_stale=is_stale,
    )


def set_json_cache(cache_key: str, payload: Any, *, ttl_seconds: int) -> CacheEntry:
    now = _utc_now()
    expires = now + timedelta(seconds=max(1, ttl_seconds))
    fetched_at = now.isoformat()
    expires_at = expires.isoformat()
    conn = get_connection()
    try:
        conn.execute(
            """
            INSERT INTO data_cache (cache_key, payload_json, fetched_at, expires_at)
            VALUES (?, ?, ?, ?)
            ON CONFLICT(cache_key) DO UPDATE SET
                payload_json = excluded.payload_json,
                fetched_at = excluded.fetched_at,
                expires_at = excluded.expires_at
            """,
            (cache_key, json.dumps(payload), fetched_at, expires_at),
        )
        conn.commit()
    finally:
        conn.close()
    return CacheEntry(payload=payload, fetched_at=fetched_at, expires_at=expires_at, is_stale=False)


def delete_json_cache(cache_key: str) -> None:
    conn = get_connection()
    try:
        conn.execute("DELETE FROM data_cache WHERE cache_key = ?", (cache_key,))
        conn.commit()
    finally:
        conn.close()
