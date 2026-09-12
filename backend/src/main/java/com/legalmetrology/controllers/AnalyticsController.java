package com.legalmetrology.controllers;

import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

@RestController
@RequestMapping("/api/analytics")
@RequiredArgsConstructor
public class AnalyticsController {

    @GetMapping("/dashboard")
    public ResponseEntity<Map<String, Object>> getDashboardKpis(Authentication authentication) {
        Map<String, Object> kpis = Map.of(
                "totalInstruments", 0,
                "verifiedInstruments", 0,
                "pendingApplications", 0,
                "expiringSoon", 0,
                "expiredInstruments", 0,
                "failedInspections", 0,
                "compliancePercentage", 0.0
        );
        return ResponseEntity.ok(kpis);
    }
}
