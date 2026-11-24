package com.legalmetrology.controllers;

import com.legalmetrology.dto.UserCreateRequest;
import com.legalmetrology.dto.UserResponse;
import com.legalmetrology.entities.InstrumentType;
import com.legalmetrology.entities.User;
import com.legalmetrology.enums.Role;
import com.legalmetrology.entities.Jurisdiction;
import com.legalmetrology.repositories.JurisdictionRepository;
import com.legalmetrology.repositories.InstrumentTypeRepository;
import com.legalmetrology.repositories.UserRepository;
import com.legalmetrology.repositories.ApplicationRepository;
import com.legalmetrology.repositories.AssignmentRepository;
import com.legalmetrology.repositories.InspectionRepository;
import com.legalmetrology.repositories.NotificationRepository;
import com.legalmetrology.repositories.ComplaintRepository;
import com.legalmetrology.repositories.AuditLogRepository;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/users")
@RequiredArgsConstructor
public class UserController {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final InstrumentTypeRepository instrumentTypeRepository;
    private final JurisdictionRepository jurisdictionRepository;
    private final ApplicationRepository applicationRepository;
    private final AssignmentRepository assignmentRepository;
    private final InspectionRepository inspectionRepository;
    private final NotificationRepository notificationRepository;
    private final ComplaintRepository complaintRepository;
    private final AuditLogRepository auditLogRepository;

    @GetMapping
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'DISTRICT_OFFICER', 'STATE_OFFICER')")
    public ResponseEntity<List<UserResponse>> getUsersByRole(
            @RequestParam(required = false) String role,
            @RequestParam(required = false) Boolean includeInactive) {
        boolean showInactive = Boolean.TRUE.equals(includeInactive);
        List<User> users = userRepository.findAll().stream()
                .filter(u -> showInactive || Boolean.TRUE.equals(u.getIsActive()))
                .toList();

        if (role != null && !role.isBlank()) {
            try {
                Role r = Role.valueOf(role);
                users = users.stream()
                        .filter(u -> u.getRole() == r)
                        .toList();
            } catch (IllegalArgumentException ignored) {
            }
        }

        // Efficiently fetch jurisdiction names for all users
        Set<String> jurisdictionIds = users.stream()
                .map(User::getJurisdictionId)
                .filter(id -> id != null && !id.isEmpty())
                .collect(Collectors.toSet());

        List<Jurisdiction> jurisdictions = jurisdictionRepository.findAllById(jurisdictionIds);
        Map<String, String> jurisdictionNameMap = jurisdictions.stream()
                .collect(Collectors.toMap(Jurisdiction::getId, Jurisdiction::getName));

        // Build UserResponse objects
        List<UserResponse> userResponses = users.stream()
                .map(user -> {
                    UserResponse.UserResponseBuilder builder = UserResponse.builder()
                            .id(user.getId())
                            .name(user.getName())
                            .email(user.getEmail())
                            .role(user.getRole())
                            .jurisdictionId(user.getJurisdictionId())
                            .jurisdiction(user.getJurisdictionId() != null ?
                                    jurisdictionNameMap.get(user.getJurisdictionId()) : null)
                            .competencyId(user.getCompetency() != null ? user.getCompetency().getId() : null)
                            .competencyName(user.getCompetency() != null ? user.getCompetency().getName() : null)
                            .isActive(user.getIsActive());

                    if (user.getBusiness() != null) {
                        builder.businessId(user.getBusiness().getId())
                                .businessName(user.getBusiness().getName());
                    }

                    return builder.build();
                })
                .collect(Collectors.toList());

        return ResponseEntity.ok(userResponses);
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'DISTRICT_OFFICER')")
    public ResponseEntity<?> createUser(@Valid @RequestBody UserCreateRequest request) {
        if (userRepository.existsByEmail(request.getEmail())) {
            return ResponseEntity.badRequest().body(Map.of("error", "Email already registered"));
        }

        User user = User.builder()
                .name(request.getName())
                .email(request.getEmail())
                .password(passwordEncoder.encode(request.getPassword()))
                .role(request.getRole())
                .phone(request.getPhone())
                .jurisdictionId(request.getJurisdictionId())
                .isActive(true)
                .build();

        // Set competency if provided
        if (request.getCompetencyId() != null && !request.getCompetencyId().isBlank()) {
            InstrumentType competency = instrumentTypeRepository.findById(request.getCompetencyId())
                    .orElseThrow(() -> new RuntimeException("Competency not found"));
            user.setCompetency(competency);
        }

        user = userRepository.save(user);

        // Return UserResponse with jurisdiction and competency names
        UserResponse.UserResponseBuilder responseBuilder = UserResponse.builder()
                .id(user.getId())
                .name(user.getName())
                .email(user.getEmail())
                .role(user.getRole())
                .jurisdictionId(user.getJurisdictionId())
                .jurisdiction(user.getJurisdictionId() != null ?
                        jurisdictionRepository.findById(user.getJurisdictionId()).map(Jurisdiction::getName).orElse(null) : null)
                .competencyId(user.getCompetency() != null ? user.getCompetency().getId() : null)
                .competencyName(user.getCompetency() != null ? user.getCompetency().getName() : null)
                .isActive(user.getIsActive());

        if (user.getBusiness() != null) {
            responseBuilder.businessId(user.getBusiness().getId())
                    .businessName(user.getBusiness().getName());
        }

        return ResponseEntity.ok(responseBuilder.build());
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'DISTRICT_OFFICER')")
    public ResponseEntity<?> updateUser(@PathVariable String id, @RequestBody Map<String, Object> updates) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("User not found"));

        if (updates.containsKey("name")) user.setName((String) updates.get("name"));
        if (updates.containsKey("phone")) user.setPhone((String) updates.get("phone"));
        if (updates.containsKey("jurisdictionId")) user.setJurisdictionId((String) updates.get("jurisdictionId"));
        if (updates.containsKey("isActive")) user.setIsActive((Boolean) updates.get("isActive"));
        if (updates.containsKey("competencyId")) {
            String competencyId = (String) updates.get("competencyId");
            if (competencyId != null && !competencyId.isBlank()) {
                InstrumentType competency = instrumentTypeRepository.findById(competencyId)
                        .orElseThrow(() -> new RuntimeException("Competency not found"));
                user.setCompetency(competency);
            } else {
                user.setCompetency(null);
            }
        }

        if (updates.containsKey("role")) {
            try {
                user.setRole(Role.valueOf((String) updates.get("role")));
            } catch (IllegalArgumentException ignored) {
            }
        }

        user = userRepository.save(user);

        // Return UserResponse with jurisdiction and competency names
        UserResponse.UserResponseBuilder responseBuilder = UserResponse.builder()
                .id(user.getId())
                .name(user.getName())
                .email(user.getEmail())
                .role(user.getRole())
                .jurisdictionId(user.getJurisdictionId())
                .jurisdiction(user.getJurisdictionId() != null ?
                        jurisdictionRepository.findById(user.getJurisdictionId()).map(Jurisdiction::getName).orElse(null) : null)
                .competencyId(user.getCompetency() != null ? user.getCompetency().getId() : null)
                .competencyName(user.getCompetency() != null ? user.getCompetency().getName() : null)
                .isActive(user.getIsActive());

        if (user.getBusiness() != null) {
            responseBuilder.businessId(user.getBusiness().getId())
                    .businessName(user.getBusiness().getName());
        }

        return ResponseEntity.ok(responseBuilder.build());
    }

    /**
     * Permanently removes a user account.
     *
     * Deactivation (soft) is done via PUT /{id} with {"isActive": false} - that keeps the
     * row and everything attached to it. This endpoint is the destructive counterpart and
     * is therefore guarded: it refuses to remove the caller, the last Super Admin, or any
     * account that still owns business records (which would otherwise blow up as a
     * foreign-key violation -> HTTP 500).
     */
    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'DISTRICT_OFFICER')")
    @Transactional
    public ResponseEntity<?> deleteUser(@PathVariable String id, Authentication authentication) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("User not found"));

        // Never let an admin delete the account they are signed in with
        if (user.getEmail() != null && user.getEmail().equalsIgnoreCase(authentication.getName())) {
            return ResponseEntity.badRequest()
                    .body(Map.of("error", "You cannot permanently delete your own account"));
        }

        // Never remove the last Super Admin - that would lock everyone out permanently
        if (user.getRole() == Role.SUPER_ADMIN) {
            long remainingAdmins = userRepository.findAll().stream()
                    .filter(u -> u.getRole() == Role.SUPER_ADMIN)
                    .filter(u -> !u.getId().equals(user.getId()))
                    .filter(u -> Boolean.TRUE.equals(u.getIsActive()))
                    .count();
            if (remainingAdmins == 0) {
                return ResponseEntity.badRequest()
                        .body(Map.of("error", "Cannot delete the last Super Admin account"));
            }
        }

        // All six of these tables hold a foreign key onto users.id with DELETE rule
        // NO ACTION, so deleting while any of them still point here would throw a
        // DataIntegrityViolationException (HTTP 500). Check first and explain instead.
        long applications = applicationRepository.findByApplicantId(id).size();
        long assignments = assignmentRepository.findByAssigneeId(id).size();
        long inspections = inspectionRepository.findByInspectorId(id).size();
        long complaints = complaintRepository.countByUserId(id);
        long auditLogs = auditLogRepository.countByUserId(id);

        if (applications + assignments + inspections + complaints + auditLogs > 0) {
            return ResponseEntity.status(HttpStatus.CONFLICT).body(Map.of(
                    "error",
                    "Cannot permanently delete this account because it still has linked records ("
                            + applications + " application(s), "
                            + assignments + " assignment(s), "
                            + inspections + " inspection(s), "
                            + complaints + " complaint(s), "
                            + auditLogs + " audit log(s)). "
                            + "Deactivate the account instead to disable access without losing history."
            ));
        }

        // Notifications are ephemeral and also reference users.id - clear them so they
        // cannot block the delete. They carry no business history worth keeping.
        notificationRepository.deleteByUserId(id);

        userRepository.deleteById(id);
        return ResponseEntity.noContent().build();
    }
}
