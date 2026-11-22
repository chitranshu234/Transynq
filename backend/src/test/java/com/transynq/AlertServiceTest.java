package com.transynq;

import com.transynq.entity.Alert;
import com.transynq.entity.Asset;
import com.transynq.repository.AlertRepository;
import com.transynq.service.AlertService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.Instant;
import java.util.HashMap;
import java.util.Map;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@DisplayName("Alert Service - Unit Tests (State Transitions & Deduplication)")
class AlertServiceTest {

    @Mock
    private AlertRepository alertRepository;

    private AlertService alertService;
    private Asset testAsset;

    @BeforeEach
    void setUp() {
        alertService = new AlertService(alertRepository);
        testAsset = new Asset("TR-101", "Main Power Transformer", "Substation A", "NORMAL", "HEALTHY");
        testAsset.setId(1L);
    }

    @Test
    @DisplayName("TC-AS-01: Generates WARNING alert when parameter breaches warning threshold")
    void testAlertCreation_WhenThresholdBreached() {
        when(alertRepository.findFirstByAssetIdAndParameterAndResolvedAtIsNullOrderByRecordedAtDesc(1L, "oilTemperature"))
                .thenReturn(Optional.empty());

        Map<String, String> statuses = Map.of("oilTemperature", "WARNING");
        alertService.checkAndCreateAlerts(testAsset, statuses);

        ArgumentCaptor<Alert> captor = ArgumentCaptor.forClass(Alert.class);
        verify(alertRepository, times(1)).save(captor.capture());

        Alert savedAlert = captor.getValue();
        assertEquals("WARNING", savedAlert.getSeverity());
        assertEquals("oilTemperature", savedAlert.getParameter());
        assertTrue(savedAlert.getMessage().contains("exceeded warning threshold"));
        assertNull(savedAlert.getResolvedAt());
    }

    @Test
    @DisplayName("TC-AS-02: Prevents duplicate alerts on consecutive 3-second ticks when status remains unchanged")
    void testNoDuplicateAlerts_WhenStatusUnchanged() {
        when(alertRepository.findFirstByAssetIdAndParameterAndResolvedAtIsNullOrderByRecordedAtDesc(1L, "oilTemperature"))
                .thenReturn(Optional.empty());

        Map<String, String> tick1 = Map.of("oilTemperature", "WARNING");
        alertService.checkAndCreateAlerts(testAsset, tick1);

        // Verification after tick 1: exactly 1 alert saved
        verify(alertRepository, times(1)).save(any(Alert.class));

        // Tick 2 (3 seconds later) - condition still WARNING
        Map<String, String> tick2 = Map.of("oilTemperature", "WARNING");
        alertService.checkAndCreateAlerts(testAsset, tick2);

        // Still exactly 1 save call - duplicate was suppressed by transition detection
        verify(alertRepository, times(1)).save(any(Alert.class));
    }

    @Test
    @DisplayName("TC-AS-03: Escalates WARNING to CRITICAL, resolving prior warning and creating new critical alert")
    void testSeverityEscalation_WarningToCritical() {
        when(alertRepository.findFirstByAssetIdAndParameterAndResolvedAtIsNullOrderByRecordedAtDesc(1L, "oilTemperature"))
                .thenReturn(Optional.empty());

        // Step 1: Initial Warning
        Map<String, String> tick1 = Map.of("oilTemperature", "WARNING");
        alertService.checkAndCreateAlerts(testAsset, tick1);

        Alert warningAlert = new Alert(testAsset, Instant.now().minusSeconds(10), "oilTemperature", "WARNING", "Warning message");
        warningAlert.setId(101L);

        // Step 2: Now escalate to CRITICAL
        when(alertRepository.findFirstByAssetIdAndParameterAndResolvedAtIsNullOrderByRecordedAtDesc(1L, "oilTemperature"))
                .thenReturn(Optional.of(warningAlert));

        Map<String, String> tick2 = Map.of("oilTemperature", "CRITICAL");
        alertService.checkAndCreateAlerts(testAsset, tick2);

        // Prior warning alert must be resolved with timestamp
        assertNotNull(warningAlert.getResolvedAt());

        // Critical alert must be created
        ArgumentCaptor<Alert> captor = ArgumentCaptor.forClass(Alert.class);
        verify(alertRepository, atLeast(2)).save(captor.capture());

        Alert lastSaved = captor.getValue();
        assertEquals("CRITICAL", lastSaved.getSeverity());
        assertTrue(lastSaved.getMessage().contains("CRITICAL:"));
    }

    @Test
    @DisplayName("TC-AS-04: Resolves open active alert when parameter returns to normal")
    void testAlertResolution_WhenConditionsNormalize() {
        Alert activeAlert = new Alert(testAsset, Instant.now().minusSeconds(30), "hydrogenPpm", "CRITICAL", "High gas");
        activeAlert.setId(201L);
        assertNull(activeAlert.getResolvedAt());

        when(alertRepository.findFirstByAssetIdAndParameterAndResolvedAtIsNullOrderByRecordedAtDesc(1L, "hydrogenPpm"))
                .thenReturn(Optional.of(activeAlert));

        // Initial state set in cache via DB lookup
        Map<String, String> tick1 = Map.of("hydrogenPpm", "CRITICAL");
        alertService.checkAndCreateAlerts(testAsset, tick1);

        // Normalize state to HEALTHY
        Map<String, String> tick2 = Map.of("hydrogenPpm", "HEALTHY");
        alertService.checkAndCreateAlerts(testAsset, tick2);

        // Active alert must now have resolvedAt timestamp populated
        assertNotNull(activeAlert.getResolvedAt());
        verify(alertRepository, atLeastOnce()).save(activeAlert);
    }

    @Test
    @DisplayName("TC-AS-05: Handles null asset or empty statuses gracefully without exceptions")
    void testNullOrEmptyHandling_DoesNotThrow() {
        assertDoesNotThrow(() -> alertService.checkAndCreateAlerts(null, Map.of()));
        assertDoesNotThrow(() -> alertService.checkAndCreateAlerts(new Asset(), null));
        verify(alertRepository, never()).save(any());
    }
}
