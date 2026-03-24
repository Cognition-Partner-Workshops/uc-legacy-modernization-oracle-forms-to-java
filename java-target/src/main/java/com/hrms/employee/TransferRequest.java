package com.hrms.employee;

import jakarta.validation.constraints.*;
import java.time.LocalDate;

public record TransferRequest(
    @NotNull Long newDeptId,
    Long newManagerEmpId,
    String newLocationCode,
    @NotNull LocalDate effectiveDate,
    String reason
) {}
