package com.bankasset.controller;

import com.bankasset.dto.AiCategoryRecommendation;
import com.bankasset.dto.AiRiskAssessment;
import com.bankasset.service.AiService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/ai")
@RequiredArgsConstructor
public class AiController {

    private final AiService aiService;

    @GetMapping("/recommend-category")
    public ResponseEntity<AiCategoryRecommendation> recommendCategory(
            @RequestParam String name,
            @RequestParam(required = false) String description) {
        return ResponseEntity.ok(aiService.recommendCategory(name, description));
    }

    @GetMapping("/risk/{assetId}")
    public ResponseEntity<AiRiskAssessment> assessRisk(@PathVariable Long assetId) {
        return ResponseEntity.ok(aiService.assessRisk(assetId));
    }

    @GetMapping("/risks")
    public ResponseEntity<List<AiRiskAssessment>> assessAllRisks() {
        return ResponseEntity.ok(aiService.assessAllRisks());
    }

    @GetMapping("/high-risk")
    public ResponseEntity<List<AiRiskAssessment>> getHighRiskAssets() {
        return ResponseEntity.ok(aiService.getHighRiskAssets());
    }
}
