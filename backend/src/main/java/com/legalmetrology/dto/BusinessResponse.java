package com.legalmetrology.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class BusinessResponse {
    private String businessId;
    private String businessName;
    private String registrationNumber;
    private String gstNumber;
    private String address;
    private String city;
    private String state;
    private List<EstablishmentInfo> establishments;

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class EstablishmentInfo {
        private String id;
        private String name;
        private String address;
        private String city;
        private String district;
        private String state;
    }
}
