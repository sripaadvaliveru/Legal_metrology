package com.legalmetrology.controllers;

import com.legalmetrology.dto.InstrumentCreateRequest;
import com.legalmetrology.entities.Instrument;
import com.legalmetrology.services.InstrumentService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/instruments")
@RequiredArgsConstructor
public class InstrumentController {

    private final InstrumentService instrumentService;

    @PostMapping
    @PreAuthorize("hasRole('BUSINESS')")
    public ResponseEntity<Instrument> createInstrument(
            @Valid @RequestBody InstrumentCreateRequest request,
            org.springframework.security.core.Authentication authentication) {
        return ResponseEntity.ok(instrumentService.createInstrument(request, authentication.getName()));
    }

    @GetMapping
    @PreAuthorize("hasAnyRole('BUSINESS', 'LMO', 'GATC', 'DISTRICT_OFFICER', 'STATE_OFFICER', 'SUPER_ADMIN')")
    public ResponseEntity<Page<Instrument>> getInstruments(Pageable pageable) {
        return ResponseEntity.ok(instrumentService.getInstruments(pageable));
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAnyRole('BUSINESS', 'LMO', 'GATC', 'DISTRICT_OFFICER', 'STATE_OFFICER', 'SUPER_ADMIN')")
    public ResponseEntity<Instrument> getInstrument(@PathVariable String id) {
        return ResponseEntity.ok(instrumentService.getInstrumentById(id));
    }
}
