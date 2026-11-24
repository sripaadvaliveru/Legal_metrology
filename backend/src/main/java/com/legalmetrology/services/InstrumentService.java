package com.legalmetrology.services;

import com.legalmetrology.dto.InstrumentCreateRequest;
import com.legalmetrology.entities.Establishment;
import com.legalmetrology.entities.Instrument;
import com.legalmetrology.entities.InstrumentType;
import com.legalmetrology.entities.User;
import com.legalmetrology.enums.InstrumentStatus;
import com.legalmetrology.repositories.EstablishmentRepository;
import com.legalmetrology.repositories.InstrumentRepository;
import com.legalmetrology.repositories.InstrumentTypeRepository;
import com.legalmetrology.repositories.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class InstrumentService {

    private final InstrumentRepository instrumentRepository;
    private final InstrumentTypeRepository instrumentTypeRepository;
    private final EstablishmentRepository establishmentRepository;
    private final UserRepository userRepository;

    public Instrument createInstrument(InstrumentCreateRequest request, String userEmail) {
        InstrumentType type = instrumentTypeRepository.findById(request.getType())
                .orElseGet(() -> instrumentTypeRepository.findByName(request.getType())
                        .orElseThrow(() -> new RuntimeException("Instrument type not found")));

        Establishment establishment = establishmentRepository.findById(request.getEstablishmentId())
                .orElseThrow(() -> new RuntimeException("Establishment not found"));

        // Instrument IDs are the one ID in the system derived from another: the owner's user ID
        // plus a per-owner extension -> USR-2026-01-INST-0001. The controller passes the
        // authenticated principal's email, which is the only ownership handle available here.
        User owner = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new RuntimeException("User not found"));
        String instrumentId = IdGenerator.nextInstrument(owner.getId());

        Instrument instrument = Instrument.builder()
                .id(instrumentId)
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

    public Instrument updateInstrument(String id, InstrumentCreateRequest request) {
        Instrument instrument = getInstrumentById(id);
        InstrumentType type = instrumentTypeRepository.findById(request.getType())
                .orElseGet(() -> instrumentTypeRepository.findByName(request.getType())
                        .orElseThrow(() -> new RuntimeException("Instrument type not found")));
        Establishment establishment = establishmentRepository.findById(request.getEstablishmentId())
                .orElseThrow(() -> new RuntimeException("Establishment not found"));
        instrument.setInstrumentType(type);
        instrument.setManufacturer(request.getManufacturer());
        instrument.setModel(request.getModel());
        instrument.setSerialNumber(request.getSerialNumber());
        instrument.setCapacityRange(request.getCapacityRange());
        instrument.setAccuracy(request.getAccuracy());
        instrument.setYearOfManufacture(request.getYearOfManufacture());
        instrument.setUsage(request.getUsage());
        instrument.setInstallationDetails(request.getInstallationDetails());
        instrument.setEstablishment(establishment);
        return instrumentRepository.save(instrument);
    }

    public void deleteInstrument(String id) {
        Instrument instrument = getInstrumentById(id);
        instrumentRepository.delete(instrument);
    }
}
