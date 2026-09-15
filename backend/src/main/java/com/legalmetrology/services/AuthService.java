package com.legalmetrology.services;

import com.legalmetrology.dto.*;
import com.legalmetrology.entities.Business;
import com.legalmetrology.entities.Establishment;
import com.legalmetrology.entities.User;
import com.legalmetrology.enums.Role;
import com.legalmetrology.repositories.BusinessRepository;
import com.legalmetrology.repositories.EstablishmentRepository;
import com.legalmetrology.repositories.UserRepository;
import com.legalmetrology.security.JwtTokenProvider;
import lombok.RequiredArgsConstructor;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class AuthService {

    private final AuthenticationManager authenticationManager;
    private final JwtTokenProvider tokenProvider;
    private final UserRepository userRepository;
    private final BusinessRepository businessRepository;
    private final EstablishmentRepository establishmentRepository;
    private final PasswordEncoder passwordEncoder;

    public AuthResponse login(LoginRequest request) {
        Authentication authentication = authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(request.getEmail(), request.getPassword())
        );

        String token = tokenProvider.generateAccessToken(authentication);
        String refreshToken = tokenProvider.generateRefreshToken(authentication);

        User user = userRepository.findByEmail(request.getEmail())
                .orElseThrow(() -> new RuntimeException("User not found"));

        UserResponse.UserResponseBuilder responseBuilder = UserResponse.builder()
                .id(user.getId())
                .name(user.getName())
                .email(user.getEmail())
                .role(user.getRole())
                .jurisdiction(user.getJurisdictionId());

        if (user.getBusiness() != null) {
            responseBuilder.businessId(user.getBusiness().getId());
            responseBuilder.businessName(user.getBusiness().getName());
        }

        UserResponse userResponse = responseBuilder.build();

        return AuthResponse.builder()
                .token(token)
                .refreshToken(refreshToken)
                .user(userResponse)
                .build();
    }

    @Transactional
    public UserResponse register(RegisterRequest request) {
        if (userRepository.existsByEmail(request.getEmail())) {
            throw new RuntimeException("Email already registered");
        }

        User user = User.builder()
                .name(request.getName())
                .email(request.getEmail())
                .password(passwordEncoder.encode(request.getPassword()))
                .role(request.getRole())
                .phone(request.getPhone())
                .isActive(true)
                .build();

        userRepository.save(user);

        if (request.getRole() == Role.BUSINESS && request.getBusinessName() != null && !request.getBusinessName().isBlank()) {
            Business business = Business.builder()
                    .name(request.getBusinessName())
                    .address(request.getAddress())
                    .city(request.getCity())
                    .state(request.getState())
                    .pincode(request.getPincode())
                    .contactPerson(request.getName())
                    .phone(request.getPhone())
                    .email(request.getEmail())
                    .build();
            business = businessRepository.save(business);

            Establishment establishment = Establishment.builder()
                    .name(request.getBusinessName() + " - Main")
                    .address(request.getAddress())
                    .city(request.getCity())
                    .district(request.getDistrict())
                    .state(request.getState())
                    .pincode(request.getPincode())
                    .business(business)
                    .build();
            establishmentRepository.save(establishment);

            user.setBusiness(business);
            userRepository.save(user);
        }

        UserResponse.UserResponseBuilder responseBuilder = UserResponse.builder()
                .id(user.getId())
                .name(user.getName())
                .email(user.getEmail())
                .role(user.getRole());

        if (user.getBusiness() != null) {
            responseBuilder.businessId(user.getBusiness().getId());
            responseBuilder.businessName(user.getBusiness().getName());
        }

        return responseBuilder.build();
    }

    public UserResponse getCurrentUser(String email) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));

        UserResponse.UserResponseBuilder responseBuilder = UserResponse.builder()
                .id(user.getId())
                .name(user.getName())
                .email(user.getEmail())
                .role(user.getRole())
                .jurisdiction(user.getJurisdictionId());

        if (user.getBusiness() != null) {
            responseBuilder.businessId(user.getBusiness().getId());
            responseBuilder.businessName(user.getBusiness().getName());
        }

        return responseBuilder.build();
    }
}
