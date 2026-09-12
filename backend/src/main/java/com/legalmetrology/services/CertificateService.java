package com.legalmetrology.services;

import com.legalmetrology.entities.Certificate;
import com.legalmetrology.enums.CertificateStatus;
import com.legalmetrology.repositories.CertificateRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class CertificateService {

    private final CertificateRepository certificateRepository;

    public Certificate getCertificateById(String id) {
        return certificateRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Certificate not found"));
    }

    public Certificate getCertificateByNumber(String number) {
        return certificateRepository.findByCertificateNumber(number)
                .orElseThrow(() -> new RuntimeException("Certificate not found"));
    }

    public Certificate verifyByQrToken(String token) {
        return certificateRepository.findByQrToken(token)
                .orElseThrow(() -> new RuntimeException("Certificate not found"));
    }

    public Certificate revokeCertificate(String id, String reason) {
        Certificate certificate = getCertificateById(id);
        certificate.setStatus(CertificateStatus.REVOKED);
        return certificateRepository.save(certificate);
    }
}
