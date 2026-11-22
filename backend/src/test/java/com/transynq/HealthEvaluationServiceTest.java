package com.transynq;

import com.transynq.service.HealthEvaluationService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.*;

class HealthEvaluationServiceTest {

    private HealthEvaluationService service;

    @BeforeEach
    void setUp() {
        service = new HealthEvaluationService();
    }

    @Test
    @DisplayName("Should return HEALTHY and 100 score for normal baseline parameters")
    void testNormalParameters() {
        HealthEvaluationService.EvaluationResult result = service.evaluate(60.0, 72.0, 68.0, 30.0);

        assertEquals("HEALTHY", result.getOverallStatus());
        assertEquals(100, result.getHealthScore());
        assertEquals("HEALTHY", result.getParameterStatuses().get("oilTemperature"));
        assertEquals("HEALTHY", result.getParameterStatuses().get("windingTemperature"));
        assertEquals("HEALTHY", result.getParameterStatuses().get("loadPercentage"));
        assertEquals("HEALTHY", result.getParameterStatuses().get("hydrogenPpm"));
    }

    @Test
    @DisplayName("Should return WARNING and deducted score when oil temperature breaches warning threshold")
    void testWarningOilTemperature() {
        // Oil temp 80 is > 75 (warning) but <= 85 (critical)
        HealthEvaluationService.EvaluationResult result = service.evaluate(80.0, 85.0, 70.0, 35.0);

        assertEquals("WARNING", result.getOverallStatus());
        assertEquals(90, result.getHealthScore()); // 100 - 10
        assertEquals("WARNING", result.getParameterStatuses().get("oilTemperature"));
    }

    @Test
    @DisplayName("Should return CRITICAL when any single parameter breaches critical limit")
    void testCriticalBreach() {
        // Hydrogen 250 ppm is > 200 (critical)
        HealthEvaluationService.EvaluationResult result = service.evaluate(62.0, 74.0, 70.0, 250.0);

        assertEquals("CRITICAL", result.getOverallStatus());
        assertEquals(75, result.getHealthScore()); // 100 - 25
        assertEquals("CRITICAL", result.getParameterStatuses().get("hydrogenPpm"));
    }

    @Test
    @DisplayName("Should clamp health score to minimum 0 under extreme multi-fault conditions")
    void testScoreClampingAtZero() {
        // Extreme breach on all 4 parameters: 4 * 25 = 100 penalty -> score 0
        HealthEvaluationService.EvaluationResult result = service.evaluate(105.0, 115.0, 99.0, 350.0);

        assertEquals("CRITICAL", result.getOverallStatus());
        assertEquals(0, result.getHealthScore());
    }
}
