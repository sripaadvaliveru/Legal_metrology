package com.legalmetrology.repositories;

import com.legalmetrology.entities.Certificate;
import com.legalmetrology.enums.CertificateStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

@Repository
public interface CertificateRepository extends JpaRepository<Certificate, String> {
    Optional<Certificate> findByCertificateNumber(String certificateNumber);
    Optional<Certificate> findByQrToken(String qrToken);
    List<Certificate> findByInstrumentId(String instrumentId);
    List<Certificate> findByStatus(CertificateStatus status);
    List<Certificate> findByStatusAndValidUntilBetween(CertificateStatus status, LocalDate from, LocalDate to);
    List<Certificate> findByStatusAndValidUntilBefore(CertificateStatus status, LocalDate date);

    @Query("SELECT c FROM Certificate c WHERE c.instrument.establishment.business.id = :businessId")
    List<Certificate> findByBusinessId(@Param("businessId") String businessId);

    @Query("SELECT c FROM Certificate c WHERE " +
           "(:businessId IS NOT NULL AND c.instrument.establishment.business.id = :businessId) OR " +
           "(c.inspection.appointment.application.applicant.id = :userId)")
    List<Certificate> findByBusinessIdOrUserId(@Param("businessId") String businessId, @Param("userId") String userId);
}
