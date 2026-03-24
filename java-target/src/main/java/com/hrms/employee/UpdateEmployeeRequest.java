package com.hrms.employee;

import jakarta.validation.constraints.*;

public record UpdateEmployeeRequest(
    @NotBlank String firstName,
    @NotBlank String lastName,
    @Email String email,
    String phoneWork,
    String phoneMobile,
    @NotNull Long deptId,
    @NotNull Long jobId,
    Long managerEmpId,
    String locationCode,
    String employmentType,
    String gender,
    String maritalStatus
) {}
