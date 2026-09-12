package com.legalmetrology.dto;

import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class ManualAssignmentRequest {
    @NotNull
    private String applicationId;

    @NotNull
    private String assigneeId;
}
