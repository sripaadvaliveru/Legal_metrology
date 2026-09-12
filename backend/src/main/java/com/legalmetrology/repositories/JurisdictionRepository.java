package com.legalmetrology.repositories;

import com.legalmetrology.entities.Jurisdiction;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface JurisdictionRepository extends JpaRepository<Jurisdiction, String> {
    Optional<Jurisdiction> findByJurisdictionCode(String code);
}
