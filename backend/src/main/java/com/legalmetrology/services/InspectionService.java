package com.legalmetrology.services;

import com.legalmetrology.dto.MeasurementBatchRequest;
import com.legalmetrology.entities.*;
import com.legalmetrology.enums.CertificateStatus;
import com.legalmetrology.enums.InspectionResult;
import com.legalmetrology.repositories.*;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class InspectionService {

    private final InspectionRepository inspectionRepository;
    private final AppointmentRepository appointmentRepository;
    private final CertificateRepository certificateRepository;
    private final InstrumentRepository instrumentRepository;
    private final UserRepository userRepository;

    @Transactional
    public Inspection createInspection(String appointmentId, String inspectorEmail) {
        Appointment appointment = appointmentRepository.findById(appointmentId)
                .orElseThrow(() -> new RuntimeException("Appointment not found"));

        User inspector = userRepository.findByEmail(inspectorEmail)
                .orElseThrow(() -> new RuntimeException("Inspector not found"));

        Inspection inspection = Inspection.builder()
                .appointment(appointment)
                .inspector(inspector)
                .result(InspectionResult.PENDING)
                .build();

        return inspectionRepository.save(inspection);
    }

    @Transactional
    public Inspection submitInspection(String inspectionId, InspectionResult result, String remarks) {
        Inspection inspection = inspectionRepository.findById(inspectionId)
                .orElseThrow(() -> new RuntimeException("Inspection not found"));

        inspection.setResult(result);
        inspection.setRemarks(remarks);
        inspection.setCompletedAt(java.time.LocalDateTime.now());

        inspection = inspectionRepository.save(inspection);

        if (result == InspectionResult.PASS) {
            generateCertificate(inspection);
        }

        return inspection;
    }

    @Transactional
    public List<Measurement> recordMeasurements(String inspectionId, MeasurementBatchRequest request) {
        Inspection inspection = inspectionRepository.findById(inspectionId)
                .orElseThrow(() -> new RuntimeException("Inspection not found"));

        List<Measurement> measurements = new ArrayList<>();
        for (MeasurementBatchRequest.MeasurementItem item : request.getReadings()) {
            Measurement measurement = Measurement.builder()
                    .inspection(inspection)
                    .parameter(item.getParameter())
                    .observedValue(item.getObservedValue())
                    .tolerance(item.getTolerance())
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
                certificateRepository.count() + 1);

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

    public Inspection getInspectionById(String id) {
        return inspectionRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Inspection not found"));
    }
}
