package com.legalmetrology.controllers;

import com.legalmetrology.dto.UserCreateRequest;
import com.legalmetrology.entities.User;
import com.legalmetrology.enums.Role;
import com.legalmetrology.repositories.UserRepository;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/users")
@RequiredArgsConstructor
public class UserController {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

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

        return ResponseEntity.ok(users);
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'DISTRICT_OFFICER')")
    public ResponseEntity<?> createUser(@Valid @RequestBody UserCreateRequest request) {
        if (userRepository.existsByEmail(request.getEmail())) {
            return ResponseEntity.badRequest().body(Map.of("error", "Email already registered"));
        }

        User user = User.builder()
                .name(request.getName())
                .email(request.getEmail())
                .password(passwordEncoder.encode(request.getPassword()))
                .role(request.getRole())
                .phone(request.getPhone())
                .jurisdictionId(request.getJurisdictionId())
                .isActive(true)
                .build();

        user = userRepository.save(user);
        return ResponseEntity.ok(user);
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'DISTRICT_OFFICER')")
    public ResponseEntity<?> updateUser(@PathVariable String id, @RequestBody Map<String, Object> updates) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("User not found"));

        if (updates.containsKey("name")) user.setName((String) updates.get("name"));
        if (updates.containsKey("phone")) user.setPhone((String) updates.get("phone"));
        if (updates.containsKey("jurisdictionId")) user.setJurisdictionId((String) updates.get("jurisdictionId"));
        if (updates.containsKey("isActive")) user.setIsActive((Boolean) updates.get("isActive"));

        if (updates.containsKey("role")) {
            try {
                user.setRole(Role.valueOf((String) updates.get("role")));
            } catch (IllegalArgumentException ignored) {
            }
        }

        user = userRepository.save(user);
        return ResponseEntity.ok(user);
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'DISTRICT_OFFICER')")
    public ResponseEntity<Void> deleteUser(@PathVariable String id) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("User not found"));
        user.setIsActive(false);
        userRepository.save(user);
        return ResponseEntity.noContent().build();
    }
}
