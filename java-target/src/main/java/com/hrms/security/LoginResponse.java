package com.hrms.security;

import java.util.Set;

/**
 * Login Response DTO
 *
 * Replaces: Legacy session cookie / Forms session context.
 * Returns a JWT token for stateless authentication.
 */
public record LoginResponse(
    String accessToken,
    String tokenType,
    long expiresIn,
    String username,
    Set<String> roles
) {
    public LoginResponse(String accessToken, long expiresIn, String username, Set<String> roles) {
        this(accessToken, "Bearer", expiresIn, username, roles);
    }
}
