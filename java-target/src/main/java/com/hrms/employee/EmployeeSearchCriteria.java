package com.hrms.employee;

/**
 * Search criteria DTO
 * Replaces: PKG_EMPLOYEE.search_employees dynamic SQL
 * FIXED: Uses Spring Data Specifications — no SQL injection risk
 */
public record EmployeeSearchCriteria(
    String name,
    Long deptId,
    Long jobId,
    String locationCode,
    String employmentStatus,
    String employmentType
) {}
