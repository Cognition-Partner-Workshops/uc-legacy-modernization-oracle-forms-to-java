package com.hrms.employee.event;

import java.time.LocalDate;

/**
 * Published when an employee is terminated.
 * Replaces: direct call to PKG_PAYROLL.end_salary_record from PKG_EMPLOYEE.terminate_employee
 * and PKG_LEAVE.cancel_pending_leave from PKG_EMPLOYEE.terminate_employee
 */
public record EmployeeTerminatedEvent(
    Long empId,
    LocalDate terminationDate,
    String reason
) {}
