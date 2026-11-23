# Transynq — Electrical Asset Digital Twin Monitoring System

A high-reliability digital twin monitoring platform for critical high-voltage electrical substation assets (Power Transformers, Distribution Transformers, and Medium-Voltage Switchgear Panels). Transynq demonstrates real-time asset health evaluation from continuous multi-sensor telemetry, deterministic threshold-based anomaly detection, historical trend analytics, and operational fault simulation.

> **Track:** Track 1 — Digital Twin for Electrical Assets  
> **Candidate:** Chitranshu Pandey  
> **Target Role:** Rugged Monitoring Take-Home Assignment  
> **Stack:** React 19 + Vite + Tailwind CSS + Chart.js (Frontend) \| Java 17 + Spring Boot 3.4.1 + H2 / PostgreSQL (Backend)  
> **Repository:** [https://github.com/chitranshu234/Transynq](https://github.com/chitranshu234/Transynq)

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
- Alerts fire on **status transitions** only (`HEALTHY` → `WARNING`, `HEALTHY` → `CRITICAL`, `WARNING` → `CRITICAL`)
- No duplicate alerts generated on every tick during active faults
- Alerts automatically resolve (`resolvedAt` timestamped) when readings recover below safety limits
- Severity escalation automatically resolves prior warning and logs the elevated critical state

## Security Measures Applied

Transynq applies defense-in-depth security controls across the application stack:

- **Input Validation:** Strict Jakarta Bean Validation (`@Valid`, `@Pattern`, `@Positive`, `@Min`, `@Max`) enforces payload schemas and validates request parameters, rejecting malformed scenario states with HTTP 400.
- **Restricted CORS Policy:** Cross-Origin Resource Sharing is locked down to approved origins (`localhost:5173`, `localhost:3000`, and authorized Vercel production domains). Wildcard `*` origins are disallowed.
- **OWASP Security Headers:** The `SecurityHeadersFilter` automatically attaches defensive HTTP headers to all responses (`X-Content-Type-Options: nosniff`, `X-Frame-Options: DENY`, `X-XSS-Protection: 1; mode=block`, and strict `Referrer-Policy`).
- **Sanitized Global Error Handling:** The `@RestControllerAdvice` (`GlobalExceptionHandler`) intercepts all runtime exceptions, returning standardized `ErrorResponse` objects while completely suppressing database dialects, internal file paths, and Java stack traces (`server.error.include-stacktrace=never`).
- **Environment-Driven Secrets:** All credentials (`DATABASE_URL`, `DB_USERNAME`, `DB_PASSWORD`, `SCENARIO_API_KEY`) are managed through environment variables with zero hardcoded credentials in source control.
- **API Authentication & Rate Limiting:** Operational simulation controls (`POST /api/assets/{id}/scenario`) support optional `X-API-KEY` / `Bearer` token verification and an in-memory sliding-window rate limiter (10 requests / 10s per client IP) to prevent denial-of-service abuse.
- **Reverse Proxy Header Support:** Configured with `server.forward-headers-strategy=native` to securely honor upstream TLS termination (`X-Forwarded-Proto: https`) on cloud hosting platforms.

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
├── frontend/               # React 19 + Vite + Tailwind CSS
│   ├── src/
│   │   ├── components/     # TopBar, TransformerHeroCard, StatsCards, Charts,
│   │   │                   # AlertBanner, HealthGauge, ScenarioControls
│   │   ├── context/        # AssetContext.jsx (global multi-asset state)
│   │   ├── pages/          # Dashboard, HistoryView, AlertsView
│   │   ├── services/       # api.js (REST + SSE client with security headers)
│   │   └── App.jsx         # Router & Context Provider
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
│   │   ├── application.properties          # Dev profile (H2, auto-seeded)
│   │   └── application-postgres.properties # Production profile (PostgreSQL)
│   └── pom.xml
└── README.md
```

## AI Usage Note (Submission Requirement)

In compliance with the take-home submission ground rules:

- **What AI tools were used:** Assisted by agentic AI (Antigravity with Google DeepMind models) for scaffolding repetitive boilerplate, Spring Boot JPA repository setups, and CSS layout adaptation.
- **How the code was verified:**
  1. **Automated Test Suite:** Executed `mvn test` verifying 5/5 unit and integration tests covering threshold boundaries, multi-parameter scoring, and Spring application context bootstrapping.
  2. **End-to-End API Audit:** Scripted PowerShell verification for all REST endpoints (`/api/assets`, `/latest`, `/history`, `/alerts`, `/scenario`) across all 3 seeded assets.
  3. **Live SSE Stream Inspection:** Verified raw `text/event-stream` chunks delivered every 3 seconds with bounded physics drift.
  4. **Security Verification:** Tested invalid scenario payloads (`400 Bad Request`), missing IDs (`404 Not Found`), and OWASP response headers (`X-Frame-Options`, `X-Content-Type-Options`).
- **One place where AI was overruled:**
  - **Overruled Architecture Complexity:** AI initially proposed a heavy event-driven architecture using Apache Kafka and bi-directional WebSockets with full Spring Security OAuth2. I overruled this design because transformer telemetry is unidirectional (device-to-cloud), and over-engineering distributed message brokers introduces unnecessary operational failure points. Instead, I mandated **Server-Sent Events (SSE)** with Spring `SseEmitter` and a dedicated `ScenarioSecurityService`. This reduced token overhead, zeroed external broker latency, eliminated dependency bloat, and ensured 100% reliable auto-reconnects in the browser.
  - **Overruled Random Jumps for Thermal Physics:** When AI first drafted the simulation tick, it used unconstrained random numbers. I overruled this with a **bounded thermal inertia equation** where oil and winding temperatures drift smoothly and follow ambient lag, mimicking real thermodynamic behavior.

## Key Decisions & Interview Talking Points

During the technical interview walkthrough:
1. **Decision Changed — FetchType LAZY vs EAGER:** Originally, JPA entity relationships (`Reading.asset` and `Alert.asset`) were marked `FetchType.LAZY`. When streaming DTOs over SSE outside a transactional boundary, this triggered `LazyInitializationException`. I evaluated `@Transactional(readOnly = true)` on controller vs `FetchType.EAGER`. I chose `FetchType.EAGER` because `Asset` is a small reference entity with only 6 scalar fields, completely eliminating N+1 overhead while guaranteeing thread-safe serialization for async SSE workers.
2. **Transition-Based Alerting:** Rather than firing an alert record on every 3-second simulation tick during a fault (which would flood the database with thousands of duplicate rows per hour), the alert service triggers only on **state transitions** (e.g. `HEALTHY` → `WARNING` or `WARNING` → `CRITICAL`). When normal conditions resume, the open alert is timestamped with `resolvedAt`.
3. **Multi-Asset Scalability:** The backend simulation loop dynamically iterates `assetRepository.findAll()`. Adding new switchgears, generators, or transformers requires no changes to the simulation engine or frontend routing.

## Research Note

Thresholds and monitoring concepts were informed by:
- **IEEE C57.104-2019**: Guide for the Interpretation of Gases Generated in Mineral Oil-Immersed Transformers (dissolved gas analysis concepts)
- **IEC 60076-7**: Power transformers — Loading guide for mineral-oil-immersed power transformers (thermal modeling concepts)
- **IEEE C57.91-2011**: Guide for Loading Mineral-Oil-Immersed Transformers and Step-Voltage Regulators

The specific numerical thresholds used in this project are **simplified educational values** chosen to demonstrate the monitoring concept clearly within a 3-second simulation cycle. Real transformer monitoring uses manufacturer-specific limits, historical trending, and multi-parameter dissolved gas analysis ratios.

