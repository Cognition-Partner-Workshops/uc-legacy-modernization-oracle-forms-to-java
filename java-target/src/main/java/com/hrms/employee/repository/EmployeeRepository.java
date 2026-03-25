package com.hrms.employee.repository;

import com.hrms.employee.Employee;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

/**
 * Employee Repository
 * Replaces: Direct SQL in PKG_EMPLOYEE
 * FIXED: Uses JPA Specifications instead of string concatenation (SQL injection in search_employees)
 * FIXED: Uses DB sequence for emp number generation (race condition in generate_emp_number)
 */
@Repository
public interface EmployeeRepository extends JpaRepository<Employee, Long>, JpaSpecificationExecutor<Employee> {

    Optional<Employee> findByEmpNumber(String empNumber);

    List<Employee> findByManagerEmpIdAndActiveFlag(Long managerEmpId, String activeFlag);

    @Query("SELECT COUNT(e) FROM Employee e WHERE e.deptId = :deptId AND e.employmentStatus = 'ACTIVE' AND e.activeFlag = 'Y'")
    long countActiveByDeptId(@Param("deptId") Long deptId);

    @Query(value = "SELECT CONCAT('EMP-', LPAD(CAST(NEXTVAL('SEQ_EMP_NUMBER') AS VARCHAR), 6, '0'))", nativeQuery = true)
    String generateEmpNumber();

    boolean existsByEmpNumber(String empNumber);
}
