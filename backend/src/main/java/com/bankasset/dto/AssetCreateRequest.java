package com.bankasset.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;
import java.math.BigDecimal;
import java.time.LocalDate;

@Data
public class AssetCreateRequest {
    @NotBlank(message = "Asset name is required")
    private String name;

    private String description;

    @NotBlank(message = "Serial number is required")
    private String serialNumber;

    @NotBlank(message = "Asset type is required")
    private String type;

    @NotNull(message = "Category ID is required")
    private Long categoryId;

    private LocalDate purchaseDate;
    private BigDecimal purchaseCost;
    private LocalDate warrantyExpiryDate;
    private String notes;
}
