package com.transynq.entity;

import jakarta.persistence.*;

@Entity
@Table(name = "assets", indexes = {
    @Index(name = "idx_asset_code", columnList = "code")
})
public class Asset {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true)
    private String code;

    @Column(nullable = false)
    private String name;

    private String location;

    @Column(nullable = false)
    private String scenario = "NORMAL";

    @Column(nullable = false)
    private String status = "HEALTHY";

    public Asset() {}

    public Asset(String code, String name, String location, String scenario, String status) {
        this.code = code;
        this.name = name;
        this.location = location;
        this.scenario = scenario != null ? scenario : "NORMAL";
        this.status = status != null ? status : "HEALTHY";
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getCode() {
        return code;
    }

    public void setCode(String code) {
        this.code = code;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public String getLocation() {
        return location;
    }

    public void setLocation(String location) {
        this.location = location;
    }

    public String getScenario() {
        return scenario;
    }

    public void setScenario(String scenario) {
        this.scenario = scenario;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }
}
