package com.legalmetrology.repositories;

import com.legalmetrology.entities.ChecklistTemplate;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ChecklistTemplateRepository extends JpaRepository<ChecklistTemplate, String> {
    List<ChecklistTemplate> findByInstrumentTypeId(String instrumentTypeId);
}
