package com.hrms.employee;

import jakarta.validation.constraints.*;

/**
 * Request DTO for submitting personal details.
 * Replaces the Forms block insert mode + WHEN-VALIDATE-ITEM triggers.
 *
 * Validation annotations replace:
 * - HRMS_EMPLOYEE form trigger WHEN-VALIDATE-ITEM
 * - HRMS_VALIDATION_LIB client-side checks
 * - PKG_VALIDATION server-side checks
 * All in one place (fixes client/server validation drift - TD-026)
 */
public record PersonalDetailsRequest(
    @NotBlank(message = "First name is required")
    @Size(max = 20, message = "First name must not exceed 20 characters")
    @Pattern(regexp = "^[a-zA-Z]+$", message = "First name must contain only alphabetic characters")
    String firstName,

    @NotBlank(message = "Last name is required")
    @Size(max = 10, message = "Last name must not exceed 10 characters")
    @Pattern(regexp = "^[a-zA-Z]+$", message = "Last name must contain only alphabetic characters")
    String lastName,

    @NotBlank(message = "Aadhaar ID is required")
    @Size(min = 12, max = 12, message = "Aadhaar ID must be exactly 12 characters")
    @Pattern(regexp = "^[0-9]{12}$", message = "Aadhaar ID must contain exactly 12 numeric digits")
    String aadhaarId
) {}
