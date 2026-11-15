"""
Database Layer for FieldShift.
Supports SQLite (zero-config local hackathon execution) and Supabase PostgreSQL with PostGIS GeoJSON fields.
"""
import sqlite3
import json
import os
from typing import List, Dict, Any, Optional
from datetime import datetime

DB_PATH = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "..", "fieldshift.db")

def get_connection():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn

def init_db():
    conn = get_connection()
    cursor = conn.cursor()

    # Farms table
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS farms (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        location_name TEXT NOT NULL,
        latitude REAL NOT NULL,
        longitude REAL NOT NULL,
        area_hectares REAL NOT NULL,
        boundaries_geojson TEXT,
        current_crop TEXT NOT NULL,
        previous_crop_sequence TEXT,
        irrigation_type TEXT NOT NULL,
        primary_priority TEXT NOT NULL,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL
    )
    """)

    # Crop Catalog table
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS crop_catalog (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        family TEXT NOT NULL,
        category TEXT NOT NULL,
        data_json TEXT NOT NULL
    )
    """)

    # Analysis runs / cached recommendations
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS analysis_runs (
        id TEXT PRIMARY KEY,
        farm_id TEXT NOT NULL,
        analysis_date TEXT NOT NULL,
        environmental_summary TEXT NOT NULL,
        recommendation_payload TEXT NOT NULL,
        FOREIGN KEY (farm_id) REFERENCES farms (id)
    )
    """)

    # Data sources registry table
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS data_sources (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        agency TEXT NOT NULL,
        product_name TEXT NOT NULL,
        resolution TEXT NOT NULL,
        cadence TEXT NOT NULL,
        status TEXT NOT NULL,
        description TEXT NOT NULL,
        documentation_url TEXT NOT NULL
    )
    """)

    # Durable external-data response cache. Keeping this in SQLite means a
    # backend restart or browser refresh can reuse a successful NASA response.
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS data_cache (
        cache_key TEXT PRIMARY KEY,
        payload_json TEXT NOT NULL,
        fetched_at TEXT NOT NULL,
        expires_at TEXT NOT NULL
    )
    """)

    conn.commit()
    conn.close()

# Initialize tables upon module load
init_db()
