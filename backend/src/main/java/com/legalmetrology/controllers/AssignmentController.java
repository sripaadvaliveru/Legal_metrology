package com.legalmetrology.controllers;

import com.legalmetrology.dto.AssignmentResponse;
import com.legalmetrology.dto.ManualAssignmentRequest;
import com.legalmetrology.dto.ReassignRequest;
import com.legalmetrology.dto.UserResponse;
import com.legalmetrology.entities.Assignment;
import com.legalmetrology.entities.User;
import com.legalmetrology.entities.Jurisdiction;
import com.legalmetrology.repositories.AssignmentRepository;
import com.legalmetrology.repositories.JurisdictionRepository;
import com.legalmetrology.repositories.UserRepository;
import com.legalmetrology.services.AssignmentService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/assignments")
@RequiredArgsConstructor
public class AssignmentController {

    private final AssignmentService assignmentService;
    private final AssignmentRepository assignmentRepository;
    private final UserRepository userRepository;
    private final JurisdictionRepository jurisdictionRepository;

    @PostMapping("/auto")
    @PreAuthorize("hasAnyRole('DISTRICT_OFFICER', 'STATE_OFFICER', 'SUPER_ADMIN')")
    public ResponseEntity<AssignmentResponse> autoAssign(
            @RequestBody java.util.Map<String, String> request,
            Authentication authentication) {
        Assignment assignment = assignmentService.autoAssign(request.get("applicationId"));
        return ResponseEntity.ok(assignmentToResponse(assignment));
    }

    @PostMapping("/manual")
    @PreAuthorize("hasAnyRole('DISTRICT_OFFICER', 'STATE_OFFICER', 'SUPER_ADMIN')")
    public ResponseEntity<AssignmentResponse> manualAssign(
            @Valid @RequestBody ManualAssignmentRequest request,
            Authentication authentication) {
        Assignment assignment = assignmentService.manualAssign(
                request.getApplicationId(), request.getAssigneeId(), authentication.getName());
        return ResponseEntity.ok(assignmentToResponse(assignment));
    }

    @PostMapping("/{id}/reassign")
    @PreAuthorize("hasAnyRole('DISTRICT_OFFICER', 'STATE_OFFICER', 'SUPER_ADMIN')")
    public ResponseEntity<AssignmentResponse> reassign(
            @PathVariable String id,
            @Valid @RequestBody ReassignRequest request,
            Authentication authentication) {
        Assignment assignment = assignmentService.reassign(
                id, request.getNewAssigneeId(), request.getReason(), authentication.getName());
        return ResponseEntity.ok(assignmentToResponse(assignment));
    }

    @GetMapping("/my")
    @PreAuthorize("hasAnyRole('LMO', 'GATC')")
    public ResponseEntity<List<AssignmentResponse>> getMyAssignments(Authentication authentication) {
        User user = userRepository.findByEmail(authentication.getName())
                .orElseThrow(() -> new RuntimeException("User not found"));
        List<Assignment> assignments = assignmentRepository.findByAssigneeId(user.getId());
        List<AssignmentResponse> assignmentResponses = assignments.stream()
                .map(this::assignmentToResponse)
                .collect(Collectors.toList());
        return ResponseEntity.ok(assignmentResponses);
    }

    @GetMapping
    @PreAuthorize("hasAnyRole('LMO', 'GATC', 'DISTRICT_OFFICER', 'STATE_OFFICER', 'SUPER_ADMIN')")
    public ResponseEntity<List<AssignmentResponse>> getAssignments(
            @RequestParam String applicationId) {
        List<Assignment> assignments = assignmentService.getAssignmentsByApplication(applicationId);
        List<AssignmentResponse> assignmentResponses = assignments.stream()
                .map(this::assignmentToResponse)
                .collect(Collectors.toList());
        return ResponseEntity.ok(assignmentResponses);
    }

    private AssignmentResponse assignmentToResponse(Assignment assignment) {
        User assignee = assignment.getAssignee();
        UserResponse.UserResponseBuilder assigneeResponseBuilder = UserResponse.builder()
                .id(assignee.getId())
                .name(assignee.getName())
                .email(assignee.getEmail())
                .role(assignee.getRole())
                .jurisdictionId(assignee.getJurisdictionId())
                .jurisdiction(assignee.getJurisdictionId() != null ?
                        jurisdictionRepository.findById(assignee.getJurisdictionId()).map(Jurisdiction::getName).orElse(null) : null)
                .competencyId(assignee.getCompetency() != null ? assignee.getCompetency().getId() : null)
                .competencyName(assignee.getCompetency() != null ? assignee.getCompetency().getName() : null);

        if (assignee.getBusiness() != null) {
            assigneeResponseBuilder.businessId(assignee.getBusiness().getId())
                    .businessName(assignee.getBusiness().getName());
        }

        UserResponse assigneeResponse = assigneeResponseBuilder.build();

        return AssignmentResponse.builder()
                .id(assignment.getId())
                .applicationId(assignment.getApplication().getId())
                .assigneeId(assignee.getId())
                .assignee(assigneeResponse)
                .method(assignment.getMethod())
                .score(assignment.getScore())
                .reason(assignment.getReason())
                .previousAssigneeId(assignment.getPreviousAssigneeId())
                .assignedAt(assignment.getAssignedAt())
                .build();
    }
}
