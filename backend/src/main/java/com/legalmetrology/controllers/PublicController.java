package com.legalmetrology.controllers;

import com.legalmetrology.entities.Certificate;
import com.legalmetrology.services.CertificateService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/public")
@RequiredArgsConstructor
public class PublicController {

    private final CertificateService certificateService;

    @GetMapping("/verify/{token}")
    public ResponseEntity<Map<String, Object>> verifyCertificate(@PathVariable String token) {
        try {
            Certificate cert = certificateService.verifyByQrToken(token);

            Map<String, Object> response = new HashMap<>();
            response.put("certificateNumber", cert.getCertificateNumber());
            response.put("instrumentType", cert.getInstrument().getInstrumentType().getName());
            response.put("manufacturer", cert.getInstrument().getManufacturer());
            response.put("model", cert.getInstrument().getModel());
            response.put("serialNumber", cert.getInstrument().getSerialNumber());
            response.put("capacityRange", cert.getInstrument().getCapacityRange());
            response.put("verificationDate", cert.getVerificationDate());
            response.put("validUntil", cert.getValidUntil());
            response.put("issuer", cert.getIssuedBy());
            response.put("status", cert.getStatus().name());

            return ResponseEntity.ok(response);
        } catch (Exception e) {
            Map<String, Object> notFound = new HashMap<>();
            notFound.put("status", "NOT_FOUND");
            notFound.put("message", "Certificate not found or invalid token");
            return ResponseEntity.ok(notFound);
        }
    }
}
