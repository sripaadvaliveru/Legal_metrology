package com.legalmetrology.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class DashboardKPIs {
    private long totalInstruments;
    private long verifiedInstruments;
    private long pendingApplications;
    private long expiringSoon;
    private long expiredInstruments;
    private long failedInspections;
    private double compliancePercentage;

    private long totalBusinesses;
    private long totalLmos;
    private long totalCertificates;
    private long completedApplications;
    private long todayInspections;
    private long assignedInspections;
    private long overdueInspections;
    private long pendingTests;
    private long todayAppointments;
    private long completedTests;
    private long failedTests;

    private List<RecentActivity> recentActivity;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class RecentActivity {
        private String id;
        private String type;
        private String description;
        private String timestamp;
        private String status;
    }
}
