package com.transynq;

import com.transynq.service.HealthEvaluationService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.*;

@DisplayName("Health Evaluation Service - Unit Tests")
class HealthEvaluationServiceTest {

    private HealthEvaluationService service;

    @BeforeEach
    void setUp() {
        service = new HealthEvaluationService();
    }

    @Test
    @DisplayName("TC-HE-01: Baseline healthy parameters return status HEALTHY and score 100")
    void testNormalBaselineParameters_ReturnsHealthy() {
        HealthEvaluationService.EvaluationResult result = service.evaluate(60.0, 72.0, 68.0, 30.0);

        assertEquals("HEALTHY", result.getOverallStatus());
        assertEquals(100, result.getHealthScore());
        assertEquals("HEALTHY", result.getParameterStatuses().get("oilTemperature"));
        assertEquals("HEALTHY", result.getParameterStatuses().get("windingTemperature"));
        assertEquals("HEALTHY", result.getParameterStatuses().get("loadPercentage"));
        assertEquals("HEALTHY", result.getParameterStatuses().get("hydrogenPpm"));
    }

    @Test
    @DisplayName("TC-HE-02: Top Oil Temperature threshold boundary evaluation (<=75, >75, >85)")
    void testOilTemperatureBoundaryConditions() {
        // Exact boundary: 75.0 C is HEALTHY
        HealthEvaluationService.EvaluationResult atBoundary = service.evaluate(75.0, 72.0, 68.0, 30.0);
        assertEquals("HEALTHY", atBoundary.getParameterStatuses().get("oilTemperature"));
        assertEquals(100, atBoundary.getHealthScore());

        // Just over boundary: 75.1 C is WARNING
        HealthEvaluationService.EvaluationResult justAboveWarn = service.evaluate(75.1, 72.0, 68.0, 30.0);
        assertEquals("WARNING", justAboveWarn.getParameterStatuses().get("oilTemperature"));
        assertEquals(90, justAboveWarn.getHealthScore()); // 100 - 10

        // Warning ceiling: 85.0 C is still WARNING
        HealthEvaluationService.EvaluationResult atCritBoundary = service.evaluate(85.0, 72.0, 68.0, 30.0);
        assertEquals("WARNING", atCritBoundary.getParameterStatuses().get("oilTemperature"));
        assertEquals(90, atCritBoundary.getHealthScore());

        // Just over critical limit: 85.1 C is CRITICAL
        HealthEvaluationService.EvaluationResult justAboveCrit = service.evaluate(85.1, 72.0, 68.0, 30.0);
        assertEquals("CRITICAL", justAboveCrit.getParameterStatuses().get("oilTemperature"));
        assertEquals(75, justAboveCrit.getHealthScore()); // 100 - 25
    }

    @Test
    @DisplayName("TC-HE-03: Winding Temperature threshold boundary evaluation (<=88, >88, >98)")
    void testWindingTemperatureBoundaryConditions() {
        // Boundary: 88.0 C is HEALTHY
        assertEquals("HEALTHY", service.evaluate(60.0, 88.0, 68.0, 30.0).getParameterStatuses().get("windingTemperature"));

        // Warning: 88.5 C
        HealthEvaluationService.EvaluationResult warn = service.evaluate(60.0, 88.5, 68.0, 30.0);
        assertEquals("WARNING", warn.getParameterStatuses().get("windingTemperature"));
        assertEquals(90, warn.getHealthScore());

        // Boundary: 98.0 C is WARNING
        assertEquals("WARNING", service.evaluate(60.0, 98.0, 68.0, 30.0).getParameterStatuses().get("windingTemperature"));

        // Critical: 98.1 C
        HealthEvaluationService.EvaluationResult crit = service.evaluate(60.0, 98.1, 68.0, 30.0);
        assertEquals("CRITICAL", crit.getParameterStatuses().get("windingTemperature"));
        assertEquals(75, crit.getHealthScore());
    }

    @Test
    @DisplayName("TC-HE-04: Electrical Load Factor boundary evaluation (<=85%, >85%, >95%)")
    void testLoadPercentageBoundaryConditions() {
        // Boundary: 85.0% is HEALTHY
        assertEquals("HEALTHY", service.evaluate(60.0, 72.0, 85.0, 30.0).getParameterStatuses().get("loadPercentage"));

        // Warning: 85.2%
        HealthEvaluationService.EvaluationResult warn = service.evaluate(60.0, 72.0, 85.2, 30.0);
        assertEquals("WARNING", warn.getParameterStatuses().get("loadPercentage"));
        assertEquals(90, warn.getHealthScore());

        // Boundary: 95.0% is WARNING
        assertEquals("WARNING", service.evaluate(60.0, 72.0, 95.0, 30.0).getParameterStatuses().get("loadPercentage"));

        // Critical: 95.1%
        HealthEvaluationService.EvaluationResult crit = service.evaluate(60.0, 72.0, 95.1, 30.0);
        assertEquals("CRITICAL", crit.getParameterStatuses().get("loadPercentage"));
        assertEquals(75, crit.getHealthScore());
    }

    @Test
    @DisplayName("TC-HE-05: Dissolved Hydrogen (H2) DGA boundary evaluation (<=100ppm, >100ppm, >200ppm)")
    void testHydrogenPpmBoundaryConditions() {
        // Boundary: 100.0 ppm is HEALTHY
        assertEquals("HEALTHY", service.evaluate(60.0, 72.0, 68.0, 100.0).getParameterStatuses().get("hydrogenPpm"));

        // Warning: 100.5 ppm
        HealthEvaluationService.EvaluationResult warn = service.evaluate(60.0, 72.0, 68.0, 100.5);
        assertEquals("WARNING", warn.getParameterStatuses().get("hydrogenPpm"));
        assertEquals(90, warn.getHealthScore());

        // Boundary: 200.0 ppm is WARNING
        assertEquals("WARNING", service.evaluate(60.0, 72.0, 68.0, 200.0).getParameterStatuses().get("hydrogenPpm"));

        // Critical: 200.5 ppm
        HealthEvaluationService.EvaluationResult crit = service.evaluate(60.0, 72.0, 68.0, 200.5);
        assertEquals("CRITICAL", crit.getParameterStatuses().get("hydrogenPpm"));
        assertEquals(75, crit.getHealthScore());
    }

    @Test
    @DisplayName("TC-HE-06: Multi-parameter faults accumulate penalties according to formula")
    void testMultipleParameterFaults_PenaltyCalculation() {
        // 2 Warnings: Oil temp (80.0) and Load (90.0) -> 100 - (2 * 10) = 80
        HealthEvaluationService.EvaluationResult twoWarn = service.evaluate(80.0, 72.0, 90.0, 30.0);
        assertEquals("WARNING", twoWarn.getOverallStatus());
        assertEquals(80, twoWarn.getHealthScore());

        // 1 Warning (Oil=80.0) + 1 Critical (Hydrogen=250.0) -> 100 - 10 - 25 = 65
        HealthEvaluationService.EvaluationResult mixed = service.evaluate(80.0, 72.0, 68.0, 250.0);
        assertEquals("CRITICAL", mixed.getOverallStatus());
        assertEquals(65, mixed.getHealthScore());
    }

    @Test
    @DisplayName("TC-HE-07: Health score clamps strictly at minimum 0 under catastrophic conditions")
    void testScoreClampingAtZero() {
        // 4 Critical breaches: 4 * 25 = 100 penalty -> exactly 0
        HealthEvaluationService.EvaluationResult allCrit = service.evaluate(100.0, 110.0, 99.0, 300.0);
        assertEquals("CRITICAL", allCrit.getOverallStatus());
        assertEquals(0, allCrit.getHealthScore());

        // Super-critical: should not produce negative score
        HealthEvaluationService.EvaluationResult superCrit = service.evaluate(120.0, 130.0, 100.0, 500.0);
        assertEquals(0, superCrit.getHealthScore());
    }

    @Test
    @DisplayName("TC-HE-08: Recovery from fault conditions restores HEALTHY status and 100 score")
    void testRecoveryToNormal_RestoresScore() {
        // First tick: degraded state
        HealthEvaluationService.EvaluationResult degraded = service.evaluate(86.0, 100.0, 96.0, 250.0);
        assertEquals("CRITICAL", degraded.getOverallStatus());
        assertEquals(0, degraded.getHealthScore());

        // Subsequent tick: cooled down and vented
        HealthEvaluationService.EvaluationResult recovered = service.evaluate(58.0, 70.0, 65.0, 28.0);
        assertEquals("HEALTHY", recovered.getOverallStatus());
        assertEquals(100, recovered.getHealthScore());
    }
}
