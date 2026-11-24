package com.legalmetrology.controllers;

import com.legalmetrology.entities.Jurisdiction;
import com.legalmetrology.repositories.JurisdictionRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

/**
 * Jurisdictions are reference data — seeded once and never created at runtime — but they need to be
 * listable so the admin UI can offer them as a choice instead of a free-text box.
 *
 * <p>That free-text box was a live bug: the placeholder invited {@code JUR-DEL-001} while the real
 * keys were UUIDs, so anything typed there could never match {@code jurisdictions.id}. Jurisdiction
 * names rendered as null and, worse, {@code AssignmentService}'s jurisdiction matcher
 * ({@code lmo.getJurisdictionId().equals(establishment.getJurisdiction().getId())}) silently failed
 * for that officer, so they were never auto-assigned work.</p>
 */
@RestController
@RequestMapping("/api/jurisdictions")
@RequiredArgsConstructor
public class JurisdictionController {

    private final JurisdictionRepository jurisdictionRepository;

    @GetMapping
    public ResponseEntity<List<Jurisdiction>> getAllJurisdictions() {
        return ResponseEntity.ok(jurisdictionRepository.findAll());
    }
}
