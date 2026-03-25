package com.hrms.employee;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

/**
 * Employee Repository
 *
 * Replaces: Direct SQL in PKG_EMPLOYEE (get_employee, search_employees, etc.)
 * FIXED: Uses Spring Data Specifications instead of dynamic string concatenation
 *        (eliminates SQL injection vulnerability in legacy search_employees)
 */
@Repository
public interface EmployeeRepository extends JpaRepository<Employee, Long>, JpaSpecificationExecutor<Employee> {

    Optional<Employee> findByEmpNumber(String empNumber);

    List<Employee> findByManagerEmpIdAndEmploymentStatus(Long managerEmpId, String employmentStatus);

    /**
     * Replaces: PKG_EMPLOYEE.get_headcount_by_dept
     */
    long countByDeptIdAndEmploymentStatus(Long deptId, String employmentStatus);

    /**
     * Replaces: PKG_EMPLOYEE.get_org_chart (recursive CONNECT BY PRIOR)
     * Uses recursive CTE for better performance with large hierarchies.
     */
    @Query(value = """
            WITH RECURSIVE org_tree AS (
                SELECT e.emp_id, e.emp_number, e.first_name, e.last_name,
                       e.dept_id, e.job_id, e.manager_emp_id, 1 AS depth
                FROM hrms.employees e
                WHERE e.emp_id = :rootEmpId AND e.employment_status = 'ACTIVE'
                UNION ALL
                SELECT e.emp_id, e.emp_number, e.first_name, e.last_name,
                       e.dept_id, e.job_id, e.manager_emp_id, ot.depth + 1
                FROM hrms.employees e
                JOIN org_tree ot ON e.manager_emp_id = ot.emp_id
                WHERE e.employment_status = 'ACTIVE' AND ot.depth < :maxDepth
            )
            SELECT * FROM org_tree ORDER BY depth, last_name, first_name
            """, nativeQuery = true)
    List<Object[]> findOrgTree(@Param("rootEmpId") Long rootEmpId, @Param("maxDepth") int maxDepth);
}
