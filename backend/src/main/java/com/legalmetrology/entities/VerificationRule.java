package com.legalmetrology.entities;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "verification_rules")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class VerificationRule extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private String id;

    @JsonIgnore
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "instrument_type_id", nullable = false)
    private InstrumentType instrumentType;

    @Column(name = "rule_name", nullable = false)
    private String ruleName;

    @Column(columnDefinition = "TEXT")
    private String description;

    @Column(name = "validity_months")
    private Integer validityMonths;

    @Column(name = "requires_gatc")
    @Builder.Default
    private Boolean requiresGatc = false;

    @Column(columnDefinition = "TEXT")
    private String checklistItems;

    @Column(name = "tolerance_rules", columnDefinition = "TEXT")
    private String toleranceRules;

    @Column(name = "version")
    @Builder.Default
    private Integer version = 1;
}
