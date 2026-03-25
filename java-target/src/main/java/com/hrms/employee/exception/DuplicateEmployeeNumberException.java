package com.hrms.employee.exception;

/**
 * Replaces: PKG_EMPLOYEE.e_duplicate_emp_number (-20002)
 */
public class DuplicateEmployeeNumberException extends RuntimeException {
    public DuplicateEmployeeNumberException(String empNumber) {
        super("Duplicate employee number: " + empNumber);
    }
}
