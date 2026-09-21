package com.legalmetrology.controllers;

import com.legalmetrology.entities.Certificate;
import com.legalmetrology.entities.Instrument;
import com.legalmetrology.services.CertificateService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
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
            Instrument inst = cert.getInstrument();

            Map<String, Object> response = new HashMap<>();
            response.put("certificateNumber", cert.getCertificateNumber());
            response.put("instrumentType", (inst != null && inst.getInstrumentType() != null)
                    ? inst.getInstrumentType().getName()
                    : "Standard Instrument");
            response.put("manufacturer", inst != null ? inst.getManufacturer() : "N/A");
            response.put("model", inst != null ? inst.getModel() : "N/A");
            response.put("serialNumber", inst != null ? inst.getSerialNumber() : "N/A");
            response.put("capacityRange", inst != null ? inst.getCapacityRange() : null);
            response.put("verificationDate", cert.getVerificationDate());
            response.put("validUntil", cert.getValidUntil());
            response.put("issuer", cert.getIssuedBy() != null ? cert.getIssuedBy() : "Legal Metrology Officer");
            response.put("status", cert.getStatus() != null ? cert.getStatus().name() : "VALID");

            return ResponseEntity.ok(response);
        } catch (Exception e) {
            Map<String, Object> notFound = new HashMap<>();
            notFound.put("status", "NOT_FOUND");
            notFound.put("message", "Certificate not found or invalid token");
            return ResponseEntity.ok(notFound);
        }
    }

    @GetMapping(value = "/qr/{token}", produces = MediaType.IMAGE_PNG_VALUE)
    public ResponseEntity<byte[]> getQrCodeImage(
            @PathVariable String token,
            @RequestParam(defaultValue = "250") int size) {
        try {
            byte[] imageBytes = certificateService.generateQrCodeImage(token, size, size);
            return ResponseEntity.ok()
                    .header(HttpHeaders.CONTENT_TYPE, MediaType.IMAGE_PNG_VALUE)
                    .header(HttpHeaders.CACHE_CONTROL, "public, max-age=86400")
                    .body(imageBytes);
        } catch (Exception e) {
            return ResponseEntity.notFound().build();
        }
    }
}
