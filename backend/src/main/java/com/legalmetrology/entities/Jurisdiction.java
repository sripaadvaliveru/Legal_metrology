package com.legalmetrology.entities;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "jurisdictions")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class Jurisdiction extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private String id;

    @Column(nullable = false)
    private String name;

    @Column(name = "jurisdiction_code", unique = true)
    private String jurisdictionCode;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    @Builder.Default
    private JurisdictionLevel level = JurisdictionLevel.DISTRICT;

    @Column(name = "parent_id")
    private String parentId;

    private String state;

    private String district;

    public enum JurisdictionLevel {
        STATE,
        DISTRICT,
        ZONE
    }
}
