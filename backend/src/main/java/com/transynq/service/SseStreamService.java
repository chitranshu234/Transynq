package com.transynq.service;

import com.transynq.dto.ReadingDto;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

import java.io.IOException;
import java.util.List;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.CopyOnWriteArrayList;

@Service
public class SseStreamService {

    private static final Logger log = LoggerFactory.getLogger(SseStreamService.class);

    private final Map<Long, CopyOnWriteArrayList<SseEmitter>> emitters = new ConcurrentHashMap<>();

    public void addEmitter(Long assetId, SseEmitter emitter) {
        emitters.computeIfAbsent(assetId, k -> new CopyOnWriteArrayList<>()).add(emitter);
        log.info("SSE emitter registered for assetId={}. Total active: {}",
                assetId, emitters.get(assetId).size());

        emitter.onCompletion(() -> removeEmitter(assetId, emitter));
        emitter.onTimeout(() -> removeEmitter(assetId, emitter));
        emitter.onError(e -> removeEmitter(assetId, emitter));
    }

    public void removeEmitter(Long assetId, SseEmitter emitter) {
        List<SseEmitter> list = emitters.get(assetId);
        if (list != null) {
            list.remove(emitter);
            if (list.isEmpty()) {
                emitters.remove(assetId);
            }
        }
    }

    public void broadcast(Long assetId, ReadingDto dto) {
        List<SseEmitter> list = emitters.get(assetId);
        if (list == null || list.isEmpty()) {
            return;
        }

        for (SseEmitter emitter : list) {
            try {
                emitter.send(SseEmitter.event()
                        .name("reading")
                        .data(dto));
            } catch (IOException | IllegalStateException ex) {
                log.debug("Failed to send SSE to emitter for assetId={}, removing dead client", assetId);
                removeEmitter(assetId, emitter);
            }
        }
    }
}
