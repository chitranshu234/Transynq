package com.transynq.service;

import org.springframework.stereotype.Service;

import java.util.Collections;
import java.util.LinkedHashMap;
import java.util.Map;

@Service
public class HealthEvaluationService {

    // Documented Educational Assumptions (inspired by IEEE C57.104 & IEC 60076 loading/thermal guides)
    // Note: These values are simplified demo thresholds for asset monitoring, not absolute manufacturer limits.
    public static final double OIL_TEMP_WARNING = 75.0;
    public static final double OIL_TEMP_CRITICAL = 85.0;

    public static final double WINDING_TEMP_WARNING = 88.0;
    public static final double WINDING_TEMP_CRITICAL = 98.0;

    public static final double LOAD_PCT_WARNING = 85.0;
    public static final double LOAD_PCT_CRITICAL = 95.0;

    public static final double HYDROGEN_PPM_WARNING = 100.0;
    public static final double HYDROGEN_PPM_CRITICAL = 200.0;

    public static final int PENALTY_WARNING = 10;
    public static final int PENALTY_CRITICAL = 25;

    public static class EvaluationResult {
        private final String overallStatus;
        private final int healthScore;
        private final Map<String, String> parameterStatuses;

        public EvaluationResult(String overallStatus, int healthScore, Map<String, String> parameterStatuses) {
            this.overallStatus = overallStatus;
            this.healthScore = healthScore;
            this.parameterStatuses = Collections.unmodifiableMap(parameterStatuses);
        }

        public String getOverallStatus() {
            return overallStatus;
        }

        public int getHealthScore() {
            return healthScore;
        }

        public Map<String, String> getParameterStatuses() {
            return parameterStatuses;
        }
    }

    public EvaluationResult evaluate(double oilTemp, double windingTemp, double loadPct, double hydrogenPpm) {
        Map<String, String> statuses = new LinkedHashMap<>();

        statuses.put("oilTemperature", evaluateSingle(oilTemp, OIL_TEMP_WARNING, OIL_TEMP_CRITICAL));
        statuses.put("windingTemperature", evaluateSingle(windingTemp, WINDING_TEMP_WARNING, WINDING_TEMP_CRITICAL));
        statuses.put("loadPercentage", evaluateSingle(loadPct, LOAD_PCT_WARNING, LOAD_PCT_CRITICAL));
        statuses.put("hydrogenPpm", evaluateSingle(hydrogenPpm, HYDROGEN_PPM_WARNING, HYDROGEN_PPM_CRITICAL));

        int warningCount = 0;
        int criticalCount = 0;

        for (String status : statuses.values()) {
            if ("CRITICAL".equals(status)) {
                criticalCount++;
            } else if ("WARNING".equals(status)) {
                warningCount++;
            }
        }

        String overallStatus = "HEALTHY";
        if (criticalCount > 0) {
            overallStatus = "CRITICAL";
        } else if (warningCount > 0) {
            overallStatus = "WARNING";
        }

        int score = 100 - (warningCount * PENALTY_WARNING) - (criticalCount * PENALTY_CRITICAL);
        score = Math.max(0, Math.min(100, score));

        return new EvaluationResult(overallStatus, score, statuses);
    }

    private String evaluateSingle(double value, double warningThreshold, double criticalThreshold) {
        if (value > criticalThreshold) {
            return "CRITICAL";
        } else if (value > warningThreshold) {
            return "WARNING";
        } else {
            return "HEALTHY";
        }
    }
}
