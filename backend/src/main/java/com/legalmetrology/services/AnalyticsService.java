package com.legalmetrology.services;

import com.legalmetrology.dto.AnalyticsTrends;
import com.legalmetrology.dto.DashboardKPIs;
import com.legalmetrology.dto.DashboardKPIs.RecentActivity;
import com.legalmetrology.entities.Business;
import com.legalmetrology.entities.Certificate;
import com.legalmetrology.entities.Establishment;
import com.legalmetrology.entities.Inspection;
import com.legalmetrology.entities.Instrument;
import com.legalmetrology.entities.User;
import com.legalmetrology.enums.*;
import com.legalmetrology.repositories.*;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.YearMonth;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
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
    private final EstablishmentRepository establishmentRepository;
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

    /**
     * Every figure on the business dashboard is scoped to the caller's own business.
     * Instruments are owned by establishments, which are owned by businesses, so the
     * ownership chain is user -&gt; business -&gt; establishment -&gt; instrument. This resolves
     * the same way GET /api/instruments/my does, so the counts and the instrument list
     * can never disagree. A user with no business sees zeros, never another tenant's data.
     */
    private void buildBusinessKPIs(User user, DashboardKPIs.DashboardKPIsBuilder builder) {
        Business business = user.getBusiness();

        List<Instrument> myInstruments = new ArrayList<>();
        List<com.legalmetrology.entities.Application> myApps = List.of();
        List<Certificate> myCertificates = List.of();
        List<Inspection> myInspections = List.of();

        if (business != null) {
            for (Establishment establishment : establishmentRepository.findByBusinessId(business.getId())) {
                myInstruments.addAll(instrumentRepository.findByEstablishmentId(establishment.getId()));
            }
            myApps = applicationRepository.findByApplicantId(user.getId());
            myCertificates = certificateRepository.findByBusinessId(business.getId());
            myInspections = inspectionRepository.findByBusinessId(business.getId());
        }

        long totalInstruments = myInstruments.size();
        long verifiedInstruments = myInstruments.stream()
                .filter(i -> i.getStatus() == InstrumentStatus.VERIFIED)
                .count();
        long expiredInstruments = myInstruments.stream()
                .filter(i -> i.getStatus() == InstrumentStatus.EXPIRED)
                .count();

        long pendingApps = myApps.stream()
                .filter(a -> a.getStatus() == ApplicationStatus.SUBMITTED
                        || a.getStatus() == ApplicationStatus.UNDER_REVIEW
                        || a.getStatus() == ApplicationStatus.ASSIGNMENT_PENDING
                        || a.getStatus() == ApplicationStatus.ASSIGNED
                        || a.getStatus() == ApplicationStatus.SCHEDULED)
                .count();

        LocalDate today = LocalDate.now();
        LocalDate oneMonthFromNow = today.plusMonths(1);
        long expiringSoon = myCertificates.stream()
                .filter(c -> c.getStatus() == CertificateStatus.VALID)
                .filter(c -> c.getValidUntil().isAfter(today) && c.getValidUntil().isBefore(oneMonthFromNow))
                .count();

        long failedInspections = myInspections.stream()
                .filter(i -> i.getResult() == InspectionResult.FAIL)
                .count();

        double compliance = totalInstruments > 0 ? (verifiedInstruments * 100.0 / totalInstruments) : 0;

        builder.totalInstruments(totalInstruments)
                .verifiedInstruments(verifiedInstruments)
                .pendingApplications(pendingApps)
                .expiringSoon(expiringSoon)
                .expiredInstruments(expiredInstruments)
                .failedInspections(failedInspections)
                .compliancePercentage(Math.round(compliance * 100.0) / 100.0);

        List<RecentActivity> activities = new ArrayList<>();
        myApps.stream()
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

        List<com.legalmetrology.entities.Appointment> myAppointments = appointmentRepository.findByAssignmentAssigneeId(user.getId());
        LocalDateTime now = LocalDateTime.now();
        long completed = myAppointments.stream()
                .filter(a -> a.getStatus() == AppointmentStatus.COMPLETED)
                .count();
        if (completed == 0) {
            completed = myInspections.stream()
                    .filter(i -> i.getResult() == InspectionResult.PASS || i.getResult() == InspectionResult.FAIL)
                    .count();
        }
        long failed = myInspections.stream()
                .filter(i -> i.getResult() == InspectionResult.FAIL)
                .count();
        long pending = myAppointments.stream()
                .filter(a -> a.getStatus() == AppointmentStatus.SCHEDULED)
                .count();

        long todayInspections = myAppointments.stream()
                .filter(a -> a.getScheduledAt() != null && a.getScheduledAt().toLocalDate().equals(LocalDate.now()))
                .filter(a -> a.getStatus() == AppointmentStatus.SCHEDULED)
                .count();
        long overdue = myAppointments.stream()
                .filter(a -> a.getScheduledAt() != null && a.getScheduledAt().isBefore(now))
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

    /** Chart data for the admin analytics page. */
    public AnalyticsTrends getTrends() {
        YearMonth now = YearMonth.now();
        Map<YearMonth, Long> verificationsByMonth = certificateRepository.findAll().stream()
                .filter(c -> c.getVerificationDate() != null)
                .collect(Collectors.groupingBy(
                        c -> YearMonth.from(c.getVerificationDate()),
                        LinkedHashMap::new,
                        Collectors.counting()));

        List<AnalyticsTrends.MonthlyCount> monthly = new ArrayList<>();
        for (int i = 5; i >= 0; i--) {
            YearMonth month = now.minusMonths(i);
            monthly.add(AnalyticsTrends.MonthlyCount.builder()
                    .month(month.format(DateTimeFormatter.ofPattern("MMM uuuu")))
                    .count(verificationsByMonth.getOrDefault(month, 0L))
                    .build());
        }

        return AnalyticsTrends.builder()
                .monthlyVerifications(monthly)
                .applicationStatuses(countBy(
                        applicationRepository.findAll().stream()
                                .map(a -> a.getStatus() == null ? "UNKNOWN" : a.getStatus().name())
                                .toList()))
                .instrumentStatuses(countBy(
                        instrumentRepository.findAll().stream()
                                .map(i -> i.getStatus() == null ? "UNKNOWN" : i.getStatus().name())
                                .toList()))
                .jurisdictionDistribution(countBy(
                        instrumentRepository.findAll().stream()
                                .map(i -> i.getEstablishment() != null
                                        && i.getEstablishment().getJurisdiction() != null
                                        && i.getEstablishment().getJurisdiction().getName() != null
                                        ? i.getEstablishment().getJurisdiction().getName()
                                        : "Unassigned")
                                .toList()))
                .build();
    }

    private List<AnalyticsTrends.NameCount> countBy(List<String> values) {
        return values.stream()
                .collect(Collectors.groupingBy(v -> v, LinkedHashMap::new, Collectors.counting()))
                .entrySet().stream()
                .map(e -> AnalyticsTrends.NameCount.builder().name(e.getKey()).count(e.getValue()).build())
                .toList();
    }
}
