package com.transynq.dto;

import com.transynq.entity.Reading;

import java.time.format.DateTimeFormatter;

public class ReadingDto {

    private Long assetId;
    private String assetCode;
    private String timestamp;
    private double oilTemperature;
    private double windingTemperature;
    private double loadPercentage;
    private double hydrogenPpm;
    private int healthScore;
    private String status;
    private String scenario;

    public ReadingDto() {}

    public ReadingDto(Long assetId, String assetCode, String timestamp, double oilTemperature,
                      double windingTemperature, double loadPercentage, double hydrogenPpm,
                      int healthScore, String status, String scenario) {
        this.assetId = assetId;
        this.assetCode = assetCode;
        this.timestamp = timestamp;
        this.oilTemperature = oilTemperature;
        this.windingTemperature = windingTemperature;
        this.loadPercentage = loadPercentage;
        this.hydrogenPpm = hydrogenPpm;
        this.healthScore = healthScore;
        this.status = status;
        this.scenario = scenario;
    }

    public static ReadingDto fromReading(Reading reading) {
        if (reading == null) return null;
        String assetCode = reading.getAsset() != null ? reading.getAsset().getCode() : null;
        String scenario = reading.getAsset() != null ? reading.getAsset().getScenario() : "NORMAL";
        Long assetId = reading.getAsset() != null ? reading.getAsset().getId() : null;
        String isoTime = reading.getRecordedAt() != null ? DateTimeFormatter.ISO_INSTANT.format(reading.getRecordedAt()) : null;

        return new ReadingDto(
                assetId,
                assetCode,
                isoTime,
                Math.round(reading.getOilTemperature() * 10.0) / 10.0,
                Math.round(reading.getWindingTemperature() * 10.0) / 10.0,
                Math.round(reading.getLoadPercentage() * 10.0) / 10.0,
                Math.round(reading.getHydrogenPpm() * 10.0) / 10.0,
                reading.getHealthScore(),
                reading.getStatus(),
                scenario
        );
    }

    public Long getAssetId() {
        return assetId;
    }

    public void setAssetId(Long assetId) {
        this.assetId = assetId;
    }

    public String getAssetCode() {
        return assetCode;
    }

    public void setAssetCode(String assetCode) {
        this.assetCode = assetCode;
    }

    public String getTimestamp() {
        return timestamp;
    }

    public void setTimestamp(String timestamp) {
        this.timestamp = timestamp;
    }

    public double getOilTemperature() {
        return oilTemperature;
    }

    public void setOilTemperature(double oilTemperature) {
        this.oilTemperature = oilTemperature;
    }

    public double getWindingTemperature() {
        return windingTemperature;
    }

    public void setWindingTemperature(double windingTemperature) {
        this.windingTemperature = windingTemperature;
    }

    public double getLoadPercentage() {
        return loadPercentage;
    }

    public void setLoadPercentage(double loadPercentage) {
        this.loadPercentage = loadPercentage;
    }

    public double getHydrogenPpm() {
        return hydrogenPpm;
    }

    public void setHydrogenPpm(double hydrogenPpm) {
        this.hydrogenPpm = hydrogenPpm;
    }

    public int getHealthScore() {
        return healthScore;
    }

    public void setHealthScore(int healthScore) {
        this.healthScore = healthScore;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }

    public String getScenario() {
        return scenario;
    }

    public void setScenario(String scenario) {
        this.scenario = scenario;
    }
}
