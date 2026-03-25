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

    Employee create(CreateEmployeeRequest request);

    Employee update(Long empId, UpdateEmployeeRequest request);

    Optional<Employee> findById(Long empId);

    Optional<Employee> findByEmpNumber(String empNumber);

    List<Employee> search(EmployeeSearchCriteria criteria);

    Employee terminate(Long empId, TerminationRequest request);

    Employee transfer(Long empId, TransferRequest request);

    Employee promote(Long empId, PromoteRequest request);

    Employee rehire(Long empId, RehireRequest request);

    OrgChartNode getOrgChart(Long rootEmpId);

    List<Employee> getDirectReports(Long managerId);

    long getHeadcountByDept(Long deptId);

    double getTenureYears(Long empId);

    boolean isActive(Long empId);
}
