package com.bankasset.dto;

import lombok.Builder;
import lombok.Data;
import java.util.List;

@Data
@Builder
public class AiCategoryRecommendation {
    private String recommendedCategory;
    private String recommendedType;
    private double confidence;
    private List<String> alternativeCategories;
    private String reasoning;
}
