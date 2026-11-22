package com.transynq;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.transynq.controller.AssetController;
import com.transynq.dto.ScenarioRequest;
import com.transynq.entity.Asset;
import com.transynq.entity.Reading;
import com.transynq.exception.GlobalExceptionHandler;
import com.transynq.repository.AssetRepository;
import com.transynq.repository.ReadingRepository;
import com.transynq.service.ScenarioSecurityService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

import java.time.Instant;
import java.util.List;
import java.util.Optional;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@ExtendWith(MockitoExtension.class)
@DisplayName("Asset Controller - MockMvc API Tests")
class AssetControllerTest {

    private MockMvc mockMvc;
    private ObjectMapper objectMapper;

    @Mock
    private AssetRepository assetRepository;

    @Mock
    private ReadingRepository readingRepository;

    private ScenarioSecurityService scenarioSecurityService;

    @BeforeEach
    void setUp() {
        objectMapper = new ObjectMapper();
        scenarioSecurityService = new ScenarioSecurityService();
        AssetController controller = new AssetController(assetRepository, readingRepository, scenarioSecurityService);
        mockMvc = MockMvcBuilders.standaloneSetup(controller)
                .setControllerAdvice(new GlobalExceptionHandler())
                .build();
    }

    @Test
    @DisplayName("TC-API-01: GET /api/assets returns 200 OK with registered electrical asset list")
    void testListAssets_Returns200WithAssets() throws Exception {
        Asset tr101 = new Asset("TR-101", "Main Power Transformer", "Substation A", "NORMAL", "HEALTHY");
        tr101.setId(1L);

        when(assetRepository.findAll()).thenReturn(List.of(tr101));

        mockMvc.perform(get("/api/assets"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].code").value("TR-101"))
                .andExpect(jsonPath("$[0].status").value("HEALTHY"));
    }

    @Test
    @DisplayName("TC-API-02: GET /api/assets/{id} returns 200 OK for existing asset")
    void testGetAssetById_ValidId_Returns200() throws Exception {
        Asset tr101 = new Asset("TR-101", "Main Power Transformer", "Substation A", "NORMAL", "HEALTHY");
        tr101.setId(1L);

        when(assetRepository.findById(1L)).thenReturn(Optional.of(tr101));

        mockMvc.perform(get("/api/assets/1"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code").value("TR-101"));
    }

    @Test
    @DisplayName("TC-API-03: GET /api/assets/{id} returns 404 Not Found when ID does not exist")
    void testGetAssetById_NonExistent_Returns404() throws Exception {
        when(assetRepository.findById(999L)).thenReturn(Optional.empty());

        mockMvc.perform(get("/api/assets/999"))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.status").value(404));
    }

    @Test
    @DisplayName("TC-API-04: GET /api/assets/{id}/latest returns 200 OK with recent telemetry snapshot")
    void testGetLatestReading_Returns200WithReading() throws Exception {
        Asset tr101 = new Asset("TR-101", "Main Power Transformer", "Substation A", "NORMAL", "HEALTHY");
        tr101.setId(1L);

        Reading reading = new Reading(tr101, Instant.now(), 62.5, 74.0, 70.0, 32.0, 100, "HEALTHY");

        when(assetRepository.existsById(1L)).thenReturn(true);
        when(readingRepository.findFirstByAssetIdOrderByRecordedAtDesc(1L)).thenReturn(Optional.of(reading));

        mockMvc.perform(get("/api/assets/1/latest"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.assetCode").value("TR-101"))
                .andExpect(jsonPath("$.oilTemperature").value(62.5))
                .andExpect(jsonPath("$.status").value("HEALTHY"));
    }

    @Test
    @DisplayName("TC-API-05: POST /api/assets/{id}/scenario with valid payload updates scenario and returns 200")
    void testUpdateScenario_ValidScenario_Returns200() throws Exception {
        Asset tr101 = new Asset("TR-101", "Main Power Transformer", "Substation A", "NORMAL", "HEALTHY");
        tr101.setId(1L);

        Asset updated = new Asset("TR-101", "Main Power Transformer", "Substation A", "OVERHEATING", "HEALTHY");
        updated.setId(1L);

        when(assetRepository.findById(1L)).thenReturn(Optional.of(tr101));
        when(assetRepository.save(any(Asset.class))).thenReturn(updated);

        ScenarioRequest req = new ScenarioRequest("OVERHEATING");

        mockMvc.perform(post("/api/assets/1/scenario")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.scenario").value("OVERHEATING"));
    }

    @Test
    @DisplayName("TC-API-06: POST /api/assets/{id}/scenario with invalid scenario returns 400 Bad Request")
    void testUpdateScenario_InvalidScenario_Returns400() throws Exception {
        ScenarioRequest invalid = new ScenarioRequest("MALICIOUS_INPUT");

        mockMvc.perform(post("/api/assets/1/scenario")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(invalid)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.status").value(400))
                .andExpect(jsonPath("$.error").value("Bad Request"));
    }
}
