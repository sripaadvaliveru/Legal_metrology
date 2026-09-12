package com.legalmetrology.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class ReassignRequest {
    @NotBlank
    private String newAssigneeId;

    @NotBlank
    private String reason;
}
