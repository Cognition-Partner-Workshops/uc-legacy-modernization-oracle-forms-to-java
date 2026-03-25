package com.hrms.security;

import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

/**
 * Authentication Controller
 *
 * Replaces: HRMS_LOGIN form + PKG_SECURITY procedures
 *
 * Endpoints:
 * - POST /api/v1/auth/login    → PKG_SECURITY.authenticate
 * - POST /api/v1/auth/logout   → PKG_SECURITY.logout (client-side token discard)
 * - POST /api/v1/auth/change-password → PKG_SECURITY.change_password
 *
 * See: docs/api-design.md for the full API specification.
 */
@RestController
@RequestMapping("/api/v1/auth")
public class AuthController {

    private final SecurityService securityService;

    public AuthController(SecurityService securityService) {
        this.securityService = securityService;
    }

    /**
     * Authenticate user and return JWT token.
     * Replaces: PKG_SECURITY.authenticate + HRMS_LOGIN BTN_LOGIN trigger
     */
    @PostMapping("/login")
    public ResponseEntity<LoginResponse> login(@Valid @RequestBody LoginRequest request) {
        LoginResponse response = securityService.authenticate(request);
        return ResponseEntity.ok(response);
    }

    /**
     * Logout (client-side token invalidation).
     * Replaces: PKG_SECURITY.logout
     *
     * With stateless JWT, logout is handled client-side by discarding the token.
     * This endpoint exists for API symmetry with the legacy system and can be
     * extended with a token blocklist if server-side invalidation is needed.
     */
    @PostMapping("/logout")
    public ResponseEntity<Map<String, String>> logout() {
        return ResponseEntity.ok(Map.of("message", "Logged out successfully"));
    }

    /**
     * Change password for the currently authenticated user.
     * Replaces: PKG_SECURITY.change_password
     */
    @PostMapping("/change-password")
    public ResponseEntity<Map<String, String>> changePassword(
            @Valid @RequestBody ChangePasswordRequest request) {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        securityService.changePassword(auth.getName(), request);
        return ResponseEntity.ok(Map.of("message", "Password changed successfully"));
    }
}
