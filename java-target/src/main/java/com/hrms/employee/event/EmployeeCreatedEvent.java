package com.hrms.employee.event;

import java.math.BigDecimal;

/**
 * Published when a new employee is created.
 * Replaces: direct call to PKG_PAYROLL.create_salary_record from PKG_EMPLOYEE.create_employee (line 275)
 * This breaks the circular dependency between Employee and Payroll modules.
 */
public record EmployeeCreatedEvent(
    Long empId,
    BigDecimal startingSalary,
    String createdBy
) {}
