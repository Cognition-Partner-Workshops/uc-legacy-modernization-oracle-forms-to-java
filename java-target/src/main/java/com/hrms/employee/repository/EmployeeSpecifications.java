package com.hrms.employee.repository;

import com.hrms.employee.Employee;
import com.hrms.employee.EmployeeSearchCriteria;
import org.springframework.data.jpa.domain.Specification;

/**
 * JPA Specifications for type-safe, parameterized employee search.
 * Replaces: PKG_EMPLOYEE.search_employees (lines 445-499)
 * FIXED: Eliminates SQL injection vulnerability from string concatenation.
 * Legacy code built SQL via: v_sql || 'AND UPPER(e.LAST_NAME) LIKE UPPER(''' || p_last_name || '%'') '
 * Now uses JPA Criteria API with parameterized predicates.
 */
public final class EmployeeSpecifications {

    private EmployeeSpecifications() {}

    public static Specification<Employee> fromCriteria(EmployeeSearchCriteria criteria) {
        Specification<Employee> spec = Specification.where(isActive());

        if (criteria.name() != null && !criteria.name().isBlank()) {
            spec = spec.and(nameContains(criteria.name()));
        }
        if (criteria.deptId() != null) {
            spec = spec.and(inDepartment(criteria.deptId()));
        }
        if (criteria.jobId() != null) {
            spec = spec.and(hasJob(criteria.jobId()));
        }
        if (criteria.locationCode() != null && !criteria.locationCode().isBlank()) {
            spec = spec.and(atLocation(criteria.locationCode()));
        }
        if (criteria.employmentStatus() != null && !criteria.employmentStatus().isBlank()) {
            spec = spec.and(hasStatus(criteria.employmentStatus()));
        }
        if (criteria.employmentType() != null && !criteria.employmentType().isBlank()) {
            spec = spec.and(hasType(criteria.employmentType()));
        }
        return spec;
    }

    public static Specification<Employee> isActive() {
        return (root, query, cb) -> cb.equal(root.get("activeFlag"), "Y");
    }

    public static Specification<Employee> nameContains(String name) {
        return (root, query, cb) -> cb.or(
            cb.like(cb.upper(root.get("firstName")), "%" + name.toUpperCase() + "%"),
            cb.like(cb.upper(root.get("lastName")), "%" + name.toUpperCase() + "%")
        );
    }

    public static Specification<Employee> inDepartment(Long deptId) {
        return (root, query, cb) -> cb.equal(root.get("deptId"), deptId);
    }

    public static Specification<Employee> hasJob(Long jobId) {
        return (root, query, cb) -> cb.equal(root.get("jobId"), jobId);
    }

    public static Specification<Employee> atLocation(String locationCode) {
        return (root, query, cb) -> cb.equal(root.get("locationCode"), locationCode);
    }

    public static Specification<Employee> hasStatus(String status) {
        return (root, query, cb) -> cb.equal(root.get("employmentStatus"), status);
    }

    public static Specification<Employee> hasType(String type) {
        return (root, query, cb) -> cb.equal(root.get("employmentType"), type);
    }
}
