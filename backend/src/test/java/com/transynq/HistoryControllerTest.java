package com.transynq;

import com.transynq.controller.HistoryController;
import com.transynq.entity.Alert;
import com.transynq.entity.Asset;
import com.transynq.entity.Reading;
import com.transynq.exception.GlobalExceptionHandler;
import com.transynq.repository.AlertRepository;
import com.transynq.repository.AssetRepository;
import com.transynq.repository.ReadingRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

import java.time.Instant;
import java.util.List;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@ExtendWith(MockitoExtension.class)
@DisplayName("History Controller - MockMvc API Tests")
class HistoryControllerTest {

    private MockMvc mockMvc;

    @Mock
    private AssetRepository assetRepository;

    @Mock
    private ReadingRepository readingRepository;

    @Mock
    private AlertRepository alertRepository;

    private Asset testAsset;

    @BeforeEach
    void setUp() {
        HistoryController controller = new HistoryController(assetRepository, readingRepository, alertRepository);
        mockMvc = MockMvcBuilders.standaloneSetup(controller)
                .setControllerAdvice(new GlobalExceptionHandler())
                .build();

        testAsset = new Asset("TR-101", "Main Power Transformer", "Substation A", "NORMAL", "HEALTHY");
        testAsset.setId(1L);
    }

    @Test
    @DisplayName("TC-HIST-01: GET /api/assets/{id}/history returns 200 with historical reading records")
    void testGetHistory_ValidAsset_ReturnsReadings() throws Exception {
        when(assetRepository.existsById(1L)).thenReturn(true);

        Reading r1 = new Reading(testAsset, Instant.now().minusSeconds(10), 61.0, 73.0, 69.0, 31.0, 100, "HEALTHY");
        when(readingRepository.findByAssetIdAndRecordedAtAfterOrderByRecordedAtDesc(eq(1L), any(Instant.class)))
                .thenReturn(List.of(r1));

        mockMvc.perform(get("/api/assets/1/history?minutes=15"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].oilTemperature").value(61.0))
                .andExpect(jsonPath("$[0].status").value("HEALTHY"));
    }

    @Test
    @DisplayName("TC-HIST-02: GET /api/assets/{id}/history returns 404 when asset does not exist")
    void testGetHistory_NonExistentAsset_Returns404() throws Exception {
        when(assetRepository.existsById(999L)).thenReturn(false);

        mockMvc.perform(get("/api/assets/999/history"))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.status").value(404));
    }

    @Test
    @DisplayName("TC-HIST-03: GET /api/assets/{id}/alerts returns 200 with recorded alert event list")
    void testGetAlerts_ReturnsAlertList() throws Exception {
        when(assetRepository.existsById(1L)).thenReturn(true);

        Alert alert = new Alert(testAsset, Instant.now().minusSeconds(60), "oilTemperature", "WARNING", "Oil temp high");
        alert.setId(10L);

        when(alertRepository.findByAssetIdOrderByRecordedAtDesc(1L)).thenReturn(List.of(alert));

        mockMvc.perform(get("/api/assets/1/alerts"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].severity").value("WARNING"))
                .andExpect(jsonPath("$[0].parameter").value("oilTemperature"));
    }
}
