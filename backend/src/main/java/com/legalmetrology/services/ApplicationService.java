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

    private static final AtomicLong APP_COUNTER = new AtomicLong(1);

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

        return application;
    }

    @Transactional
    public Appointment scheduleApplication(String applicationId, ScheduleRequest request, String actor) {
        Application application = getApplicationById(applicationId);

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

        return appointment;
    }

    @Transactional(readOnly = true)
    public List<Application> getAllApplications() {
        return applicationRepository.findAll();
    }
}
