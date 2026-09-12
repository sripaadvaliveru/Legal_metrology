package com.legalmetrology.repositories;

import com.legalmetrology.entities.VerificationRule;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface VerificationRuleRepository extends JpaRepository<VerificationRule, String> {
    List<VerificationRule> findByInstrumentTypeId(String instrumentTypeId);
}
