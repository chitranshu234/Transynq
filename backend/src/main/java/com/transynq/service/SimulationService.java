package com.transynq.service;

import com.transynq.dto.ReadingDto;
import com.transynq.entity.Asset;
import com.transynq.entity.Reading;
import com.transynq.repository.AssetRepository;
import com.transynq.repository.ReadingRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.List;
import java.util.Map;
import java.util.Random;
import java.util.concurrent.ConcurrentHashMap;

@Service
public class SimulationService {

    private static final Logger log = LoggerFactory.getLogger(SimulationService.class);
    private final Random random = new Random();

    private final AssetRepository assetRepository;
    private final ReadingRepository readingRepository;
    private final HealthEvaluationService healthEvaluationService;
    private final AlertService alertService;
    private final SseStreamService sseStreamService;

    // Server-side continuous simulation state per asset
    public static class SimulationState {
        public double oilTemperature = 60.0;
        public double windingTemperature = 72.0;
        public double loadPercentage = 68.0;
        public double hydrogenPpm = 30.0;

        public SimulationState() {}

        public SimulationState(double oilTemp, double windingTemp, double load, double hydrogen) {
            this.oilTemperature = oilTemp;
            this.windingTemperature = windingTemp;
            this.loadPercentage = load;
            this.hydrogenPpm = hydrogen;
        }
    }

    private final Map<Long, SimulationState> assetStates = new ConcurrentHashMap<>();

    public SimulationService(AssetRepository assetRepository,
                             ReadingRepository readingRepository,
                             HealthEvaluationService healthEvaluationService,
                             AlertService alertService,
                             SseStreamService sseStreamService) {
        this.assetRepository = assetRepository;
        this.readingRepository = readingRepository;
        this.healthEvaluationService = healthEvaluationService;
        this.alertService = alertService;
        this.sseStreamService = sseStreamService;
    }

    @Scheduled(fixedRate = 3000)
    @Transactional
    public void runSimulationTick() {
        List<Asset> assets = assetRepository.findAll();
        if (assets.isEmpty()) {
            return;
        }

        Instant now = Instant.now();

        for (Asset asset : assets) {
            SimulationState state = assetStates.computeIfAbsent(asset.getId(), k -> new SimulationState());

            // 1. Advance simulation state based on active server-side scenario
            advanceState(state, asset.getScenario());

            // 2. Evaluate deterministic health rules
            HealthEvaluationService.EvaluationResult eval = healthEvaluationService.evaluate(
                    state.oilTemperature,
                    state.windingTemperature,
                    state.loadPercentage,
                    state.hydrogenPpm
            );

            // 3. Update asset overall status in DB if changed
            if (!eval.getOverallStatus().equals(asset.getStatus())) {
                asset.setStatus(eval.getOverallStatus());
                assetRepository.save(asset);
            }

            // 4. Trigger alert transitions (only saves on status change/breach)
            alertService.checkAndCreateAlerts(asset, eval.getParameterStatuses());

            // 5. Persist reading
            Reading reading = new Reading(
                    asset,
                    now,
                    state.oilTemperature,
                    state.windingTemperature,
                    state.loadPercentage,
                    state.hydrogenPpm,
                    eval.getHealthScore(),
                    eval.getOverallStatus()
            );
            readingRepository.save(reading);

            // 6. Broadcast live telemetry to all connected SSE clients
            ReadingDto dto = ReadingDto.fromReading(reading);
            sseStreamService.broadcast(asset.getId(), dto);
        }
    }

    private void advanceState(SimulationState state, String scenario) {
        String sc = scenario != null ? scenario.toUpperCase() : "NORMAL";

        switch (sc) {
            case "OVERHEATING" -> {
                // Temperatures rise progressively; load increases; hydrogen slightly drifts
                double oilStep = 1.0 + (random.nextDouble() * 1.5); // +1.0 to +2.5 C per tick
                state.oilTemperature = Math.min(102.0, state.oilTemperature + oilStep);

                double windingGradient = 13.0 + (random.nextDouble() * 3.0);
                state.windingTemperature = Math.min(118.0, state.oilTemperature + windingGradient);

                double loadStep = 0.5 + (random.nextDouble() * 1.5); // load rises
                state.loadPercentage = Math.min(99.0, state.loadPercentage + loadStep);

                state.hydrogenPpm = Math.min(150.0, state.hydrogenPpm + (random.nextDouble() * 2.0));
            }
            case "GAS_ANOMALY" -> {
                // Rapid hydrogen accumulation simulating partial discharge / arcing
                double gasStep = 15.0 + (random.nextDouble() * 20.0); // +15 to +35 ppm per tick
                state.hydrogenPpm = Math.min(380.0, state.hydrogenPpm + gasStep);

                // Moderate temperature drift
                state.oilTemperature += (68.0 - state.oilTemperature) * 0.1 + ((random.nextDouble() - 0.5) * 0.8);
                state.windingTemperature = state.oilTemperature + 12.0 + ((random.nextDouble() - 0.5) * 1.5);

                // Load hovers around normal-high
                state.loadPercentage += (74.0 - state.loadPercentage) * 0.1 + ((random.nextDouble() - 0.5) * 1.2);
            }
            default -> {
                // NORMAL: Bounded decay / drift toward stable nominal setpoints
                // Smoothly cools down or vents gas if coming from an anomaly
                state.oilTemperature += (60.0 - state.oilTemperature) * 0.12 + ((random.nextDouble() - 0.5) * 0.6);
                state.windingTemperature = state.oilTemperature + 12.0 + ((random.nextDouble() - 0.5) * 1.2);
                state.loadPercentage += (68.0 - state.loadPercentage) * 0.10 + ((random.nextDouble() - 0.5) * 1.5);
                state.hydrogenPpm += (30.0 - state.hydrogenPpm) * 0.12 + ((random.nextDouble() - 0.5) * 1.8);
            }
        }

        // Physical sanity clamping
        state.oilTemperature = Math.max(30.0, Math.min(105.0, state.oilTemperature));
        state.windingTemperature = Math.max(35.0, Math.min(120.0, state.windingTemperature));
        state.loadPercentage = Math.max(20.0, Math.min(100.0, state.loadPercentage));
        state.hydrogenPpm = Math.max(5.0, Math.min(450.0, state.hydrogenPpm));
    }
}
