package com.bankasset.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class EmployeeRequest {
    @NotBlank(message = "First name is required")
    private String firstName;

    @NotBlank(message = "Last name is required")
    private String lastName;

    @NotBlank(message = "Employee code is required")
    private String employeeCode;

    private String email;
    private String phone;
    private String position;
    private Long departmentId;
}
