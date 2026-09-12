package com.legalmetrology.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class InstrumentCreateRequest {
    @NotBlank
    private String establishmentId;

    @NotBlank
    private String type;

    @NotBlank
    private String manufacturer;

    @NotBlank
    private String model;

    @NotBlank
    private String serialNumber;

    private String capacityRange;
    private String accuracy;
    private Integer yearOfManufacture;
    private String usage;
    private String installationDetails;
}
