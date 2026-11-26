package com.legalmetrology.security;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.User;

import java.util.List;

import static org.junit.jupiter.api.Assertions.*;

class JwtTokenProviderTest {

    private static final String SECRET =
            "sih2026-legal-metrology-jwt-secret-key-that-is-long-enough-for-hs256";
    private static final String EMAIL = "lmo@example.com";

    private JwtTokenProvider provider;

    @BeforeEach
    void setUp() {
        provider = new JwtTokenProvider(SECRET, 3_600_000L, 604_800_000L);
    }

    private Authentication authentication() {
        User principal = new User(EMAIL, "password",
                List.of(new SimpleGrantedAuthority("ROLE_LMO")));
        return new UsernamePasswordAuthenticationToken(principal, null, principal.getAuthorities());
    }

    @Test
    void accessTokenIsValidButIsNotARefreshToken() {
        String token = provider.generateAccessToken(authentication());

        assertTrue(provider.validateToken(token));
        assertFalse(provider.isRefreshToken(token));
        assertEquals(EMAIL, provider.getUsernameFromToken(token));
    }

    @Test
    void refreshTokenIsValidAndMarkedAsRefresh() {
        String token = provider.generateRefreshToken(authentication());

        assertTrue(provider.validateToken(token));
        assertTrue(provider.isRefreshToken(token));
        assertEquals(EMAIL, provider.getUsernameFromToken(token));
    }

    @Test
    void invalidTokensAreRejected() {
        assertFalse(provider.validateToken("not-a-jwt"));
        assertFalse(provider.isRefreshToken("not-a-jwt"));
    }

    @Test
    void expiredTokensAreRejected() {
        JwtTokenProvider shortLived = new JwtTokenProvider(SECRET, -1000L, -1000L);

        assertFalse(shortLived.validateToken(shortLived.generateAccessToken(authentication())));
    }
}
