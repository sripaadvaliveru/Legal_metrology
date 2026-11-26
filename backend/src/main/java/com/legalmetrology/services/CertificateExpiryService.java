package com.legalmetrology.services;

import com.legalmetrology.entities.Business;
import com.legalmetrology.entities.Certificate;
import com.legalmetrology.entities.Notification;
import com.legalmetrology.entities.User;
import com.legalmetrology.enums.CertificateStatus;
import com.legalmetrology.repositories.CertificateRepository;
import com.legalmetrology.repositories.NotificationRepository;
import com.legalmetrology.repositories.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.temporal.ChronoUnit;
import java.util.List;

/**
 * Keeps certificate status in sync with validity dates and creates owner reminders
 * at the 90/30/7/0 day milestones required by the SRS.
 *
 * Only in-app notifications are created here; e-mail/SMS/push gateways can be added
 * on top of the same notification records later.
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class CertificateExpiryService {

    private static final List<Integer> REMINDER_DAYS = List.of(90, 30, 7, 0);

    private final CertificateRepository certificateRepository;
    private final NotificationRepository notificationRepository;
    private final UserRepository userRepository;

    @Scheduled(cron = "${app.expiry.cron:0 0 6 * * *}")
    public void runScheduledExpiryCheck() {
        try {
            processCertificateExpiries(LocalDate.now());
        } catch (Exception e) {
            log.error("Certificate expiry check failed", e);
        }
    }

    @Transactional
    public int processCertificateExpiries(LocalDate today) {
        int changes = expireCertificates(today);
        return changes + sendReminders(today);
    }

    private int expireCertificates(LocalDate today) {
        // validUntil inclusive: a certificate is still valid on its last day.
        List<Certificate> expired = certificateRepository
                .findByStatusAndValidUntilBefore(CertificateStatus.VALID, today.plusDays(1));

        for (Certificate certificate : expired) {
            certificate.setStatus(CertificateStatus.EXPIRED);
            certificateRepository.save(certificate);
            notifyOwner(certificate, "CERTIFICATE_EXPIRED",
                    "Certificate " + certificate.getCertificateNumber() + " has expired. Please apply for re-verification.");
        }
        return expired.size();
    }

    private int sendReminders(LocalDate today) {
        List<Certificate> upcoming = certificateRepository.findByStatusAndValidUntilBetween(
                CertificateStatus.VALID, today, today.plusDays(90));

        int sent = 0;
        for (Certificate certificate : upcoming) {
            long daysLeft = ChronoUnit.DAYS.between(today, certificate.getValidUntil());
            if (!REMINDER_DAYS.contains((int) daysLeft)) {
                continue;
            }
            String type = "CERTIFICATE_EXPIRING_" + daysLeft;
            if (notifyOwner(certificate, type,
                    "Certificate " + certificate.getCertificateNumber()
                            + (daysLeft == 0 ? " expires today." : " expires in " + daysLeft + " days."))) {
                sent++;
            }
        }
        return sent;
    }

    /** @return true when a new notification was created (false for duplicates/unknown owners). */
    private boolean notifyOwner(Certificate certificate, String type, String message) {
        String email = ownerEmail(certificate);
        if (email == null) {
            return false;
        }
        User owner = userRepository.findByEmail(email).orElse(null);
        if (owner == null) {
            return false;
        }
        if (notificationRepository.existsByUserIdAndTypeAndEntityId(owner.getId(), type, certificate.getId())) {
            return false;
        }
        notificationRepository.save(Notification.builder()
                .user(owner)
                .type(type)
                .message(message)
                .entityType("Certificate")
                .entityId(certificate.getId())
                .build());
        return true;
    }

    private String ownerEmail(Certificate certificate) {
        try {
            User applicant = certificate.getInspection().getAppointment().getApplication().getApplicant();
            if (applicant != null && applicant.getEmail() != null && !applicant.getEmail().isBlank()) {
                return applicant.getEmail();
            }
        } catch (Exception ignored) {
            // Fall through to the business owner below.
        }
        try {
            Business business = certificate.getInstrument().getEstablishment().getBusiness();
            if (business != null && business.getEmail() != null && !business.getEmail().isBlank()) {
                return business.getEmail();
            }
        } catch (Exception ignored) {
            // No identifiable owner - nothing to notify.
        }
        return null;
    }
}
