package com.legalmetrology.controllers;

import com.legalmetrology.entities.Appointment;
import com.legalmetrology.entities.User;
import com.legalmetrology.enums.AppointmentStatus;
import com.legalmetrology.repositories.AppointmentRepository;
import com.legalmetrology.repositories.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/appointments")
@RequiredArgsConstructor
public class AppointmentController {

    private final AppointmentRepository appointmentRepository;
    private final UserRepository userRepository;

    @GetMapping("/my")
    @PreAuthorize("hasAnyRole('LMO', 'GATC')")
    public ResponseEntity<List<Appointment>> getMyAppointments(Authentication authentication) {
        User user = userRepository.findByEmail(authentication.getName())
                .orElseThrow(() -> new RuntimeException("User not found"));
        List<Appointment> appointments = appointmentRepository.findByAssignmentAssigneeId(user.getId());
        return ResponseEntity.ok(appointments);
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAnyRole('LMO', 'GATC', 'DISTRICT_OFFICER', 'STATE_OFFICER', 'SUPER_ADMIN')")
    public ResponseEntity<Appointment> getAppointment(@PathVariable String id) {
        Appointment appointment = appointmentRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Appointment not found"));
        return ResponseEntity.ok(appointment);
    }

    @PatchMapping("/{id}/complete")
    @PreAuthorize("hasAnyRole('LMO', 'GATC')")
    public ResponseEntity<Appointment> completeAppointment(@PathVariable String id) {
        Appointment appointment = appointmentRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Appointment not found"));
        appointment.setStatus(AppointmentStatus.COMPLETED);
        return ResponseEntity.ok(appointmentRepository.save(appointment));
    }
}
