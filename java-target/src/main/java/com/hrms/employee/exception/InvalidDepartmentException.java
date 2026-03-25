package com.hrms.employee.exception;

/**
 * Replaces: PKG_EMPLOYEE.e_invalid_department (-20003)
 */
public class InvalidDepartmentException extends RuntimeException {
    public InvalidDepartmentException(Long deptId) {
        super("Invalid or inactive department ID: " + deptId);
    }
}
