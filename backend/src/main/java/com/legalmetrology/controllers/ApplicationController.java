package com.legalmetrology.controllers;

import com.legalmetrology.dto.ApplicationCreateRequest;
import com.legalmetrology.dto.ApplicationResponse;
import com.legalmetrology.dto.ScheduleRequest;
import com.legalmetrology.entities.Appointment;
import com.legalmetrology.entities.Application;
import com.legalmetrology.entities.Assignment;
import com.legalmetrology.entities.ApplicationStatusHistory;
import com.legalmetrology.entities.User;
import com.legalmetrology.enums.ApplicationStatus;
import com.legalmetrology.enums.ApplicationType;
import com.legalmetrology.repositories.JurisdictionRepository;
import com.legalmetrology.services.ApplicationService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/applications")
@RequiredArgsConstructor
public class ApplicationController {

    private final ApplicationService applicationService;
    private final JurisdictionRepository jurisdictionRepository;

    @PostMapping
    @PreAuthorize("hasRole('BUSINESS')")
    public ResponseEntity<Application> createApplication(
            @Valid @RequestBody ApplicationCreateRequest request,
            Authentication authentication) {
        return ResponseEntity.ok(applicationService.createApplication(request, authentication.getName()));
    }

    @GetMapping
    @PreAuthorize("hasRole('BUSINESS')")
    public ResponseEntity<List<ApplicationResponse>> getApplications(Authentication authentication) {
        List<Application> applications = applicationService.getApplicationsByUser(authentication.getName());
        List<ApplicationResponse> applicationResponses = applications.stream()
                .map(this::applicationToResponse)
                .collect(Collectors.toList());
        return ResponseEntity.ok(applicationResponses);
    }

    @GetMapping("/all")
    @PreAuthorize("hasAnyRole('DISTRICT_OFFICER', 'STATE_OFFICER', 'SUPER_ADMIN')")
    public ResponseEntity<List<ApplicationResponse>> getAllApplications() {
        List<Application> applications = applicationService.getAllApplications();
        List<ApplicationResponse> applicationResponses = applications.stream()
                .map(this::applicationToResponse)
                .collect(Collectors.toList());
        return ResponseEntity.ok(applicationResponses);
    }

    @GetMapping("/by-instrument/{instrumentId}")
    @PreAuthorize("hasAnyRole('BUSINESS', 'LMO', 'GATC', 'DISTRICT_OFFICER', 'STATE_OFFICER', 'SUPER_ADMIN')")
    public ResponseEntity<List<ApplicationResponse>> getApplicationsByInstrument(
            @PathVariable String instrumentId,
            Authentication authentication) {
        List<Application> applications = applicationService.getApplicationsByInstrumentForCaller(
                instrumentId, authentication.getName());
        List<ApplicationResponse> applicationResponses = applications.stream()
                .map(this::applicationToResponse)
                .collect(Collectors.toList());
        return ResponseEntity.ok(applicationResponses);
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAnyRole('BUSINESS', 'LMO', 'GATC', 'DISTRICT_OFFICER', 'STATE_OFFICER', 'SUPER_ADMIN')")
    public ResponseEntity<ApplicationResponse> getApplication(@PathVariable String id, Authentication authentication) {
        Application application = applicationService.getApplicationForCaller(id, authentication.getName());
        return ResponseEntity.ok(applicationToResponse(application));
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
    public ResponseEntity<List<ApplicationStatusHistory>> getApplicationHistory(
            @PathVariable String id,
            Authentication authentication) {
        return ResponseEntity.ok(applicationService.getApplicationHistoryForCaller(id, authentication.getName()));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('BUSINESS')")
    public ResponseEntity<Void> deleteApplication(
            @PathVariable String id,
            Authentication authentication) {
        applicationService.deleteApplication(id, authentication.getName());
        return ResponseEntity.noContent().build();
    }

private ApplicationResponse applicationToResponse(Application application) {
        // Get applicant details
        User applicant = application.getApplicant();

        // Start building the response
        ApplicationResponse.ApplicationResponseBuilder responseBuilder = ApplicationResponse.builder()
                .id(application.getId())
                .applicationNumber(application.getApplicationNumber())
                .createdAt(application.getCreatedAt())
                .updatedAt(application.getUpdatedAt())
                .submittedAt(application.getSubmittedAt())
                .status(application.getStatus())
                .type(application.getType());

        // Add instrument details if available
        if (application.getInstrument() != null) {
            responseBuilder.instrumentId(application.getInstrument().getId())
                    .instrumentName(application.getInstrument().getModel());
        }

        // Add applicant details if available
        if (applicant != null) {
            responseBuilder.applicantId(applicant.getId())
                    .applicantName(applicant.getName())
                    .applicantEmail(applicant.getEmail());
        }

        // Get the latest assignment (if any) to show who it's assigned to
        if (application.getAssignments() != null && !application.getAssignments().isEmpty()) {
            // Get the most recent assignment (we'll take the first one for simplicity;
            // in a production system, you'd want to sort by date)
            Assignment latestAssignment = application.getAssignments().iterator().next();

            // Add assignment details
            responseBuilder.assignmentId(latestAssignment.getId())
                    .assignmentScore(latestAssignment.getScore())
                    .assignmentMethod(latestAssignment.getMethod() != null ? latestAssignment.getMethod().name() : null)
                    .assignedAt(latestAssignment.getAssignedAt());

            // Add assignee (LMO) details if available
            if (latestAssignment.getAssignee() != null) {
                User assignee = latestAssignment.getAssignee();
                responseBuilder.assigneeId(assignee.getId())
                        .assigneeName(assignee.getName())
                        .assigneeEmail(assignee.getEmail());

                // Add assignee jurisdiction details if available
                if (assignee.getJurisdictionId() != null) {
                    responseBuilder.assigneeJurisdictionId(assignee.getJurisdictionId());
                    // Look up the jurisdiction NAME for the assignee's jurisdictionId.
                    // (Was wrongly using UserRepository here, which looks up users.id —
                    // a jurisdiction id never matches a user, so this silently produced null.)
                    jurisdictionRepository.findById(assignee.getJurisdictionId()).ifPresent(jurisdiction ->
                            responseBuilder.assigneeJurisdiction(jurisdiction.getName()));
                }

                // Add assignee competency details if available
                if (assignee.getCompetency() != null) {
                    responseBuilder.assigneeCompetencyId(assignee.getCompetency().getId())
                            .assigneeCompetency(assignee.getCompetency().getName());
                }
            }
        }

        return responseBuilder.build();
    }
}
