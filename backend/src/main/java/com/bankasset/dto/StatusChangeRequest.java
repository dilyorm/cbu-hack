package com.bankasset.dto;

import com.bankasset.enums.AssetStatus;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class StatusChangeRequest {
    @NotNull(message = "New status is required")
    private AssetStatus newStatus;

    @NotBlank(message = "Changed by is required")
    private String changedBy;

    private String reason;
}
