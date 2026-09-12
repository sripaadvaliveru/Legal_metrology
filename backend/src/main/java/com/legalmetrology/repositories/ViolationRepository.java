package com.legalmetrology.repositories;

import com.legalmetrology.entities.Violation;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface ViolationRepository extends JpaRepository<Violation, String> {
}
