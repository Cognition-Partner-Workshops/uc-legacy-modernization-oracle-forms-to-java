package com.hrms.employee.exception;

/**
 * Replaces: PKG_EMPLOYEE.e_invalid_manager (-20004)
 */
public class InvalidManagerException extends RuntimeException {
    public InvalidManagerException(Long managerId) {
        super("Invalid manager employee ID: " + managerId);
    }
}
