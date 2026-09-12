package com.legalmetrology.repositories;

import com.legalmetrology.entities.AuditLog;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface AuditLogRepository extends JpaRepository<AuditLog, String> {
    List<AuditLog> findByEntityTypeAndEntityId(String entityType, String entityId);
}
