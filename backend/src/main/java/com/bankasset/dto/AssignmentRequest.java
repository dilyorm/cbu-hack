package com.bankasset.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class AssignmentRequest {
    private Long employeeId;
    private Long departmentId;
    private Long branchId;

    @NotBlank(message = "Assigned by is required")
    private String assignedBy;
}
