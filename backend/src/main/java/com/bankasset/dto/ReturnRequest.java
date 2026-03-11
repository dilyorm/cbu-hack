package com.bankasset.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class ReturnRequest {
    @NotBlank(message = "Returned by is required")
    private String returnedBy;

    private String returnNotes;
}
