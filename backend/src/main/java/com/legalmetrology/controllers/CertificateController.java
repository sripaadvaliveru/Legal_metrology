package com.legalmetrology.controllers;

import com.legalmetrology.entities.Certificate;
import com.legalmetrology.services.CertificateService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/certificates")
@RequiredArgsConstructor
public class CertificateController {

    private final CertificateService certificateService;

    @GetMapping("/{id}")
    public ResponseEntity<Certificate> getCertificate(@PathVariable String id) {
        return ResponseEntity.ok(certificateService.getCertificateById(id));
    }

    @PostMapping("/{id}/revoke")
    public ResponseEntity<Certificate> revokeCertificate(
            @PathVariable String id,
            @RequestBody Map<String, String> request) {
        return ResponseEntity.ok(certificateService.revokeCertificate(id, request.get("reason")));
    }
}
