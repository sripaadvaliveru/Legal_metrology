package com.legalmetrology.services;

import com.legalmetrology.dto.ApplicationCreateRequest;
import com.legalmetrology.dto.ScheduleRequest;
import com.legalmetrology.entities.*;
import com.legalmetrology.enums.ApplicationStatus;
import com.legalmetrology.enums.AppointmentStatus;
import com.legalmetrology.repositories.*;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import jakarta.annotation.PostConstruct;
import java.time.Year;
import java.util.List;
import java.util.concurrent.atomic.AtomicLong;

@Service
@RequiredArgsConstructor
public class ApplicationService {

    private final ApplicationRepository applicationRepository;
    private final InstrumentRepository instrumentRepository;
    private final UserRepository userRepository;
    private final ApplicationStatusHistoryRepository statusHistoryRepository;
    private final AppointmentRepository appointmentRepository;
    private final AssignmentRepository assignmentRepository;
    private final NotificationService notificationService;

    private final AtomicLong APP_COUNTER = new AtomicLong(0);

    @PostConstruct
    public void init() {
        long maxSeq = applicationRepository.findAll().stream()
                .map(Application::getApplicationNumber)
                .filter(id -> id != null && id.startsWith("APP-"))
                .map(id -> {
                    try { return Long.parseLong(id.substring(id.lastIndexOf('-') + 1)); }
                    catch (Exception e) { return 0L; }
                })
                .mapToLong(Long::longValue)
                .max().orElse(0L);
        APP_COUNTER.set(maxSeq + 1);
    }

    @Transactional
    public Application createApplication(ApplicationCreateRequest request, String userEmail) {
        Instrument instrument = instrumentRepository.findById(request.getInstrumentId())
                .orElseThrow(() -> new RuntimeException("Instrument not found"));

        User applicant = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new RuntimeException("User not found"));

        String applicationNumber = String.format("APP-%d-%06d",
                Year.now().getValue(), APP_COUNTER.getAndIncrement());

        Application application = Application.builder()
                .applicationNumber(applicationNumber)
                .instrument(instrument)
                .applicant(applicant)
                .type(request.getType())
                .status(ApplicationStatus.SUBMITTED)
                .build();

        application = applicationRepository.save(application);

        ApplicationStatusHistory history = ApplicationStatusHistory.builder()
                .application(application)
                .status(ApplicationStatus.SUBMITTED)
                .actor(userEmail)
                .build();
        statusHistoryRepository.save(history);

        final Application savedApplication = application;
        try {
            notificationService.createNotificationByEmail(userEmail, "APPLICATION_SUBMITTED",
                    "Your application " + applicationNumber + " has been submitted for verification.",
                    "Application", savedApplication.getId());
            userRepository.findAll().stream()
                    .filter(u -> u.getRole() == com.legalmetrology.enums.Role.SUPER_ADMIN)
                    .forEach(admin -> {
                        try {
                            notificationService.createNotificationByEmail(admin.getEmail(), "NEW_APPLICATION",
                                    "New application " + applicationNumber + " submitted by " + applicant.getName(),
                                    "Application", savedApplication.getId());
                        } catch (Exception ignored) {}
                    });
        } catch (Exception ignored) {}

        return application;
    }

    @Transactional(readOnly = true)
    public List<Application> getApplicationsByUser(String userEmail) {
        User user = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new RuntimeException("User not found"));
        return applicationRepository.findByApplicantId(user.getId());
    }

    @Transactional(readOnly = true)
    public Application getApplicationById(String id) {
        return applicationRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Application not found"));
    }

    @Transactional
    public Application updateStatus(String id, ApplicationStatus newStatus, String actor) {
        Application application = getApplicationById(id);
        ApplicationStatus oldStatus = application.getStatus();
        application.setStatus(newStatus);
        applicationRepository.save(application);

        ApplicationStatusHistory history = ApplicationStatusHistory.builder()
                .application(application)
                .status(newStatus)
                .actor(actor)
                .build();
        statusHistoryRepository.save(history);

        try {
            User businessUser = application.getApplicant();
            String statusLabel = newStatus.name().replaceAll("_", " ").toLowerCase();
            String message = "Your application " + application.getApplicationNumber() + " has been " + statusLabel + ".";
            notificationService.createNotificationByEmail(businessUser.getEmail(), "APPLICATION_STATUS_CHANGED",
                    message, "Application", application.getId());
        } catch (Exception ignored) {}

        return application;
    }

    @Transactional
    public Appointment scheduleApplication(String applicationId, ScheduleRequest request, String actor) {
        Application application = getApplicationById(applicationId);

        if (application.getStatus() != ApplicationStatus.APPROVED) {
            throw new RuntimeException("Application must be APPROVED before scheduling. Current status: " + application.getStatus());
        }

        List<Assignment> assignments = assignmentRepository.findByApplicationId(applicationId);
        if (assignments.isEmpty()) {
            throw new RuntimeException("Application must be assigned before scheduling");
        }
        Assignment assignment = assignments.get(0);

        Appointment appointment = Appointment.builder()
                .application(application)
                .assignment(assignment)
                .scheduledAt(request.getScheduledAt())
                .location(request.getLocation())
                .status(AppointmentStatus.SCHEDULED)
                .build();

        appointment = appointmentRepository.save(appointment);

        application.setAppointment(appointment);
        application.setStatus(ApplicationStatus.SCHEDULED);
        applicationRepository.save(application);

        ApplicationStatusHistory history = ApplicationStatusHistory.builder()
                .application(application)
                .status(ApplicationStatus.SCHEDULED)
                .actor(actor)
                .build();
        statusHistoryRepository.save(history);

        try {
            User businessUser = application.getApplicant();
            notificationService.createNotificationByEmail(businessUser.getEmail(), "APPLICATION_SCHEDULED",
                    "Your application " + application.getApplicationNumber() + " has been scheduled for " + request.getScheduledAt() + ".",
                    "Application", application.getId());
            notificationService.createNotificationByEmail(assignment.getAssignee().getEmail(), "INSPECTION_SCHEDULED",
                    "Inspection for application " + application.getApplicationNumber() + " scheduled at " + request.getLocation(),
                    "Appointment", appointment.getId());
        } catch (Exception ignored) {}

        return appointment;
    }

    @Transactional(readOnly = true)
    public List<Application> getAllApplications() {
        return applicationRepository.findAll();
    }

    @Transactional(readOnly = true)
    public List<Application> getApplicationsByInstrumentId(String instrumentId) {
        return applicationRepository.findByInstrumentId(instrumentId);
    }

    @Transactional(readOnly = true)
    public List<ApplicationStatusHistory> getApplicationHistory(String applicationId) {
        return statusHistoryRepository.findByApplicationIdOrderByTimestampAsc(applicationId);
    }

    @Transactional
    public void deleteApplication(String applicationId, String userEmail) {
        Application application = getApplicationById(applicationId);

        if (!application.getApplicant().getEmail().equals(userEmail)) {
            throw new RuntimeException("You can only delete your own applications");
        }

        ApplicationStatus status = application.getStatus();
        if (status != ApplicationStatus.SUBMITTED && status != ApplicationStatus.APPROVED
                && status != ApplicationStatus.REJECTED && status != ApplicationStatus.DRAFT) {
            throw new RuntimeException("Application cannot be deleted after it has been assigned. Current status: " + status);
        }

        Appointment appointment = application.getAppointment();
        if (appointment != null) {
            appointmentRepository.delete(appointment);
        }

        applicationRepository.delete(application);
    }
}
