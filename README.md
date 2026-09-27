# eRTMAC-NWIS

## AI-Powered Nearby Wells Intelligence & Proactive Drilling Risk Decision Support Platform
**Designed for Oil India Limited (OIL) — Real Time Data Acquisition Center (RTDC)**

---

## 1. Executive Summary

**eRTMAC-NWIS** is an enterprise drilling decision-support prototype that transforms unstructured historical well reports (WCR, DDR, Mud Logs) into structured intelligence, computes multi-factor offset well similarity ($S_{ij}$), and correlates real-time drilling telemetry with historical precedents in normalized stratigraphic formation space ($\eta_{norm}$). 

By evaluating a configurable **50-meter look-ahead horizon** ($Z \to Z + \Delta Z$), the system generates **proactive hazard warnings** (Lost Circulation, Stuck Pipe, Gas Kick) with explainable root-cause evidence, source document citations, and retrieved field-proven standard operating procedures (SOPs).

---

## 2. System Architecture

```
                                  +---------------------------------------+
                                  |    Historical Well Documents          |
                                  |  (WCR, DDR, Mud Logs, Scanned PDFs)   |
                                  +-------------------+-------------------+
                                                      |
                                                      v
                                  +---------------------------------------+
                                  |     Document Intelligence Engine      |
                                  | (Entity Extraction, Page Citations)   |
                                  +-------------------+-------------------+
                                                      |
                                                      v
                                  +---------------------------------------+
                                  |  Enterprise Knowledge Graph & DB      |
                                  | (Well->Borehole->Formation->Hazard)   |
                                  +-------------------+-------------------+
                                                      |
+------------------------------+                      |                      +------------------------------+
| Real-Time eRTMAC Telemetry   |                      v                      | Stratigraphic Normalization  |
| (WOB, ROP, RPM, ECD, SPP,    | ------> +------------------------+ <------- | TVDSS = TVD - KB             |
|  Torque, Flow, Gas Stream)   |         | Proactive Look-Ahead   |          | eta_norm = (TVDSS - Top) /   |
+------------------------------+         | Hazard Prediction      |          |            (Base - Top)      |
                                         | Engine (Z -> Z + 50m)  |          +------------------------------+
                                         +-----------+------------+
                                                     |
                                                     v
                                  +---------------------------------------+
                                  |   Explainable Decision Support Radar  |
                                  | (WHAT, WHY, WHERE, WHEN, SOP Action)  |
                                  +-------------------+-------------------+
                                                      |
                                                      v
                                  +---------------------------------------+
                                  |   OIL Command Center (React/Vite)     |
                                  +---------------------------------------+
```

---

## 3. Key Mathematical & Algorithmic Formulations

### 3.1 Multi-Factor Offset Well Similarity Index ($S_{ij}$)
The relevance of an offset well $j$ relative to active drilling well $i$ is calculated via:
$$S_{ij} = w_1 \cdot S_{\text{spatial}} + w_2 \cdot S_{\text{trajectory}} + w_3 \cdot S_{\text{stratigraphic}} + w_4 \cdot S_{\text{architecture}}$$
* **Default Weights**: $w_1 = 0.35$ (Spatial proximity via Haversine decay), $w_2 = 0.20$ (Directional inclination profile correlation), $w_3 = 0.30$ (Geological formation overlap Jaccard index), $w_4 = 0.15$ (Mud chemistry and casing schedule match).
* Every score generates human-readable engineering reasoning: *"650 m away, 82% formation overlap, similar directional trajectory and comparable hole architecture."*

### 3.2 Stratigraphic Depth Normalization ($\eta_{norm}$)
To compare hazards across wells with varying elevation and formation dip:
$$\text{TVDSS} = \text{TVD} - \text{KB}_{\text{elevation}}$$
$$\eta_{\text{norm}} = \frac{\text{TVDSS} - \text{TVDSS}_{\text{top}}}{\text{TVDSS}_{\text{base}} - \text{TVDSS}_{\text{top}}}$$
* $\eta_{\text{norm}} = 0.0$: Stratigraphic formation top
* $\eta_{\text{norm}} = 1.0$: Stratigraphic formation base

---

## 4. Project Directory Structure

```
sihfinal/
├── backend/
│   ├── app/
│   │   ├── api/                 # REST API endpoints & WebSocket channels
│   │   │   ├── auth.py          # JWT authentication and RBAC
│   │   │   ├── wells.py         # Well inventory, nearby GIS search, similarity
│   │   │   ├── formations.py    # Stratigraphic formation tops and baselines
│   │   │   ├── incidents.py     # Historical drilling incidents catalog
│   │   │   ├── mitigations.py   # Proven mitigation strategies and SOP references
│   │   │   ├── telemetry.py     # Real-time telemetry feed and simulator controls
│   │   │   ├── hazards.py       # Look-ahead engine and explainable predictions
│   │   │   ├── alerts.py        # Proactive alerts management & action logging
│   │   │   ├── documents.py     # OCR/NLP ingestion and human verification
│   │   │   ├── knowledge_graph.py# Relationship graph querying
│   │   │   ├── ask_nwis.py      # Grounded RAG assistant (zero hallucination)
│   │   │   └── analytics.py     # NPT KPIs and formation risk aggregations
│   │   ├── core/                # Configuration, database, and security
│   │   ├── models/              # SQLAlchemy relational and graph models
│   │   ├── schemas/             # Pydantic validation schemas
│   │   ├── services/            # Core computation engines
│   │   │   ├── stratigraphy.py  # TVDSS and eta_norm calculations
│   │   │   ├── similarity_engine.py # Multi-factor offset scoring S_ij
│   │   │   ├── telemetry_simulator.py # Physics-based live drilling stream
│   │   │   ├── lookahead_engine.py # Window evaluation Z -> Z + Delta Z
│   │   │   ├── hazard_predictor.py # Structured WHAT, WHY, WHERE, WHEN, SOP
│   │   │   ├── document_engine.py # Entity extraction and page citations
│   │   │   ├── knowledge_graph.py # Node-link graph constructor
│   │   │   └── rag_assistant.py # Evidence-grounded Q&A assistant
│   │   ├── main.py              # FastAPI application root & WebSockets
│   │   └── seed_data.py         # Upper Assam Basin / OIL realistic seed data
│   ├── requirements.txt
│   └── run.py
├── frontend/
│   ├── src/
│   │   ├── components/          # Reusable UI components
│   │   │   ├── Navbar.tsx       # Header with stream badge & alert indicator
│   │   │   ├── Sidebar.tsx      # Enterprise command-center navigation
│   │   │   ├── GisMap.tsx       # Leaflet GIS map with similarity color-coding
│   │   │   ├── TelemetryGauges.tsx # High precision drilling parameter dials
│   │   │   ├── StratigraphicColumn.tsx # Depth column with active bit & eta_norm
│   │   │   └── ProactiveAlertModal.tsx # Full hazard alert modal with SOP action
│   │   ├── context/             # Global AppContext & WebSocket client
│   │   ├── pages/               # Application view modules
│   │   │   ├── LandingPage.tsx  # Executive overview and demo launchpad
│   │   │   ├── OverviewPage.tsx # Main command-center dashboard
│   │   │   ├── ActiveWellPage.tsx # 3D trajectory & synchronized log tracks
│   │   │   ├── NearbyWellsPage.tsx# GIS map, weights slider, similarity matrix
│   │   │   ├── TelemetryPage.tsx# Live eRTMAC streaming cockpit & anomaly triggers
│   │   │   ├── HazardsPage.tsx  # Look-ahead radar & explainable risk breakdown
│   │   │   ├── KnowledgeGraphPage.tsx # Interactive node-link graph explorer
│   │   │   ├── DocumentsPage.tsx# WCR/DDR hub with human verification
│   │   │   ├── AlertsPage.tsx   # Proactive alert center & audit trail
│   │   │   ├── AnalyticsPage.tsx# NPT by hazard, formation risk heatmaps
│   │   │   ├── AskNWISPage.tsx  # Grounded RAG copilot with document citations
│   │   │   └── SettingsPage.tsx # System parameters & WITSML configuration
│   │   ├── services/api.ts      # Typed REST client
│   │   ├── types/index.ts       # Shared TypeScript definitions
│   │   ├── App.tsx
│   │   └── index.css            # Dark enterprise theme tokens
│   ├── package.json
│   └── vite.config.ts
├── start.bat                    # One-click Windows runner
├── start.sh                     # One-click Linux/macOS runner
├── .env.example
└── README.md
```

---

## 5. Quick Start Instructions

### Prerequisites
* **Python 3.10+** (Python 3.13 supported)
* **Node.js 18+** & **npm**

### Step 1: Install Dependencies
```bash
# In repository root:
# 1. Backend dependencies
cd backend
pip install -r requirements.txt

# 2. Frontend dependencies
cd ../frontend
npm install
```

### Step 2: Seed the Database
The backend automatically populates the SQLite database on startup, but you can also seed it manually:
```bash
cd backend
python -m app.seed_data
```
*Creates 22 realistic Upper Assam wells (Nahorkatiya, Moran, Dikom, Jorajan, Kusijan), 10 geological formations, 38+ drilling incidents, 25+ mitigations with SOPs, and document extractions.*

### Step 3: Run the Application

**Option A: Using One-Click Runner (Windows)**
Double click `start.bat` in the project root.

**Option B: Manual Terminal Execution**

*Terminal 1 (Backend):*
```bash
cd backend
python run.py
# Runs on http://localhost:8000 (Docs at http://localhost:8000/docs)
```

*Terminal 2 (Frontend):*
```bash
cd frontend
npm run dev
# Opens on http://localhost:5173
```

---

## 6. Demo User Credentials & Roles

| Username | Password | Role | Description |
| :--- | :--- | :--- | :--- |
| `driller` | `oil123` | `DRILLING_ENGINEER` | RTDC Lead Engineer with full simulation and mitigation access |
| `geologist` | `oil123` | `GEOLOGIST` | Formation tops inspection and document verification |
| `admin` | `admin` | `ADMIN` | System parameter configuration and algorithm tuning |
| `viewer` | `oil123` | `VIEWER` | Read-only executive dashboard viewer |

---

## 7. Step-by-Step SIH Demonstration Flow

To demonstrate the complete end-to-end intelligent decision-support pipeline during the presentation:

1. **Launch Dashboard**:
   * Open `http://localhost:5173`.
   * Click **"Launch NWIS Dashboard"** on the landing page.
2. **Inspect Active Well**:
   * Active well `OIL-DEMO-001 (NHK-412)` is drilling at measured depth **2,845.0 m MD** in the **Barail Sandstone** horizon.
3. **Verify Nearby Offset Wells GIS**:
   * Navigate to **"Nearby Offset GIS"**.
   * Observe offset wells color-coded by similarity score $S_{ij}$.
   * Click on closest offset `OIL-DEMO-002 (NHK-388)` (650 m away, **92% match**).
   * Review the explainability text: *"650 m away, 100% formation overlap, identical directional profile, and matching mud system."*
4. **Trigger Real-Time eRTMAC Stream**:
   * Navigate to **"Live eRTMAC Stream"**.
   * Telemetry updates continuously over WebSockets (WOB, RPM, ROP, ECD, SPP, Torque, Flow Out).
   * Click **"Simulate Loss Event"** or let the bit advance to **2,860 m**.
5. **Look-Ahead Engine Proactive Detection**:
   * Navigate to **"Look-Ahead Radar"**.
   * The 50 m evaluation window ($2,845 \to 2,895\text{ m}$) detects **Lost Circulation** recorded at $2,862\text{ m}$ in offset `OIL-DEMO-002`.
   * Risk level spikes to **CRITICAL (82%)**.
   * The system displays the explainable breakdown:
     * **WHAT**: Severe mud loss into sub-hydrostatic fractured sandstone.
     * **WHY**: 3 of 4 relevant offset wells experienced severe losses in this $\eta_{\text{norm}}$ interval.
     * **WHERE**: $2,860 - 2,872\text{ m MD}$ in Barail Sandstone.
     * **WHEN**: In next $15\text{ m}$ (~45 mins).
6. **Launch Proactive Hazard Alert**:
   * Click the glowing red **"Proactive Alerts"** badge on top navbar.
   * View the retrieved mitigation: **High-Permeability LCM Pill (Nut Plug 20 ppb + Mica 15 ppb + coarse CaCO3 10 ppb)** with reference to **OIL-SOP-DRL-042 Rev.3**.
   * Log engineer action remarks and acknowledge the alert.
7. **Document Ingestion & Verification**:
   * Navigate to **"Document Hub"**.
   * Open `WCR_OIL_NHK_388_Final.pdf`.
   * Inspect the extracted incident table with page numbers and confidence scores. Click **"Correct"** to demonstrate human-in-the-loop validation.
8. **Knowledge Graph Exploration**:
   * Navigate to **"Knowledge Graph"**.
   * Observe visual chain: `OIL-DEMO-001` $\to$ `Borehole` $\to$ `Barail Sandstone` $\to$ `Lost Circulation` $\to$ `LCM Pill`.
9. **Ask NWIS AI Assistant**:
   * Navigate to **"Ask NWIS Copilot"**.
   * Query: *"Why is the current well at high risk?"* or *"What mitigation worked in Barail Sandstone?"*.
   * Copilot returns evidence-grounded answer with source citations from `WCR-OIL-DEMO-002.pdf (Pg 8)`.

---

## 8. Real-World OIL / eRTMAC / WITSML Integration Roadmap

For future production integration with Oil India Limited enterprise systems:
* **WITSML 1.4.1.1 & 2.0 Ingestion**: The data schemas directly align with Energistics WITSML standard objects (`trajectory`, `log`, `tubular`, `wellbore`, `mudLog`).
* **PostGIS & Geospatial Clustering**: Ready to swap SQLite with PostgreSQL 16 + PostGIS for spatial spatial indexing over thousands of wells across Assam and Rajasthan basins.
* **LLM Document Pipeline**: The abstraction layer in `document_engine.py` is ready for connection to on-premise OIL-hosted LLMs (e.g. Llama-3-70B-Instruct, Mistral-Large) for automatic OCR of multi-hundred-page legacy Well Completion Reports.

---

## 9. Safety Compliance Disclaimer

**eRTMAC-NWIS is a Decision-Support Platform.** It does not execute autonomous rig machine control or modify mud weights, surface pressures, or flow rates without human engineer approval. All advisories are presented as actionable intelligence for qualified Oil India Limited drilling personnel.
