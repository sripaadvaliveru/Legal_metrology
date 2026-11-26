package com.legalmetrology.services;

import com.legalmetrology.entities.Business;
import com.legalmetrology.entities.Certificate;
import com.legalmetrology.entities.Establishment;
import com.legalmetrology.entities.Instrument;
import com.legalmetrology.entities.Notification;
import com.legalmetrology.entities.User;
import com.legalmetrology.enums.CertificateStatus;
import com.legalmetrology.enums.Role;
import com.legalmetrology.repositories.CertificateRepository;
import com.legalmetrology.repositories.NotificationRepository;
import com.legalmetrology.repositories.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class CertificateExpiryServiceTest {

    private static final LocalDate TODAY = LocalDate.of(2026, 11, 26);
    private static final String OWNER_EMAIL = "owner@example.com";

    @Mock private CertificateRepository certificateRepository;
    @Mock private NotificationRepository notificationRepository;
    @Mock private UserRepository userRepository;

    @InjectMocks private CertificateExpiryService service;

    private User owner;

    @BeforeEach
    void setUp() {
        owner = User.builder().id("U-1").email(OWNER_EMAIL).role(Role.BUSINESS).isActive(true).build();
    }

    private Certificate certificate(String id, LocalDate validUntil) {
        Business business = Business.builder().email(OWNER_EMAIL).build();
        Establishment establishment = Establishment.builder().business(business).build();
        Instrument instrument = Instrument.builder().establishment(establishment).build();
        return Certificate.builder()
                .id(id)
                .certificateNumber("CERT-" + id)
                .instrument(instrument)
                .status(CertificateStatus.VALID)
                .validUntil(validUntil)
                .build();
    }

    @Test
    void expiredCertificatesAreMarkedExpiredAndOwnerIsNotified() {
        Certificate certificate = certificate("1", TODAY.minusDays(1));
        when(certificateRepository.findByStatusAndValidUntilBefore(CertificateStatus.VALID, TODAY.plusDays(1)))
                .thenReturn(List.of(certificate));
        when(certificateRepository.findByStatusAndValidUntilBetween(any(), any(), any()))
                .thenReturn(List.of());
        when(userRepository.findByEmail(OWNER_EMAIL)).thenReturn(Optional.of(owner));
        when(notificationRepository.existsByUserIdAndTypeAndEntityId(anyString(), anyString(), anyString()))
                .thenReturn(false);

        assertEquals(1, service.processCertificateExpiries(TODAY));
        assertEquals(CertificateStatus.EXPIRED, certificate.getStatus());
        verify(certificateRepository).save(certificate);

        ArgumentCaptor<Notification> captor = ArgumentCaptor.forClass(Notification.class);
        verify(notificationRepository).save(captor.capture());
        assertEquals("CERTIFICATE_EXPIRED", captor.getValue().getType());
        assertEquals("1", captor.getValue().getEntityId());
    }

    @Test
    void reminderIsCreatedAtTheNinetyDayMilestone() {
        Certificate certificate = certificate("2", TODAY.plusDays(90));
        when(certificateRepository.findByStatusAndValidUntilBefore(any(), any())).thenReturn(List.of());
        when(certificateRepository.findByStatusAndValidUntilBetween(
                CertificateStatus.VALID, TODAY, TODAY.plusDays(90))).thenReturn(List.of(certificate));
        when(userRepository.findByEmail(OWNER_EMAIL)).thenReturn(Optional.of(owner));
        when(notificationRepository.existsByUserIdAndTypeAndEntityId(anyString(), anyString(), anyString()))
                .thenReturn(false);

        assertEquals(1, service.processCertificateExpiries(TODAY));

        ArgumentCaptor<Notification> captor = ArgumentCaptor.forClass(Notification.class);
        verify(notificationRepository).save(captor.capture());
        assertEquals("CERTIFICATE_EXPIRING_90", captor.getValue().getType());
        assertEquals(CertificateStatus.VALID, certificate.getStatus());
    }

    @Test
    void duplicateRemindersAreNotCreated() {
        Certificate certificate = certificate("3", TODAY.plusDays(7));
        when(certificateRepository.findByStatusAndValidUntilBefore(any(), any())).thenReturn(List.of());
        when(certificateRepository.findByStatusAndValidUntilBetween(
                CertificateStatus.VALID, TODAY, TODAY.plusDays(90))).thenReturn(List.of(certificate));
        when(userRepository.findByEmail(OWNER_EMAIL)).thenReturn(Optional.of(owner));
        when(notificationRepository.existsByUserIdAndTypeAndEntityId(anyString(), anyString(), anyString()))
                .thenReturn(true);

        assertEquals(0, service.processCertificateExpiries(TODAY));
        verify(notificationRepository, never()).save(any());
    }

    @Test
    void certificatesOutsideReminderWindowAreIgnored() {
        Certificate certificate = certificate("4", TODAY.plusDays(45));
        when(certificateRepository.findByStatusAndValidUntilBefore(any(), any())).thenReturn(List.of());
        when(certificateRepository.findByStatusAndValidUntilBetween(
                CertificateStatus.VALID, TODAY, TODAY.plusDays(90))).thenReturn(List.of(certificate));

        assertEquals(0, service.processCertificateExpiries(TODAY));
        verifyNoInteractions(userRepository, notificationRepository);
    }
}
