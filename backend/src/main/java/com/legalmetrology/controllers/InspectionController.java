package com.legalmetrology.controllers;

import com.legalmetrology.dto.InspectionSubmitRequest;
import com.legalmetrology.dto.MeasurementBatchRequest;
import com.legalmetrology.entities.Certificate;
import com.legalmetrology.entities.Inspection;
import com.legalmetrology.entities.Measurement;
import com.legalmetrology.entities.User;
import com.legalmetrology.repositories.InspectionRepository;
import com.legalmetrology.repositories.UserRepository;
import com.legalmetrology.services.InspectionService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/inspections")
@RequiredArgsConstructor
public class InspectionController {

    private final InspectionService inspectionService;
    private final InspectionRepository inspectionRepository;
    private final UserRepository userRepository;

    @PostMapping
    @PreAuthorize("hasRole('LMO')")
    public ResponseEntity<Inspection> createInspection(
            @RequestBody java.util.Map<String, String> request,
            Authentication authentication) {
        return ResponseEntity.ok(inspectionService.createInspection(
                request.get("appointmentId"), authentication.getName()));
    }

    @GetMapping("/my")
    @PreAuthorize("hasAnyRole('LMO', 'GATC')")
    public ResponseEntity<List<Inspection>> getMyInspections(Authentication authentication) {
        User user = userRepository.findByEmail(authentication.getName())
                .orElseThrow(() -> new RuntimeException("User not found"));
        return ResponseEntity.ok(inspectionRepository.findByInspectorId(user.getId()));
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAnyRole('LMO', 'GATC', 'DISTRICT_OFFICER', 'STATE_OFFICER', 'SUPER_ADMIN')")
    public ResponseEntity<Inspection> getInspection(@PathVariable String id) {
        return ResponseEntity.ok(inspectionService.getInspectionById(id));
    }

    @GetMapping("/{id}/measurements")
    @PreAuthorize("hasAnyRole('LMO', 'GATC', 'DISTRICT_OFFICER', 'STATE_OFFICER', 'SUPER_ADMIN')")
    public ResponseEntity<List<Measurement>> getMeasurements(@PathVariable String id) {
        Inspection inspection = inspectionService.getInspectionById(id);
        return ResponseEntity.ok(inspection.getMeasurements());
    }

    @GetMapping("/{id}/previous")
    @PreAuthorize("hasAnyRole('LMO', 'GATC', 'DISTRICT_OFFICER', 'STATE_OFFICER', 'SUPER_ADMIN')")
    public ResponseEntity<Inspection> getPreviousInspection(@PathVariable String id) {
        Inspection inspection = inspectionService.getInspectionById(id);
        if (inspection.getPreviousInspectionId() != null) {
            return ResponseEntity.ok(inspectionService.getInspectionById(inspection.getPreviousInspectionId()));
        }
        return ResponseEntity.ok(inspection);
    }

    @PostMapping("/{id}/submit")
    @PreAuthorize("hasRole('LMO')")
    public ResponseEntity<Inspection> submitInspection(
            @PathVariable String id,
            @RequestBody InspectionSubmitRequest request) {
        return ResponseEntity.ok(inspectionService.submitInspection(
                id, request.getResult(), request.getRemarks()));
    }

    @PostMapping("/{id}/measurements")
    @PreAuthorize("hasRole('LMO')")
    public ResponseEntity<List<Measurement>> recordMeasurements(
            @PathVariable String id,
            @RequestBody MeasurementBatchRequest request) {
        return ResponseEntity.ok(inspectionService.recordMeasurements(id, request));
    }

    @PostMapping("/{id}/evidence")
    @PreAuthorize("hasRole('LMO')")
    public ResponseEntity<Inspection> addEvidence(
            @PathVariable String id,
            @RequestBody Map<String, String> request) {
        return ResponseEntity.ok(inspectionService.addEvidence(id, request.get("url")));
    }

    @PostMapping("/{id}/gps")
    @PreAuthorize("hasRole('LMO')")
    public ResponseEntity<Inspection> updateGps(
            @PathVariable String id,
            @RequestBody Map<String, Double> request) {
        return ResponseEntity.ok(inspectionService.updateGpsCoordinates(
                id, request.get("latitude"), request.get("longitude")));
    }
}
