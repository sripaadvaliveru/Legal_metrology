package com.legalmetrology.repositories;

import com.legalmetrology.entities.Inspection;
import com.legalmetrology.enums.InspectionResult;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface InspectionRepository extends JpaRepository<Inspection, String> {
    List<Inspection> findByInspectorId(String inspectorId);
    List<Inspection> findByResult(InspectionResult result);
    java.util.Optional<Inspection> findByAppointmentId(String appointmentId);

    /**
     * Inspections belonging to a business, walking
     * inspection -&gt; appointment -&gt; application -&gt; instrument -&gt; establishment -&gt; business.
     * Mirrors {@link CertificateRepository#findByBusinessId(String)} so per-tenant dashboards
     * can scope both certificates and inspections the same way.
     */
    @Query("SELECT i FROM Inspection i WHERE i.appointment.application.instrument.establishment.business.id = :businessId")
    List<Inspection> findByBusinessId(@Param("businessId") String businessId);
}
