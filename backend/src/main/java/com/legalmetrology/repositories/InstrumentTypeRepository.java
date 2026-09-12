package com.legalmetrology.repositories;

import com.legalmetrology.entities.InstrumentType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface InstrumentTypeRepository extends JpaRepository<InstrumentType, String> {
    Optional<InstrumentType> findByName(String name);
}
