package com.legalmetrology.controllers;

import com.legalmetrology.entities.AuditLog;
import com.legalmetrology.entities.Violation;
import com.legalmetrology.repositories.AuditLogRepository;
import com.legalmetrology.repositories.ViolationRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Sort;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

/** Read-only administrative data used by the audit trail and enforcement screens. */
@RestController
@RequiredArgsConstructor
public class AdminDataController {

    private final AuditLogRepository auditLogRepository;
    private final ViolationRepository violationRepository;

    @GetMapping("/api/audit")
    @PreAuthorize("hasAnyRole('DISTRICT_OFFICER', 'STATE_OFFICER', 'SUPER_ADMIN')")
    public ResponseEntity<List<AuditLog>> getAuditLogs() {
        return ResponseEntity.ok(auditLogRepository.findAll(Sort.by(Sort.Direction.DESC, "timestamp")));
    }

    @GetMapping("/api/enforcement/violations")
    @PreAuthorize("hasAnyRole('DISTRICT_OFFICER', 'STATE_OFFICER', 'SUPER_ADMIN')")
    public ResponseEntity<List<Violation>> getViolations() {
        return ResponseEntity.ok(violationRepository.findAll(Sort.by(Sort.Direction.DESC, "createdAt")));
    }
}
