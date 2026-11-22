package com.transynq.service;

import com.transynq.entity.Alert;
import com.transynq.entity.Asset;
import com.transynq.repository.AlertRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.Map;
import java.util.Optional;
import java.util.concurrent.ConcurrentHashMap;

@Service
public class AlertService {

    private static final Logger log = LoggerFactory.getLogger(AlertService.class);

    private final AlertRepository alertRepository;

    // In-memory cache for fast transition detection: Key = "assetId:parameter" -> Value = "HEALTHY" / "WARNING" / "CRITICAL"
    private final Map<String, String> lastKnownParamStatus = new ConcurrentHashMap<>();

    public AlertService(AlertRepository alertRepository) {
        this.alertRepository = alertRepository;
    }

    @Transactional
    public void checkAndCreateAlerts(Asset asset, Map<String, String> currentParamStatuses) {
        if (asset == null || asset.getId() == null || currentParamStatuses == null) {
            return;
        }

        Long assetId = asset.getId();
        Instant now = Instant.now();

        for (Map.Entry<String, String> entry : currentParamStatuses.entrySet()) {
            String parameter = entry.getKey();
            String currentStatus = entry.getValue(); // "HEALTHY", "WARNING", "CRITICAL"

            String cacheKey = assetId + ":" + parameter;
            String previousStatus = lastKnownParamStatus.get(cacheKey);

            // If we don't have it in memory yet, check DB for an active (unresolved) alert
            if (previousStatus == null) {
                Optional<Alert> existingActive = alertRepository
                        .findFirstByAssetIdAndParameterAndResolvedAtIsNullOrderByRecordedAtDesc(assetId, parameter);
                previousStatus = existingActive.map(Alert::getSeverity).orElse("HEALTHY");
                lastKnownParamStatus.put(cacheKey, previousStatus);
            }

            // Only act if there is a transition!
            if (!currentStatus.equals(previousStatus)) {
                log.info("Transition detected for asset {} parameter {}: {} -> {}",
                        asset.getCode(), parameter, previousStatus, currentStatus);

                if ("HEALTHY".equals(currentStatus)) {
                    // Recovered to normal: resolve active alert
                    resolveActiveAlert(assetId, parameter, now);
                } else if ("WARNING".equals(currentStatus)) {
                    // Transition to WARNING (from HEALTHY or CRITICAL)
                    resolveActiveAlert(assetId, parameter, now);
                    String message = String.format("%s on %s has exceeded warning threshold.",
                            formatParamName(parameter), asset.getCode());
                    Alert alert = new Alert(asset, now, parameter, "WARNING", message);
                    alertRepository.save(alert);
                } else if ("CRITICAL".equals(currentStatus)) {
                    // Transition to CRITICAL (from HEALTHY or WARNING)
                    resolveActiveAlert(assetId, parameter, now);
                    String message = String.format("CRITICAL: %s on %s has breached safety limit!",
                            formatParamName(parameter), asset.getCode());
                    Alert alert = new Alert(asset, now, parameter, "CRITICAL", message);
                    alertRepository.save(alert);
                }

                lastKnownParamStatus.put(cacheKey, currentStatus);
            }
        }
    }

    private void resolveActiveAlert(Long assetId, String parameter, Instant resolvedAt) {
        Optional<Alert> activeAlert = alertRepository
                .findFirstByAssetIdAndParameterAndResolvedAtIsNullOrderByRecordedAtDesc(assetId, parameter);
        if (activeAlert.isPresent()) {
            Alert alert = activeAlert.get();
            alert.setResolvedAt(resolvedAt);
            alertRepository.save(alert);
            log.info("Resolved alert id={} for assetId={} parameter={}", alert.getId(), assetId, parameter);
        }
    }

    private String formatParamName(String param) {
        return switch (param) {
            case "oilTemperature" -> "Top Oil Temperature";
            case "windingTemperature" -> "Winding Temperature";
            case "loadPercentage" -> "Load Factor";
            case "hydrogenPpm" -> "Dissolved Hydrogen";
            default -> param;
        };
    }
}
