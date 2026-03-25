package com.hrms.employee;

import jakarta.persistence.EntityNotFoundException;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * Employee REST Controller
 *
 * Replaces: HRMS_EMPLOYEE Oracle Form (master-detail form with 4 tab pages)
 *
 * Endpoint mapping from legacy PL/SQL to REST:
 *   PKG_EMPLOYEE.create_employee     -> POST   /api/employees
 *   PKG_EMPLOYEE.update_employee     -> PUT    /api/employees/{id}
 *   PKG_EMPLOYEE.get_employee        -> GET    /api/employees/{id}
 *   PKG_EMPLOYEE.search_employees    -> GET    /api/employees?name=&deptId=&...
 *   PKG_EMPLOYEE.terminate_employee  -> POST   /api/employees/{id}/terminate
 *   PKG_EMPLOYEE.transfer_employee   -> POST   /api/employees/{id}/transfer
 *   PKG_EMPLOYEE.get_org_chart       -> GET    /api/employees/{id}/org-chart
 *   PKG_EMPLOYEE.get_direct_reports  -> GET    /api/employees/{id}/direct-reports
 *
 * See: docs/api-design.md for full endpoint specification
 */
@RestController
@RequestMapping("/api/employees")
public class EmployeeController {

    private final EmployeeService employeeService;

    public EmployeeController(EmployeeService employeeService) {
        this.employeeService = employeeService;
    }

    /**
     * Create a new employee.
     * Replaces: HRMS_EMPLOYEE form insert mode + PKG_EMPLOYEE.create_employee
     */
    @PostMapping
    public ResponseEntity<Employee> createEmployee(@Valid @RequestBody CreateEmployeeRequest request) {
        Employee created = employeeService.create(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(created);
    }

    /**
     * Update an existing employee.
     * Replaces: HRMS_EMPLOYEE form edit mode + PKG_EMPLOYEE.update_employee
     */
    @PutMapping("/{empId}")
    public ResponseEntity<Employee> updateEmployee(
            @PathVariable Long empId,
            @Valid @RequestBody UpdateEmployeeRequest request) {
        Employee updated = employeeService.update(empId, request);
        return ResponseEntity.ok(updated);
    }

    /**
     * Get employee by ID.
     * Replaces: PKG_EMPLOYEE.get_employee (single record query)
     */
    @GetMapping("/{empId}")
    public ResponseEntity<Employee> getEmployee(@PathVariable Long empId) {
        return employeeService.findById(empId)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    /**
     * Search employees with optional filters.
     * Replaces: PKG_EMPLOYEE.search_employees
     * FIXED: Uses Spring Data Specifications (no SQL injection risk)
     */
    @GetMapping
    public ResponseEntity<List<Employee>> searchEmployees(
            @RequestParam(required = false) String name,
            @RequestParam(required = false) Long deptId,
            @RequestParam(required = false) Long jobId,
            @RequestParam(required = false) String locationCode,
            @RequestParam(required = false) String employmentStatus,
            @RequestParam(required = false) String employmentType) {
        EmployeeSearchCriteria criteria = new EmployeeSearchCriteria(
                name, deptId, jobId, locationCode, employmentStatus, employmentType);
        List<Employee> results = employeeService.search(criteria);
        return ResponseEntity.ok(results);
    }

    /**
     * Terminate an employee.
     * Replaces: PKG_EMPLOYEE.terminate_employee
     */
    @PostMapping("/{empId}/terminate")
    public ResponseEntity<Employee> terminateEmployee(
            @PathVariable Long empId,
            @Valid @RequestBody TerminationRequest request) {
        Employee terminated = employeeService.terminate(empId, request);
        return ResponseEntity.ok(terminated);
    }

    /**
     * Transfer an employee to a new department.
     * Replaces: PKG_EMPLOYEE.transfer_employee
     */
    @PostMapping("/{empId}/transfer")
    public ResponseEntity<Employee> transferEmployee(
            @PathVariable Long empId,
            @Valid @RequestBody TransferRequest request) {
        Employee transferred = employeeService.transfer(empId, request);
        return ResponseEntity.ok(transferred);
    }

    /**
     * Get org chart starting from a root employee.
     * Replaces: PKG_EMPLOYEE.get_org_chart + VW_ORG_HIERARCHY
     */
    @GetMapping("/{empId}/org-chart")
    public ResponseEntity<OrgChartNode> getOrgChart(@PathVariable Long empId) {
        OrgChartNode chart = employeeService.getOrgChart(empId);
        return ResponseEntity.ok(chart);
    }

    /**
     * Get direct reports for a manager.
     * Replaces: PKG_EMPLOYEE.get_direct_reports
     */
    @GetMapping("/{empId}/direct-reports")
    public ResponseEntity<List<Employee>> getDirectReports(@PathVariable Long empId) {
        List<Employee> reports = employeeService.getDirectReports(empId);
        return ResponseEntity.ok(reports);
    }

    // --- Exception Handlers ---

    @ExceptionHandler(EntityNotFoundException.class)
    public ResponseEntity<ErrorResponse> handleNotFound(EntityNotFoundException ex) {
        return ResponseEntity.status(HttpStatus.NOT_FOUND)
                .body(new ErrorResponse("NOT_FOUND", ex.getMessage()));
    }

    @ExceptionHandler(IllegalStateException.class)
    public ResponseEntity<ErrorResponse> handleIllegalState(IllegalStateException ex) {
        return ResponseEntity.status(HttpStatus.CONFLICT)
                .body(new ErrorResponse("CONFLICT", ex.getMessage()));
    }

    @ExceptionHandler(IllegalArgumentException.class)
    public ResponseEntity<ErrorResponse> handleIllegalArgument(IllegalArgumentException ex) {
        return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                .body(new ErrorResponse("BAD_REQUEST", ex.getMessage()));
    }

    record ErrorResponse(String code, String message) {}
}
