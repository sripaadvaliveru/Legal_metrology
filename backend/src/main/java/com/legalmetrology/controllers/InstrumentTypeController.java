package com.legalmetrology.controllers;

import com.legalmetrology.entities.InstrumentType;
import com.legalmetrology.repositories.InstrumentTypeRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/instrument-types")
@RequiredArgsConstructor
public class InstrumentTypeController {

    private final InstrumentTypeRepository instrumentTypeRepository;

    @GetMapping
    public ResponseEntity<List<InstrumentType>> getAllInstrumentTypes() {
        return ResponseEntity.ok(instrumentTypeRepository.findAll());
    }
}
