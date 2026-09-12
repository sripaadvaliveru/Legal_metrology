package com.legalmetrology.repositories;

import com.legalmetrology.entities.Assignment;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface AssignmentRepository extends JpaRepository<Assignment, String> {
    List<Assignment> findByApplicationId(String applicationId);
    Optional<Assignment> findByApplicationIdAndAssigneeId(String applicationId, String assigneeId);
}
