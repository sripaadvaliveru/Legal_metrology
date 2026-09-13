package com.legalmetrology.services;

import com.legalmetrology.entities.Notification;
import com.legalmetrology.entities.User;
import com.legalmetrology.repositories.NotificationRepository;
import com.legalmetrology.repositories.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class NotificationService {

    private final NotificationRepository notificationRepository;
    private final UserRepository userRepository;

    public Notification createNotification(String userId, String type, String message,
                                           String entityType, String entityId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));

        Notification notification = Notification.builder()
                .user(user)
                .type(type)
                .message(message)
                .entityType(entityType)
                .entityId(entityId)
                .build();

        return notificationRepository.save(notification);
    }

    public Notification createNotificationByEmail(String email, String type, String message,
                                                   String entityType, String entityId) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found with email: " + email));

        Notification notification = Notification.builder()
                .user(user)
                .type(type)
                .message(message)
                .entityType(entityType)
                .entityId(entityId)
                .build();

        return notificationRepository.save(notification);
    }

    public List<Notification> getUserNotifications(String email) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found with email: " + email));
        return notificationRepository.findByUserIdOrderByCreatedAtDesc(user.getId());
    }

    public long getUnreadCount(String email) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found with email: " + email));
        return notificationRepository.countByUserIdAndIsReadFalse(user.getId());
    }
}
