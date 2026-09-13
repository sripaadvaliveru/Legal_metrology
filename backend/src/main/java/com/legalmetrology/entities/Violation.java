package com.legalmetrology.entities;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;

@Entity
@Table(name = "violations")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class Violation extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private String id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "instrument_id")
    private Instrument instrument;

    @Column(name = "violation_type", nullable = false)
    private String violationType;

    @Column(columnDefinition = "TEXT")
    private String description;

    @Column(name = "reported_by")
    private String reportedBy;

    @Column(name = "report_date")
    private LocalDateTime reportDate;

    @Enumerated(EnumType.STRING)
    @Builder.Default
    private ViolationStatus status = ViolationStatus.REPORTED;

    public enum ViolationStatus {
        REPORTED,
        UNDER_INVESTIGATION,
        RESOLVED,
        DISMISSED
    }

    @CreationTimestamp
    @Column(updatable = false)
    private LocalDateTime createdAt;
}
