package com.bankasset.dto;

import lombok.Data;
import java.math.BigDecimal;
import java.time.LocalDate;

@Data
public class AssetUpdateRequest {
    private String name;
    private String description;
    private String type;
    private Long categoryId;
    private LocalDate purchaseDate;
    private BigDecimal purchaseCost;
    private LocalDate warrantyExpiryDate;
    private String notes;
}
