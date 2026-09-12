package com.legalmetrology.repositories;

import com.legalmetrology.entities.ApplicationStatusHistory;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ApplicationStatusHistoryRepository extends JpaRepository<ApplicationStatusHistory, String> {
    List<ApplicationStatusHistory> findByApplicationIdOrderByTimestampAsc(String applicationId);
}
