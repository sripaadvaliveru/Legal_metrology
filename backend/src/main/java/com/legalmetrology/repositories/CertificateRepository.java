package com.legalmetrology.repositories;

import com.legalmetrology.entities.Certificate;
import com.legalmetrology.enums.CertificateStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface CertificateRepository extends JpaRepository<Certificate, String> {
    Optional<Certificate> findByCertificateNumber(String certificateNumber);
    Optional<Certificate> findByQrToken(String qrToken);
    List<Certificate> findByInstrumentId(String instrumentId);
    List<Certificate> findByStatus(CertificateStatus status);

    @Query("SELECT c FROM Certificate c WHERE c.instrument.establishment.business.id = :businessId")
    List<Certificate> findByBusinessId(@Param("businessId") String businessId);
}
