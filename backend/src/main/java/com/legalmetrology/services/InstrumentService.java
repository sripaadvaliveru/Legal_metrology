package com.legalmetrology.services;

import com.legalmetrology.dto.InstrumentCreateRequest;
import com.legalmetrology.entities.Instrument;
import com.legalmetrology.entities.InstrumentType;
import com.legalmetrology.enums.InstrumentStatus;
import com.legalmetrology.repositories.InstrumentRepository;
import com.legalmetrology.repositories.InstrumentTypeRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;

import java.time.Year;
import java.util.concurrent.atomic.AtomicLong;

@Service
@RequiredArgsConstructor
public class InstrumentService {

    private final InstrumentRepository instrumentRepository;
    private final InstrumentTypeRepository instrumentTypeRepository;

    private static final AtomicLong COUNTER = new AtomicLong(1);

    public Instrument createInstrument(InstrumentCreateRequest request, String userId) {
        InstrumentType type = instrumentTypeRepository.findByName(request.getType())
                .orElseThrow(() -> new RuntimeException("Instrument type not found"));

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
                .status(InstrumentStatus.REGISTERED)
                .build();

        return instrumentRepository.save(instrument);
    }

    public Page<Instrument> getInstruments(Pageable pageable) {
        return instrumentRepository.findAll(pageable);
    }

    public Instrument getInstrumentById(String id) {
        return instrumentRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Instrument not found"));
    }

    public Instrument getInstrumentByInstrumentId(String instrumentId) {
        return instrumentRepository.findByInstrumentId(instrumentId)
                .orElseThrow(() -> new RuntimeException("Instrument not found"));
    }
}
