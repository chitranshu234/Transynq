package com.transynq.service;

import jakarta.servlet.http.HttpServletRequest;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.ConcurrentLinkedDeque;

@Service
public class ScenarioSecurityService {

    private static final Logger log = LoggerFactory.getLogger(ScenarioSecurityService.class);

    @Value("${transynq.security.scenario-api-key:}")
    private String configuredApiKey;

    // In-memory sliding window rate limiter: max 10 requests per 10 seconds per client IP
    private static final int MAX_REQUESTS_PER_WINDOW = 10;
    private static final long WINDOW_MS = 10_000L;
    private final Map<String, ConcurrentLinkedDeque<Long>> requestLogByIp = new ConcurrentHashMap<>();

    public void validateScenarioAccess(HttpServletRequest request) {
        String clientIp = extractClientIp(request);

        // 1. Rate Limiting Check
        enforceRateLimit(clientIp);

        // 2. API Key Authentication Check (if configured)
        if (configuredApiKey != null && !configuredApiKey.trim().isEmpty()) {
            String apiKeyHeader = request.getHeader("X-API-KEY");
            String authHeader = request.getHeader("Authorization");

            boolean isValid = false;
            if (apiKeyHeader != null && apiKeyHeader.trim().equals(configuredApiKey.trim())) {
                isValid = true;
            } else if (authHeader != null && authHeader.startsWith("Bearer ")) {
                String bearerToken = authHeader.substring(7).trim();
                if (bearerToken.equals(configuredApiKey.trim())) {
                    isValid = true;
                }
            }

            if (!isValid) {
                log.warn("[SECURITY AUDIT] Unauthorized attempt to modify asset scenario from IP: {}", clientIp);
                throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Invalid or missing Scenario API Key");
            }

            log.info("[SECURITY AUDIT] Authenticated operator modified scenario from IP: {}", clientIp);
        } else {
            log.debug("[SECURITY AUDIT] Scenario modified without key (API key not enforced in current profile) from IP: {}", clientIp);
        }
    }

    private void enforceRateLimit(String clientIp) {
        long now = System.currentTimeMillis();
        ConcurrentLinkedDeque<Long> timestamps = requestLogByIp.computeIfAbsent(clientIp, k -> new ConcurrentLinkedDeque<>());

        // Purge timestamps older than window
        while (!timestamps.isEmpty() && now - timestamps.peekFirst() > WINDOW_MS) {
            timestamps.pollFirst();
        }

        if (timestamps.size() >= MAX_REQUESTS_PER_WINDOW) {
            log.warn("[SECURITY AUDIT] Rate limit exceeded for IP: {} on scenario mutation endpoint", clientIp);
            throw new ResponseStatusException(HttpStatus.TOO_MANY_REQUESTS, "Rate limit exceeded. Maximum 10 scenario changes per 10 seconds.");
        }

        timestamps.addLast(now);
    }

    private String extractClientIp(HttpServletRequest request) {
        String xForwardedFor = request.getHeader("X-Forwarded-For");
        if (xForwardedFor != null && !xForwardedFor.isEmpty()) {
            return xForwardedFor.split(",")[0].trim();
        }
        return request.getRemoteAddr() != null ? request.getRemoteAddr() : "unknown";
    }
}
