package com.hrms.employee.validation;

import org.springframework.stereotype.Component;

import java.math.BigDecimal;
import java.time.DayOfWeek;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;
import java.util.regex.Pattern;

/**
 * Unified Employee Validator
 *
 * Merges validation from two legacy sources:
 * 1. HRMS_VALIDATION_LIB.pll (client-side, Forms PLL library)
 * 2. PKG_VALIDATION (server-side, PL/SQL package)
 *
 * Fixes:
 * - Email validation: PLL rejected valid subdomain emails (user@mail.company.com)
 *   because it only checked for one dot after @. Now uses RFC-compliant regex.
 * - Validation drift: Client and server had different rules. Now unified in one place.
 *
 * Legacy mapping:
 * - validate_email        -> PLL lines 21-41 + PKG_VALIDATION.validate_email_format
 * - validate_phone        -> PLL lines 47-63 + PKG_VALIDATION.validate_phone_format
 * - validate_ssn          -> PLL lines 69-90 (server-side had no SSN validation)
 * - validate_date_not_future -> PLL lines 96-99 + PKG_VALIDATION.is_future_date
 * - validate_salary_range -> PLL lines 108-135 + PKG_VALIDATION.validate_salary_for_grade
 * - validate_date_range   -> PKG_VALIDATION.validate_date_range (server-only)
 * - validate_emp_number   -> PKG_VALIDATION.validate_emp_number_format
 * - is_business_day       -> PKG_VALIDATION.is_business_day
 * - validate_required     -> PKG_VALIDATION.validate_required_fields
 */
@Component
public class EmployeeValidator {

    private static final Pattern EMAIL_PATTERN = Pattern.compile(
        "^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}$"
    );

    private static final Pattern PHONE_PATTERN = Pattern.compile(
        "^\\+?1?[-.\\s]?\\(?\\d{3}\\)?[-.\\s]?\\d{3}[-.\\s]?\\d{4}$"
    );

    private static final Pattern SSN_PATTERN = Pattern.compile(
        "^(?!000|666|9\\d{2})\\d{3}(?!00)\\d{2}(?!0000)\\d{4}$"
    );

    private static final Pattern EMP_NUMBER_PATTERN = Pattern.compile(
        "^EMP-\\d{6}$"
    );

    public List<String> validateForCreate(String firstName, String lastName, String email,
                                           String phone, LocalDate hireDate, Long deptId, Long jobId,
                                           BigDecimal salary) {
        List<String> errors = new ArrayList<>();
        errors.addAll(validateRequiredFields(firstName, lastName, hireDate, deptId, jobId));
        if (email != null && !email.isBlank() && !validateEmail(email)) {
            errors.add("Invalid email format");
        }
        if (phone != null && !phone.isBlank() && !validatePhone(phone)) {
            errors.add("Invalid phone format (US: 10-11 digits)");
        }
        if (hireDate != null && hireDate.isAfter(LocalDate.now().plusDays(90))) {
            errors.add("Hire date cannot be more than 90 days in the future");
        }
        if (salary != null && salary.compareTo(BigDecimal.ZERO) <= 0) {
            errors.add("Salary must be positive");
        }
        return errors;
    }

    /**
     * Validates email format.
     * FIXED: Legacy PLL (lines 21-41) only allowed one dot after @, rejecting
     * valid subdomain emails like user@mail.company.com. Now uses RFC-compliant pattern.
     */
    public boolean validateEmail(String email) {
        if (email == null || email.isBlank()) return false;
        return EMAIL_PATTERN.matcher(email).matches();
    }

    /**
     * Validates US phone format (10-11 digits).
     * Replaces: PLL lines 47-63 + PKG_VALIDATION.validate_phone_format
     */
    public boolean validatePhone(String phone) {
        if (phone == null || phone.isBlank()) return false;
        return PHONE_PATTERN.matcher(phone).matches();
    }

    /**
     * Validates SSN format (9 digits, no all-zero groups).
     * Replaces: PLL lines 69-90 (was client-side only, now unified)
     */
    public boolean validateSsn(String ssn) {
        if (ssn == null || ssn.isBlank()) return false;
        String digits = ssn.replaceAll("[^0-9]", "");
        return SSN_PATTERN.matcher(digits).matches();
    }

    /**
     * Validates that a date is not in the future.
     * Replaces: PLL lines 96-99 + PKG_VALIDATION.is_future_date
     */
    public boolean validateDateNotFuture(LocalDate date) {
        if (date == null) return true;
        return !date.isAfter(LocalDate.now());
    }

    /**
     * Validates salary is within the grade's min/max range.
     * Replaces: PLL lines 108-135 + PKG_VALIDATION.validate_salary_for_grade
     */
    public boolean validateSalaryRange(BigDecimal salary, BigDecimal minSalary, BigDecimal maxSalary) {
        if (salary == null || minSalary == null || maxSalary == null) return false;
        return salary.compareTo(minSalary) >= 0 && salary.compareTo(maxSalary) <= 0;
    }

    /**
     * Validates a date range (start before end).
     * Replaces: PKG_VALIDATION.validate_date_range (server-side only)
     */
    public boolean validateDateRange(LocalDate startDate, LocalDate endDate) {
        if (startDate == null || endDate == null) return true;
        return !endDate.isBefore(startDate);
    }

    /**
     * Validates employee number format: EMP-NNNNNN.
     * Replaces: PKG_VALIDATION.validate_emp_number_format
     */
    public boolean validateEmpNumberFormat(String empNumber) {
        if (empNumber == null || empNumber.isBlank()) return false;
        return EMP_NUMBER_PATTERN.matcher(empNumber).matches();
    }

    /**
     * Checks if a date is a business day (not weekend).
     * Replaces: PKG_VALIDATION.is_business_day
     * Note: Legacy also checked HOLIDAYS table; holiday check can be added via HolidayRepository.
     */
    public boolean isBusinessDay(LocalDate date) {
        if (date == null) return false;
        DayOfWeek dow = date.getDayOfWeek();
        return dow != DayOfWeek.SATURDAY && dow != DayOfWeek.SUNDAY;
    }

    /**
     * Validates required fields for employee creation.
     * Replaces: PKG_VALIDATION.validate_required_fields (checks FIRST_NAME, LAST_NAME, HIRE_DATE, DEPT_ID, JOB_ID)
     */
    public List<String> validateRequiredFields(String firstName, String lastName,
                                                LocalDate hireDate, Long deptId, Long jobId) {
        List<String> errors = new ArrayList<>();
        if (firstName == null || firstName.isBlank()) errors.add("First name is required");
        if (lastName == null || lastName.isBlank()) errors.add("Last name is required");
        if (hireDate == null) errors.add("Hire date is required");
        if (deptId == null) errors.add("Department is required");
        if (jobId == null) errors.add("Job title is required");
        return errors;
    }
}
