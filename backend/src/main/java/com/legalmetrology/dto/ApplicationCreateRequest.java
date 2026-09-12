package com.legalmetrology.dto;

import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class ApplicationCreateRequest {
    @NotNull
    private String instrumentId;

    @NotNull
    private com.legalmetrology.enums.ApplicationType type;
}
