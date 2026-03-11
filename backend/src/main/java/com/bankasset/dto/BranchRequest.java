package com.bankasset.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class BranchRequest {
    @NotBlank(message = "Branch name is required")
    private String name;

    @NotBlank(message = "Branch code is required")
    private String code;

    private String address;
}
