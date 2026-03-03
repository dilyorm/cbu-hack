package com.bankasset.dto;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class EmployeeResponse {
    private Long id;
    private String firstName;
    private String lastName;
    private String fullName;
    private String employeeCode;
    private String email;
    private String phone;
    private String position;
    private String departmentName;
    private Long departmentId;
    private Boolean active;
}
