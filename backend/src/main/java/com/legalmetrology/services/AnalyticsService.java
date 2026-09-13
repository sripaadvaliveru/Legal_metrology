package com.legalmetrology.services;

import com.legalmetrology.dto.DashboardKPIs;
import com.legalmetrology.dto.DashboardKPIs.RecentActivity;
import com.legalmetrology.entities.User;
import com.legalmetrology.enums.*;
import com.legalmetrology.repositories.*;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class AnalyticsService {

    private final InstrumentRepository instrumentRepository;
    private final ApplicationRepository applicationRepository;
    private final CertificateRepository certificateRepository;
    private final InspectionRepository inspectionRepository;
    private final AssignmentRepository assignmentRepository;
    private final AppointmentRepository appointmentRepository;
    private final BusinessRepository businessRepository;
    private final UserRepository userRepository;

    public DashboardKPIs getDashboardKPIs(User user) {
        DashboardKPIs.DashboardKPIsBuilder builder = DashboardKPIs.builder();

        switch (user.getRole()) {
            case BUSINESS -> buildBusinessKPIs(user, builder);
            case LMO -> buildLmoKPIs(user, builder);
            case GATC -> buildGatcKPIs(user, builder);
            default -> buildAdminKPIs(builder);
        }

        return builder.build();
    }

    private void buildBusinessKPIs(User user, DashboardKPIs.DashboardKPIsBuilder builder) {
        long totalInstruments = instrumentRepository.count();
        long verifiedInstruments = instrumentRepository.findByStatus(InstrumentStatus.VERIFIED, null).getTotalElements();
        long expiredInstruments = instrumentRepository.findByStatus(InstrumentStatus.EXPIRED, null).getTotalElements();

        List<com.legalmetrology.entities.Application> allApps = applicationRepository.findAll();
        long pendingApps = allApps.stream()
                .filter(a -> a.getStatus() == ApplicationStatus.SUBMITTED
                        || a.getStatus() == ApplicationStatus.UNDER_REVIEW
                        || a.getStatus() == ApplicationStatus.ASSIGNMENT_PENDING
                        || a.getStatus() == ApplicationStatus.ASSIGNED
                        || a.getStatus() == ApplicationStatus.SCHEDULED)
                .count();

        LocalDate today = LocalDate.now();
        LocalDate oneMonthFromNow = today.plusMonths(1);
        long expiringSoon = certificateRepository.findByStatus(CertificateStatus.VALID).stream()
                .filter(c -> c.getValidUntil().isAfter(today) && c.getValidUntil().isBefore(oneMonthFromNow))
                .count();

        long failedInspections = inspectionRepository.findByResult(InspectionResult.FAIL).size();

        double compliance = totalInstruments > 0 ? (verifiedInstruments * 100.0 / totalInstruments) : 0;

        builder.totalInstruments(totalInstruments)
                .verifiedInstruments(verifiedInstruments)
                .pendingApplications(pendingApps)
                .expiringSoon(expiringSoon)
                .expiredInstruments(expiredInstruments)
                .failedInspections(failedInspections)
                .compliancePercentage(Math.round(compliance * 100.0) / 100.0);

        List<RecentActivity> activities = new ArrayList<>();
        allApps.stream()
                .sorted((a, b) -> {
                    LocalDateTime aTime = a.getUpdatedAt() != null ? a.getUpdatedAt() : a.getCreatedAt();
                    LocalDateTime bTime = b.getUpdatedAt() != null ? b.getUpdatedAt() : b.getCreatedAt();
                    if (aTime == null) return 1;
                    if (bTime == null) return -1;
                    return bTime.compareTo(aTime);
                })
                .limit(5)
                .forEach(app -> {
                    String timestamp = app.getCreatedAt() != null
                            ? app.getCreatedAt().format(DateTimeFormatter.ofPattern("MMM dd, yyyy HH:mm"))
                            : "Unknown";
                    activities.add(RecentActivity.builder()
                            .id(app.getId())
                            .type("APPLICATION")
                            .description("Application " + app.getApplicationNumber() + " - " + app.getStatus().name())
                            .timestamp(timestamp)
                            .status(app.getStatus().name())
                            .build());
                });
        builder.recentActivity(activities);
    }

    private void buildLmoKPIs(User user, DashboardKPIs.DashboardKPIsBuilder builder) {
        List<com.legalmetrology.entities.Inspection> myInspections = inspectionRepository.findByInspectorId(user.getId());

        long completed = myInspections.stream()
                .filter(i -> i.getResult() == InspectionResult.PASS || i.getResult() == InspectionResult.FAIL)
                .count();
        long failed = myInspections.stream()
                .filter(i -> i.getResult() == InspectionResult.FAIL)
                .count();
        long pending = myInspections.stream()
                .filter(i -> i.getResult() == InspectionResult.PENDING)
                .count();

        List<com.legalmetrology.entities.Appointment> myAppointments = appointmentRepository.findByAssignmentAssigneeId(user.getId());
        LocalDateTime now = LocalDateTime.now();
        long todayInspections = myAppointments.stream()
                .filter(a -> a.getScheduledAt().toLocalDate().equals(LocalDate.now()))
                .filter(a -> a.getStatus() == AppointmentStatus.SCHEDULED)
                .count();
        long overdue = myAppointments.stream()
                .filter(a -> a.getScheduledAt().isBefore(now))
                .filter(a -> a.getStatus() == AppointmentStatus.SCHEDULED)
                .count();

        builder.todayInspections(todayInspections)
                .assignedInspections(pending)
                .completedApplications(completed)
                .failedInspections(failed)
                .overdueInspections(overdue);

        List<RecentActivity> activities = new ArrayList<>();
        myAppointments.stream()
                .sorted((a, b) -> {
                    LocalDateTime aTime = a.getCreatedAt() != null ? a.getCreatedAt() : LocalDateTime.MIN;
                    LocalDateTime bTime = b.getCreatedAt() != null ? b.getCreatedAt() : LocalDateTime.MIN;
                    return bTime.compareTo(aTime);
                })
                .limit(5)
                .forEach(appt -> {
                    String timestamp = appt.getScheduledAt() != null
                            ? appt.getScheduledAt().format(DateTimeFormatter.ofPattern("MMM dd, yyyy HH:mm"))
                            : "Unknown";
                    activities.add(RecentActivity.builder()
                            .id(appt.getId())
                            .type("INSPECTION")
                            .description("Inspection scheduled at " + appt.getLocation())
                            .timestamp(timestamp)
                            .status(appt.getStatus().name())
                            .build());
                });
        builder.recentActivity(activities);
    }

    private void buildGatcKPIs(User user, DashboardKPIs.DashboardKPIsBuilder builder) {
        List<com.legalmetrology.entities.Appointment> myAppointments = appointmentRepository.findByAssignmentAssigneeId(user.getId());

        long todayAppointments = myAppointments.stream()
                .filter(a -> a.getScheduledAt().toLocalDate().equals(LocalDate.now()))
                .count();
        long completed = myAppointments.stream()
                .filter(a -> a.getStatus() == AppointmentStatus.COMPLETED)
                .count();
        long pending = myAppointments.stream()
                .filter(a -> a.getStatus() == AppointmentStatus.SCHEDULED)
                .count();

        List<com.legalmetrology.entities.Inspection> myInspections = inspectionRepository.findByInspectorId(user.getId());
        long failed = myInspections.stream()
                .filter(i -> i.getResult() == InspectionResult.FAIL)
                .count();

        builder.pendingTests(pending)
                .todayAppointments(todayAppointments)
                .completedTests(completed)
                .failedTests(failed);

        List<RecentActivity> activities = new ArrayList<>();
        myAppointments.stream()
                .sorted((a, b) -> {
                    LocalDateTime aTime = a.getCreatedAt() != null ? a.getCreatedAt() : LocalDateTime.MIN;
                    LocalDateTime bTime = b.getCreatedAt() != null ? b.getCreatedAt() : LocalDateTime.MIN;
                    return bTime.compareTo(aTime);
                })
                .limit(5)
                .forEach(appt -> {
                    String timestamp = appt.getScheduledAt() != null
                            ? appt.getScheduledAt().format(DateTimeFormatter.ofPattern("MMM dd, yyyy HH:mm"))
                            : "Unknown";
                    activities.add(RecentActivity.builder()
                            .id(appt.getId())
                            .type("TEST")
                            .description("Test appointment at " + appt.getLocation())
                            .timestamp(timestamp)
                            .status(appt.getStatus().name())
                            .build());
                });
        builder.recentActivity(activities);
    }

    private void buildAdminKPIs(DashboardKPIs.DashboardKPIsBuilder builder) {
        long totalInstruments = instrumentRepository.count();
        long verifiedInstruments = instrumentRepository.findByStatus(InstrumentStatus.VERIFIED, null).getTotalElements();
        long expiredInstruments = instrumentRepository.findByStatus(InstrumentStatus.EXPIRED, null).getTotalElements();

        List<com.legalmetrology.entities.Application> allApps = applicationRepository.findAll();
        long pendingApps = allApps.stream()
                .filter(a -> a.getStatus() == ApplicationStatus.SUBMITTED
                        || a.getStatus() == ApplicationStatus.UNDER_REVIEW
                        || a.getStatus() == ApplicationStatus.ASSIGNMENT_PENDING)
                .count();
        long completedApps = allApps.stream()
                .filter(a -> a.getStatus() == ApplicationStatus.COMPLETED)
                .count();

        long totalBusinesses = businessRepository.count();
        long totalLmos = userRepository.findAll().stream()
                .filter(u -> u.getRole() == Role.LMO)
                .count();
        long totalCertificates = certificateRepository.count();

        LocalDate today = LocalDate.now();
        LocalDate oneMonthFromNow = today.plusMonths(1);
        long expiringSoon = certificateRepository.findByStatus(CertificateStatus.VALID).stream()
                .filter(c -> c.getValidUntil().isAfter(today) && c.getValidUntil().isBefore(oneMonthFromNow))
                .count();

        long failedInspections = inspectionRepository.findByResult(InspectionResult.FAIL).size();

        double compliance = totalInstruments > 0 ? (verifiedInstruments * 100.0 / totalInstruments) : 0;

        builder.totalInstruments(totalInstruments)
                .verifiedInstruments(verifiedInstruments)
                .pendingApplications(pendingApps)
                .expiringSoon(expiringSoon)
                .expiredInstruments(expiredInstruments)
                .failedInspections(failedInspections)
                .compliancePercentage(Math.round(compliance * 100.0) / 100.0)
                .totalBusinesses(totalBusinesses)
                .totalLmos(totalLmos)
                .totalCertificates(totalCertificates)
                .completedApplications(completedApps);

        List<RecentActivity> activities = new ArrayList<>();
        allApps.stream()
                .sorted((a, b) -> {
                    LocalDateTime aTime = a.getUpdatedAt() != null ? a.getUpdatedAt() : a.getCreatedAt();
                    LocalDateTime bTime = b.getUpdatedAt() != null ? b.getUpdatedAt() : b.getCreatedAt();
                    if (aTime == null) return 1;
                    if (bTime == null) return -1;
                    return bTime.compareTo(aTime);
                })
                .limit(10)
                .forEach(app -> {
                    String timestamp = app.getCreatedAt() != null
                            ? app.getCreatedAt().format(DateTimeFormatter.ofPattern("MMM dd, yyyy HH:mm"))
                            : "Unknown";
                    activities.add(RecentActivity.builder()
                            .id(app.getId())
                            .type("APPLICATION")
                            .description("Application " + app.getApplicationNumber() + " - " + app.getStatus().name())
                            .timestamp(timestamp)
                            .status(app.getStatus().name())
                            .build());
                });
        builder.recentActivity(activities);
    }
}
