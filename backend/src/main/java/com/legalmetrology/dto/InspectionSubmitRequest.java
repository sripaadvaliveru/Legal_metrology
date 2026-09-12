package com.legalmetrology.dto;

import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class InspectionSubmitRequest {
    @NotNull
    private com.legalmetrology.enums.InspectionResult result;

    private String remarks;
}
