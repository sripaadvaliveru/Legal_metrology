package com.legalmetrology.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

/** Data behind the admin analytics charts. */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AnalyticsTrends {

    private List<MonthlyCount> monthlyVerifications;
    private List<NameCount> applicationStatuses;
    private List<NameCount> instrumentStatuses;
    private List<NameCount> jurisdictionDistribution;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class MonthlyCount {
        private String month;
        private long count;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class NameCount {
        private String name;
        private long count;
    }
}
