package com.legalmetrology.controllers;

import com.legalmetrology.entities.User;
import com.legalmetrology.enums.Role;
import com.legalmetrology.repositories.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/users")
@RequiredArgsConstructor
public class UserController {

    private final UserRepository userRepository;

    @GetMapping
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'DISTRICT_OFFICER', 'STATE_OFFICER')")
    public ResponseEntity<List<User>> getUsersByRole(@RequestParam(required = false) String role) {
        List<User> users = userRepository.findAll().stream()
                .filter(User::getIsActive)
                .toList();

        if (role != null && !role.isBlank()) {
            try {
                Role r = Role.valueOf(role);
                users = users.stream()
                        .filter(u -> u.getRole() == r)
                        .toList();
            } catch (IllegalArgumentException ignored) {
            }
        }

        users.forEach(u -> u.setPassword(null));
        return ResponseEntity.ok(users);
    }
}
