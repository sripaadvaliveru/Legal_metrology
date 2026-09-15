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
    @PreAuthorize("hasRole('LMO')")
    public ResponseEntity<Map<String, String>> uploadEvidence(
            @RequestParam("file") MultipartFile file) throws IOException {

        if (file.isEmpty()) {
            return ResponseEntity.badRequest().body(Map.of("error", "File is empty"));
        }

        String originalFilename = file.getOriginalFilename();
        String extension = "";
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
}
