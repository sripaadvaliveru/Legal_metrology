package com.legalmetrology.controllers;

import com.legalmetrology.dto.BusinessResponse;
import com.legalmetrology.entities.Business;
import com.legalmetrology.entities.Establishment;
import com.legalmetrology.entities.User;
import com.legalmetrology.repositories.BusinessRepository;
import com.legalmetrology.repositories.EstablishmentRepository;
import com.legalmetrology.repositories.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/business")
@RequiredArgsConstructor
public class BusinessController {

    private final UserRepository userRepository;
    private final EstablishmentRepository establishmentRepository;

    @GetMapping("/me")
    @PreAuthorize("hasRole('BUSINESS')")
    public ResponseEntity<BusinessResponse> getMyBusiness(Authentication authentication) {
        User user = userRepository.findByEmail(authentication.getName())
                .orElseThrow(() -> new RuntimeException("User not found"));

        Business business = user.getBusiness();
        if (business == null) {
            throw new RuntimeException("No business associated with this user");
        }

        List<Establishment> establishments = establishmentRepository.findByBusinessId(business.getId());

        BusinessResponse response = BusinessResponse.builder()
                .businessId(business.getId())
                .businessName(business.getName())
                .registrationNumber(business.getRegistrationNumber())
                .gstNumber(business.getGstNumber())
                .address(business.getAddress())
                .city(business.getCity())
                .state(business.getState())
                .establishments(establishments.stream()
                        .map(e -> BusinessResponse.EstablishmentInfo.builder()
                                .id(e.getId())
                                .name(e.getName())
                                .address(e.getAddress())
                                .city(e.getCity())
                                .district(e.getDistrict())
                                .state(e.getState())
                                .build())
                        .collect(Collectors.toList()))
                .build();

        return ResponseEntity.ok(response);
    }
}
