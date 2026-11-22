package com.transynq.dto;

import jakarta.validation.constraints.NotBlank;

public class ScenarioRequest {

    @NotBlank(message = "Scenario must not be blank")
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
