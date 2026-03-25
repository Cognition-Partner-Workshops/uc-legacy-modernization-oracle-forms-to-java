package com.hrms.employee;

import jakarta.validation.constraints.*;
import java.time.LocalDate;

/**
 * Request DTO for rehiring a terminated employee.
 * Replaces: PKG_EMPLOYEE.rehire_employee parameters
 */
public record RehireRequest(
    @NotNull Long deptId,
    @NotNull Long jobId,
    Long managerEmpId,
    String locationCode,
    @NotNull LocalDate rehireDate,
    @NotNull @Positive java.math.BigDecimal salary
) {}
