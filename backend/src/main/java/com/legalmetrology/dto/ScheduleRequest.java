package com.legalmetrology.dto;

import com.fasterxml.jackson.databind.annotation.JsonDeserialize;
import com.legalmetrology.config.FlexibleDateTimeDeserializer;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.time.LocalDateTime;

@Data
public class ScheduleRequest {
    @NotNull(message = "scheduledAt is required")
    @JsonDeserialize(using = FlexibleDateTimeDeserializer.class)
    private LocalDateTime scheduledAt;

    private String location;
}
