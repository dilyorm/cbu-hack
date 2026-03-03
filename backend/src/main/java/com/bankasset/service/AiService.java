package com.bankasset.service;

import com.bankasset.dto.AiCategoryRecommendation;
import com.bankasset.dto.AiRiskAssessment;
import com.bankasset.enums.AssetStatus;
import com.bankasset.model.Asset;
import com.bankasset.model.AssetCategory;
import com.bankasset.model.AssetStatusHistory;
import com.bankasset.repository.AssetCategoryRepository;
import com.bankasset.repository.AssetRepository;
import com.bankasset.repository.AssetStatusHistoryRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.temporal.ChronoUnit;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class AiService {

    private final AssetRepository assetRepository;
    private final AssetCategoryRepository categoryRepository;
    private final AssetStatusHistoryRepository statusHistoryRepository;
    private final GeminiService geminiService;

    /**
     * Recommends a category using Gemini LLM with rule-based fallback.
     */
    public AiCategoryRecommendation recommendCategory(String name, String description) {
        // Try Gemini first
        if (geminiService.isEnabled()) {
            List<String> categoryNames = categoryRepository.findAll().stream()
                    .map(AssetCategory::getName)
                    .toList();

            AiCategoryRecommendation geminiResult = geminiService.recommendCategory(name, description, categoryNames);
            if (geminiResult != null) {
                log.info("Category recommendation from Gemini AI for '{}': {}", name, geminiResult.getRecommendedCategory());
                return geminiResult;
            }
            log.warn("Gemini failed, falling back to rule-based recommendation for '{}'", name);
        }

        // Fallback: rule-based keyword matching
        return ruleBasedCategoryRecommendation(name, description);
    }

    /**
     * Assesses failure risk for an asset, enhanced with Gemini insights when available.
     */
    public AiRiskAssessment assessRisk(Long assetId) {
        Asset asset = assetRepository.findById(assetId)
                .orElseThrow(() -> new RuntimeException("Asset not found"));

        List<AssetStatusHistory> history = statusHistoryRepository.findByAssetIdOrderByChangedAtDesc(assetId);
        List<String> riskFactors = new ArrayList<>();
        List<String> recommendations = new ArrayList<>();
        double riskScore = 0;

        // Factor 1: Age of asset
        int ageYears = 0;
        if (asset.getPurchaseDate() != null) {
            ageYears = (int) ChronoUnit.YEARS.between(asset.getPurchaseDate(), LocalDate.now());
            if (ageYears > 7) {
                riskScore += 0.3;
                riskFactors.add("Asset is " + ageYears + " years old (>7 years)");
                recommendations.add("Consider replacing this aging asset");
            } else if (ageYears > 5) {
                riskScore += 0.15;
                riskFactors.add("Asset is " + ageYears + " years old (>5 years)");
                recommendations.add("Schedule preventive maintenance");
            }
        }

        // Factor 2: Warranty status
        boolean warrantyExpired = asset.isWarrantyExpired();
        if (warrantyExpired) {
            riskScore += 0.15;
            riskFactors.add("Warranty has expired");
            recommendations.add("Renew warranty or budget for potential replacement");
        }

        // Factor 3: Repair history
        long repairCount = history.stream()
                .filter(h -> h.getNewStatus() == AssetStatus.IN_REPAIR).count();
        if (repairCount >= 3) {
            riskScore += 0.3;
            riskFactors.add("Has been sent for repair " + repairCount + " times");
            recommendations.add("Frequent repairs indicate systemic issues - consider write-off");
        } else if (repairCount >= 1) {
            riskScore += 0.1;
            riskFactors.add("Has been sent for repair " + repairCount + " time(s)");
        }

        // Factor 4: Status change frequency
        if (history.size() > 10) {
            riskScore += 0.1;
            riskFactors.add("High number of status changes (" + history.size() + ")");
            recommendations.add("Review asset usage pattern");
        }

        // Factor 5: Recent repair
        boolean recentRepair = history.stream()
                .anyMatch(h -> h.getNewStatus() == AssetStatus.IN_REPAIR &&
                        h.getChangedAt().isAfter(LocalDateTime.now().minusMonths(3)));
        if (recentRepair) {
            riskScore += 0.15;
            riskFactors.add("Was in repair within the last 3 months");
            recommendations.add("Monitor closely for recurring issues");
        }

        // Try to enhance with Gemini AI
        if (geminiService.isEnabled()) {
            try {
                Map<String, Object> geminiInsights = geminiService.enhanceRiskAssessment(
                        asset.getName(), asset.getType(), asset.getStatus().name(),
                        ageYears, warrantyExpired, repairCount, history.size());

                if (geminiInsights != null) {
                    @SuppressWarnings("unchecked")
                    List<String> additionalFactors = (List<String>) geminiInsights.get("additionalRiskFactors");
                    if (additionalFactors != null) {
                        riskFactors.addAll(additionalFactors);
                    }
                    @SuppressWarnings("unchecked")
                    List<String> additionalRecs = (List<String>) geminiInsights.get("additionalRecommendations");
                    if (additionalRecs != null) {
                        recommendations.addAll(additionalRecs);
                    }
                    log.info("Enhanced risk assessment with Gemini AI for asset {}", assetId);
                }
            } catch (Exception e) {
                log.warn("Gemini risk enhancement failed for asset {}: {}", assetId, e.getMessage());
            }
        }

        // Determine risk level
        String riskLevel;
        if (riskScore >= 0.7) riskLevel = "CRITICAL";
        else if (riskScore >= 0.5) riskLevel = "HIGH";
        else if (riskScore >= 0.25) riskLevel = "MEDIUM";
        else riskLevel = "LOW";

        if (riskFactors.isEmpty()) {
            riskFactors.add("No significant risk factors detected");
            recommendations.add("Continue regular maintenance schedule");
        }

        return AiRiskAssessment.builder()
                .assetId(assetId)
                .assetName(asset.getName())
                .riskLevel(riskLevel)
                .failureProbability(Math.min(riskScore, 0.95))
                .riskFactors(riskFactors)
                .recommendations(recommendations)
                .build();
    }

    /**
     * Batch risk assessment for all active assets.
     */
    public List<AiRiskAssessment> assessAllRisks() {
        List<Asset> activeAssets = assetRepository.findAll().stream()
                .filter(a -> a.getStatus() != AssetStatus.WRITTEN_OFF)
                .toList();

        return activeAssets.stream()
                .map(asset -> assessRisk(asset.getId()))
                .sorted((a, b) -> Double.compare(b.getFailureProbability(), a.getFailureProbability()))
                .toList();
    }

    /**
     * Get high-risk assets that need attention.
     */
    public List<AiRiskAssessment> getHighRiskAssets() {
        return assessAllRisks().stream()
                .filter(r -> r.getRiskLevel().equals("HIGH") || r.getRiskLevel().equals("CRITICAL"))
                .toList();
    }

    // ===== Rule-based fallback =====

    private AiCategoryRecommendation ruleBasedCategoryRecommendation(String name, String description) {
        String text = (name + " " + (description != null ? description : "")).toLowerCase();

        Map<String, List<String>> categoryKeywords = new LinkedHashMap<>();
        categoryKeywords.put("IT", List.of("laptop", "desktop", "computer", "server", "notebook",
                "workstation", "pc", "mac", "dell", "hp", "lenovo", "thinkpad", "cpu", "ram", "ssd", "hdd",
                "router", "switch", "firewall", "network", "ethernet", "wifi", "modem", "access point"));
        categoryKeywords.put("Peripherals", List.of("monitor", "display", "screen", "printer",
                "scanner", "keyboard", "mouse", "webcam", "headset", "speaker", "projector", "usb",
                "docking station", "hub"));
        categoryKeywords.put("Communication", List.of("phone", "telephone", "intercom", "voip",
                "radio", "walkie", "conference", "cisco", "polycom"));
        categoryKeywords.put("Security", List.of("camera", "cctv", "surveillance", "alarm",
                "access control", "badge", "card reader", "biometric", "safe", "vault", "lock"));
        categoryKeywords.put("Banking Equipment", List.of("atm", "pos", "terminal", "cash counter",
                "cash register", "money counter", "bill counter", "check scanner", "card terminal",
                "payment terminal", "teller"));
        categoryKeywords.put("Office", List.of("desk", "chair", "table", "cabinet", "shelf",
                "whiteboard", "filing", "shredder", "laminator", "copier", "fax", "stapler",
                "furniture", "lamp", "air conditioner", "fan"));

        String bestCategory = "IT";
        double bestScore = 0;
        List<String> alternatives = new ArrayList<>();

        for (Map.Entry<String, List<String>> entry : categoryKeywords.entrySet()) {
            long matchCount = entry.getValue().stream().filter(text::contains).count();
            double score = (double) matchCount / entry.getValue().size();

            if (score > bestScore) {
                if (bestScore > 0) alternatives.add(bestCategory);
                bestScore = score;
                bestCategory = entry.getKey();
            } else if (score > 0) {
                alternatives.add(entry.getKey());
            }
        }

        String recommendedType = determineType(text);

        return AiCategoryRecommendation.builder()
                .recommendedCategory(bestCategory)
                .recommendedType(recommendedType)
                .confidence(Math.min(bestScore * 3, 0.95))
                .alternativeCategories(alternatives)
                .reasoning("Rule-based keyword analysis of: " + name)
                .build();
    }

    private String determineType(String text) {
        Map<String, List<String>> typeKeywords = new LinkedHashMap<>();
        typeKeywords.put("LAPTOP", List.of("laptop", "notebook", "thinkpad", "macbook"));
        typeKeywords.put("DESKTOP", List.of("desktop", "pc", "workstation", "imac"));
        typeKeywords.put("SERVER", List.of("server", "rack"));
        typeKeywords.put("MONITOR", List.of("monitor", "display", "screen"));
        typeKeywords.put("PRINTER", List.of("printer", "laser", "inkjet"));
        typeKeywords.put("SCANNER", List.of("scanner"));
        typeKeywords.put("PHONE", List.of("phone", "telephone", "voip"));
        typeKeywords.put("ROUTER", List.of("router", "gateway"));
        typeKeywords.put("SWITCH", List.of("switch", "network switch"));
        typeKeywords.put("ATM", List.of("atm"));
        typeKeywords.put("POS_TERMINAL", List.of("pos", "payment terminal"));
        typeKeywords.put("CAMERA", List.of("camera", "cctv", "webcam"));
        typeKeywords.put("UPS", List.of("ups", "battery backup", "uninterruptible"));

        for (Map.Entry<String, List<String>> entry : typeKeywords.entrySet()) {
            if (entry.getValue().stream().anyMatch(text::contains)) {
                return entry.getKey();
            }
        }
        return "OTHER";
    }
}
