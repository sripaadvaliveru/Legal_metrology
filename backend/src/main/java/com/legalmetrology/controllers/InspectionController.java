package com.legalmetrology.controllers;

import com.legalmetrology.dto.InspectionSubmitRequest;
import com.legalmetrology.entities.Certificate;
import com.legalmetrology.entities.Inspection;
import com.legalmetrology.services.InspectionService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/inspections")
@RequiredArgsConstructor
public class InspectionController {

    private final InspectionService inspectionService;

    @PostMapping
    public ResponseEntity<Inspection> createInspection(
            @RequestBody java.util.Map<String, String> request,
            Authentication authentication) {
        return ResponseEntity.ok(inspectionService.createInspection(
                request.get("appointmentId"), authentication.getName()));
    }

    @GetMapping("/{id}")
    public ResponseEntity<Inspection> getInspection(@PathVariable String id) {
        return ResponseEntity.ok(inspectionService.getInspectionById(id));
    }

    @PostMapping("/{id}/submit")
    public ResponseEntity<Inspection> submitInspection(
            @PathVariable String id,
            @RequestBody InspectionSubmitRequest request) {
        return ResponseEntity.ok(inspectionService.submitInspection(
                id, request.getResult(), request.getRemarks()));
    }
}
