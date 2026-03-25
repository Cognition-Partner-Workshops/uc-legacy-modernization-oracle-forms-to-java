package com.hrms.employee.event;

import java.math.BigDecimal;

/**
 * Published when an employee is promoted.
 * Replaces: direct call to PKG_PAYROLL.update_salary from PKG_EMPLOYEE.promote_employee
 */
public record EmployeePromotedEvent(
    Long empId,
    Long newJobId,
    BigDecimal newSalary,
    String reason
) {}
