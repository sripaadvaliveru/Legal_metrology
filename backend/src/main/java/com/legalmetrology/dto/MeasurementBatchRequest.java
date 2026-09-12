package com.legalmetrology.dto;

import lombok.Data;

import java.util.List;

@Data
public class MeasurementBatchRequest {
    private String checklistId;
    private List<MeasurementItem> readings;

    @Data
    public static class MeasurementItem {
        private String parameter;
        private String observedValue;
        private String tolerance;
        private Boolean withinTolerance;
    }
}
