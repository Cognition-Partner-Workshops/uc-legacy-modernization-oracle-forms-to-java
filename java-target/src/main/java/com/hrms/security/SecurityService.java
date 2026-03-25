package com.hrms.security;

import java.util.Optional;

/**
 * Security Service Interface
 *
 * Migrated from: PKG_SECURITY (spec + body)
 * See: migration-plan/component-mapping.md for full mapping
 *
 * Key changes from legacy:
 * - MD5 password hashing replaced with BCrypt (fixes TD-001)
 * - Account lockout added after max failed attempts (fixes TD-002)
 * - Hard-coded encryption key removed (fixes TD-003)
 * - Database sessions replaced with stateless JWT tokens (ADR-003)
 */
public interface SecurityService {

    /**
     * Authenticate a user and return a JWT token.
     * Replaces: PKG_SECURITY.authenticate
     */
    LoginResponse authenticate(LoginRequest request);

    /**
     * Change the password for the currently authenticated user.
     * Replaces: PKG_SECURITY.change_password
     */
    void changePassword(String username, ChangePasswordRequest request);

    /**
     * Find a user by username.
     */
    Optional<User> findByUsername(String username);
}
