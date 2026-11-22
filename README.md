# Transynq — Transformer Digital Twin

A simplified digital twin for electrical transformer monitoring, built by adapting an existing HerdWatch IoT dashboard. Demonstrates live asset health from simulated sensor data, alerts on health degradation, and reviewable history.

> **Selected Track:** Digital Twin for Electrical Assets  
> **Stack:** React 19 + Vite + Tailwind CSS + Chart.js (frontend) | Java 17 + Spring Boot 3.4.1 + H2/PostgreSQL (backend)

---

## Quick Start

### Prerequisites
- **Java 17+** (JDK) and **Maven 3.8+**
- **Node.js 18+** and **npm 9+**
- PostgreSQL is optional — the app uses H2 in-memory by default for local development

### 1. Start the Backend (port 8080)
```bash
cd backend
mvn spring-boot:run
```
The server starts on `http://localhost:8080` with an in-memory H2 database.  
Assets **TR-101** (Main Power Transformer), **TR-202** (Distribution Transformer), and **SG-301** (11 kV Switchgear Panel) are seeded automatically. The 3-second simulation begins immediately for all assets.

### 2. Start the Frontend (port 5173)
```bash
cd frontend
npm install
npm run dev
```
Open **http://localhost:5173** in your browser.  
The Vite dev server proxies `/api` calls to the backend at port 8080.

### 3. Use the Application
- **Asset Selector:** Switch between **TR-101**, **TR-202**, and **SG-301** directly from the top bar dropdown
- **Dashboard (/):** Live sensor readings, charts, health gauge, and scenario buttons for the active asset
- **History (/history):** Time-filtered historical readings (15 min / 1 hr / 24 hr) for the selected asset
- **Alerts (/alerts):** Alert audit log with severity filters for the selected asset
- Click **OVERHEATING** or **GAS_ANOMALY** scenario buttons to trigger simulated faults on the active asset

---

## Architecture

```
Frontend (React + Vite, port 5173)
  │── SSE subscription (/api/assets/{id}/stream)
  │── REST queries (/api/assets, /history, /alerts, /scenario)
  │
Backend (Spring Boot, port 8080)
  ├── SimulationService (@Scheduled every 3s)
  │     → generates bounded, gradual sensor readings per scenario
  │     → calls HealthEvaluationService (threshold-based)
  │     → calls AlertService (transition detection, no duplicates)
  │     → persists Reading to database
  │     → broadcasts via SSE to all connected clients
  ├── Controllers (REST + SSE endpoints)
  └── H2 Database (in-memory, dev) / PostgreSQL (production)
```

## API Contract

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/assets` | List all assets |
| `GET` | `/api/assets/{id}/latest` | Latest reading for asset |
| `GET` | `/api/assets/{id}/history?minutes=60` | Time-filtered readings |
| `GET` | `/api/assets/{id}/alerts` | All alerts for asset |
| `POST` | `/api/assets/{id}/scenario` | Set scenario (`{"scenario":"OVERHEATING"}`) |
| `GET` | `/api/assets/{id}/stream` | SSE event stream (text/event-stream) |

**Sample SSE payload:**
```json
{
  "assetId": 1,
  "assetCode": "TR-101",
  "timestamp": "2026-11-22T13:10:52Z",
  "oilTemperature": 62.0,
  "windingTemperature": 74.5,
  "loadPercentage": 71.0,
  "hydrogenPpm": 31.4,
  "healthScore": 100,
  "status": "HEALTHY",
  "scenario": "NORMAL"
}
```

## Database Schema

```sql
assets(id, code UNIQUE, name, location, scenario, status)
readings(id, asset_id FK, recorded_at, oil_temp_c, winding_temp_c, load_pct, hydrogen_ppm, health_score, status)
  -- INDEX on (asset_id, recorded_at)
alerts(id, asset_id FK, recorded_at, parameter, severity, message, resolved_at NULL)
  -- INDEX on (asset_id, recorded_at)
```

## Simulation & Health Logic

### Scenarios (server-side, deterministic)
| Scenario | Behavior |
|----------|----------|
| **NORMAL** | Values drift within safe bands (oil 55-65°C, winding 65-75°C, load 60-75%, H₂ 20-40 ppm) |
| **OVERHEATING** | Temperatures rise +1-2.5°C/tick toward critical; load increases |
| **GAS_ANOMALY** | Hydrogen rises +15-35 ppm/tick simulating partial discharge/arcing |

On return to NORMAL: values gradually cool down / decrease.

### Health Evaluation Thresholds
| Parameter | Normal | Warning | Critical |
|-----------|--------|---------|----------|
| Top Oil Temp | ≤75°C | >75°C | >85°C |
| Winding Temp | ≤88°C | >88°C | >98°C |
| Load Factor | ≤85% | >85% | >95% |
| Dissolved H₂ | ≤100 ppm | >100 ppm | >200 ppm |

> ⚠️ **These are educational demonstration thresholds**, not universal transformer operating limits. See Research Note below for actual consulted references.

**Overall status** = worst parameter status.  
**Health score** = 100 − (10 × warning parameters) − (25 × critical parameters), clamped [0, 100].

### Alert Logic
- Alerts fire on **status transitions** only (HEALTHY→WARNING, HEALTHY→CRITICAL, WARNING→CRITICAL)
- No duplicate alerts generated every tick
- Alerts auto-resolve when parameter returns to normal
- Severity escalation (WARNING→CRITICAL) resolves old alert, creates new

## HerdWatch → Transynq Adaptation

| Original HerdWatch | Transynq Adaptation |
|---------------------|---------------------|
| `TopBar` (HerdWatch branding, Feeder/Cattle status) | Rebranded Transynq TopBar with navigation, SSE status, asset indicator |
| `CattlePresenceCard` (green gradient hero card) | `TransformerHeroCard` (dynamic gradient by health status) |
| `StatsCards` (6 farm metrics) | 4 transformer telemetry cards (oil, winding, load, H₂) |
| `Charts` (food level, temperature bar, visit activity) | Dual-line temperature chart + load chart |
| `FoodRefillAlert` (red banner) | `AlertBanner` (severity-colored anomaly alert) |
| `FoodGauge` (circular SVG) | `HealthGauge` (health score 0-100 gauge) |
| Firebase real-time DB | Spring Boot SSE + REST |
| Single Dashboard page | 3-view routing (Dashboard, History, Alerts) |

## Design Decisions

1. **Server-side simulation over frontend random values:** Multiple browser tabs see the same consistent state; readings persist across page refreshes; history is real.
2. **SSE over WebSockets:** Simpler for unidirectional server→client push; built-in browser reconnection; no additional dependencies.
3. **H2 dev / PostgreSQL prod:** Zero-setup local development; production-ready PostgreSQL profile included.
4. **Transition-based alerting:** Prevents alert table flooding; models real monitoring behavior.

## Assumptions & Restart Behavior
- On backend restart, scenario resets to NORMAL (documented assumption per guide)
- History from previous run is lost (H2 in-memory); use PostgreSQL profile for persistence
- The health score is a simplified educational metric, not a validated industry health index
- Hydrogen concentration alone cannot diagnose a specific fault type

## Project Structure
```
transynq/
├── frontend/           # React + Vite + Tailwind CSS
│   ├── src/
│   │   ├── components/ # TopBar, TransformerHeroCard, StatsCards, Charts,
│   │   │               # AlertBanner, HealthGauge, ScenarioControls
│   │   ├── pages/      # Dashboard, HistoryView, AlertsView
│   │   ├── services/   # api.js (REST + SSE client)
│   │   └── App.jsx     # Router
│   └── package.json
├── backend/            # Java Spring Boot
│   ├── src/main/java/com/transynq/
│   │   ├── entity/     # Asset, Reading, Alert
│   │   ├── repository/ # JPA repositories
│   │   ├── service/    # SimulationService, HealthEvaluationService,
│   │   │               # AlertService, SseStreamService
│   │   ├── controller/ # AssetController, HistoryController, StreamController
│   │   ├── dto/        # ReadingDto, ScenarioRequest
│   │   └── config/     # WebConfig, DataInitializer
│   └── pom.xml
└── README.md
```

## Research Note

Thresholds and monitoring concepts were informed by:
- **IEEE C57.104-2019**: Guide for the Interpretation of Gases Generated in Mineral Oil-Immersed Transformers (dissolved gas analysis concepts)
- **IEC 60076-7**: Power transformers — Loading guide for mineral-oil-immersed power transformers (thermal modeling concepts)
- **IEEE C57.91-2011**: Guide for Loading Mineral-Oil-Immersed Transformers and Step-Voltage Regulators

The specific numerical thresholds used in this project are **simplified educational values** chosen to demonstrate the monitoring concept clearly within a 3-second simulation cycle. Real transformer monitoring uses manufacturer-specific limits, historical trending, and multi-parameter dissolved gas analysis ratios.

## Deployment

### Frontend (Vercel)
```bash
cd frontend
npm run build
# Deploy the dist/ folder to Vercel
```

### Backend (Render)
1. Create a PostgreSQL database on Render
2. Set environment variable: `SPRING_PROFILES_ACTIVE=postgres`
3. Configure `application-postgres.properties` with Render database URL
4. Deploy as a Web Service with build command: `cd backend && mvn clean package -DskipTests`
5. Start command: `java -jar target/transynq-backend-0.0.1-SNAPSHOT.jar`
