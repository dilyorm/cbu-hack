package com.bankasset.service;

import com.bankasset.dto.AiCategoryRecommendation;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.reactive.function.client.WebClient;

import java.time.Duration;
import java.util.*;

@Service
@Slf4j
public class GeminiService {

    private final WebClient webClient;
    private final ObjectMapper objectMapper;
    private final boolean enabled;
    private final String apiKey;
    private final String model;

    public GeminiService(
            @Value("${app.gemini.api-key:}") String apiKey,
            @Value("${app.gemini.enabled:false}") boolean enabled,
            @Value("${app.gemini.model:gemini-2.0-flash}") String model,
            ObjectMapper objectMapper) {
        this.enabled = enabled && apiKey != null && !apiKey.isBlank();
        this.apiKey = apiKey;
        this.model = model;
        this.objectMapper = objectMapper;

        if (this.enabled) {
            this.webClient = WebClient.builder()
                    .baseUrl("https://generativelanguage.googleapis.com/v1beta")
                    .defaultHeader("Content-Type", "application/json")
                    .build();
            log.info("Gemini AI service initialized with model: {}", model);
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
                        "maxOutputTokens", 1024,
                        "responseMimeType", "application/json"
                )
        );

        try {
            String responseBody = webClient.post()
                    .uri("/models/{model}:generateContent?key={key}", model, apiKey)
                    .bodyValue(requestBody)
                    .retrieve()
                    .bodyToMono(String.class)
                    .timeout(Duration.ofSeconds(15))
                    .block();

            if (responseBody == null) return null;

            JsonNode root = objectMapper.readTree(responseBody);
            JsonNode candidates = root.path("candidates");
            if (candidates.isArray() && !candidates.isEmpty()) {
                return candidates.get(0).path("content").path("parts").get(0).path("text").asText();
            }
            return null;
        } catch (Exception e) {
            log.warn("Gemini API call failed: {}", e.getMessage());
            return null;
        }
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
