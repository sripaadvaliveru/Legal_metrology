package com.legalmetrology.controllers;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.Base64;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/evidence")
public class EvidenceController {

    @Value("${evidence.upload-dir:uploads}")
    private String uploadDir;

    @Value("${server.port:8080}")
    private String serverPort;

    @PostMapping("/upload")
    @PreAuthorize("hasAnyRole('LMO', 'GATC', 'DISTRICT_OFFICER', 'STATE_OFFICER', 'SUPER_ADMIN')")
    public ResponseEntity<Map<String, String>> uploadEvidence(
            @RequestParam("file") MultipartFile file) throws IOException {

        if (file.isEmpty()) {
            return ResponseEntity.badRequest().body(Map.of("error", "File is empty"));
        }

        String originalFilename = file.getOriginalFilename();
        String extension = ".jpg";
        if (originalFilename != null && originalFilename.contains(".")) {
            extension = originalFilename.substring(originalFilename.lastIndexOf("."));
        }

        String filename = UUID.randomUUID().toString() + extension;
        Path uploadPath = Paths.get(uploadDir);
        if (!Files.exists(uploadPath)) {
            Files.createDirectories(uploadPath);
        }

        Path filePath = uploadPath.resolve(filename);
        file.transferTo(filePath.toFile());

        String url = "/uploads/" + filename;

        return ResponseEntity.ok(Map.of("url", url, "filename", filename));
    }

    @PostMapping("/upload-base64")
    @PreAuthorize("hasAnyRole('LMO', 'GATC', 'DISTRICT_OFFICER', 'STATE_OFFICER', 'SUPER_ADMIN')")
    public ResponseEntity<Map<String, String>> uploadEvidenceBase64(
            @RequestBody Map<String, String> payload) throws IOException {

        String base64Data = payload.get("base64");
        if (base64Data == null || base64Data.trim().isEmpty()) {
            return ResponseEntity.badRequest().body(Map.of("error", "base64 data is required"));
        }

        String extension = ".jpg";
        if (base64Data.contains("data:image/png;base64,")) {
            extension = ".png";
            base64Data = base64Data.replace("data:image/png;base64,", "");
        } else if (base64Data.contains("data:image/jpeg;base64,")) {
            extension = ".jpg";
            base64Data = base64Data.replace("data:image/jpeg;base64,", "");
        } else if (base64Data.contains(",")) {
            base64Data = base64Data.substring(base64Data.indexOf(",") + 1);
        }

        byte[] decodedBytes = Base64.getDecoder().decode(base64Data.trim());

        String filename = UUID.randomUUID().toString() + extension;
        Path uploadPath = Paths.get(uploadDir);
        if (!Files.exists(uploadPath)) {
            Files.createDirectories(uploadPath);
        }

        Path filePath = uploadPath.resolve(filename);
        Files.write(filePath, decodedBytes);

        String url = "/uploads/" + filename;

        return ResponseEntity.ok(Map.of("url", url, "filename", filename));
    }
}
