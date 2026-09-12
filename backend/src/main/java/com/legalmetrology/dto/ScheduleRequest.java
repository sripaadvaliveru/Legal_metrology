package com.legalmetrology.dto;

import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.time.LocalDateTime;

@Data
public class ScheduleRequest {
    @NotNull
    private LocalDateTime scheduledAt;

    private String location;
}
