package com.transynq.controller;

import com.transynq.dto.ReadingDto;
import com.transynq.entity.Alert;
import com.transynq.entity.Reading;
import com.transynq.repository.AlertRepository;
import com.transynq.repository.AssetRepository;
import com.transynq.repository.ReadingRepository;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.Positive;
import org.springframework.http.HttpStatus;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.List;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/assets/{id}")
@Validated
public class HistoryController {

    private final AssetRepository assetRepository;
    private final ReadingRepository readingRepository;
    private final AlertRepository alertRepository;

    public HistoryController(AssetRepository assetRepository,
                             ReadingRepository readingRepository,
                             AlertRepository alertRepository) {
        this.assetRepository = assetRepository;
        this.readingRepository = readingRepository;
        this.alertRepository = alertRepository;
    }

    @GetMapping("/history")
    public List<ReadingDto> getHistory(
            @PathVariable @Positive(message = "Asset ID must be positive") Long id,
            @RequestParam(defaultValue = "60") @Min(value = 1, message = "Minutes must be at least 1")
            @Max(value = 10080, message = "Minutes cannot exceed 10080 (7 days)") int minutes) {
        if (!assetRepository.existsById(id)) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Asset not found: " + id);
        }

        Instant cutoff = Instant.now().minus(minutes, ChronoUnit.MINUTES);

        List<Reading> readings = readingRepository.findByAssetIdAndRecordedAtAfterOrderByRecordedAtDesc(id, cutoff);
        return readings.stream()
                .map(ReadingDto::fromReading)
                .collect(Collectors.toList());
    }

    @GetMapping("/alerts")
    public List<Alert> getAlerts(
            @PathVariable @Positive(message = "Asset ID must be positive") Long id,
            @RequestParam(required = false, defaultValue = "false") boolean activeOnly) {
        if (!assetRepository.existsById(id)) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Asset not found: " + id);
        }

        if (activeOnly) {
            return alertRepository.findByAssetIdAndResolvedAtIsNullOrderByRecordedAtDesc(id);
        }
        return alertRepository.findByAssetIdOrderByRecordedAtDesc(id);
    }
}
