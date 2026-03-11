package com.bankasset.dto;

import lombok.Builder;
import lombok.Data;
import java.util.List;

@Data
@Builder
public class AiRiskAssessment {
    private Long assetId;
    private String assetName;
    private String riskLevel; // LOW, MEDIUM, HIGH, CRITICAL
    private double failureProbability;
    private List<String> riskFactors;
    private List<String> recommendations;
}
