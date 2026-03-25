package com.hrms.employee;

import jakarta.validation.constraints.*;
import java.math.BigDecimal;

/**
 * Request DTO for promoting an employee.
 * Replaces: PKG_EMPLOYEE.promote_employee parameters
 */
public record PromoteRequest(
    @NotNull Long newJobId,
    @NotNull @Positive BigDecimal newSalary,
    String reason
) {}
