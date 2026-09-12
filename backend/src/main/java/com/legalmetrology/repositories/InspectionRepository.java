package com.legalmetrology.repositories;

import com.legalmetrology.entities.Inspection;
import com.legalmetrology.enums.InspectionResult;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface InspectionRepository extends JpaRepository<Inspection, String> {
    List<Inspection> findByInspectorId(String inspectorId);
    List<Inspection> findByResult(InspectionResult result);
}
