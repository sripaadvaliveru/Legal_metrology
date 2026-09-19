package com.legalmetrology.entities;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.legalmetrology.enums.AssignmentMethod;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;

@Entity
@Table(name = "assignments")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class Assignment extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private String id;

    @JsonIgnoreProperties({"assignments", "statusHistory", "appointment"})
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "application_id", nullable = false)
    private Application application;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "assignee_id", nullable = false)
    private User assignee;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private AssignmentMethod method;

    private Double score;

    private String reason;

    @Column(name = "previous_assignee_id")
    private String previousAssigneeId;

    @CreationTimestamp
    @Column(updatable = false)
    private LocalDateTime assignedAt;
}
