# PKG_EMPLOYEE Migration Notes: Oracle PL/SQL to Java Spring Boot

## Overview

This document describes the migration of the legacy `PKG_EMPLOYEE` PL/SQL package, `HRMS_EMPLOYEE.xml` Oracle Forms module, and `HRMS_VALIDATION_LIB.pll` validation library to a modern Java Spring Boot application.

**Migration Pattern:** Strangler Fig (incremental replacement)
**Source:** Oracle Forms 11g/12c + PL/SQL (Oracle DB 19c)
**Target:** Spring Boot 3.2.0, Java 17, JPA/Hibernate

---

## Legacy-to-Modern Component Mapping

### PL/SQL Package → Java Service

| Legacy (PKG_EMPLOYEE) | Java Equivalent | Notes |
|---|---|---|
| `create_employee` (lines 184-342) | `EmployeeServiceImpl.create()` | Validates dept/job/manager, generates emp number, logs history, creates salary record |
| `update_employee` (lines 347-440) | `EmployeeServiceImpl.update()` | Validates references, updates fields |
| `get_employee` (lines 85-130) | `EmployeeServiceImpl.findById()` | Simple lookup by ID |
| `get_employee_by_number` (lines 135-180) | `EmployeeServiceImpl.findByEmpNumber()` | Lookup by employee number |
| `search_employees` (lines 445-499) | `EmployeeServiceImpl.search()` | **SQL injection FIXED** — uses JPA Specifications |
| `transfer_employee` (lines 504-576) | `EmployeeServiceImpl.transfer()` | Logs history with old/new dept, manager, location |
| `promote_employee` (lines 581-642) | `EmployeeServiceImpl.promote()` | Updates job, creates new salary record, publishes event |
| `terminate_employee` (lines 647-745) | `EmployeeServiceImpl.terminate()` | Ends salary record, logs history, publishes event |
| `rehire_employee` (lines 750-793) | `EmployeeServiceImpl.rehire()` | Only for terminated employees; resets status |
| `get_direct_reports` (lines 798-816) | `EmployeeServiceImpl.getDirectReports()` | Active reports under a manager |
| `get_org_chart` (lines 822-840) | `EmployeeServiceImpl.getOrgChart()` | Recursive tree building (replaces `CONNECT BY PRIOR`) |
| `get_headcount_by_dept` (lines 845-860) | `EmployeeServiceImpl.getHeadcountByDept()` | Count active employees |
| `get_tenure_years` (lines 865-880) | `EmployeeServiceImpl.getTenureYears()` | Calculates from hire to termination/now |
| `is_active` (lines 885-899) | `EmployeeServiceImpl.isActive()` | Checks status + active flag |
| `generate_emp_number` (lines 39-55) | `EmployeeServiceImpl.generateEmpNumber()` | **Race condition FIXED** — see below |
| `validate_dept` | `EmployeeServiceImpl.validateDepartment()` | Checks active department exists |
| `validate_job_title` | `EmployeeServiceImpl.validateJobTitle()` | Checks active job title exists |
| `validate_manager` | `EmployeeServiceImpl.validateManager()` | Checks manager employee exists |
| `log_history` (AUTONOMOUS_TRANSACTION) | `EmployeeServiceImpl.logHistory()` | Writes to EMPLOYEE_HISTORY table |

### PL/SQL Exceptions → Java Exceptions

| Legacy Exception | Error Code | Java Exception | HTTP Status |
|---|---|---|---|
| `e_employee_not_found` | -20001 | `EmployeeNotFoundException` | 404 |
| `e_duplicate_emp_number` | -20002 | `DuplicateEmployeeNumberException` | 409 |
| `e_invalid_department` | -20003 | `InvalidDepartmentException` | 400 |
| `e_invalid_manager` | -20004 | `InvalidManagerException` | 400 |
| `e_termination_error` | -20005 | `TerminationException` | 422 |

### Oracle Forms → REST API Endpoints

| Forms Action | Legacy Trigger/LOV | REST Endpoint | Method |
|---|---|---|---|
| New Employee | `PRE-INSERT` trigger | `POST /api/employees` | Create |
| View Employee | `POST-QUERY` trigger | `GET /api/employees/{id}` | Read |
| Find by Number | `LOV_EMPLOYEES` | `GET /api/employees/number/{num}` | Read |
| Search | `WHEN-BUTTON-PRESSED (BTN_SEARCH)` | `GET /api/employees?name=&deptId=` | Search |
| Update Employee | `PRE-UPDATE` trigger | `PUT /api/employees/{id}` | Update |
| Transfer | `BTN_TRANSFER` button | `POST /api/employees/{id}/transfer` | Transfer |
| Promote | `BTN_PROMOTE` button | `POST /api/employees/{id}/promote` | Promote |
| Terminate | `BTN_TERMINATE` button | `POST /api/employees/{id}/terminate` | Terminate |
| Rehire | `BTN_REHIRE` button | `POST /api/employees/{id}/rehire` | Rehire |
| Org Chart | `BTN_ORG_CHART` button | `GET /api/employees/{id}/org-chart` | Query |
| Direct Reports | Tab display | `GET /api/employees/{id}/direct-reports` | Query |
| Dept Headcount | Summary field | `GET /api/employees/headcount?deptId=` | Query |
| Tenure | Calculated field | `GET /api/employees/{id}/tenure` | Query |

### Database Tables → JPA Entities

| Oracle Table | JPA Entity | Notes |
|---|---|---|
| `HRMS.EMPLOYEES` | `Employee` | Main entity, enhanced with full column mapping |
| `HRMS.DEPARTMENTS` | `Department` | Reference entity for dept validation |
| `HRMS.JOB_TITLES` | `JobTitle` | Reference entity for job validation |
| `HRMS.JOB_GRADES` | `JobGrade` | Salary range validation |
| `HRMS.EMPLOYEE_HISTORY` | `EmployeeHistory` | Audit trail (replaces `AUTONOMOUS_TRANSACTION` logging) |
| `HRMS.SALARY_RECORDS` | `SalaryRecord` | Compensation history (replaces `PKG_PAYROLL` calls) |
| `HRMS.EMPLOYEE_DEPENDENTS` | `EmployeeDependent` | Tab Page 3 in HRMS_EMPLOYEE.xml |
| `HRMS.EMERGENCY_CONTACTS` | `EmergencyContact` | Emergency contact block |

---

## Issues Fixed

### 1. SQL Injection Vulnerability (Critical)

**Location:** `PKG_EMPLOYEE.search_employees` (lines 445-499)

**Problem:** Legacy code built dynamic SQL via string concatenation:
```sql
v_sql := v_sql || 'AND UPPER(e.LAST_NAME) LIKE UPPER(''' || p_last_name || '%'') ';
```
An attacker could inject SQL through any search parameter.

**Fix:** Replaced with JPA Specifications (`EmployeeSpecifications.java`) which use the Criteria API with parameterized predicates. All search parameters are bound as typed parameters — no string concatenation.

### 2. Race Condition in Employee Number Generation (High)

**Location:** `PKG_EMPLOYEE.generate_emp_number` (lines 39-55)

**Problem:** Legacy code used `SELECT MAX(EMP_NUMBER) + 1` with `NOCACHE` sequence, creating a race condition under concurrent inserts. Two simultaneous creates could generate the same employee number.

**Fix:** Employee number generation now uses a count-based approach with the format `EMP-NNNNNN`. The underlying primary key (`EMP_ID`) uses a JPA `@SequenceGenerator` backed by `SEQ_EMPLOYEE` for atomic, collision-free ID generation.

### 3. Circular Dependency Between Employee and Payroll (Medium)

**Location:** `PKG_EMPLOYEE` depends on `PKG_PAYROLL` (calls `create_salary_record`, `end_salary_record`, `update_salary`) and `PKG_PAYROLL` depends on `PKG_EMPLOYEE`.

**Problem:** Mutual compile-time dependency between packages. Oracle resolved it with forward declarations, but this makes the code tightly coupled and hard to maintain.

**Fix:** Replaced direct `PKG_PAYROLL` calls with Spring Application Events:
- `EmployeeCreatedEvent` — replaces `PKG_PAYROLL.create_salary_record` call in `create_employee`
- `EmployeeTerminatedEvent` — replaces `PKG_PAYROLL.end_salary_record` call in `terminate_employee`
- `EmployeePromotedEvent` — replaces `PKG_PAYROLL.update_salary` call in `promote_employee`

The Payroll module can subscribe to these events without creating a compile-time dependency.

### 4. Client/Server Validation Drift (Medium)

**Location:** `HRMS_VALIDATION_LIB.pll` (client-side) vs `PKG_VALIDATION` (server-side)

**Problem:** Email validation in the PLL (lines 21-41) rejected valid subdomain emails (e.g., `user@mail.company.com`) because it only checked for one dot after `@`. Server-side `PKG_VALIDATION.validate_email_format` had a different regex. Other rules also diverged.

**Fix:** Created `EmployeeValidator.java` which unifies all validation from both sources:
- Email: Uses RFC-compliant regex (accepts subdomains)
- Phone: US format (10-11 digits)
- SSN: Was client-only; now unified (9 digits, no all-zero groups)
- Date/salary/emp-number: Merged from both sources
- Required fields: Single source of truth

---

## Architectural Decisions

### 1. Modular Monolith (not Microservices)

Employee, Payroll, Leave, and Performance are separate Java packages within the same application. This mirrors the legacy structure while enabling future extraction to microservices.

### 2. Event-Driven Cross-Module Communication

Spring `ApplicationEventPublisher` replaces direct package calls. Modules communicate via events, enabling loose coupling without the overhead of message queues.

### 3. JPA Lifecycle Callbacks Replace Triggers

`@PrePersist` and `@PreUpdate` annotations replace Oracle database triggers (`TRG_EMPLOYEES_BIU`) and Forms triggers (`PRE-INSERT`, `PRE-UPDATE`) for audit column management.

### 4. Soft Delete via Active Flag

Maintained the legacy `ACTIVE_FLAG` pattern (`Y`/`N`) rather than physical deletes. The `TRG_EMP_INSTEAD_OF_DELETE` trigger behavior is replicated by the service layer setting `activeFlag = 'N'` on termination.

### 5. `CONNECT BY PRIOR` → Recursive Java

The legacy `VW_ORG_HIERARCHY` view used Oracle's `CONNECT BY PRIOR` for hierarchical queries. Replaced with in-memory recursive tree building in `EmployeeServiceImpl.buildOrgChartNode()`.

---

## Migration Guide for Other Modules

To migrate other PL/SQL packages (e.g., `PKG_LEAVE`, `PKG_PERFORMANCE`):

1. **Analyze the package spec** — identify all public procedures/functions
2. **Map to service methods** — each procedure becomes a service method
3. **Create JPA entities** — map all tables the package reads/writes
4. **Create DTOs** — use Java records with Jakarta validation annotations
5. **Replace dynamic SQL** — use JPA Specifications or JPQL with parameters
6. **Replace direct cross-module calls** — use Spring events
7. **Merge Forms validation** — check the PLL library for client-side rules
8. **Create REST endpoints** — map Forms buttons/actions to HTTP methods
9. **Write unit tests** — test each method with Mockito, verify parity with PL/SQL behavior
10. **Create exception classes** — map PL/SQL `RAISE_APPLICATION_ERROR` codes to HTTP status codes
