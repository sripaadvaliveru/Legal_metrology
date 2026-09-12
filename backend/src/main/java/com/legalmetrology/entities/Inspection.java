package com.legalmetrology.entities;

import com.legalmetrology.enums.InspectionResult;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "inspections")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class Inspection {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private String id;

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "appointment_id", nullable = false)
    private Appointment appointment;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "inspector_id", nullable = false)
    private User inspector;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    @Builder.Default
    private InspectionResult result = InspectionResult.PENDING;

    private String remarks;

    @ElementCollection
    @CollectionTable(name = "inspection_evidence_urls", joinColumns = @JoinColumn(name = "inspection_id"))
    @Column(name = "evidence_url")
    @Builder.Default
    private List<String> evidenceUrls = new ArrayList<>();

    private Double latitude;

    private Double longitude;

    @Column(name = "started_at")
    private LocalDateTime startedAt;

    @Column(name = "completed_at")
    private LocalDateTime completedAt;

    @OneToMany(mappedBy = "inspection", cascade = CascadeType.ALL)
    @Builder.Default
    private List<Measurement> measurements = new ArrayList<>();

    @CreationTimestamp
    @Column(updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    private LocalDateTime updatedAt;
}
