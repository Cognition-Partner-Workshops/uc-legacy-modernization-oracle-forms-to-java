package com.hrms.employee;

import java.util.List;
import java.util.Optional;

/**
 * Employee Service Interface
 *
 * Migrated from: PKG_EMPLOYEE (spec + body)
 * See: migration-plan/component-mapping.md for full mapping
 *
 * Key changes from legacy:
 * - Race condition in emp number generation fixed (uses DB sequence directly)
 * - SQL injection in search fixed (uses Spring Data Specifications)
 * - Circular dependency with PayrollService broken (uses events)
 */
public interface EmployeeService {

    /**
     * Create a new employee.
     * Replaces: PKG_EMPLOYEE.create_employee + HRMS_EMPLOYEE PRE-INSERT trigger
     */
    Employee create(CreateEmployeeRequest request);

    /**
     * Update an existing employee.
     * Replaces: PKG_EMPLOYEE.update_employee + HRMS_EMPLOYEE PRE-UPDATE trigger
     */
    Employee update(Long empId, UpdateEmployeeRequest request);

    /**
     * Find employee by ID.
     * Replaces: PKG_EMPLOYEE.get_employee
     */
    Optional<Employee> findById(Long empId);

    /**
     * Search employees with criteria.
     * Replaces: PKG_EMPLOYEE.search_employees
     * FIXED: Uses Spring Data Specifications instead of string concatenation (SQL injection)
     */
    List<Employee> search(EmployeeSearchCriteria criteria);

    /**
     * Terminate an employee.
     * Replaces: PKG_EMPLOYEE.terminate_employee
     */
    Employee terminate(Long empId, TerminationRequest request);

    /**
     * Transfer employee to a new department.
     * Replaces: PKG_EMPLOYEE.transfer_employee
     */
    Employee transfer(Long empId, TransferRequest request);

    /**
     * Get org chart starting from a root employee.
     * Replaces: PKG_EMPLOYEE.get_org_chart + VW_ORG_HIERARCHY
     * FIXED: Uses recursive CTE instead of CONNECT BY for better performance
     */
    OrgChartNode getOrgChart(Long rootEmpId);

    /**
     * Get direct reports for a manager.
     * Replaces: PKG_EMPLOYEE.get_direct_reports
     */
    List<Employee> getDirectReports(Long managerId);
}
