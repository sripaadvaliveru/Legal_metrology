package com.legalmetrology.services;

import com.legalmetrology.dto.InstrumentCreateRequest;
import com.legalmetrology.entities.Establishment;
import com.legalmetrology.entities.Instrument;
import com.legalmetrology.entities.InstrumentType;
import com.legalmetrology.enums.InstrumentStatus;
import com.legalmetrology.repositories.EstablishmentRepository;
import com.legalmetrology.repositories.InstrumentRepository;
import com.legalmetrology.repositories.InstrumentTypeRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import jakarta.annotation.PostConstruct;
import java.time.Year;
import java.util.List;
import java.util.concurrent.atomic.AtomicLong;

@Service
@RequiredArgsConstructor
public class InstrumentService {

    private final InstrumentRepository instrumentRepository;
    private final InstrumentTypeRepository instrumentTypeRepository;
    private final EstablishmentRepository establishmentRepository;

    private final AtomicLong COUNTER = new AtomicLong(0);

    @PostConstruct
    public void init() {
        long maxSeq = instrumentRepository.findAll().stream()
                .map(Instrument::getInstrumentId)
                .filter(id -> id != null && id.startsWith("LM-INST-"))
                .map(id -> {
                    try { return Long.parseLong(id.substring(id.lastIndexOf('-') + 1)); }
                    catch (Exception e) { return 0L; }
                })
                .mapToLong(Long::longValue)
                .max().orElse(0L);
        COUNTER.set(maxSeq + 1);
    }

    public Instrument createInstrument(InstrumentCreateRequest request, String userId) {
        InstrumentType type = instrumentTypeRepository.findById(request.getType())
                .orElseGet(() -> instrumentTypeRepository.findByName(request.getType())
                        .orElseThrow(() -> new RuntimeException("Instrument type not found")));

        Establishment establishment = establishmentRepository.findById(request.getEstablishmentId())
                .orElseThrow(() -> new RuntimeException("Establishment not found"));

        String instrumentId = String.format("LM-INST-%d-%06d",
                Year.now().getValue(), COUNTER.getAndIncrement());

        Instrument instrument = Instrument.builder()
                .instrumentId(instrumentId)
                .instrumentType(type)
                .manufacturer(request.getManufacturer())
                .model(request.getModel())
                .serialNumber(request.getSerialNumber())
                .capacityRange(request.getCapacityRange())
                .accuracy(request.getAccuracy())
                .yearOfManufacture(request.getYearOfManufacture())
                .usage(request.getUsage())
                .installationDetails(request.getInstallationDetails())
                .establishment(establishment)
                .status(InstrumentStatus.REGISTERED)
                .build();

        return instrumentRepository.save(instrument);
    }

    @Transactional(readOnly = true)
    public Page<Instrument> getInstruments(Pageable pageable) {
        return instrumentRepository.findAll(pageable);
    }

    @Transactional(readOnly = true)
    public List<Instrument> getInstrumentsByEstablishment(String establishmentId) {
        return instrumentRepository.findByEstablishmentId(establishmentId);
    }

    @Transactional(readOnly = true)
    public Instrument getInstrumentById(String id) {
        return instrumentRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Instrument not found"));
    }

    public Instrument getInstrumentByInstrumentId(String instrumentId) {
        return instrumentRepository.findByInstrumentId(instrumentId)
                .orElseThrow(() -> new RuntimeException("Instrument not found"));
    }
}
