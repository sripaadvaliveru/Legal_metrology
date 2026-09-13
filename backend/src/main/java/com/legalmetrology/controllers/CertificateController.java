package com.legalmetrology.controllers;

import com.legalmetrology.entities.Certificate;
import com.legalmetrology.services.CertificateService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/certificates")
@RequiredArgsConstructor
public class CertificateController {

    private final CertificateService certificateService;

    @GetMapping("/{id}")
    @PreAuthorize("hasAnyRole('BUSINESS', 'LMO', 'GATC', 'DISTRICT_OFFICER', 'STATE_OFFICER', 'SUPER_ADMIN')")
    public ResponseEntity<Certificate> getCertificate(@PathVariable String id) {
        return ResponseEntity.ok(certificateService.getCertificateById(id));
    }

    @GetMapping("/by-number/{number}")
    @PreAuthorize("hasAnyRole('BUSINESS', 'LMO', 'GATC', 'DISTRICT_OFFICER', 'STATE_OFFICER', 'SUPER_ADMIN')")
    public ResponseEntity<Certificate> getCertificateByNumber(@PathVariable String number) {
        return ResponseEntity.ok(certificateService.getCertificateByNumber(number));
    }

    @PostMapping("/{id}/revoke")
    @PreAuthorize("hasAnyRole('DISTRICT_OFFICER', 'STATE_OFFICER', 'SUPER_ADMIN')")
    public ResponseEntity<Certificate> revokeCertificate(
            @PathVariable String id,
            @RequestBody Map<String, String> request) {
        return ResponseEntity.ok(certificateService.revokeCertificate(id, request.get("reason")));
    }

    @PostMapping("/generate/{inspectionId}")
    @PreAuthorize("hasRole('LMO')")
    public ResponseEntity<Certificate> generateCertificate(@PathVariable String inspectionId) {
        return ResponseEntity.ok(certificateService.generateCertificateForInspection(inspectionId));
    }
}
