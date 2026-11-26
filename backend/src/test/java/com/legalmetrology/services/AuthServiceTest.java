package com.legalmetrology.services;

import com.legalmetrology.dto.AuthResponse;
import com.legalmetrology.dto.RefreshTokenRequest;
import com.legalmetrology.entities.User;
import com.legalmetrology.enums.Role;
import com.legalmetrology.repositories.BusinessRepository;
import com.legalmetrology.repositories.EstablishmentRepository;
import com.legalmetrology.repositories.JurisdictionRepository;
import com.legalmetrology.repositories.UserRepository;
import com.legalmetrology.security.CustomUserDetailsService;
import com.legalmetrology.security.JwtTokenProvider;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class AuthServiceTest {

    private static final String EMAIL = "business@example.com";
    private static final String REFRESH = "valid.refresh.token";

    @Mock private AuthenticationManager authenticationManager;
    @Mock private JwtTokenProvider tokenProvider;
    @Mock private CustomUserDetailsService userDetailsService;
    @Mock private UserRepository userRepository;
    @Mock private BusinessRepository businessRepository;
    @Mock private EstablishmentRepository establishmentRepository;
    @Mock private JurisdictionRepository jurisdictionRepository;
    @Mock private PasswordEncoder passwordEncoder;

    @InjectMocks private AuthService authService;

    private UserDetails userDetails() {
        return new org.springframework.security.core.userdetails.User(
                EMAIL, "encoded", true, true, true, true,
                List.of(new SimpleGrantedAuthority("ROLE_BUSINESS")));
    }

    @Test
    void refreshIssuesNewAccessTokenAndKeepsRefreshToken() {
        User user = User.builder().id("U-1").email(EMAIL).name("Owner")
                .role(Role.BUSINESS).isActive(true).build();

        when(tokenProvider.validateToken(REFRESH)).thenReturn(true);
        when(tokenProvider.isRefreshToken(REFRESH)).thenReturn(true);
        when(tokenProvider.getUsernameFromToken(REFRESH)).thenReturn(EMAIL);
        when(userDetailsService.loadUserByUsername(EMAIL)).thenReturn(userDetails());
        when(tokenProvider.generateAccessToken(any())).thenReturn("fresh.access.token");
        when(userRepository.findByEmail(EMAIL)).thenReturn(Optional.of(user));

        AuthResponse response = authService.refreshToken(new RefreshTokenRequest(REFRESH));

        assertEquals("fresh.access.token", response.getToken());
        assertEquals(REFRESH, response.getRefreshToken());
        assertEquals(EMAIL, response.getUser().getEmail());
    }

    @Test
    void refreshRejectsAccessToken() {
        when(tokenProvider.validateToken(REFRESH)).thenReturn(true);
        when(tokenProvider.isRefreshToken(REFRESH)).thenReturn(false);

        RuntimeException ex = assertThrows(RuntimeException.class,
                () -> authService.refreshToken(new RefreshTokenRequest(REFRESH)));
        assertTrue(ex.getMessage().contains("Invalid"));
        verifyNoInteractions(userDetailsService, userRepository);
    }

    @Test
    void refreshRejectsInvalidToken() {
        when(tokenProvider.validateToken(REFRESH)).thenReturn(false);

        assertThrows(RuntimeException.class,
                () -> authService.refreshToken(new RefreshTokenRequest(REFRESH)));
    }
}
