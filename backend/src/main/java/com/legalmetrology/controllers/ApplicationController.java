package com.legalmetrology.controllers;

import com.legalmetrology.dto.ApplicationCreateRequest;
import com.legalmetrology.dto.ScheduleRequest;
import com.legalmetrology.entities.Application;
import com.legalmetrology.enums.ApplicationStatus;
import com.legalmetrology.services.ApplicationService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/applications")
@RequiredArgsConstructor
public class ApplicationController {

    private final ApplicationService applicationService;

    @PostMapping
    public ResponseEntity<Application> createApplication(
            @Valid @RequestBody ApplicationCreateRequest request,
            Authentication authentication) {
        return ResponseEntity.ok(applicationService.createApplication(request, authentication.getName()));
    }

    @GetMapping
    public ResponseEntity<List<Application>> getApplications(Authentication authentication) {
        return ResponseEntity.ok(applicationService.getApplicationsByUser(authentication.getName()));
    }

    @GetMapping("/{id}")
    public ResponseEntity<Application> getApplication(@PathVariable String id) {
        return ResponseEntity.ok(applicationService.getApplicationById(id));
    }

    @PostMapping("/{id}/approve")
    public ResponseEntity<Application> approveApplication(
            @PathVariable String id,
            Authentication authentication) {
        return ResponseEntity.ok(applicationService.updateStatus(id, ApplicationStatus.APPROVED, authentication.getName()));
    }

    @PostMapping("/{id}/reject")
    public ResponseEntity<Application> rejectApplication(
            @PathVariable String id,
            Authentication authentication) {
        return ResponseEntity.ok(applicationService.updateStatus(id, ApplicationStatus.REJECTED, authentication.getName()));
    }
}
