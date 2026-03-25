package com.hrms.security;

import jakarta.validation.constraints.NotBlank;

/**
 * Login Request DTO
 *
 * Replaces: HRMS_LOGIN form fields (LOGIN.USERNAME, LOGIN.PASSWORD)
 * Fixes TD-005: Password is now transmitted over HTTPS (TLS) instead of cleartext.
 */
public record LoginRequest(
    @NotBlank(message = "Username is required")
    String username,

    @NotBlank(message = "Password is required")
    String password
) {}
