package com.transynq.entity;

import jakarta.persistence.*;
import java.time.Instant;

@Entity
@Table(
    name = "readings",
    indexes = {
        @Index(name = "idx_reading_asset_recorded", columnList = "asset_id, recorded_at")
    }
)
public class Reading {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "asset_id", nullable = false)
    private Asset asset;

    @Column(name = "recorded_at", nullable = false)
    private Instant recordedAt;

    @Column(name = "oil_temp_c", nullable = false)
    private double oilTemperature;

    @Column(name = "winding_temp_c", nullable = false)
    private double windingTemperature;

    @Column(name = "load_pct", nullable = false)
    private double loadPercentage;

    @Column(name = "hydrogen_ppm", nullable = false)
    private double hydrogenPpm;

    @Column(name = "health_score", nullable = false)
    private int healthScore;

    @Column(nullable = false)
    private String status;

    public Reading() {}

    public Reading(Asset asset, Instant recordedAt, double oilTemperature, double windingTemperature,
                   double loadPercentage, double hydrogenPpm, int healthScore, String status) {
        this.asset = asset;
        this.recordedAt = recordedAt;
        this.oilTemperature = oilTemperature;
        this.windingTemperature = windingTemperature;
        this.loadPercentage = loadPercentage;
        this.hydrogenPpm = hydrogenPpm;
        this.healthScore = healthScore;
        this.status = status;
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public Asset getAsset() {
        return asset;
    }

    public void setAsset(Asset asset) {
        this.asset = asset;
    }

    public Instant getRecordedAt() {
        return recordedAt;
    }

    public void setRecordedAt(Instant recordedAt) {
        this.recordedAt = recordedAt;
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
}
