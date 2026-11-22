package com.legalmetrology.dto;

import com.legalmetrology.entities.Application;
import com.legalmetrology.enums.ApplicationStatus;
import com.legalmetrology.enums.ApplicationType;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ApplicationResponse {
    private String id;
    private String applicationNumber;
    private String instrumentId;
    private String instrumentName;
    private String applicantId;
    private String applicantName;
    private String applicantEmail;
    private ApplicationType type;
    private ApplicationStatus status;
    private LocalDateTime submittedAt;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    // Assignment information (if any)
    private String assignmentId;
    private String assigneeId;
    private String assigneeName;
    private String assigneeEmail;
    private String assigneeJurisdiction;
    private String assigneeJurisdictionId;
    private String assigneeCompetency;
    private String assigneeCompetencyId;
    private Double assignmentScore;
    private String assignmentMethod;
    private LocalDateTime assignedAt;
}