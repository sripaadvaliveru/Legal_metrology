package com.legalmetrology.controllers;

import com.legalmetrology.dto.InstrumentCreateRequest;
import com.legalmetrology.entities.Establishment;
import com.legalmetrology.entities.Instrument;
import com.legalmetrology.entities.User;
import com.legalmetrology.repositories.EstablishmentRepository;
import com.legalmetrology.repositories.UserRepository;
import com.legalmetrology.services.InstrumentService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.ArrayList;
import java.util.List;

@RestController
@RequestMapping("/api/instruments")
@RequiredArgsConstructor
public class InstrumentController {

    private final InstrumentService instrumentService;
    private final UserRepository userRepository;
    private final EstablishmentRepository establishmentRepository;

    @PostMapping
    @PreAuthorize("hasRole('BUSINESS')")
    public ResponseEntity<Instrument> createInstrument(
            @Valid @RequestBody InstrumentCreateRequest request,
            Authentication authentication) {
        return ResponseEntity.ok(instrumentService.createInstrument(request, authentication.getName()));
    }

    @GetMapping
    @PreAuthorize("hasAnyRole('BUSINESS', 'LMO', 'GATC', 'DISTRICT_OFFICER', 'STATE_OFFICER', 'SUPER_ADMIN')")
    public ResponseEntity<Page<Instrument>> getInstruments(Pageable pageable) {
        return ResponseEntity.ok(instrumentService.getInstruments(pageable));
    }

    @GetMapping("/my")
    @PreAuthorize("hasRole('BUSINESS')")
    public ResponseEntity<List<Instrument>> getMyInstruments(Authentication authentication) {
        User user = userRepository.findByEmail(authentication.getName())
                .orElseThrow(() -> new RuntimeException("User not found"));

        if (user.getBusiness() == null) {
            return ResponseEntity.ok(new ArrayList<>());
        }

        List<Establishment> establishments = establishmentRepository.findByBusinessId(user.getBusiness().getId());
        List<Instrument> allInstruments = new ArrayList<>();
        for (Establishment establishment : establishments) {
            allInstruments.addAll(instrumentService.getInstrumentsByEstablishment(establishment.getId()));
        }
        return ResponseEntity.ok(allInstruments);
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAnyRole('BUSINESS', 'LMO', 'GATC', 'DISTRICT_OFFICER', 'STATE_OFFICER', 'SUPER_ADMIN')")
    public ResponseEntity<Instrument> getInstrument(@PathVariable String id) {
        return ResponseEntity.ok(instrumentService.getInstrumentById(id));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('BUSINESS')")
    public ResponseEntity<Instrument> updateInstrument(
            @PathVariable String id,
            @Valid @RequestBody InstrumentCreateRequest request) {
        return ResponseEntity.ok(instrumentService.updateInstrument(id, request));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('BUSINESS')")
    public ResponseEntity<Void> deleteInstrument(@PathVariable String id) {
        instrumentService.deleteInstrument(id);
        return ResponseEntity.noContent().build();
    }
}
