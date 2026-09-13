package com.legalmetrology.repositories;

import com.legalmetrology.entities.Instrument;
import com.legalmetrology.enums.InstrumentStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface InstrumentRepository extends JpaRepository<Instrument, String> {
    Optional<Instrument> findByInstrumentId(String instrumentId);
    Page<Instrument> findByStatus(InstrumentStatus status, Pageable pageable);
    Page<Instrument> findByEstablishmentId(String establishmentId, Pageable pageable);
    List<Instrument> findByEstablishmentId(String establishmentId);
    Boolean existsBySerialNumberAndManufacturer(String serialNumber, String manufacturer);
}
