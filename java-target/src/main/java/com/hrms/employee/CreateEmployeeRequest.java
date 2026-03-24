package com.hrms.employee;

import jakarta.validation.constraints.*;
import java.time.LocalDate;

/**
 * Request DTO for creating a new employee.
 * Replaces the Forms block insert mode + WHEN-VALIDATE-ITEM triggers.
 *
 * Validation annotations replace:
 * - HRMS_EMPLOYEE form trigger WHEN-VALIDATE-ITEM
 * - HRMS_VALIDATION_LIB client-side checks
 * - PKG_VALIDATION server-side checks
 * All in one place (fixes client/server validation drift - TD-026)
 */
public record CreateEmployeeRequest(
    @NotBlank(message = "First name is required")
    String firstName,

    @NotBlank(message = "Last name is required")
    String lastName,

    @Email(message = "Invalid email format")
    String email,

    String phoneWork,
    String phoneMobile,

    @NotNull(message = "Hire date is required")
    @FutureOrPresent(message = "Hire date cannot be in the past")
    LocalDate hireDate,

    @NotNull(message = "Department is required")
    Long deptId,

    @NotNull(message = "Job title is required")
    Long jobId,

    Long managerEmpId,
    String locationCode,
    String employmentType,
    String gender,
    LocalDate dateOfBirth,
    String maritalStatus,

    @NotNull(message = "Starting salary is required")
    @Positive(message = "Salary must be positive")
    java.math.BigDecimal startingSalary
) {}
