package com.legalmetrology.entities;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "measurements")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class Measurement {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private String id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "inspection_id", nullable = false)
    private Inspection inspection;

    private String parameter;

    @Column(name = "observed_value")
    private String observedValue;

    private String tolerance;

    @Column(name = "within_tolerance")
    private Boolean withinTolerance;

    private String remarks;
}
