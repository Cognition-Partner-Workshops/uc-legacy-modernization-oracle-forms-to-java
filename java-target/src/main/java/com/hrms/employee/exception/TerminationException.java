package com.hrms.employee.exception;

/**
 * Replaces: PKG_EMPLOYEE.e_termination_error (-20005)
 */
public class TerminationException extends RuntimeException {
    public TerminationException(String message) {
        super(message);
    }
}
