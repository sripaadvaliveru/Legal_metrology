package com.legalmetrology.controllers;

import com.legalmetrology.entities.Certificate;
import com.legalmetrology.entities.User;
import com.legalmetrology.enums.Role;
import com.legalmetrology.repositories.CertificateRepository;
import com.legalmetrology.repositories.UserRepository;
import com.legalmetrology.services.CertificateService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/certificates")
@RequiredArgsConstructor
public class CertificateController {

    private final CertificateService certificateService;
    private final CertificateRepository certificateRepository;
    private final UserRepository userRepository;

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

    @GetMapping("/my")
    @PreAuthorize("hasAnyRole('BUSINESS', 'LMO', 'GATC', 'DISTRICT_OFFICER', 'STATE_OFFICER', 'SUPER_ADMIN')")
    public ResponseEntity<List<Certificate>> getMyCertificates(Authentication authentication) {
        User user = userRepository.findByEmail(authentication.getName())
                .orElseThrow(() -> new RuntimeException("User not found"));

        if (user.getRole() == Role.BUSINESS) {
            String businessId = user.getBusiness() != null ? user.getBusiness().getId() : null;
            return ResponseEntity.ok(certificateService.getCertificatesForUserOrBusiness(user.getId(), businessId));
        } else {
            return ResponseEntity.ok(certificateRepository.findAll());
        }
    }

    @GetMapping(value = "/{id}/pdf", produces = MediaType.APPLICATION_PDF_VALUE)
    @PreAuthorize("hasAnyRole('BUSINESS', 'LMO', 'GATC', 'DISTRICT_OFFICER', 'STATE_OFFICER', 'SUPER_ADMIN')")
    public ResponseEntity<byte[]> getCertificatePdf(@PathVariable String id) {
        Certificate cert = certificateService.getCertificateById(id);
        byte[] pdfBytes = certificateService.generateCertificatePdf(id);

        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_TYPE, MediaType.APPLICATION_PDF_VALUE)
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"certificate-" + cert.getCertificateNumber() + ".pdf\"")
                .body(pdfBytes);
    }

    @GetMapping(value = "/{id}/qr", produces = MediaType.IMAGE_PNG_VALUE)
    @PreAuthorize("hasAnyRole('BUSINESS', 'LMO', 'GATC', 'DISTRICT_OFFICER', 'STATE_OFFICER', 'SUPER_ADMIN')")
    public ResponseEntity<byte[]> getCertificateQrCode(
            @PathVariable String id,
            @RequestParam(defaultValue = "300") int size) {
        Certificate cert = certificateService.getCertificateById(id);
        byte[] imageBytes = certificateService.generateQrCodeImage(cert.getQrToken(), size, size);

        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_TYPE, MediaType.IMAGE_PNG_VALUE)
                .header(HttpHeaders.CONTENT_DISPOSITION, "inline; filename=\"qr-" + cert.getCertificateNumber() + ".png\"")
                .body(imageBytes);
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
