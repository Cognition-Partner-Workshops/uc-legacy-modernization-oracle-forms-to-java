package com.hrms.employee.validation;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;

import java.math.BigDecimal;
import java.time.DayOfWeek;
import java.time.LocalDate;
import java.time.temporal.TemporalAdjusters;
import java.util.List;

import static org.assertj.core.api.Assertions.*;

/**
 * Tests for EmployeeValidator
 *
 * Validates unified validation merging:
 * - HRMS_VALIDATION_LIB.pll (client-side)
 * - PKG_VALIDATION (server-side)
 *
 * Key fix tested: Email validation now accepts subdomain emails
 * (PLL lines 21-41 rejected user@mail.company.com)
 */
class EmployeeValidatorTest {

    private EmployeeValidator validator;

    @BeforeEach
    void setUp() {
        validator = new EmployeeValidator();
    }

    @Nested
    @DisplayName("Email validation - fixes PLL subdomain rejection bug")
    class EmailTests {

        @Test
        @DisplayName("should accept simple email")
        void validSimpleEmail() {
            assertThat(validator.validateEmail("user@company.com")).isTrue();
        }

        @Test
        @DisplayName("should accept subdomain email (FIXED: PLL rejected this)")
        void validSubdomainEmail() {
            assertThat(validator.validateEmail("user@mail.company.com")).isTrue();
        }

        @Test
        @DisplayName("should accept email with dots and plus")
        void validComplexEmail() {
            assertThat(validator.validateEmail("first.last+tag@example.org")).isTrue();
        }

        @Test
        @DisplayName("should reject email without @")
        void invalidNoAt() {
            assertThat(validator.validateEmail("usercompany.com")).isFalse();
        }

        @Test
        @DisplayName("should reject null email")
        void invalidNull() {
            assertThat(validator.validateEmail(null)).isFalse();
        }

        @Test
        @DisplayName("should reject blank email")
        void invalidBlank() {
            assertThat(validator.validateEmail("")).isFalse();
        }
    }

    @Nested
    @DisplayName("Phone validation - US format (PLL lines 47-63)")
    class PhoneTests {

        @Test
        @DisplayName("should accept standard US format")
        void validUSFormat() {
            assertThat(validator.validatePhone("212-555-1234")).isTrue();
        }

        @Test
        @DisplayName("should accept format with parentheses")
        void validParensFormat() {
            assertThat(validator.validatePhone("(212) 555-1234")).isTrue();
        }

        @Test
        @DisplayName("should accept format with country code")
        void validWithCountryCode() {
            assertThat(validator.validatePhone("+1 212-555-1234")).isTrue();
        }

        @Test
        @DisplayName("should reject short number")
        void invalidShort() {
            assertThat(validator.validatePhone("555-1234")).isFalse();
        }
    }

    @Nested
    @DisplayName("SSN validation - PLL lines 69-90 (was client-only, now unified)")
    class SsnTests {

        @Test
        @DisplayName("should accept valid SSN")
        void validSsn() {
            assertThat(validator.validateSsn("123456789")).isTrue();
        }

        @Test
        @DisplayName("should reject SSN starting with 000")
        void invalidAllZeroArea() {
            assertThat(validator.validateSsn("000123456")).isFalse();
        }

        @Test
        @DisplayName("should reject SSN starting with 666")
        void invalidDevilsNumber() {
            assertThat(validator.validateSsn("666123456")).isFalse();
        }
    }

    @Nested
    @DisplayName("Date validation")
    class DateTests {

        @Test
        @DisplayName("should accept past date")
        void pastDateValid() {
            assertThat(validator.validateDateNotFuture(LocalDate.now().minusDays(1))).isTrue();
        }

        @Test
        @DisplayName("should accept today")
        void todayValid() {
            assertThat(validator.validateDateNotFuture(LocalDate.now())).isTrue();
        }

        @Test
        @DisplayName("should reject future date")
        void futureDateInvalid() {
            assertThat(validator.validateDateNotFuture(LocalDate.now().plusDays(1))).isFalse();
        }

        @Test
        @DisplayName("should validate date range (start before end)")
        void dateRangeValid() {
            assertThat(validator.validateDateRange(LocalDate.of(2024, 1, 1), LocalDate.of(2024, 12, 31))).isTrue();
        }

        @Test
        @DisplayName("should reject invalid date range (end before start)")
        void dateRangeInvalid() {
            assertThat(validator.validateDateRange(LocalDate.of(2024, 12, 31), LocalDate.of(2024, 1, 1))).isFalse();
        }
    }

    @Nested
    @DisplayName("Salary range validation - PLL lines 108-135 + PKG_VALIDATION")
    class SalaryTests {

        @Test
        @DisplayName("should accept salary within range")
        void withinRange() {
            assertThat(validator.validateSalaryRange(
                new BigDecimal("60000"), new BigDecimal("50000"), new BigDecimal("80000")
            )).isTrue();
        }

        @Test
        @DisplayName("should accept salary at minimum boundary")
        void atMinBoundary() {
            assertThat(validator.validateSalaryRange(
                new BigDecimal("50000"), new BigDecimal("50000"), new BigDecimal("80000")
            )).isTrue();
        }

        @Test
        @DisplayName("should reject salary below minimum")
        void belowMin() {
            assertThat(validator.validateSalaryRange(
                new BigDecimal("40000"), new BigDecimal("50000"), new BigDecimal("80000")
            )).isFalse();
        }

        @Test
        @DisplayName("should reject salary above maximum")
        void aboveMax() {
            assertThat(validator.validateSalaryRange(
                new BigDecimal("90000"), new BigDecimal("50000"), new BigDecimal("80000")
            )).isFalse();
        }
    }

    @Nested
    @DisplayName("Employee number format - PKG_VALIDATION.validate_emp_number_format")
    class EmpNumberTests {

        @Test
        @DisplayName("should accept valid EMP-NNNNNN format")
        void validFormat() {
            assertThat(validator.validateEmpNumberFormat("EMP-000001")).isTrue();
        }

        @Test
        @DisplayName("should reject wrong prefix")
        void wrongPrefix() {
            assertThat(validator.validateEmpNumberFormat("emp-000001")).isFalse();
        }

        @Test
        @DisplayName("should reject too few digits")
        void tooFewDigits() {
            assertThat(validator.validateEmpNumberFormat("EMP-001")).isFalse();
        }
    }

    @Nested
    @DisplayName("Business day check - PKG_VALIDATION.is_business_day")
    class BusinessDayTests {

        @Test
        @DisplayName("should identify Monday as business day")
        void mondayIsBusinessDay() {
            LocalDate monday = LocalDate.now().with(TemporalAdjusters.next(DayOfWeek.MONDAY));
            assertThat(validator.isBusinessDay(monday)).isTrue();
        }

        @Test
        @DisplayName("should identify Saturday as non-business day")
        void saturdayNotBusinessDay() {
            LocalDate saturday = LocalDate.now().with(TemporalAdjusters.next(DayOfWeek.SATURDAY));
            assertThat(validator.isBusinessDay(saturday)).isFalse();
        }

        @Test
        @DisplayName("should identify Sunday as non-business day")
        void sundayNotBusinessDay() {
            LocalDate sunday = LocalDate.now().with(TemporalAdjusters.next(DayOfWeek.SUNDAY));
            assertThat(validator.isBusinessDay(sunday)).isFalse();
        }
    }

    @Nested
    @DisplayName("Required fields - PKG_VALIDATION.validate_required_fields")
    class RequiredFieldsTests {

        @Test
        @DisplayName("should pass when all required fields present")
        void allPresent() {
            List<String> errors = validator.validateRequiredFields(
                "John", "Doe", LocalDate.now(), 100L, 10L
            );
            assertThat(errors).isEmpty();
        }

        @Test
        @DisplayName("should report multiple missing fields")
        void multipleMissing() {
            List<String> errors = validator.validateRequiredFields(
                null, "", null, null, null
            );
            assertThat(errors).hasSize(5);
        }
    }
}
