package com.hrms.employee;

import jakarta.validation.constraints.*;
import java.time.LocalDate;

public record TerminationRequest(
    @NotNull LocalDate terminationDate,
    @NotBlank String reason,
    String notes
) {}
