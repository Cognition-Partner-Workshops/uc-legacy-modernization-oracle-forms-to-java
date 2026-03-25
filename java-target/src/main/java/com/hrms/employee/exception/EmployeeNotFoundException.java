package com.hrms.employee.exception;

/**
 * Replaces: PKG_EMPLOYEE.e_employee_not_found (-20001)
 */
public class EmployeeNotFoundException extends RuntimeException {
    public EmployeeNotFoundException(Long empId) {
        super("Employee not found with ID: " + empId);
    }
    public EmployeeNotFoundException(String empNumber) {
        super("Employee not found with number: " + empNumber);
    }
}
