package com.legalmetrology.entities;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDateTime;
import java.util.HashSet;
import java.util.Set;

@Entity
@Table(name = "instruments")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class Instrument extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private String id;

    @Column(name = "instrument_id", unique = true, nullable = false)
    private String instrumentId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "instrument_type_id")
    private InstrumentType instrumentType;

    @Column(nullable = false)
    private String manufacturer;

    @Column(nullable = false)
    private String model;

    @Column(name = "serial_number", nullable = false)
    private String serialNumber;

    @Column(name = "capacity_range")
    private String capacityRange;

    private String accuracy;

    @Column(name = "year_of_manufacture")
    private Integer yearOfManufacture;

    private String usage;

    @Column(name = "installation_details")
    private String installationDetails;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    @Builder.Default
    private com.legalmetrology.enums.InstrumentStatus status =
        com.legalmetrology.enums.InstrumentStatus.REGISTERED;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "establishment_id", nullable = false)
    private Establishment establishment;

    @JsonIgnore
    @OneToMany(mappedBy = "instrument", cascade = CascadeType.ALL)
    @Builder.Default
    private Set<Application> applications = new HashSet<>();

    @JsonIgnore
    @OneToMany(mappedBy = "instrument", cascade = CascadeType.ALL)
    @Builder.Default
    private Set<Certificate> certificates = new HashSet<>();

    @CreationTimestamp
    @Column(updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    private LocalDateTime updatedAt;
}
