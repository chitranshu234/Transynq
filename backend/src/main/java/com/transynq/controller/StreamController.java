package com.transynq.controller;

import com.transynq.dto.ReadingDto;
import com.transynq.entity.Reading;
import com.transynq.repository.AssetRepository;
import com.transynq.repository.ReadingRepository;
import com.transynq.service.SseStreamService;
import jakarta.validation.constraints.Positive;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

import java.io.IOException;
import java.util.Optional;

@RestController
@RequestMapping("/api/assets/{id}")
@Validated
public class StreamController {

    private static final Logger log = LoggerFactory.getLogger(StreamController.class);

    private final AssetRepository assetRepository;
    private final ReadingRepository readingRepository;
    private final SseStreamService sseStreamService;

    public StreamController(AssetRepository assetRepository,
                            ReadingRepository readingRepository,
                            SseStreamService sseStreamService) {
        this.assetRepository = assetRepository;
        this.readingRepository = readingRepository;
        this.sseStreamService = sseStreamService;
    }

    @GetMapping(value = "/stream", produces = MediaType.TEXT_EVENT_STREAM_VALUE)
    public SseEmitter streamAssetReadings(@PathVariable @Positive(message = "Asset ID must be positive") Long id) {
        if (!assetRepository.existsById(id)) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Asset not found: " + id);
        }

        // Infinite timeout for persistent real-time streaming
        SseEmitter emitter = new SseEmitter(0L);
        sseStreamService.addEmitter(id, emitter);

        // Send immediate snapshot if a previous reading exists
        Optional<Reading> latest = readingRepository.findFirstByAssetIdOrderByRecordedAtDesc(id);
        if (latest.isPresent()) {
            try {
                emitter.send(SseEmitter.event()
                        .name("reading")
                        .data(ReadingDto.fromReading(latest.get())));
            } catch (IOException e) {
                log.debug("Error sending initial snapshot to SSE client for assetId={}: {}", id, e.getMessage());
                sseStreamService.removeEmitter(id, emitter);
            }
        }

        return emitter;
    }
}
