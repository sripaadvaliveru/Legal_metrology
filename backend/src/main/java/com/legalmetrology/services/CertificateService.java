package com.legalmetrology.services;

import com.legalmetrology.entities.Certificate;
import com.legalmetrology.entities.Inspection;
import com.legalmetrology.enums.CertificateStatus;
import com.legalmetrology.repositories.CertificateRepository;
import com.legalmetrology.repositories.InspectionRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class CertificateService {

    private final CertificateRepository certificateRepository;
    private final InspectionRepository inspectionRepository;

    @Transactional(readOnly = true)
    public Certificate getCertificateById(String id) {
        return certificateRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Certificate not found"));
    }

    @Transactional(readOnly = true)
    public Certificate getCertificateByNumber(String number) {
        return certificateRepository.findByCertificateNumber(number)
                .orElseThrow(() -> new RuntimeException("Certificate not found"));
    }

    public Certificate verifyByQrToken(String token) {
        return certificateRepository.findByQrToken(token)
                .orElseThrow(() -> new RuntimeException("Certificate not found"));
    }

    @Transactional
    public Certificate revokeCertificate(String id, String reason) {
        Certificate certificate = getCertificateById(id);
        certificate.setStatus(CertificateStatus.REVOKED);
        return certificateRepository.save(certificate);
    }

    @Transactional(readOnly = true)
    public List<Certificate> getCertificatesByBusinessId(String businessId) {
        return certificateRepository.findByBusinessId(businessId);
    }

    @Transactional
    public Certificate generateCertificateForInspection(String inspectionId) {
        Inspection inspection = inspectionRepository.findById(inspectionId)
                .orElseThrow(() -> new RuntimeException("Inspection not found"));

        if (inspection.getMeasurements() == null || inspection.getMeasurements().isEmpty()) {
            throw new RuntimeException("Inspection must have measurements before generating certificate");
        }

        com.legalmetrology.entities.Appointment appointment = inspection.getAppointment();
        com.legalmetrology.entities.Application application = appointment.getApplication();
        com.legalmetrology.entities.Instrument instrument = application.getInstrument();

        String certificateNumber = String.format("CERT-LM-%d-%06d",
                java.time.LocalDate.now().getYear(),
                certificateRepository.count() + 1);

        String qrToken = java.util.UUID.randomUUID().toString();

        java.time.LocalDate verificationDate = java.time.LocalDate.now();
        java.time.LocalDate validUntil = verificationDate.plusMonths(12);

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
}
