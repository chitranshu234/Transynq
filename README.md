# Transynq — Electrical Asset Digital Twin Monitoring System

A real-time digital twin monitoring platform for electrical substation equipment — including Power Transformers, Distribution Transformers, and Medium-Voltage Switchgear Panels. Transynq continuously simulates sensor telemetry, evaluates equipment health using threshold rules, triggers alerts on state changes, and displays live and historical trends on a web dashboard.

> **Track:** Track 1 — Digital Twin for Electrical Assets  
> **Candidate:** Chitranshu Pandey  
> **Assignment:** Rugged Monitoring Take-Home Assignment  
> **Stack:** React 19 + Vite + Tailwind CSS + Chart.js (Frontend) \| Java 17 + Spring Boot 3.4.1 + H2 / PostgreSQL (Backend)  
> **Repository:** [https://github.com/chitranshu234/Transynq](https://github.com/chitranshu234/Transynq)

---

## Quick Start

### Prerequisites
- **Java 17+** (JDK) and **Maven 3.8+**
- **Node.js 18+** and **npm 9+**
- PostgreSQL is optional — the backend uses an in-memory **H2** database by default for zero-setup local execution

### 1. Start the Backend (port 8080)
```bash
cd backend
mvn spring-boot:run
```
The server starts on `http://localhost:8080` with an in-memory H2 database.  
Three assets are seeded automatically on startup: **TR-101** (Main Power Transformer), **TR-202** (Distribution Transformer), and **SG-301** (11 kV Switchgear Panel). The 3-second telemetry simulation starts immediately for all assets.

### 2. Start the Frontend (port 5173)
```bash
cd frontend
npm install
npm run dev
```
Open **http://localhost:5173** in your browser.  
The Vite dev server automatically forwards `/api` requests to the backend on port 8080.

### 3. Run Automated Tests
```bash
cd backend
mvn test
```
Runs 23 automated unit, controller, and integration tests (details in [TESTING.md](TESTING.md)).

### 4. Using the Dashboard
- **Asset Selector:** Switch between **TR-101**, **TR-202**, and **SG-301** from the top bar dropdown
- **Live Dashboard (`/`):** View live sensor cards, temperature/load charts, health gauge, active alerts, and scenario controls
- **History & Trends (`/history`):** Inspect past telemetry and trends across **15 min**, **1 hr**, or **24 hr** windows
- **Alerts Log (`/alerts`):** Review active and resolved alerts with severity filters (`ALL`, `CRITICAL`, `WARNING`)
- **Scenario Controls:** Click **OVERHEATING** or **GAS_ANOMALY** to inject faults on the selected asset, or **NORMAL** to cool down and recover

---

## Architecture

```
Frontend (React + Vite, port 5173)
  │── Live stream via SSE (/api/assets/{id}/stream)
  │── REST requests (/api/assets, /latest, /history, /alerts, /scenario)
  │
Backend (Spring Boot, port 8080)
  ├── SimulationService (@Scheduled every 3s)
  │     → updates sensor readings gradually based on active scenario
  │     → evaluates health status & score (HealthEvaluationService)
  │     → checks for alert state transitions (AlertService)
  │     → saves Reading to database
  │     → pushes live updates to connected clients via SSE
  ├── REST & Stream Controllers
  └── H2 Database (in-memory dev) / PostgreSQL (production profile)
```

## API Contract

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/assets` | List all monitored assets |
| `GET` | `/api/assets/{id}` | Get details for a single asset |
| `GET` | `/api/assets/{id}/latest` | Get the latest sensor reading for an asset |
| `GET` | `/api/assets/{id}/history?minutes=60` | Get readings from the last N minutes (`1`–`10080`) |
| `GET` | `/api/assets/{id}/alerts` | List alerts for an asset (supports `?activeOnly=true`) |
| `POST` | `/api/assets/{id}/scenario` | Change scenario (`{"scenario":"OVERHEATING"}`) |
| `GET` | `/api/assets/{id}/stream` | Live Server-Sent Events stream (`text/event-stream`) |

**Sample SSE payload (`event: reading`):**
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
  -- INDEX on (code)
readings(id, asset_id FK, recorded_at, oil_temp_c, winding_temp_c, load_pct, hydrogen_ppm, health_score, status)
  -- INDEX on (asset_id, recorded_at)
alerts(id, asset_id FK, recorded_at, parameter, severity, message, resolved_at NULL)
  -- INDEX on (asset_id, recorded_at)
```

## Simulation & Health Logic

### Scenarios (Server-Side, Every 3 Seconds)
| Scenario | Behavior |
|----------|----------|
| **NORMAL** | Values drift smoothly within safe ranges (oil ~55–65°C, winding ~67–77°C, load ~60–75%, H₂ ~20–40 ppm) |
| **OVERHEATING** | Oil and winding temperatures rise +1.0 to +2.5°C per tick toward critical limits; load rises |
| **GAS_ANOMALY** | Dissolved hydrogen climbs +15 to +35 ppm per tick, simulating internal partial discharge / arcing |

Switching back to **NORMAL** gradually cools temperatures and lowers gas levels back to nominal baselines.

### Health Evaluation Thresholds
| Parameter | Normal | Warning | Critical |
|-----------|--------|---------|----------|
| Top Oil Temp | ≤ 75°C | > 75°C | > 85°C |
| Winding Temp | ≤ 88°C | > 88°C | > 98°C |
| Load Factor | ≤ 85% | > 85% | > 95% |
| Dissolved H₂ | ≤ 100 ppm | > 100 ppm | > 200 ppm |

> ⚠️ **These are simplified educational thresholds** chosen to demonstrate monitoring behavior within a 3-second cycle, not universal manufacturer operating limits. See the Research Note below for industry references.

- **Overall Status:** Set to the worst status among all four parameters (`CRITICAL` > `WARNING` > `HEALTHY`).
- **Health Score:** `100 − (10 × warning parameters) − (25 × critical parameters)`, clamped between `0` and `100`.

### Alert Lifecycle
- **Transition-Only Triggering:** Alerts are created only when a parameter's status changes (e.g., `HEALTHY` → `WARNING`, `WARNING` → `CRITICAL`), rather than generating duplicate rows every 3 seconds.
- **Escalation:** When a parameter escalates from `WARNING` to `CRITICAL`, the earlier warning is automatically marked resolved (`resolvedAt` set) and a new `CRITICAL` alert is opened.
- **Auto-Resolution:** When readings drop back within normal limits, the active alert is automatically resolved with a timestamp.

## Security Measures Applied

Transynq includes practical security safeguards across API handling, headers, and configuration:

- **Input Validation:** Uses Jakarta Bean Validation (`@Valid`, `@Pattern`, `@Positive`, `@Min`, `@Max`) on request DTOs and path/query parameters to reject invalid scenario names or out-of-range inputs with `400 Bad Request`.
- **Restricted CORS:** `WebConfig` allows API requests only from approved origins (`localhost:5173`, `localhost:3000`, and `*.vercel.app` via `CORS_ALLOWED_ORIGINS`) instead of wildcard `*`.
- **OWASP Security Headers:** `SecurityHeadersFilter` attaches `X-Content-Type-Options: nosniff`, `X-Frame-Options: DENY`, `X-XSS-Protection: 1; mode=block`, `Referrer-Policy`, and `Permissions-Policy` to every HTTP response.
- **Clean Error Handling:** `GlobalExceptionHandler` (`@RestControllerAdvice`) returns a uniform `ErrorResponse` JSON while hiding internal stack traces and SQL details (`server.error.include-stacktrace=never`).
- **Environment-Based Secrets:** Database credentials (`DATABASE_URL`, `DB_USERNAME`, `DB_PASSWORD`) and `SCENARIO_API_KEY` are configured via environment variables with zero hardcoded secrets in source control.
- **Rate Limiting & Optional API Key:** `ScenarioSecurityService` limits `POST /api/assets/{id}/scenario` to **10 requests per 10 seconds per IP** (`429 Too Many Requests` on abuse) and verifies `X-API-KEY` or `Bearer` tokens when `SCENARIO_API_KEY` is set.
- **Reverse Proxy Support:** Enabled `server.forward-headers-strategy=native` so HTTPS forwarding headers (`X-Forwarded-Proto`) work cleanly behind cloud reverse proxies.

## Design Decisions

1. **Server-Side Simulation over Frontend Random Values:** All browser tabs see the same live state, data persists across page refreshes, and historical queries reflect real recorded telemetry.
2. **SSE over WebSockets:** Sensor updates only flow one way (server → browser). SSE is simpler over standard HTTP, reconnects automatically in the browser, and avoids extra WebSocket dependencies.
3. **H2 Dev / PostgreSQL Prod:** Zero-setup in-memory H2 makes local review effortless, while `application-postgres.properties` provides ready-to-use PostgreSQL support for production.
4. **Transition-Based Alerting:** Keeps the alert log clean and meaningful instead of flooding the database with identical records on every 3-second tick.

## Assumptions & Restart Behavior
- On backend restart, active asset scenarios reset to `NORMAL`.
- When running with default in-memory H2, previous run history clears on server restart; activate the `postgres` Spring profile for persistent storage.
- The composite health score is a simplified educational metric rather than a certified utility health index.
- Hydrogen ppm alone indicates potential electrical stress/partial discharge; full diagnostics in practice require multi-gas ratio analysis.

## Project Structure
```
transynq/
├── frontend/               # React 19 + Vite + Tailwind CSS + Chart.js
│   ├── src/
│   │   ├── components/     # TopBar, TransformerHeroCard, StatsCards, Charts,
│   │   │                   # AlertBanner, HealthGauge, ScenarioControls, Footer
│   │   ├── context/        # AssetContext.jsx (multi-asset selection state)
│   │   ├── pages/          # Dashboard, HistoryView, AlertsView
│   │   ├── services/       # api.js (REST + SSE client)
│   │   └── App.jsx         # Routing & AssetProvider wrapper
│   └── package.json
├── backend/                # Java 17 + Spring Boot 3.4.1
│   ├── src/main/java/com/transynq/
│   │   ├── entity/         # Asset, Reading, Alert (indexed JPA entities)
│   │   ├── repository/     # AssetRepository, ReadingRepository, AlertRepository
│   │   ├── service/        # SimulationService, HealthEvaluationService,
│   │   │                   # AlertService, SseStreamService, ScenarioSecurityService
│   │   ├── controller/     # AssetController, HistoryController, StreamController
│   │   ├── dto/            # ReadingDto, ScenarioRequest, ErrorResponse
│   │   ├── exception/      # GlobalExceptionHandler (@RestControllerAdvice)
│   │   └── config/         # WebConfig (CORS), DataInitializer, SecurityHeadersFilter
│   ├── src/main/resources/
│   │   ├── application.properties          # Local dev profile (H2, auto-seeded)
│   │   └── application-postgres.properties # Production profile (PostgreSQL)
│   ├── src/test/java/com/transynq/         # 23 JUnit 5, Mockito & MockMvc tests
│   └── pom.xml
├── TESTING.md              # Automated test suite report & case breakdown
└── README.md
```

## AI Usage Note

- **AI Tools Used:** Agentic AI coding assistance was used to speed up boilerplate scaffolding, JPA repository/DTO setup, Tailwind CSS styling, and test templates.
- **Verification Process:**
  1. **Automated Tests:** Executed `mvn test` across **23/23 passing tests** covering threshold boundaries, score clamping, alert deduplication/escalation, REST validation, and full Spring context loading (documented in [TESTING.md](TESTING.md)).
  2. **End-to-End API Checks:** Verified `/api/assets`, `/latest`, `/history`, `/alerts`, and `/scenario` across all 3 seeded assets (`TR-101`, `TR-202`, `SG-301`).
  3. **Live SSE Inspection:** Confirmed `text/event-stream` updates arriving every 3 seconds with smooth gradual value changes.
  4. **Security & Build Verification:** Verified HTTP `400` validation errors, `404` handling, OWASP response headers, and clean production frontend builds (`npm run build`).
- **Where AI Was Overruled:**
  - **Replaced Kafka + WebSockets + OAuth2 with SSE + Lightweight Guard:** AI originally suggested an over-engineered setup using Apache Kafka, bi-directional WebSockets, and full Spring Security OAuth2. Because transformer telemetry only streams in one direction (server → browser), I overruled this design and switched to Spring's built-in **Server-Sent Events (`SseEmitter`)** paired with `ScenarioSecurityService`. This removed external broker complexity, avoided unnecessary dependencies, and gave automatic browser reconnection out of the box.
  - **Replaced Random Sensor Jumps with Gradual Thermal Drift:** AI's initial simulation draft picked unconstrained random values on each tick, causing unrealistic temperature spikes and drops. I replaced it with gradual heating, cooling, and physical clamping bounds so temperatures and gas readings change smoothly like real equipment.

## Key Engineering Decisions & Refinements

1. **JPA Fetch Strategy Change (`FetchType.LAZY` → `FetchType.EAGER`):** Originally, `Reading.asset` and `Alert.asset` used `FetchType.LAZY`. Because `spring.jpa.open-in-view` is set to `false` and SSE broadcasts build `ReadingDto` outside an active database transaction, reading the lazy asset proxy threw a `LazyInitializationException`. Switching those relations to `FetchType.EAGER` fixed SSE serialization cleanly with negligible overhead because `Asset` only holds 6 small scalar fields.
2. **Transition-Based Alert State Machine:** To prevent flooding the `alerts` table every 3 seconds during a sustained fault, `AlertService` tracks each parameter's previous status in a `ConcurrentHashMap` and writes to the database only when the state changes, closing old alerts with `resolvedAt` on recovery or escalation.
3. **Chart Pre-Loading & Local Timezone Formatting:** Initially, switching assets or refreshing the page cleared the dashboard chart down to a single data point. `Dashboard.jsx` now pre-loads up to 25 recent chronological readings from `/api/assets/{id}/history?minutes=15` (with SSE timestamp deduplication) so trend curves appear immediately, and converts backend UTC timestamps to the browser's local timezone across charts and cards.
4. **Multi-Asset Extensibility:** `SimulationService` loops over `assetRepository.findAll()` on every 3-second tick, while `AssetContext` loads the asset list dynamically from `/api/assets`. Adding new transformers or switchgear requires no changes to the simulation loop or UI routing.

## Research Note

The monitoring metrics, scenarios, and simplified threshold rules were informed by:
- **IEEE C57.104-2019**: *Guide for the Interpretation of Gases Generated in Mineral Oil-Immersed Transformers* (dissolved hydrogen as an early indicator of partial discharge and arcing)
- **IEC 60076-7**: *Power Transformers — Loading Guide for Mineral-Oil-Immersed Power Transformers* (top-oil vs. winding hot-spot temperature behavior)
- **IEEE C57.91-2011**: *Guide for Loading Mineral-Oil-Immersed Transformers and Step-Voltage Regulators* (thermal effects of sustained overload)

All numerical thresholds in Transynq are **simplified educational values** selected for clear demonstration within a 3-second simulation loop. Production utility monitoring incorporates asset-specific nameplate ratings, ambient temperature baselines, and multi-gas diagnostic ratios (such as Duval Triangle or Rogers Ratios).
