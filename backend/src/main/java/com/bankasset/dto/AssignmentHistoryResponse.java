package com.bankasset.dto;

import lombok.Builder;
import lombok.Data;
import java.time.LocalDateTime;

@Data
@Builder
public class AssignmentHistoryResponse {
    private Long id;
    private Long assetId;
    private String assetName;
    private String assetSerialNumber;
    private String employeeName;
    private Long employeeId;
    private String departmentName;
    private String branchName;
    private LocalDateTime assignedAt;
    private LocalDateTime returnedAt;
    private String assignedBy;
    private String returnNotes;
    private Boolean active;
}
