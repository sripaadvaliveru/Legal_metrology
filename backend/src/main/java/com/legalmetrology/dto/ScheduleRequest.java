package com.legalmetrology.dto;

import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.time.OffsetDateTime;

@Data
public class ScheduleRequest {
    @NotNull
    private OffsetDateTime scheduledAt;

    private String location;
}
