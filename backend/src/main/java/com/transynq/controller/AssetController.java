package com.transynq.controller;

import com.transynq.dto.ReadingDto;
import com.transynq.dto.ScenarioRequest;
import com.transynq.entity.Asset;
import com.transynq.repository.AssetRepository;
import com.transynq.repository.ReadingRepository;
import jakarta.validation.Valid;
import jakarta.validation.constraints.Positive;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;

@RestController
@RequestMapping("/api/assets")
@Validated
public class AssetController {

    private final AssetRepository assetRepository;
    private final ReadingRepository readingRepository;

    public AssetController(AssetRepository assetRepository, ReadingRepository readingRepository) {
        this.assetRepository = assetRepository;
        this.readingRepository = readingRepository;
    }

    @GetMapping
    public List<Asset> listAssets() {
        return assetRepository.findAll();
    }

    @GetMapping("/{id}")
    public ResponseEntity<Asset> getAsset(@PathVariable @Positive(message = "Asset ID must be positive") Long id) {
        return assetRepository.findById(id)
                .map(ResponseEntity::ok)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Asset not found: " + id));
    }

    @GetMapping("/{id}/latest")
    public ResponseEntity<ReadingDto> getLatestReading(@PathVariable @Positive(message = "Asset ID must be positive") Long id) {
        if (!assetRepository.existsById(id)) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Asset not found: " + id);
        }

        return readingRepository.findFirstByAssetIdOrderByRecordedAtDesc(id)
                .map(ReadingDto::fromReading)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.noContent().build());
    }

    @PostMapping("/{id}/scenario")
    public ResponseEntity<Asset> updateScenario(
            @PathVariable @Positive(message = "Asset ID must be positive") Long id,
            @Valid @RequestBody ScenarioRequest request) {
        Asset asset = assetRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Asset not found: " + id));

        String scenario = request.getScenario().toUpperCase();
        asset.setScenario(scenario);
        Asset saved = assetRepository.save(asset);
        return ResponseEntity.ok(saved);
    }
}
