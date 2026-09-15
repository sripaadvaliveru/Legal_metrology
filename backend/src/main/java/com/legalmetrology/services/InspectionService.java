package com.legalmetrology.services;

import com.legalmetrology.dto.MeasurementBatchRequest;
import com.legalmetrology.entities.*;
import com.legalmetrology.enums.ApplicationStatus;
import com.legalmetrology.enums.CertificateStatus;
import com.legalmetrology.enums.InspectionResult;
import com.legalmetrology.enums.InstrumentStatus;
import com.legalmetrology.repositories.*;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.annotation.PostConstruct;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.concurrent.atomic.AtomicLong;

@Service
@RequiredArgsConstructor
public class InspectionService {

    private final InspectionRepository inspectionRepository;
    private final AppointmentRepository appointmentRepository;
    private final CertificateRepository certificateRepository;
    private final InstrumentRepository instrumentRepository;
    private final UserRepository userRepository;
    private final ApplicationRepository applicationRepository;
    private final ChecklistTemplateRepository checklistTemplateRepository;
    private final NotificationService notificationService;
    private final ApplicationStatusHistoryRepository statusHistoryRepository;

    private final AtomicLong CERT_COUNTER = new AtomicLong(0);

    @PostConstruct
    public void init() {
        long maxSeq = certificateRepository.findAll().stream()
                .map(Certificate::getCertificateNumber)
                .filter(id -> id != null && id.startsWith("CERT-LM-"))
                .map(id -> {
                    try { return Long.parseLong(id.substring(id.lastIndexOf('-') + 1)); }
                    catch (Exception e) { return 0L; }
                })
                .mapToLong(Long::longValue)
                .max().orElse(0L);
        CERT_COUNTER.set(maxSeq + 1);
    }

    @Transactional
    public Inspection createInspection(String appointmentId, String inspectorEmail) {
        Appointment appointment = appointmentRepository.findById(appointmentId)
                .orElseThrow(() -> new RuntimeException("Appointment not found"));

        java.util.Optional<Inspection> existing = inspectionRepository.findByAppointmentId(appointmentId);
        if (existing.isPresent()) {
            return existing.get();
        }

        User inspector = userRepository.findByEmail(inspectorEmail)
                .orElseThrow(() -> new RuntimeException("Inspector not found"));

        Inspection inspection = Inspection.builder()
                .appointment(appointment)
                .inspector(inspector)
                .result(InspectionResult.PENDING)
                .build();

        inspection = inspectionRepository.save(inspection);

        Application application = appointment.getApplication();
        application.setStatus(ApplicationStatus.UNDER_INSPECTION);
        applicationRepository.save(application);

        return inspection;
    }

    @Transactional
    public Inspection submitInspection(String inspectionId, InspectionResult result, String remarks) {
        Inspection inspection = inspectionRepository.findById(inspectionId)
                .orElseThrow(() -> new RuntimeException("Inspection not found"));

        inspection.setResult(result);
        inspection.setRemarks(remarks);
        inspection.setCompletedAt(java.time.LocalDateTime.now());

        Appointment appointment = inspection.getAppointment();
        Application application = appointment.getApplication();

        if (result == InspectionResult.PASS) {
            application.setStatus(ApplicationStatus.PASSED);
            applicationRepository.save(application);
            saveStatusHistory(application, ApplicationStatus.PASSED, inspection.getInspector().getEmail());

            generateCertificate(inspection);

            application.setStatus(ApplicationStatus.CERTIFICATE_GENERATED);
            applicationRepository.save(application);
            saveStatusHistory(application, ApplicationStatus.CERTIFICATE_GENERATED, inspection.getInspector().getEmail());

            application.setStatus(ApplicationStatus.COMPLETED);
            applicationRepository.save(application);
            saveStatusHistory(application, ApplicationStatus.COMPLETED, inspection.getInspector().getEmail());

            Instrument instrument = application.getInstrument();
            instrument.setStatus(InstrumentStatus.VERIFIED);
            instrumentRepository.save(instrument);
        } else if (result == InspectionResult.FAIL) {
            application.setStatus(ApplicationStatus.REINSPECTION_REQUIRED);
            applicationRepository.save(application);
            saveStatusHistory(application, ApplicationStatus.REINSPECTION_REQUIRED, inspection.getInspector().getEmail());
        }

        try {
            User businessUser = application.getApplicant();
            String resultLabel = result == InspectionResult.PASS ? "passed" : "failed";
            notificationService.createNotificationByEmail(businessUser.getEmail(), "INSPECTION_" + result.name(),
                    "Inspection for application " + application.getApplicationNumber() + " has " + resultLabel + ".",
                    "Application", application.getId());
        } catch (Exception ignored) {}

        return inspectionRepository.save(inspection);
    }

    @Transactional
    public List<Measurement> recordMeasurements(String inspectionId, MeasurementBatchRequest request) {
        Inspection inspection = inspectionRepository.findById(inspectionId)
                .orElseThrow(() -> new RuntimeException("Inspection not found"));

        Map<String, String> checklistTolerances = java.util.Collections.emptyMap();
        if (request.getChecklistId() != null && !request.getChecklistId().isEmpty()) {
            ChecklistTemplate template = checklistTemplateRepository.findById(request.getChecklistId())
                    .orElse(null);
            if (template != null) {
                try {
                    ObjectMapper mapper = new ObjectMapper();
                    List<Map<String, Object>> items = mapper.readValue(
                            template.getChecklistItems(),
                            new TypeReference<List<Map<String, Object>>>() {});
                    for (Map<String, Object> item : items) {
                        String param = (String) item.get("parameter");
                        String tol = (String) item.get("tolerance");
                        if (param != null && tol != null) {
                            checklistTolerances.put(param.toLowerCase(), tol);
                        }
                    }
                } catch (Exception ignored) {}
            }
        }

        List<Measurement> measurements = new ArrayList<>();
        for (MeasurementBatchRequest.MeasurementItem item : request.getReadings()) {
            String tolerance = item.getTolerance();
            if ((tolerance == null || tolerance.isEmpty()) && !checklistTolerances.isEmpty()) {
                tolerance = checklistTolerances.getOrDefault(item.getParameter().toLowerCase(), null);
            }

            Measurement measurement = Measurement.builder()
                    .inspection(inspection)
                    .parameter(item.getParameter())
                    .observedValue(item.getObservedValue())
                    .tolerance(tolerance)
                    .withinTolerance(item.getWithinTolerance())
                    .build();
            measurements.add(measurement);
        }

        inspection.setMeasurements(measurements);
        inspectionRepository.save(inspection);

        return measurements;
    }

    @Transactional
    public Inspection addEvidence(String inspectionId, String evidenceUrl) {
        Inspection inspection = inspectionRepository.findById(inspectionId)
                .orElseThrow(() -> new RuntimeException("Inspection not found"));

        inspection.getEvidenceUrls().add(evidenceUrl);
        return inspectionRepository.save(inspection);
    }

    @Transactional
    public Inspection updateGpsCoordinates(String inspectionId, Double latitude, Double longitude) {
        Inspection inspection = inspectionRepository.findById(inspectionId)
                .orElseThrow(() -> new RuntimeException("Inspection not found"));

        inspection.setLatitude(latitude);
        inspection.setLongitude(longitude);
        return inspectionRepository.save(inspection);
    }

    @Transactional
    public Certificate generateCertificate(Inspection inspection) {
        Appointment appointment = inspection.getAppointment();
        Application application = appointment.getApplication();
        Instrument instrument = application.getInstrument();

        String certificateNumber = String.format("CERT-LM-%d-%06d",
                LocalDate.now().getYear(),
                CERT_COUNTER.getAndIncrement());

        String qrToken = UUID.randomUUID().toString();

        LocalDate verificationDate = LocalDate.now();
        LocalDate validUntil = verificationDate.plusMonths(12);

        Certificate certificate = Certificate.builder()
                .certificateNumber(certificateNumber)
                .instrument(instrument)
                .inspection(inspection)
                .verificationDate(verificationDate)
                .validUntil(validUntil)
                .status(CertificateStatus.VALID)
                .qrToken(qrToken)
                .issuedBy(inspection.getInspector().getName())
                .build();

        return certificateRepository.save(certificate);
    }

    @Transactional(readOnly = true)
    public Inspection getInspectionById(String id) {
        return inspectionRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Inspection not found"));
    }

    private void saveStatusHistory(Application application, ApplicationStatus status, String actor) {
        ApplicationStatusHistory history = ApplicationStatusHistory.builder()
                .application(application)
                .status(status)
                .actor(actor)
                .build();
        statusHistoryRepository.save(history);
    }
}
