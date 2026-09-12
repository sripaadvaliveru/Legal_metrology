package com.legalmetrology.services;

import com.legalmetrology.dto.ApplicationCreateRequest;
import com.legalmetrology.entities.*;
import com.legalmetrology.enums.ApplicationStatus;
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

    public List<Application> getApplicationsByUser(String userEmail) {
        User user = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new RuntimeException("User not found"));
        return applicationRepository.findByApplicantId(user.getId());
    }

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
}
