package com.legalmetrology.services;

import com.legalmetrology.entities.*;
import com.legalmetrology.enums.ApplicationStatus;
import com.legalmetrology.enums.ApplicationType;
import com.legalmetrology.enums.AssignmentMethod;
import com.legalmetrology.repositories.*;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Comparator;
import java.util.List;

@Service
@RequiredArgsConstructor
public class AssignmentService {

    private final AssignmentRepository assignmentRepository;
    private final ApplicationRepository applicationRepository;
    private final UserRepository userRepository;
    private final AuditLogRepository auditLogRepository;
    private final NotificationService notificationService;

    private static final double WEIGHT_JURISDICTION = 0.40;
    private static final double WEIGHT_COMPETENCY = 0.25;
    private static final double WEIGHT_AVAILABILITY = 0.15;
    private static final double WEIGHT_WORKLOAD = 0.10;
    private static final double WEIGHT_DISTANCE = 0.05;
    private static final double WEIGHT_PRIORITY = 0.05;

    @Transactional
    public Assignment autoAssign(String applicationId) {
        Application application = applicationRepository.findById(applicationId)
                .orElseThrow(() -> new RuntimeException("Application not found"));

        List<User> eligibleLmos = userRepository.findAll().stream()
                .filter(u -> u.getRole() == com.legalmetrology.enums.Role.LMO)
                .filter(User::getIsActive)
                .toList();

        if (eligibleLmos.isEmpty()) {
            throw new RuntimeException("No eligible LMOs found");
        }

        User bestCandidate = eligibleLmos.stream()
                .max(Comparator.comparingDouble(lmo -> calculateScore(lmo, application)))
                .orElseThrow(() -> new RuntimeException("No suitable LMO found"));

        double score = calculateScore(bestCandidate, application);

        Assignment assignment = Assignment.builder()
                .application(application)
                .assignee(bestCandidate)
                .method(AssignmentMethod.AUTO)
                .score(score)
                .build();

        assignment = assignmentRepository.save(assignment);

        application.setStatus(ApplicationStatus.ASSIGNED);
        applicationRepository.save(application);

        auditLog(AssignmentMethod.AUTO, application, null, bestCandidate, score);

        try {
            notificationService.createNotificationByEmail(bestCandidate.getEmail(), "ASSIGNMENT_AUTO",
                    "You have been auto-assigned to application " + application.getApplicationNumber(),
                    "Assignment", assignment.getId());
            notificationService.createNotificationByEmail(application.getApplicant().getEmail(), "APPLICATION_ASSIGNED",
                    "Your application " + application.getApplicationNumber() + " has been assigned to " + bestCandidate.getName(),
                    "Assignment", assignment.getId());
        } catch (Exception ignored) {}

        return assignment;
    }

    @Transactional
    public Assignment manualAssign(String applicationId, String assigneeId, String actorEmail) {
        Application application = applicationRepository.findById(applicationId)
                .orElseThrow(() -> new RuntimeException("Application not found"));

        User assignee = userRepository.findById(assigneeId)
                .orElseThrow(() -> new RuntimeException("Assignee not found"));

        Assignment assignment = Assignment.builder()
                .application(application)
                .assignee(assignee)
                .method(AssignmentMethod.MANUAL)
                .build();

        assignment = assignmentRepository.save(assignment);

        application.setStatus(ApplicationStatus.ASSIGNED);
        applicationRepository.save(application);

        try {
            notificationService.createNotificationByEmail(assignee.getEmail(), "ASSIGNMENT_MANUAL",
                    "You have been assigned to application " + application.getApplicationNumber(),
                    "Assignment", assignment.getId());
            notificationService.createNotificationByEmail(application.getApplicant().getEmail(), "APPLICATION_ASSIGNED",
                    "Your application " + application.getApplicationNumber() + " has been assigned to " + assignee.getName(),
                    "Assignment", assignment.getId());
        } catch (Exception ignored) {}

        return assignment;
    }

    @Transactional
    public Assignment reassign(String assignmentId, String newAssigneeId, String reason, String actorEmail) {
        Assignment existing = assignmentRepository.findById(assignmentId)
                .orElseThrow(() -> new RuntimeException("Assignment not found"));

        User newAssignee = userRepository.findById(newAssigneeId)
                .orElseThrow(() -> new RuntimeException("New assignee not found"));

        String previousAssigneeId = existing.getAssignee().getId();

        existing.setPreviousAssigneeId(previousAssigneeId);
        existing.setAssignee(newAssignee);
        existing.setMethod(AssignmentMethod.REASSIGNED);
        existing.setReason(reason);

        return assignmentRepository.save(existing);
    }

    private double calculateScore(User lmo, Application application) {
        // Jurisdiction score: 1.0 if LMO's jurisdiction matches instrument's establishment jurisdiction
        double jurisdictionScore = 0.0;
        if (lmo.getJurisdictionId() != null) {
            try {
                Instrument instrument = application.getInstrument();
                if (instrument != null && instrument.getEstablishment() != null) {
                    Establishment establishment = instrument.getEstablishment();
                    if (establishment.getJurisdiction() != null) {
                        if (lmo.getJurisdictionId().equals(establishment.getJurisdiction().getId())) {
                            jurisdictionScore = 1.0;
                        }
                    }
                }
            } catch (Exception e) {
                // If any error in navigation, jurisdiction score remains 0.0
            }
        }

        // Competency score: 1.0 if LMO has competency for the instrument type
        double competencyScore = 0.0;
        if (lmo.getCompetency() != null) {
            try {
                Instrument instrument = application.getInstrument();
                if (instrument != null && instrument.getInstrumentType() != null) {
                    if (lmo.getCompetency().getId().equals(instrument.getInstrumentType().getId())) {
                        competencyScore = 1.0;
                    }
                }
            } catch (Exception e) {
                // If any error in navigation, competency score remains 0.0
            }
        }

        // Availability score: 1.0 if LMO is active
        double availabilityScore = lmo.getIsActive() != null && lmo.getIsActive() ? 1.0 : 0.0;

        // Workload score: Based on current assignment count (inverse - lower workload = higher score)
        // Max 10 assignments considered as full workload
        double workloadScore = 1.0;
        try {
            List<Assignment> currentAssignments = assignmentRepository.findByAssigneeId(lmo.getId());
            int assignmentCount = currentAssignments.size();
            // Normalize: 0 assignments = 1.0 score, 10+ assignments = 0.0 score
            workloadScore = Math.max(0.0, 1.0 - (assignmentCount / 10.0));
        } catch (Exception e) {
            // If error calculating workload, default to neutral score
            workloadScore = 0.5;
        }

        // Distance score: Since we don't have lat/long for users, use jurisdiction proximity
        // For now, if jurisdiction matches, full score; if same state but different district, partial; else 0
        double distanceScore = 0.0;
        if (lmo.getJurisdictionId() != null) {
            try {
                Instrument instrument = application.getInstrument();
                if (instrument != null && instrument.getEstablishment() != null) {
                    Establishment establishment = instrument.getEstablishment();
                    if (establishment.getJurisdiction() != null) {
                        String lmoJurisdictionId = lmo.getJurisdictionId();
                        String establishmentJurisdictionId = establishment.getJurisdiction().getId();

                        if (lmoJurisdictionId.equals(establishmentJurisdictionId)) {
                            distanceScore = 1.0; // Same jurisdiction
                        } else {
                            // Check if same state (assuming jurisdiction structure includes state)
                            // This is simplified - in reality we'd want to check jurisdiction hierarchy
                            distanceScore = 0.3; // Partial credit for nearby jurisdiction
                        }
                    }
                }
            } catch (Exception e) {
                // If error, distance score remains 0.0
            }
        }

        // Priority score: Based on application type and urgency
        double priorityScore = 0.5; // Default medium priority
        try {
            ApplicationType type = application.getType();
            if (type != null) {
                // Re-verification might get slightly higher priority to maintain validity
                if (type == ApplicationType.RE_VERIFICATION) {
                    priorityScore = 0.7;
                }
                // Initial verification gets standard priority
                else if (type == ApplicationType.INITIAL_VERIFICATION) {
                    priorityScore = 0.5;
                }
            }

            // Could also factor in how long application has been pending, etc.
        } catch (Exception e) {
            // If error, priority score remains 0.5
        }

        return (jurisdictionScore * WEIGHT_JURISDICTION)
             + (competencyScore * WEIGHT_COMPETENCY)
             + (availabilityScore * WEIGHT_AVAILABILITY)
             + (workloadScore * WEIGHT_WORKLOAD)
             + (distanceScore * WEIGHT_DISTANCE)
             + (priorityScore * WEIGHT_PRIORITY);
    }

    private void auditLog(AssignmentMethod method, Application application,
                          User previous, User assignee, double score) {
        AuditLog log = AuditLog.builder()
                .action("ASSIGNMENT_" + method.name())
                .entityType("Application")
                .entityId(application.getId())
                .newValue("Assigned to " + assignee.getId() + " with score " + score)
                .build();
        auditLogRepository.save(log);
    }

    public List<Assignment> getAssignmentsByApplication(String applicationId) {
        return assignmentRepository.findByApplicationId(applicationId);
    }
}
