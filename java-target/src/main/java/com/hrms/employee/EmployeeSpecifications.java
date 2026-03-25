package com.hrms.employee;

import org.springframework.data.jpa.domain.Specification;

/**
 * Employee Search Specifications
 *
 * Replaces: PKG_EMPLOYEE.search_employees dynamic SQL string concatenation
 * FIXED: Eliminates SQL injection vulnerability — uses type-safe JPA Criteria API
 *        instead of concatenating user input into SQL strings.
 *
 * Legacy vulnerability (PKG_EMPLOYEE.pkb line 467):
 *   v_sql := v_sql || 'AND UPPER(e.LAST_NAME) LIKE UPPER(''' || p_last_name || '%'') ';
 */
public final class EmployeeSpecifications {

    private EmployeeSpecifications() {
    }

    public static Specification<Employee> nameLike(String name) {
        return (root, query, cb) -> {
            if (name == null || name.isBlank()) {
                return cb.conjunction();
            }
            String pattern = "%" + name.toUpperCase() + "%";
            return cb.or(
                    cb.like(cb.upper(root.get("firstName")), pattern),
                    cb.like(cb.upper(root.get("lastName")), pattern)
            );
        };
    }

    public static Specification<Employee> inDepartment(Long deptId) {
        return (root, query, cb) -> {
            if (deptId == null) {
                return cb.conjunction();
            }
            return cb.equal(root.get("deptId"), deptId);
        };
    }

    public static Specification<Employee> hasJobId(Long jobId) {
        return (root, query, cb) -> {
            if (jobId == null) {
                return cb.conjunction();
            }
            return cb.equal(root.get("jobId"), jobId);
        };
    }

    public static Specification<Employee> atLocation(String locationCode) {
        return (root, query, cb) -> {
            if (locationCode == null || locationCode.isBlank()) {
                return cb.conjunction();
            }
            return cb.equal(root.get("locationCode"), locationCode);
        };
    }

    public static Specification<Employee> hasStatus(String employmentStatus) {
        return (root, query, cb) -> {
            if (employmentStatus == null || employmentStatus.isBlank()) {
                return cb.conjunction();
            }
            return cb.equal(root.get("employmentStatus"), employmentStatus);
        };
    }

    public static Specification<Employee> hasEmploymentType(String employmentType) {
        return (root, query, cb) -> {
            if (employmentType == null || employmentType.isBlank()) {
                return cb.conjunction();
            }
            return cb.equal(root.get("employmentType"), employmentType);
        };
    }

    public static Specification<Employee> isActive() {
        return (root, query, cb) -> cb.equal(root.get("activeFlag"), "Y");
    }
}
