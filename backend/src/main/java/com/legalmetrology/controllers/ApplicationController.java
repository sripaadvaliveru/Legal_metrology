package com.legalmetrology.controllers;

import com.legalmetrology.dto.ApplicationCreateRequest;
import com.legalmetrology.dto.ScheduleRequest;
import com.legalmetrology.entities.Appointment;
import com.legalmetrology.entities.Application;
import com.legalmetrology.entities.ApplicationStatusHistory;
import com.legalmetrology.enums.ApplicationStatus;
import com.legalmetrology.services.ApplicationService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/applications")
@RequiredArgsConstructor
public class ApplicationController {

    private final ApplicationService applicationService;

    @PostMapping
    @PreAuthorize("hasRole('BUSINESS')")
    public ResponseEntity<Application> createApplication(
            @Valid @RequestBody ApplicationCreateRequest request,
            Authentication authentication) {
        return ResponseEntity.ok(applicationService.createApplication(request, authentication.getName()));
    }

    @GetMapping
    @PreAuthorize("hasRole('BUSINESS')")
    public ResponseEntity<List<Application>> getApplications(Authentication authentication) {
        return ResponseEntity.ok(applicationService.getApplicationsByUser(authentication.getName()));
    }

    @GetMapping("/all")
    @PreAuthorize("hasAnyRole('DISTRICT_OFFICER', 'STATE_OFFICER', 'SUPER_ADMIN')")
    public ResponseEntity<List<Application>> getAllApplications() {
        return ResponseEntity.ok(applicationService.getAllApplications());
    }

    @GetMapping("/by-instrument/{instrumentId}")
    @PreAuthorize("hasAnyRole('BUSINESS', 'LMO', 'GATC', 'DISTRICT_OFFICER', 'STATE_OFFICER', 'SUPER_ADMIN')")
    public ResponseEntity<List<Application>> getApplicationsByInstrument(@PathVariable String instrumentId) {
        return ResponseEntity.ok(applicationService.getApplicationsByInstrumentId(instrumentId));
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAnyRole('BUSINESS', 'LMO', 'GATC', 'DISTRICT_OFFICER', 'STATE_OFFICER', 'SUPER_ADMIN')")
    public ResponseEntity<Application> getApplication(@PathVariable String id) {
        return ResponseEntity.ok(applicationService.getApplicationById(id));
    }

    @PostMapping("/{id}/approve")
    @PreAuthorize("hasAnyRole('DISTRICT_OFFICER', 'STATE_OFFICER', 'SUPER_ADMIN')")
    public ResponseEntity<Application> approveApplication(
            @PathVariable String id,
            Authentication authentication) {
        return ResponseEntity.ok(applicationService.updateStatus(id, ApplicationStatus.APPROVED, authentication.getName()));
    }

    @PostMapping("/{id}/reject")
    @PreAuthorize("hasAnyRole('DISTRICT_OFFICER', 'STATE_OFFICER', 'SUPER_ADMIN')")
    public ResponseEntity<Application> rejectApplication(
            @PathVariable String id,
            Authentication authentication) {
        return ResponseEntity.ok(applicationService.updateStatus(id, ApplicationStatus.REJECTED, authentication.getName()));
    }

    @PostMapping("/{id}/schedule")
    @PreAuthorize("hasAnyRole('DISTRICT_OFFICER', 'STATE_OFFICER', 'SUPER_ADMIN')")
    public ResponseEntity<Appointment> scheduleApplication(
            @PathVariable String id,
            @Valid @RequestBody ScheduleRequest request,
            Authentication authentication) {
        return ResponseEntity.ok(applicationService.scheduleApplication(id, request, authentication.getName()));
    }

    @GetMapping("/{id}/history")
    @PreAuthorize("hasAnyRole('BUSINESS', 'LMO', 'GATC', 'DISTRICT_OFFICER', 'STATE_OFFICER', 'SUPER_ADMIN')")
    public ResponseEntity<List<ApplicationStatusHistory>> getApplicationHistory(@PathVariable String id) {
        return ResponseEntity.ok(applicationService.getApplicationHistory(id));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('BUSINESS')")
    public ResponseEntity<Void> deleteApplication(
            @PathVariable String id,
            Authentication authentication) {
        applicationService.deleteApplication(id, authentication.getName());
        return ResponseEntity.noContent().build();
    }
}
