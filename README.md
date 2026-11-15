# FieldShift — Adapting Farms with NASA Earth Observations

[![NASA Space Apps Challenge 2026](https://img.shields.io/badge/NASA_Space_Apps-2026_Challenge-0B3D91?style=for-the-badge&logo=nasa&logoColor=white)](https://www.spaceappschallenge.org/)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.110+-009688?style=for-the-badge&logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com)
[![Next.js 16](https://img.shields.io/badge/Next.js-16_App_Router-black?style=for-the-badge&logo=next.js&logoColor=white)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0+-3178C6?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-4.0-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)

> **NASA Space Apps Challenge 2026**  
> **Challenge:** *"Field Shift: Adapting Farms with NASA Data"*  
> **Mission Statement:** Supporting farmer judgment rather than replacing local agricultural expertise by comparing existing crop rotations with climate-adapted alternatives using NASA Earth observations.

---

## 🌾 Table of Contents
1. [Overview & Product Objective](#overview--product-objective)
2. [Key Capabilities](#key-capabilities)
3. [Technology Stack](#technology-stack)
4. [Design System](#design-system)
5. [NASA & Earth Observation Integrations](#nasa--earth-observation-integrations)
6. [MCDA Decision Engine & Genetic Algorithm](#mcda-decision-engine--genetic-algorithm)
7. [Data Provenance & Scientific Integrity](#data-provenance--scientific-integrity)
8. [Project Architecture](#project-architecture)
9. [Quick Start & Setup Instructions](#quick-start--setup-instructions)
10. [REST API Documentation](#rest-api-documentation)
11. [Demo Mode vs. Live Stream](#demo-mode-vs-live-stream)

---

## 1. Overview & Product Objective

Farmers worldwide face accelerating agroclimatic variability: erratic precipitation seasons, expanding dry spells, groundwater table depletion, and terminal heat spikes during critical grain-filling windows.

**FieldShift** is an intelligent agricultural decision-support platform designed to:
1. **Decode Environmental Pressures:** Aggregate multi-mission NASA Earth observations to identify local vulnerabilities (heat stress, moisture deficit, erosion susceptibility).
2. **Explore Adaptive Rotations:** Generate feasible, biologically validated crop sequences across multi-year horizons.
3. **Compare Three Specific Strategies:**
   - **Strategy 1 — Baseline:** Existing historical rotation and monoculture practice.
   - **Strategy 2 — Regenerative Soil Restoration:** Emphasizes biological nitrogen fixation, deep root channels, biofumigation, and soil organic carbon accumulation.
   - **Strategy 3 — Climate & Water Resilience:** Prioritizes drought-tolerant C4 cereals, deep taproots, and lower groundwater dependence.
4. **Transparent Explainability:** Every recommendation is accompanied by empirical evidence, agronomic rationale, operational trade-offs, and missing data caveats.
5. **Simulate Climate Stress:** Dynamic sensitivity testing under hypothetical rainfall shifts (-50% to +40%), temperature spikes (+0 to +5°C), and irrigation water curtailment.

---

## 2. Key Capabilities

- **Interactive Cadastral Map:** Inspect field boundaries, sub-field plots, and toggle between High-Res Satellite imagery, Sentinel-2 10m NDVI vigor, and SMAP 9km soil moisture footprints.
- **Explainable Multi-Criteria Decision Analysis (MCDA):** 6 normalized criteria (0–100) with dynamic sliders:
  - *Water Resilience*
  - *Climate Suitability*
  - *Soil Improvement Potential*
  - *Erosion Protection*
  - *Crop Diversity & Disease Break*
  - *Market Liquidity*
- **Evolutionary Optimization:** Optional Genetic Algorithm (GA) exploring hundreds of multi-season trajectories subject to strict disease-break constraints (forbidding consecutive same-family plantings).
- **Printable Analytical Decision Briefs:** Exportable PDF-ready reports for agricultural extension officers, agronomists, and farm credit lenders.

---

## 3. Technology Stack

### Frontend Application (`frontend/`)
- **Framework:** Next.js 16 (App Router with Server Components & Client Interactivity)
- **Language:** TypeScript 5
- **Styling:** Tailwind CSS 4 with custom agricultural design system tokens
- **Data Visualizations:** Recharts (Radar charts, Line series, Stacked/Grouped Bar charts)
- **Icons:** Lucide React
- **Geospatial UI:** SVG cadastral field overlay with multispectral reflectance gradients

### Backend API & Computational Engine (`backend/`)
- **Framework:** Python FastAPI with Pydantic v2 schemas and data validation
- **Data Integrations:** `httpx` asynchronous HTTP clients for NASA POWER & SoilGrids REST APIs
- **Database:** SQLite (zero-config local hackathon execution) with GeoJSON polygon support; Supabase / PostGIS compatible
- **Scientific Algorithms:** Multi-Criteria Decision Analysis (MCDA) engine, biological disease-break constraint validator, and Genetic Algorithm sequence optimizer

---

## 4. Design System

The application uses an authentic agricultural SaaS palette:
- **Forest Green:** `#183D2C` (Sidebar, primary brand headers)
- **Primary Green:** `#39734C` (Buttons, active tabs, emphasis)
- **Sage:** `#9DBB78` (Accent highlights, vegetative badges)
- **Light Cream:** `#F8F8F3` (Main app background, soft contrast)
- **Sand:** `#E8E2D2` (Cards, borders, subtle separators)
- **Text:** `#26352C` (High readability body typography)
- **Typography:** Manrope (Display headers) & Inter (Data tables and metrics)

---

## 5. NASA & Earth Observation Integrations

| Provider / Instrument | Product Version | Spatial Footprint | Temporal Resolution | Agronomic Application |
|---|---|---|---|---|
| **NASA POWER** | Release 2.0.0 (MERRA-2) | 0.5° x 0.5° (~50km) | Daily | Surface temperature (avg, min, max), precipitation, solar irradiance, hot days (≥35°C), GDD. |
| **NASA SMAP** | SPL3SMP_E Version 6 | 9km x 9km native | Daily (2-3d revisit) | Direct topsoil volumetric soil moisture (0-5cm). |
| **NASA GPM IMERG** | GPM_3IMERGM V07 | 0.1° x 0.1° (~10km) | Monthly calibrated | Multi-satellite precipitation totals, combined with POWER daily spell diagnostics. |
| **USGS Landsat 8/9** | Collection 2 Level-2 | 30m Multispectral | 8-day combined revisit | Cloud/shadow-masked red/NIR surface reflectance NDVI for fields. |
| **NASA MODIS / VIIRS** | MOD13Q1 V061 / VNP13A1 V002 | 250m / 500m | 16-day composite | Quality-screened vegetation-index continuity when Landsat has no usable observation. |
| **USDA NRCS SSURGO** | Current Soil Data Mart survey | Survey map units/horizons | Published baseline | U.S. 0-30cm component texture, pH, organic carbon estimate, bulk density, and available water capacity. |
| **ISRIC SoilGrids** | SoilGrids 2.0 Global | 250m x 250m | Baseline aggregated | Topsoil (0-30cm) organic carbon, pH in H2O, sand/silt/clay fractions, bulk density. |
| **NASA SRTM** | SRTMGL1 Version 3 | 1 arc-second (~30m) | Static benchmark | Digital elevation and slope gradient indicating topographic runoff & erosion susceptibility. |

---

## 6. MCDA Decision Engine & Genetic Algorithm

### Multi-Criteria Decision Analysis (MCDA)
Rotations are scored across 6 dimensions on a 0–100 scale:
$$\text{Score} = \sum_{i=1}^{6} w_i \times C_i \quad \text{where} \quad \sum w_i = 1.0$$
- **Hard Constraints:** Eliminate biological mismatches (frost thresholds, extreme summer heat caps, soil pH viability, and annual water deficit ceilings).
- **Disease Breaks:** Rotational rules penalize planting crops from the same family (e.g. Poaceae $\rightarrow$ Poaceae or Fabaceae $\rightarrow$ Fabaceae) in consecutive seasons to disrupt root-pathogen lifecycles.

### Genetic Algorithm (GA) Optimization
- **Chromosome:** An array of crop genes across $N$ seasons.
- **Fitness Function:** Weighted multi-criteria score penalized for disease-break collisions or missing legume intervals.
- **Operators:** Tournament selection ($k=3$), single-point crossover, random gene mutation, and elitism preservation.

---

## 7. Data Provenance & Scientific Integrity

Every environmental metric displays its full provenance card:
- Sensor mission & product version
- Spatial resolution & acquisition date
- Quality flag (`optimal`, `estimated`, `simulated_demo_data`)
- Scientific literature citation
- Coarse satellite observations (e.g., SMAP 9km, POWER 50km) are **never** misrepresented as field-scale ground capacitance probes.

---

## 8. Project Architecture

```
FieldShift/
├── backend/
│   ├── app/
│   │   ├── api/                 # REST Endpoints
│   │   │   ├── farms.py         # Holdings CRUD & GeoJSON storage
│   │   │   ├── environment.py   # Aggregated NASA Earth diagnostics
│   │   │   ├── rotations.py     # Strategy generator & MCDA scoring
│   │   │   ├── simulation.py    # Climate sensitivity stress simulator
│   │   │   ├── crops.py         # Crop catalog & agronomic traits
│   │   │   ├── data_sources.py  # Data provenance registry
│   │   │   └── reports.py       # Printable analytical briefs
│   │   ├── engine/              # Decision Intelligence
│   │   │   ├── mcda.py          # Multi-Criteria Decision Analysis
│   │   │   ├── rules.py         # Agronomic constraints & disease breaks
│   │   │   ├── generator.py     # 3-Strategy synthesizer
│   │   │   └── genetic_algo.py  # GA sequence optimizer
│   │   ├── services/            # Modular Data Providers
│   │   │   ├── nasa_power.py    # NASA POWER Daily API client
│   │   │   ├── soilgrids.py     # ISRIC SoilGrids REST client
│   │   │   ├── nasa_smap.py     # NASA SMAP soil moisture
│   │   │   ├── nasa_gpm.py      # NASA GPM IMERG precipitation
│   │   │   ├── earth_engine.py  # Sentinel-2 / Landsat NDVI
│   │   │   └── srtm.py          # Topographic slope & elevation
│   │   ├── provenance/          # Lineage & Quality Tracking
│   │   ├── models/              # Pydantic schemas & SQLite models
│   │   ├── data/                # Crop catalog & seed datasets
│   │   ├── config.py            # Environment configuration
│   │   └── main.py              # FastAPI application entrypoint
│   └── tests/                   # Backend unit & integration tests
│
├── frontend/
│   ├── src/
│   │   ├── app/                 # Next.js App Router Routes
│   │   │   ├── dashboard/       # Overview dashboard
│   │   │   ├── farms/           # Farm portfolio & /new registration
│   │   │   ├── environmental-insights/ # NASA observation diagnostics
│   │   │   ├── rotation-planner/# 3-strategy sequence planner
│   │   │   ├── rotation-comparison/    # Radar & Bar MCDA comparison
│   │   │   ├── climate-simulator/      # Hypothetical stress testing
│   │   │   ├── data-sources/    # Scientific provenance directory
│   │   │   ├── reports/         # Printable decision briefs
│   │   │   ├── settings/        # Read-only connector health and secure env guidance
│   │   │   ├── layout.tsx       # Root AppShell & Sidebar
│   │   │   └── globals.css      # Design system & Tailwind styling
│   │   ├── components/          # Reusable UI widgets
│   │   ├── context/             # FarmContext reactive state
│   │   ├── lib/                 # Typed API client
│   │   └── types/               # TypeScript interfaces
│   └── package.json
│
├── README.md                    # Project documentation
└── fieldshift.db                # SQLite database with preloaded demo farms
```

---

## 9. Quick Start & Setup Instructions

### Prerequisites
- **Python 3.10+** (Tested on Python 3.12 / 3.14)
- **Node.js 18+** & **npm**

### Step 1: Start the Backend API
```powershell
cd backend
python -m pip install -r requirements.txt
Copy-Item .env.example .env
python -m uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```

The default `.env` runs in live mode. NASA POWER, USDA Soil Data Access, and
SoilGrids work without credentials. For live NASA SMAP, GPM IMERG, and SRTM
granules, create an Earthdata bearer token and set `NASA_EARTHDATA_TOKEN` in
`backend/.env`. Live data is discovered with NASA CMR and downloaded from the
responsible DAAC; failed or missing observations remain clearly identified.

NASA POWER and USDA Soil Data Access require no API key in live mode. Live
Landsat/MODIS/VIIRS reductions require a Google Earth Engine service account;
set `GEE_SERVICE_ACCOUNT` and `GEE_PRIVATE_KEY_FILE`. SSURGO is queried first
for U.S. coordinates, with SoilGrids retained as the global fallback.

Successful farm observations are stored in the local SQLite `data_cache` table
for six hours, and NASA POWER trend responses for 24 hours. The browser also
deduplicates concurrent requests, so dashboard, report, and rotation views reuse
the first successful fetch instead of restarting every upstream request.
*The database automatically initializes and seeds 3 realistic global holdings (Salina Prairie Farm, Punjab Research Plot, and Andalusia Field) along with the 10-crop catalog.*

Interactive API documentation will be available at:  
👉 **http://localhost:8000/docs**

### Step 2: Start the Frontend Application
In a separate terminal window:
```powershell
cd frontend
npm install
npm run dev
```

Open your browser at:  
👉 **http://localhost:3000**

---

## 10. REST API Documentation

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/health` | Service health status and live connector flags |
| `GET` | `/api/farms` | List all registered farm holdings |
| `POST` | `/api/farms` | Register a new farm with GeoJSON field boundaries |
| `GET` | `/api/farms/{id}` | Retrieve holding details |
| `GET` | `/api/farms/{id}/environment` | Aggregated NASA POWER, SMAP, SoilGrids, and Sentinel metrics |
| `GET` | `/api/farms/{id}/environment/trends`| Daily weather time-series and multi-year seasonal comparisons |
| `GET` | `/api/farms/{id}/rotations` | Generate the 3 comparative rotation strategies (Baseline, Soil, Water) |
| `POST` | `/api/farms/{id}/rotations/generate` | Recalculate strategies with custom farmer priority and criteria weights |
| `POST` | `/api/scenarios/simulate` | Execute climate stress sensitivity testing (-50% rain, +5°C temp) |
| `POST` | `/api/rotations/optimize-ga` | Run Genetic Algorithm multi-season sequence optimizer |
| `GET` | `/api/crops` | Retrieve 10-crop agronomic catalog and regional suitability |
| `GET` | `/api/data-sources` | List Earth observation sensors, resolutions, and citations |
| `GET` | `/api/reports/{id}` | Export printable agricultural decision brief |

---

## 11. Demo Mode vs. Live Stream

FieldShift supports two operational modes:
1. **Calibrated Demo Mode (Default):** Runs offline using benchmark profiles. Every metric is watermarked with `simulated_demo_data`; historical trend charts remain empty rather than presenting synthetic values as observations.
2. **Live Data Mode:** Put Earthdata and Earth Engine credentials only in `backend/.env`, set `DEMO_MODE=false`, and restart the backend. The `/settings` screen is deliberately read-only so browser code never stores secrets.

Every environmental response includes `data_status` (`live`, `mixed`, or
`demo`) and explanatory `data_messages`. Upstream failures are disclosed and
the frontend does not replace failed API responses with its own hidden dataset.

---

## 🏆 NASA Space Apps 2026 Submission

- **Team:** FieldShift AgTech Intelligence
- **Challenge Category:** Earth Observation Applications & Food Security
- **License:** Open Source (MIT)
