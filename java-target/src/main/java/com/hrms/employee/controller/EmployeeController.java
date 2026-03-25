package com.hrms.employee.controller;

import com.hrms.employee.*;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import jakarta.validation.Valid;

import java.util.List;

/**
 * REST Controller for Employee Management
 *
 * Migrated from: PKG_EMPLOYEE (PL/SQL) + HRMS_EMPLOYEE.xml (Oracle Forms)
 *
 * Endpoint mapping from legacy:
 * - POST   /api/employees              -> PKG_EMPLOYEE.create_employee
 * - GET    /api/employees/{id}         -> PKG_EMPLOYEE.get_employee
 * - GET    /api/employees/number/{num} -> PKG_EMPLOYEE.get_employee_by_number
 * - GET    /api/employees              -> PKG_EMPLOYEE.search_employees (SQL injection FIXED)
 * - PUT    /api/employees/{id}         -> PKG_EMPLOYEE.update_employee
 * - POST   /api/employees/{id}/transfer  -> PKG_EMPLOYEE.transfer_employee
 * - POST   /api/employees/{id}/promote   -> PKG_EMPLOYEE.promote_employee
 * - POST   /api/employees/{id}/terminate -> PKG_EMPLOYEE.terminate_employee
 * - POST   /api/employees/{id}/rehire    -> PKG_EMPLOYEE.rehire_employee
 * - GET    /api/employees/{id}/direct-reports -> PKG_EMPLOYEE.get_direct_reports
 * - GET    /api/employees/{id}/org-chart -> PKG_EMPLOYEE.get_org_chart
 * - GET    /api/employees/headcount      -> PKG_EMPLOYEE.get_headcount_by_dept
 * - GET    /api/employees/{id}/tenure    -> PKG_EMPLOYEE.get_tenure_years
 * - GET    /api/employees/{id}/active    -> PKG_EMPLOYEE.is_active
 */
@RestController
@RequestMapping("/api/employees")
public class EmployeeController {

    private final EmployeeService employeeService;

    public EmployeeController(EmployeeService employeeService) {
        this.employeeService = employeeService;
    }

    @PostMapping
    public ResponseEntity<Employee> create(@Valid @RequestBody CreateEmployeeRequest request) {
        Employee created = employeeService.create(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(created);
    }

    @GetMapping("/{id}")
    public ResponseEntity<Employee> getById(@PathVariable Long id) {
        return employeeService.findById(id)
            .map(ResponseEntity::ok)
            .orElse(ResponseEntity.notFound().build());
    }

    @GetMapping("/number/{empNumber}")
    public ResponseEntity<Employee> getByEmpNumber(@PathVariable String empNumber) {
        return employeeService.findByEmpNumber(empNumber)
            .map(ResponseEntity::ok)
            .orElse(ResponseEntity.notFound().build());
    }

    @GetMapping
    public ResponseEntity<List<Employee>> search(
            @RequestParam(required = false) String name,
            @RequestParam(required = false) Long deptId,
            @RequestParam(required = false) Long jobId,
            @RequestParam(required = false) String locationCode,
            @RequestParam(required = false) String employmentStatus,
            @RequestParam(required = false) String employmentType) {
        EmployeeSearchCriteria criteria = new EmployeeSearchCriteria(
            name, deptId, jobId, locationCode, employmentStatus, employmentType
        );
        return ResponseEntity.ok(employeeService.search(criteria));
    }

    @PutMapping("/{id}")
    public ResponseEntity<Employee> update(@PathVariable Long id,
                                            @Valid @RequestBody UpdateEmployeeRequest request) {
        Employee updated = employeeService.update(id, request);
        return ResponseEntity.ok(updated);
    }

    @PostMapping("/{id}/transfer")
    public ResponseEntity<Employee> transfer(@PathVariable Long id,
                                              @Valid @RequestBody TransferRequest request) {
        Employee transferred = employeeService.transfer(id, request);
        return ResponseEntity.ok(transferred);
    }

    @PostMapping("/{id}/promote")
    public ResponseEntity<Employee> promote(@PathVariable Long id,
                                             @Valid @RequestBody PromoteRequest request) {
        Employee promoted = employeeService.promote(id, request);
        return ResponseEntity.ok(promoted);
    }

    @PostMapping("/{id}/terminate")
    public ResponseEntity<Employee> terminate(@PathVariable Long id,
                                               @Valid @RequestBody TerminationRequest request) {
        Employee terminated = employeeService.terminate(id, request);
        return ResponseEntity.ok(terminated);
    }

    @PostMapping("/{id}/rehire")
    public ResponseEntity<Employee> rehire(@PathVariable Long id,
                                            @Valid @RequestBody RehireRequest request) {
        Employee rehired = employeeService.rehire(id, request);
        return ResponseEntity.ok(rehired);
    }

    @GetMapping("/{id}/direct-reports")
    public ResponseEntity<List<Employee>> getDirectReports(@PathVariable Long id) {
        return ResponseEntity.ok(employeeService.getDirectReports(id));
    }

    @GetMapping("/{id}/org-chart")
    public ResponseEntity<OrgChartNode> getOrgChart(@PathVariable Long id) {
        return ResponseEntity.ok(employeeService.getOrgChart(id));
    }

    @GetMapping("/headcount")
    public ResponseEntity<Long> getHeadcount(@RequestParam Long deptId) {
        return ResponseEntity.ok(employeeService.getHeadcountByDept(deptId));
    }

    @GetMapping("/{id}/tenure")
    public ResponseEntity<Double> getTenure(@PathVariable Long id) {
        return ResponseEntity.ok(employeeService.getTenureYears(id));
    }

    @GetMapping("/{id}/active")
    public ResponseEntity<Boolean> isActive(@PathVariable Long id) {
        return ResponseEntity.ok(employeeService.isActive(id));
    }
}
