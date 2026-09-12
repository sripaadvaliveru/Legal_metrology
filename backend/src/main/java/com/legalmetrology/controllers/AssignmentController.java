package com.legalmetrology.controllers;

import com.legalmetrology.dto.ManualAssignmentRequest;
import com.legalmetrology.dto.ReassignRequest;
import com.legalmetrology.entities.Assignment;
import com.legalmetrology.services.AssignmentService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/assignments")
@RequiredArgsConstructor
public class AssignmentController {

    private final AssignmentService assignmentService;

    @PostMapping("/auto")
    public ResponseEntity<Assignment> autoAssign(
            @RequestBody java.util.Map<String, String> request,
            Authentication authentication) {
        return ResponseEntity.ok(assignmentService.autoAssign(request.get("applicationId")));
    }

    @PostMapping("/manual")
    public ResponseEntity<Assignment> manualAssign(
            @Valid @RequestBody ManualAssignmentRequest request,
            Authentication authentication) {
        return ResponseEntity.ok(assignmentService.manualAssign(
                request.getApplicationId(), request.getAssigneeId(), authentication.getName()));
    }

    @PostMapping("/{id}/reassign")
    public ResponseEntity<Assignment> reassign(
            @PathVariable String id,
            @Valid @RequestBody ReassignRequest request,
            Authentication authentication) {
        return ResponseEntity.ok(assignmentService.reassign(
                id, request.getNewAssigneeId(), request.getReason(), authentication.getName()));
    }

    @GetMapping
    public ResponseEntity<List<Assignment>> getAssignments(
            @RequestParam String applicationId) {
        return ResponseEntity.ok(assignmentService.getAssignmentsByApplication(applicationId));
    }
}
