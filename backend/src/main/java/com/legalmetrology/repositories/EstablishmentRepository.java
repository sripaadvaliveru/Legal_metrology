package com.legalmetrology.repositories;

import com.legalmetrology.entities.Establishment;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface EstablishmentRepository extends JpaRepository<Establishment, String> {
    List<Establishment> findByBusinessId(String businessId);
}
