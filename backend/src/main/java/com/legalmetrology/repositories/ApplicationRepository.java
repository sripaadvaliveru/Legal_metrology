package com.legalmetrology.repositories;

import com.legalmetrology.entities.Application;
import com.legalmetrology.enums.ApplicationStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ApplicationRepository extends JpaRepository<Application, String> {
    Optional<Application> findByApplicationNumber(String applicationNumber);
    List<Application> findByApplicantId(String applicantId);
    List<Application> findByInstrumentId(String instrumentId);
    List<Application> findByStatus(ApplicationStatus status);
}
