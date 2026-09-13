package com.legalmetrology.entities;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDateTime;

@Entity
@Table(name = "equipment")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class Equipment extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private String id;

    @Column(name = "equipment_id", unique = true, nullable = false)
    private String equipmentId; // e.g. EQ-001

    @Column(nullable = false)
    private String name;

    private String description;

    @Column(name = "gatc_id")
    private String gatcId;

    @Column(name = "calibration_valid_until")
    private LocalDateTime calibrationValidUntil;

    @Column(name = "is_calibration_valid")
    @Builder.Default
    private Boolean isCalibrationValid = true;

    @CreationTimestamp
    @Column(updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    private LocalDateTime updatedAt;
}
