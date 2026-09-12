package com.legalmetrology.entities;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "checklist_templates")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class ChecklistTemplate {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private String id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "instrument_type_id", nullable = false)
    private InstrumentType instrumentType;

    @Column(name = "template_name", nullable = false)
    private String templateName;

    @Column(columnDefinition = "TEXT")
    private String description;

    @Column(name = "checklist_items", columnDefinition = "TEXT", nullable = false)
    private String checklistItems; // JSON array of checklist items

    @Column(name = "version")
    @Builder.Default
    private Integer version = 1;
}
