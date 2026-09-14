package com.legalmetrology.controllers;

import com.legalmetrology.entities.ChecklistTemplate;
import com.legalmetrology.services.ChecklistTemplateService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/checklist-templates")
@RequiredArgsConstructor
public class ChecklistTemplateServiceController {

    private final ChecklistTemplateService checklistTemplateService;

    @GetMapping
    @PreAuthorize("hasAnyRole('LMO', 'GATC', 'DISTRICT_OFFICER', 'STATE_OFFICER', 'SUPER_ADMIN')")
    public ResponseEntity<List<ChecklistTemplate>> getAll(
            @RequestParam(required = false) String instrumentTypeId) {
        if (instrumentTypeId != null) {
            return ResponseEntity.ok(checklistTemplateService.getByInstrumentTypeId(instrumentTypeId));
        }
        return ResponseEntity.ok(checklistTemplateService.getAll());
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAnyRole('LMO', 'GATC', 'DISTRICT_OFFICER', 'STATE_OFFICER', 'SUPER_ADMIN')")
    public ResponseEntity<ChecklistTemplate> getById(@PathVariable String id) {
        return ResponseEntity.ok(checklistTemplateService.getById(id));
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('DISTRICT_OFFICER', 'STATE_OFFICER', 'SUPER_ADMIN')")
    public ResponseEntity<ChecklistTemplate> create(@RequestBody Map<String, String> request) {
        return ResponseEntity.ok(checklistTemplateService.create(
                request.get("instrumentTypeId"),
                request.get("templateName"),
                request.get("description"),
                request.get("checklistItems")));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('DISTRICT_OFFICER', 'STATE_OFFICER', 'SUPER_ADMIN')")
    public ResponseEntity<ChecklistTemplate> update(@PathVariable String id, @RequestBody Map<String, String> request) {
        return ResponseEntity.ok(checklistTemplateService.update(
                id,
                request.get("templateName"),
                request.get("description"),
                request.get("checklistItems")));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyRole('DISTRICT_OFFICER', 'STATE_OFFICER', 'SUPER_ADMIN')")
    public ResponseEntity<Void> delete(@PathVariable String id) {
        checklistTemplateService.delete(id);
        return ResponseEntity.noContent().build();
    }
}
