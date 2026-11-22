package com.transynq.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;

public class ScenarioRequest {

    @NotBlank(message = "Scenario must not be blank")
    @Pattern(
        regexp = "^(?i)(NORMAL|OVERHEATING|GAS_ANOMALY)$",
        message = "Scenario must be one of: NORMAL, OVERHEATING, GAS_ANOMALY"
    )
    private String scenario;

    public ScenarioRequest() {}

    public ScenarioRequest(String scenario) {
        this.scenario = scenario;
    }

    public String getScenario() {
        return scenario;
    }

    public void setScenario(String scenario) {
        this.scenario = scenario;
    }
}
