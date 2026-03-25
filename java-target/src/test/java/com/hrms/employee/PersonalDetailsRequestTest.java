package com.hrms.employee;

import jakarta.validation.ConstraintViolation;
import jakarta.validation.Validation;
import jakarta.validation.Validator;
import jakarta.validation.ValidatorFactory;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import java.util.Set;

import static org.junit.jupiter.api.Assertions.*;

class PersonalDetailsRequestTest {

    private Validator validator;

    @BeforeEach
    void setUp() {
        ValidatorFactory factory = Validation.buildDefaultValidatorFactory();
        validator = factory.getValidator();
    }

    @Test
    void testValidRequest() {
        PersonalDetailsRequest request = new PersonalDetailsRequest("John", "Doe", "123456789012");
        Set<ConstraintViolation<PersonalDetailsRequest>> violations = validator.validate(request);
        assertTrue(violations.isEmpty());
    }

    @Test
    void testFirstNameBlank() {
        PersonalDetailsRequest request = new PersonalDetailsRequest("", "Doe", "123456789012");
        Set<ConstraintViolation<PersonalDetailsRequest>> violations = validator.validate(request);
        assertFalse(violations.isEmpty());
    }

    @Test
    void testFirstNameNull() {
        PersonalDetailsRequest request = new PersonalDetailsRequest(null, "Doe", "123456789012");
        Set<ConstraintViolation<PersonalDetailsRequest>> violations = validator.validate(request);
        assertFalse(violations.isEmpty());
    }

    @Test
    void testFirstNameExceeds20Chars() {
        PersonalDetailsRequest request = new PersonalDetailsRequest("ABCDEFGHIJKLMNOPQRSTU", "Doe", "123456789012");
        Set<ConstraintViolation<PersonalDetailsRequest>> violations = validator.validate(request);
        assertFalse(violations.isEmpty());
    }

    @Test
    void testFirstNameExactly20Chars() {
        PersonalDetailsRequest request = new PersonalDetailsRequest("ABCDEFGHIJKLMNOPQRST", "Doe", "123456789012");
        Set<ConstraintViolation<PersonalDetailsRequest>> violations = validator.validate(request);
        assertTrue(violations.isEmpty());
    }

    @Test
    void testFirstNameWithNumbers() {
        PersonalDetailsRequest request = new PersonalDetailsRequest("John123", "Doe", "123456789012");
        Set<ConstraintViolation<PersonalDetailsRequest>> violations = validator.validate(request);
        assertFalse(violations.isEmpty());
    }

    @Test
    void testFirstNameWithSpecialChars() {
        PersonalDetailsRequest request = new PersonalDetailsRequest("John@Doe", "Doe", "123456789012");
        Set<ConstraintViolation<PersonalDetailsRequest>> violations = validator.validate(request);
        assertFalse(violations.isEmpty());
    }

    @Test
    void testLastNameBlank() {
        PersonalDetailsRequest request = new PersonalDetailsRequest("John", "", "123456789012");
        Set<ConstraintViolation<PersonalDetailsRequest>> violations = validator.validate(request);
        assertFalse(violations.isEmpty());
    }

    @Test
    void testLastNameNull() {
        PersonalDetailsRequest request = new PersonalDetailsRequest("John", null, "123456789012");
        Set<ConstraintViolation<PersonalDetailsRequest>> violations = validator.validate(request);
        assertFalse(violations.isEmpty());
    }

    @Test
    void testLastNameExceeds10Chars() {
        PersonalDetailsRequest request = new PersonalDetailsRequest("John", "ABCDEFGHIJK", "123456789012");
        Set<ConstraintViolation<PersonalDetailsRequest>> violations = validator.validate(request);
        assertFalse(violations.isEmpty());
    }

    @Test
    void testLastNameExactly10Chars() {
        PersonalDetailsRequest request = new PersonalDetailsRequest("John", "ABCDEFGHIJ", "123456789012");
        Set<ConstraintViolation<PersonalDetailsRequest>> violations = validator.validate(request);
        assertTrue(violations.isEmpty());
    }

    @Test
    void testLastNameWithNumbers() {
        PersonalDetailsRequest request = new PersonalDetailsRequest("John", "Doe123", "123456789012");
        Set<ConstraintViolation<PersonalDetailsRequest>> violations = validator.validate(request);
        assertFalse(violations.isEmpty());
    }

    @Test
    void testAadhaarBlank() {
        PersonalDetailsRequest request = new PersonalDetailsRequest("John", "Doe", "");
        Set<ConstraintViolation<PersonalDetailsRequest>> violations = validator.validate(request);
        assertFalse(violations.isEmpty());
    }

    @Test
    void testAadhaarNull() {
        PersonalDetailsRequest request = new PersonalDetailsRequest("John", "Doe", null);
        Set<ConstraintViolation<PersonalDetailsRequest>> violations = validator.validate(request);
        assertFalse(violations.isEmpty());
    }

    @Test
    void testAadhaarLessThan12Digits() {
        PersonalDetailsRequest request = new PersonalDetailsRequest("John", "Doe", "12345678901");
        Set<ConstraintViolation<PersonalDetailsRequest>> violations = validator.validate(request);
        assertFalse(violations.isEmpty());
    }

    @Test
    void testAadhaarMoreThan12Digits() {
        PersonalDetailsRequest request = new PersonalDetailsRequest("John", "Doe", "1234567890123");
        Set<ConstraintViolation<PersonalDetailsRequest>> violations = validator.validate(request);
        assertFalse(violations.isEmpty());
    }

    @Test
    void testAadhaarExactly12Digits() {
        PersonalDetailsRequest request = new PersonalDetailsRequest("John", "Doe", "123456789012");
        Set<ConstraintViolation<PersonalDetailsRequest>> violations = validator.validate(request);
        assertTrue(violations.isEmpty());
    }

    @Test
    void testAadhaarWithAlphabets() {
        PersonalDetailsRequest request = new PersonalDetailsRequest("John", "Doe", "12345678901a");
        Set<ConstraintViolation<PersonalDetailsRequest>> violations = validator.validate(request);
        assertFalse(violations.isEmpty());
    }

    @Test
    void testAadhaarWithSpecialChars() {
        PersonalDetailsRequest request = new PersonalDetailsRequest("John", "Doe", "123456-78901");
        Set<ConstraintViolation<PersonalDetailsRequest>> violations = validator.validate(request);
        assertFalse(violations.isEmpty());
    }

    @Test
    void testAllFieldsBlank() {
        PersonalDetailsRequest request = new PersonalDetailsRequest("", "", "");
        Set<ConstraintViolation<PersonalDetailsRequest>> violations = validator.validate(request);
        assertTrue(violations.size() > 1, "Expected multiple violations for all blank fields");
    }
}
