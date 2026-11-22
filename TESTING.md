# Transynq — Automated Test Suite & Verification Report

Comprehensive verification documentation for the Transynq Electrical Asset Digital Twin backend. All tests are automated using **JUnit 5**, **Mockito**, and **Spring Boot Test (MockMvc)** against an isolated in-memory H2 database.

**Test Execution Summary:**
- **Total Tests Executed:** 23
- **Passed:** 23
- **Failed:** 0
- **Errors:** 0
- **Build Status:** `BUILD SUCCESS` (via `mvn test`)

---

## 1. Health Evaluation Service Tests (`HealthEvaluationServiceTest.java`)

Validates the deterministic health evaluation rules engine against international standards (**IEEE C57.104** and **IEC 60076-7**).

| Test ID | Test Method | Purpose | Expected Result | Actual Result |
|---|---|---|---|:---:|
| `TC-HE-01` | `testNormalBaselineParameters_ReturnsHealthy` | Verify baseline nominal parameters produce maximum health. | Status `HEALTHY`, score `100`, all 4 parameters `HEALTHY`. | **PASS** |
| `TC-HE-02` | `testOilTemperatureBoundaryConditions` | Verify exact boundary limits for Top Oil Temp ($\le 75$, $> 75$, $> 85$ °C). | $75.0$ °C = `HEALTHY` (score 100), $75.1$ °C = `WARNING` (score 90), $85.0$ °C = `WARNING` (score 90), $85.1$ °C = `CRITICAL` (score 75). | **PASS** |
| `TC-HE-03` | `testWindingTemperatureBoundaryConditions` | Verify boundary limits for Hot-Spot Winding Temp ($\le 88$, $> 88$, $> 98$ °C). | $88.0$ °C = `HEALTHY`, $88.5$ °C = `WARNING` (score 90), $98.0$ °C = `WARNING`, $98.1$ °C = `CRITICAL` (score 75). | **PASS** |
| `TC-HE-04` | `testLoadPercentageBoundaryConditions` | Verify boundary limits for Electrical Loading Factor ($\le 85$, $> 85$, $> 95$ %). | $85.0$ % = `HEALTHY`, $85.2$ % = `WARNING` (score 90), $95.0$ % = `WARNING`, $95.1$ % = `CRITICAL` (score 75). | **PASS** |
| `TC-HE-05` | `testHydrogenPpmBoundaryConditions` | Verify boundary limits for Dissolved Hydrogen DGA ($\le 100$, $> 100$, $> 200$ ppm). | $100.0$ ppm = `HEALTHY`, $100.5$ ppm = `WARNING` (score 90), $200.0$ ppm = `WARNING`, $200.5$ ppm = `CRITICAL` (score 75). | **PASS** |
| `TC-HE-06` | `testMultipleParameterFaults_PenaltyCalculation` | Verify multi-parameter fault penalty accumulation ($100 - 10 \times W - 25 \times C$). | 2 Warnings (Oil + Load) = score `80`; 1 Warning + 1 Critical = score `65`. | **PASS** |
| `TC-HE-07` | `testScoreClampingAtZero` | Verify score strictly clamps at minimum 0 under extreme multi-fault conditions. | 4 Critical breaches produce score `0` (never negative). | **PASS** |
| `TC-HE-08` | `testRecoveryToNormal_RestoresScore` | Verify evaluating healthy parameters after a severe breach fully restores score to 100. | Degraded state returns `CRITICAL` (0), subsequent nominal input returns `HEALTHY` (100). | **PASS** |

---

## 2. Alert Service Tests (`AlertServiceTest.java`)

Validates the state transition detection, deduplication mechanism, severity escalation, and auto-resolution lifecycle.

| Test ID | Test Method | Purpose | Expected Result | Actual Result |
|---|---|---|---|:---:|
| `TC-AS-01` | `testAlertCreation_WhenThresholdBreached` | Verify alert creation when parameter crosses safe threshold into `WARNING`. | Single new `Alert` entity saved with severity `WARNING` and null `resolvedAt`. | **PASS** |
| `TC-AS-02` | `testNoDuplicateAlerts_WhenStatusUnchanged` | Verify alert deduplication prevents redundant alerts every 3-second simulation tick. | Consecutive identical status inputs result in exactly 1 database save call. | **PASS** |
| `TC-AS-03` | `testSeverityEscalation_WarningToCritical` | Verify escalating from `WARNING` to `CRITICAL` closes the prior warning and opens a critical alert. | Prior warning has `resolvedAt` populated; new `Alert` with severity `CRITICAL` is saved. | **PASS** |
| `TC-AS-04` | `testAlertResolution_WhenConditionsNormalize` | Verify alert automatically resolves when reading drops back below warning threshold. | Open active alert has `resolvedAt` timestamped with current time and saved. | **PASS** |
| `TC-AS-05` | `testNullOrEmptyHandling_DoesNotThrow` | Verify resilience against null assets or empty parameter maps. | Service executes without throwing NullPointerExceptions; 0 alerts saved. | **PASS** |

---

## 3. Asset Controller API Tests (`AssetControllerTest.java`)

Validates asset catalog querying, individual asset retrieval, latest telemetry queries, and scenario mutation handling via MockMvc.

| Test ID | Test Method | Purpose | Expected Result | Actual Result |
|---|---|---|---|:---:|
| `TC-API-01` | `testListAssets_Returns200WithAssets` | Verify `GET /api/assets` returns asset catalog. | HTTP 200 OK with JSON array containing asset code `TR-101`. | **PASS** |
| `TC-API-02` | `testGetAssetById_ValidId_Returns200` | Verify `GET /api/assets/1` returns asset details. | HTTP 200 OK with matching asset ID and code. | **PASS** |
| `TC-API-03` | `testGetAssetById_NonExistent_Returns404` | Verify `GET /api/assets/999` handles missing equipment gracefully. | HTTP 404 Not Found with sanitized error body. | **PASS** |
| `TC-API-04` | `testGetLatestReading_Returns200WithReading` | Verify `GET /api/assets/1/latest` returns recent sensor telemetry. | HTTP 200 OK with reading DTO containing oil temp and status. | **PASS** |
| `TC-API-05` | `testUpdateScenario_ValidScenario_Returns200` | Verify `POST /api/assets/1/scenario` updates scenario state. | HTTP 200 OK with updated scenario (`OVERHEATING`). | **PASS** |
| `TC-API-06` | `testUpdateScenario_InvalidScenario_Returns400` | Verify input validation rejects invalid scenario states. | HTTP 400 Bad Request with field validation error message. | **PASS** |

---

## 4. History Controller API Tests (`HistoryControllerTest.java`)

Validates telemetry audit querying and historical alert retrieval via MockMvc.

| Test ID | Test Method | Purpose | Expected Result | Actual Result |
|---|---|---|---|:---:|
| `TC-HIST-01` | `testGetHistory_ValidAsset_ReturnsReadings` | Verify `GET /api/assets/1/history?minutes=15` returns time-bounded records. | HTTP 200 OK with list of historical readings. | **PASS** |
| `TC-HIST-02` | `testGetHistory_NonExistentAsset_Returns404` | Verify `GET /api/assets/999/history` handles invalid asset ID. | HTTP 404 Not Found with sanitized error payload. | **PASS** |
| `TC-HIST-03` | `testGetAlerts_ReturnsAlertList` | Verify `GET /api/assets/1/alerts` returns alert audit records. | HTTP 200 OK with list of alert events. | **PASS** |

---

## 5. Spring Boot Application Context Integration Test (`TransynqApplicationTests.java`)

| Test ID | Test Method | Purpose | Expected Result | Actual Result |
|---|---|---|---|:---:|
| `TC-INT-01` | `contextLoads` | Bootstrap full Spring Boot context, JPA entities, repositories, and H2 database. | Context loads without bean creation or database migration errors. | **PASS** |

---

## 6. How to Run the Automated Test Suite

Run the full test suite from the terminal:

```bash
cd backend
mvn test
```

To run a specific test class:

```bash
mvn test -Dtest=HealthEvaluationServiceTest
mvn test -Dtest=AlertServiceTest
mvn test -Dtest=AssetControllerTest
mvn test -Dtest=HistoryControllerTest
```
