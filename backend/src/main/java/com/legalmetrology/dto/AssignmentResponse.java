package com.legalmetrology.dto;

import com.legalmetrology.enums.AssignmentMethod;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AssignmentResponse {
    private String id;
    private String applicationId; // We could also include full application details if needed
    private String assigneeId;
    private UserResponse assignee; // Use UserResponse instead of raw User to get jurisdiction name
    private AssignmentMethod method;
    private Double score;
    private String reason;
    private String previousAssigneeId;
    private LocalDateTime assignedAt;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}