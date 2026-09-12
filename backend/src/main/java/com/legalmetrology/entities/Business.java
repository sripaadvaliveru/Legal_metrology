package com.legalmetrology.entities;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDateTime;
import java.util.HashSet;
import java.util.Set;

@Entity
@Table(name = "businesses")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class Business {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private String id;

    @Column(nullable = false)
    private String name;

    private String registrationNumber;

    private String gstNumber;

    private String address;

    private String city;

    private String state;

    private String pincode;

    @Column(name = "contact_person")
    private String contactPerson;

    private String phone;

    private String email;

    @OneToMany(mappedBy = "business", cascade = CascadeType.ALL)
    @Builder.Default
    private Set<Establishment> establishments = new HashSet<>();

    @OneToMany(mappedBy = "business", cascade = CascadeType.ALL)
    @Builder.Default
    private Set<User> users = new HashSet<>();

    @CreationTimestamp
    @Column(updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    private LocalDateTime updatedAt;
}
