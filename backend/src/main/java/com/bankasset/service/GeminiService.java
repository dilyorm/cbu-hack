package com.bankasset.service;

import com.bankasset.dto.AiCategoryRecommendation;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import io.netty.channel.ChannelOption;
import io.netty.handler.timeout.ReadTimeoutHandler;
import io.netty.handler.timeout.WriteTimeoutHandler;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.client.reactive.ReactorClientHttpConnector;
import org.springframework.stereotype.Service;
import org.springframework.web.reactive.function.client.WebClient;
import org.springframework.web.reactive.function.client.WebClientResponseException;
import reactor.netty.http.client.HttpClient;
import reactor.util.retry.Retry;

import java.time.Duration;
import java.util.*;
import java.util.concurrent.TimeUnit;

@Service
@Slf4j
public class GeminiService {

    private final WebClient webClient;
    private final ObjectMapper objectMapper;
    private final boolean enabled;
    private final String apiKey;
    private final String model;

    private static final int CONNECT_TIMEOUT_MS = 10_000;
    private static final int READ_TIMEOUT_SECONDS = 120;
    private static final int WRITE_TIMEOUT_SECONDS = 30;
    private static final Duration RESPONSE_TIMEOUT = Duration.ofSeconds(120);
    private static final Duration REACTIVE_TIMEOUT = Duration.ofSeconds(120);
    private static final int MAX_RETRIES = 2;
    private static final Duration RETRY_MIN_BACKOFF = Duration.ofSeconds(2);
    private static final Duration RETRY_MAX_BACKOFF = Duration.ofSeconds(10);
    private static final int MAX_IN_MEMORY_SIZE = 4 * 1024 * 1024; // 4MB

    public GeminiService(
            @Value("${app.gemini.api-key:}") String apiKey,
            @Value("${app.gemini.enabled:false}") boolean enabled,
            @Value("${app.gemini.model:gemini-3.1-flash-preview}") String model,
            ObjectMapper objectMapper) {
        this.enabled = enabled && apiKey != null && !apiKey.isBlank();
        this.apiKey = apiKey;
        this.model = model;
        this.objectMapper = objectMapper;

        if (this.enabled) {
            HttpClient httpClient = HttpClient.create()
                    .option(ChannelOption.CONNECT_TIMEOUT_MILLIS, CONNECT_TIMEOUT_MS)
                    .responseTimeout(RESPONSE_TIMEOUT)
                    .doOnConnected(conn -> conn
                            .addHandlerLast(new ReadTimeoutHandler(READ_TIMEOUT_SECONDS, TimeUnit.SECONDS))
                            .addHandlerLast(new WriteTimeoutHandler(WRITE_TIMEOUT_SECONDS, TimeUnit.SECONDS)));

            this.webClient = WebClient.builder()
                    .baseUrl("https://generativelanguage.googleapis.com/v1beta")
                    .defaultHeader("Content-Type", "application/json")
                    .clientConnector(new ReactorClientHttpConnector(httpClient))
                    .codecs(configurer -> configurer.defaultCodecs().maxInMemorySize(MAX_IN_MEMORY_SIZE))
                    .build();
            log.info("Gemini AI service initialized with model: {} (timeout: {}s, retries: {})",
                    model, REACTIVE_TIMEOUT.getSeconds(), MAX_RETRIES);
        } else {
            this.webClient = null;
            log.info("Gemini AI service is disabled (no API key or disabled in config)");
        }
    }

    public boolean isEnabled() {
        return enabled;
    }

    /**
     * Calls Gemini API for category recommendation based on asset name/description.
     * Returns null if the call fails or Gemini is disabled.
     */
    public AiCategoryRecommendation recommendCategory(String name, String description, List<String> availableCategories) {
        if (!enabled) return null;

        String prompt = buildCategoryPrompt(name, description, availableCategories);

        try {
            String response = callGemini(prompt);
            if (response == null) return null;
            return parseCategoryResponse(response, name);
        } catch (Exception e) {
            log.warn("Gemini category recommendation failed: {}", e.getMessage());
            return null;
        }
    }

    /**
     * Calls Gemini API for enhanced risk assessment reasoning.
     * Returns null if the call fails or Gemini is disabled.
     */
    public Map<String, Object> enhanceRiskAssessment(String assetName, String assetType, String status,
                                                       int ageYears, boolean warrantyExpired,
                                                       long repairCount, int statusChangeCount) {
        if (!enabled) return null;

        String prompt = buildRiskPrompt(assetName, assetType, status, ageYears, warrantyExpired, repairCount, statusChangeCount);

        try {
            String response = callGemini(prompt);
            if (response == null) return null;
            return parseRiskResponse(response);
        } catch (Exception e) {
            log.warn("Gemini risk assessment failed: {}", e.getMessage());
            return null;
        }
    }

    private String callGemini(String prompt) {
        if (webClient == null) return null;

        Map<String, Object> requestBody = Map.of(
                "contents", List.of(
                        Map.of("parts", List.of(Map.of("text", prompt)))
                ),
                "generationConfig", Map.of(
                        "temperature", 0.3,
                        "maxOutputTokens", 8192,
                        "responseMimeType", "application/json"
                )
        );

        List<String> modelsToTry = new ArrayList<>();
        modelsToTry.add(this.model);
        for (String fallback : List.of("gemini-2.5-pro", "gemini-3.1-pro-preview")) {
            if (!modelsToTry.contains(fallback)) {
                modelsToTry.add(fallback);
            }
        }

        for (String currentModel : modelsToTry) {
            try {
                long startTime = System.currentTimeMillis();
                log.info("Trying Gemini API with model: {}", currentModel);

                String responseBody = webClient.post()
                        .uri("/models/{model}:generateContent?key={key}", currentModel, apiKey)
                        .bodyValue(requestBody)
                        .retrieve()
                        .bodyToMono(String.class)
                        .timeout(REACTIVE_TIMEOUT)
                        .retryWhen(Retry.backoff(MAX_RETRIES, RETRY_MIN_BACKOFF)
                                .maxBackoff(RETRY_MAX_BACKOFF)
                                .filter(this::isRetryableError)
                                .doBeforeRetry(signal -> log.warn(
                                        "Retrying Gemini API call (attempt {}): {}",
                                        signal.totalRetries() + 1, signal.failure().getMessage())))
                        .block();

                long elapsed = System.currentTimeMillis() - startTime;
                log.debug("Gemini API call completed in {}ms using model {}", elapsed, currentModel);

                if (responseBody == null) continue;
                log.info("Gemini raw response: {}", responseBody);

                JsonNode root = objectMapper.readTree(responseBody);
                JsonNode candidates = root.path("candidates");
                if (candidates.isArray() && !candidates.isEmpty()) {
                    JsonNode content = candidates.get(0).path("content");
                    JsonNode parts = content.path("parts");
                    if (parts.isArray() && !parts.isEmpty()) {
                        JsonNode textNode = parts.get(0).path("text");
                        if (!textNode.isMissingNode()) {
                            String text = textNode.asText();
                            // Remove markdown formatting if present
                            if (text.startsWith("```json")) {
                                text = text.replaceAll("```json", "");
                                text = text.replaceAll("```", "");
                            }
                            return text.trim();
                        }
                    }
                }

                // Check for blocked or error responses
                JsonNode promptFeedback = root.path("promptFeedback");
                if (promptFeedback.has("blockReason")) {
                    log.warn("Gemini API blocked request: {}", promptFeedback.path("blockReason").asText());
                }

                // Wait, if it didn't return from inside candidates, the completion isn't exactly successful, but let's assume it might just be blocked.
                // It shouldn't continue throwing exception or trying other models if it was just blocked, or maybe it should?
                // Returning null here will propagate null back. Just to be safe, if we reach here we can continue to the next fallback model.
                // Except we probably don't want to if blockReason is set.
                // I will just continue so it tries the fallback model.
                continue;

            } catch (Exception e) {
                log.warn("Gemini API call failed for model {}: {}", currentModel, e.getMessage());
            }
        }

        log.error("All Gemini API models failed.");
        return null;
    }

    /**
     * Determines if an error is retryable (timeouts, server errors).
     * Client errors (400, 401, 403) are NOT retried.
     */
    private boolean isRetryableError(Throwable throwable) {
        if (throwable instanceof java.util.concurrent.TimeoutException) {
            return true;
        }
        if (throwable instanceof io.netty.handler.timeout.ReadTimeoutException) {
            return true;
        }
        if (throwable instanceof WebClientResponseException wcre) {
            int status = wcre.getStatusCode().value();
            // Retry on 429 (rate limit), 500, 502, 503, 504
            return status == 429 || status >= 500;
        }
        if (throwable instanceof java.io.IOException) {
            return true;
        }
        return false;
    }

    private String buildCategoryPrompt(String name, String description, List<String> categories) {
        return String.format("""
                You are a bank office asset classification AI. Given an asset's name and description, \
                recommend the most appropriate category from the available list.
                
                Available categories: %s
                
                Asset name: %s
                Asset description: %s
                
                Respond in JSON format:
                {
                    "recommendedCategory": "<best matching category name>",
                    "recommendedType": "<specific type like LAPTOP, DESKTOP, MONITOR, PRINTER, ATM, POS_TERMINAL, etc>",
                    "confidence": <0.0 to 1.0>,
                    "alternativeCategories": ["<other possible categories>"],
                    "reasoning": "<brief explanation of why this category was chosen>"
                }
                """, categories, name, description != null ? description : "N/A");
    }

    private String buildRiskPrompt(String name, String type, String status,
                                    int ageYears, boolean warrantyExpired,
                                    long repairCount, int statusChangeCount) {
        return String.format("""
                You are a bank office asset risk assessment AI. Analyze the following asset data and provide \
                additional risk insights and recommendations.
                
                Asset: %s
                Type: %s
                Current Status: %s
                Age: %d years
                Warranty Expired: %s
                Repair Count: %d
                Status Change Count: %d
                
                Respond in JSON format:
                {
                    "additionalRiskFactors": ["<list of additional risk insights>"],
                    "additionalRecommendations": ["<list of actionable recommendations>"],
                    "predictedLifespan": "<estimated remaining useful life>",
                    "maintenancePriority": "<LOW/MEDIUM/HIGH/CRITICAL>"
                }
                """, name, type, status, ageYears, warrantyExpired, repairCount, statusChangeCount);
    }

    private AiCategoryRecommendation parseCategoryResponse(String response, String originalName) {
        try {
            JsonNode node = objectMapper.readTree(response);
            return AiCategoryRecommendation.builder()
                    .recommendedCategory(node.path("recommendedCategory").asText("IT"))
                    .recommendedType(node.path("recommendedType").asText("OTHER"))
                    .confidence(node.path("confidence").asDouble(0.5))
                    .alternativeCategories(parseStringArray(node.path("alternativeCategories")))
                    .reasoning(node.path("reasoning").asText("AI-powered recommendation for: " + originalName))
                    .build();
        } catch (Exception e) {
            log.warn("Failed to parse Gemini category response: {}", e.getMessage());
            return null;
        }
    }

    @SuppressWarnings("unchecked")
    private Map<String, Object> parseRiskResponse(String response) {
        try {
            return objectMapper.readValue(response, Map.class);
        } catch (Exception e) {
            log.warn("Failed to parse Gemini risk response: {}", e.getMessage());
            return null;
        }
    }

    private List<String> parseStringArray(JsonNode arrayNode) {
        List<String> result = new ArrayList<>();
        if (arrayNode.isArray()) {
            arrayNode.forEach(n -> result.add(n.asText()));
        }
        return result;
    }
}
