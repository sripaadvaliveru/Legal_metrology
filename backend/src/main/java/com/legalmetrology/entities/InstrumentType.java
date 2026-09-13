package com.legalmetrology.entities;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import lombok.*;

import java.util.HashSet;
import java.util.Set;

@Entity
@Table(name = "instrument_types")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class InstrumentType extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private String id;

    @Column(nullable = false, unique = true)
    private String name;

    private String description;

    @Column(name = "validity_months")
    @Builder.Default
    private Integer validityMonths = 12;

    @JsonIgnore
    @OneToMany(mappedBy = "instrumentType", cascade = CascadeType.ALL)
    @Builder.Default
    private Set<VerificationRule> verificationRules = new HashSet<>();

    @JsonIgnore
    @OneToMany(mappedBy = "instrumentType", cascade = CascadeType.ALL)
    @Builder.Default
    private Set<ChecklistTemplate> checklistTemplates = new HashSet<>();
}
