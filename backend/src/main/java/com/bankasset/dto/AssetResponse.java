package com.bankasset.dto;

import com.bankasset.enums.AssetStatus;
import lombok.Builder;
import lombok.Data;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Data
@Builder
public class AssetResponse {
    private Long id;
    private String name;
    private String description;
    private String serialNumber;
    private String type;
    private String categoryName;
    private Long categoryId;
    private AssetStatus status;
    private LocalDate purchaseDate;
    private BigDecimal purchaseCost;
    private LocalDate warrantyExpiryDate;
    private boolean warrantyExpired;
    private String imagePath;
    private String notes;
    private EmployeeResponse currentEmployee;
    private DepartmentResponse currentDepartment;
    private BranchResponse currentBranch;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
