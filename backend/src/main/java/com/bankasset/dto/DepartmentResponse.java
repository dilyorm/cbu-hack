package com.bankasset.dto;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class DepartmentResponse {
    private Long id;
    private String name;
    private String code;
    private String branchName;
    private Long branchId;
}
