package com.legalmetrology.services;

import com.legalmetrology.entities.ChecklistTemplate;
import com.legalmetrology.entities.InstrumentType;
import com.legalmetrology.repositories.ChecklistTemplateRepository;
import com.legalmetrology.repositories.InstrumentTypeRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class ChecklistTemplateService {

    private final ChecklistTemplateRepository checklistTemplateRepository;
    private final InstrumentTypeRepository instrumentTypeRepository;

    @Transactional(readOnly = true)
    public List<ChecklistTemplate> getAll() {
        return checklistTemplateRepository.findAll();
    }

    @Transactional(readOnly = true)
    public List<ChecklistTemplate> getByInstrumentTypeId(String instrumentTypeId) {
        return checklistTemplateRepository.findByInstrumentTypeId(instrumentTypeId);
    }

    @Transactional(readOnly = true)
    public ChecklistTemplate getById(String id) {
        return checklistTemplateRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Checklist template not found"));
    }

    @Transactional
    public ChecklistTemplate create(String instrumentTypeId, String templateName, String description, String checklistItems) {
        InstrumentType instrumentType = instrumentTypeRepository.findById(instrumentTypeId)
                .orElseThrow(() -> new RuntimeException("Instrument type not found"));

        ChecklistTemplate template = ChecklistTemplate.builder()
                .instrumentType(instrumentType)
                .templateName(templateName)
                .description(description)
                .checklistItems(checklistItems)
                .version(1)
                .build();

        return checklistTemplateRepository.save(template);
    }

    @Transactional
    public ChecklistTemplate update(String id, String templateName, String description, String checklistItems) {
        ChecklistTemplate template = getById(id);
        template.setTemplateName(templateName);
        template.setDescription(description);
        template.setChecklistItems(checklistItems);
        template.setVersion(template.getVersion() + 1);
        return checklistTemplateRepository.save(template);
    }

    @Transactional
    public void delete(String id) {
        checklistTemplateRepository.deleteById(id);
    }
}
