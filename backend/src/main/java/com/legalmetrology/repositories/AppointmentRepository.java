package com.legalmetrology.repositories;

import com.legalmetrology.entities.Appointment;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface AppointmentRepository extends JpaRepository<Appointment, String> {
    List<Appointment> findByAssignmentAssigneeId(String assigneeId);
}
