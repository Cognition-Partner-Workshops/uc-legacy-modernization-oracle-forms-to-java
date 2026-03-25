# Migration Notes: PKG_EMPLOYEE → EmployeeService (Spring Boot)

## Source Components Analyzed

| Legacy Component | Type | Purpose |
|---|---|---|
| `PKG_EMPLOYEE.pks` | PL/SQL Package Spec | Employee CRUD, lifecycle, queries, validation |
| `PKG_EMPLOYEE.pkb` | PL/SQL Package Body | 967 lines of implementation |
| `HRMS_EMPLOYEE.xml` | Oracle Forms 12c | Master-detail form (4 tab pages, 5 data blocks, 8 LOVs) |
| `HRMS_VALIDATION_LIB.pll.sql` | Forms PLL Library | Client-side validation (email, phone, SSN, salary range) |

## Target Components Created

| Java Component | Replaces | Purpose |
|---|---|---|
| `Employee.java` | EMPLOYEES table + Forms block | JPA entity with validation annotations |
| `EmployeeService.java` | PKG_EMPLOYEE spec | Service interface |
| `EmployeeServiceImpl.java` | PKG_EMPLOYEE body | Full implementation |
| `EmployeeController.java` | HRMS_EMPLOYEE form | REST API endpoints |
| `EmployeeRepository.java` | Direct SQL in PKG_EMPLOYEE | Spring Data JPA repository |
| `EmployeeSpecifications.java` | Dynamic SQL in search_employees | Type-safe JPA Criteria queries |
| `CreateEmployeeRequest.java` | Forms insert mode + triggers | Request DTO with unified validation |
| `UpdateEmployeeRequest.java` | Forms edit mode + triggers | Partial update DTO |
| `TransferRequest.java` | transfer_employee params | Transfer DTO |
| `TerminationRequest.java` | terminate_employee params | Termination DTO |
| `EmployeeSearchCriteria.java` | search_employees params | Search filter DTO |
| `OrgChartNode.java` | VW_ORG_HIERARCHY | Tree structure for org chart |

## Bugs Fixed During Migration

### 1. SQL Injection in search_employees (CRITICAL)

**Legacy (PKG_EMPLOYEE.pkb line 442-499):**
```sql
-- VULNERABILITY: String concatenation instead of bind variable
v_sql := v_sql || 'AND UPPER(e.LAST_NAME) LIKE UPPER(''' || p_last_name || '%'') ';
```
User input was concatenated directly into dynamic SQL. While the Forms LOV passed validated values, direct PL/SQL calls were vulnerable.

**Fix:** `EmployeeSpecifications.java` uses JPA Criteria API — all parameters are bind variables. No user input ever appears in SQL strings.

### 2. Race Condition in generate_emp_number (HIGH)

**Legacy (PKG_EMPLOYEE.pkb line 37-55):**
```sql
-- BUG: race condition under concurrent inserts - no SELECT FOR UPDATE
SELECT NVL(MAX(TO_NUMBER(SUBSTR(EMP_NUMBER, 5))), 0) + 1 INTO v_max_num
FROM EMPLOYEES WHERE EMP_NUMBER LIKE c_emp_number_prefix || '-%';
```
Two concurrent inserts could read the same MAX value and generate duplicate employee numbers.

**Fix:** Employee number is derived from the sequence-assigned `EMP_ID` after save: `"EMP-" + String.format("%06d", saved.getEmpId())`. The database sequence guarantees uniqueness.

### 3. Circular Dependency with PKG_PAYROLL (MEDIUM)

**Legacy:** `PKG_EMPLOYEE.create_employee` called `PKG_PAYROLL.create_salary_record`, which called `PKG_EMPLOYEE.is_active` — creating a bidirectional dependency between packages.

**Fix:** Salary record creation is decoupled from employee creation. In production, use Spring Application Events (`EmployeeCreatedEvent`) to notify `PayrollService` asynchronously, breaking the circular dependency.

### 4. Validation Drift Between Client and Server (MEDIUM)

**Legacy:** Email validation in `HRMS_VALIDATION_LIB.pll.sql` rejected valid subdomain emails (e.g., `user@mail.company.com`) while `PKG_VALIDATION` on the server used a more permissive regex. The two could drift out of sync silently.

**Fix:** Unified validation in `CreateEmployeeRequest.java` using Jakarta Bean Validation annotations (`@Email`, `@NotBlank`, `@NotNull`). Single source of truth — no client/server split.

## Translation Decisions

### 1. Names stored as UPPER case
Legacy used `UPPER(TRIM())` on insert/update. Preserved this behavior for backward compatibility with any downstream systems that expect uppercase names.

### 2. Partial update pattern
Legacy `update_employee` used `NVL(p_new_value, EXISTING_VALUE)` to update only non-null parameters. Preserved this pattern in `EmployeeServiceImpl.update()`.

### 3. Audit columns via JPA lifecycle
Legacy used Forms PRE-INSERT/PRE-UPDATE triggers to set `CREATED_BY`, `CREATED_DATE`, `MODIFIED_BY`, `MODIFIED_DATE`. Replaced with `@PrePersist` and `@PreUpdate` JPA callbacks.

### 4. Org chart uses in-memory tree building
Legacy used Oracle `CONNECT BY PRIOR` which timed out for large hierarchies. Replaced with recursive in-memory tree building with bounded depth (max 10 levels). The repository also provides a native SQL recursive CTE query as an alternative for database-level recursion.

### 5. Termination side effects deferred
Legacy `terminate_employee` directly cancelled pending leave requests, ended salary records, and deactivated pay elements in the same transaction. In the modernized system, these are noted as TODOs for Spring Application Events to maintain module boundaries.

## REST API Endpoint Mapping

| HTTP Method | Endpoint | Legacy Equivalent |
|---|---|---|
| `POST` | `/api/employees` | `PKG_EMPLOYEE.create_employee` |
| `PUT` | `/api/employees/{id}` | `PKG_EMPLOYEE.update_employee` |
| `GET` | `/api/employees/{id}` | `PKG_EMPLOYEE.get_employee` |
| `GET` | `/api/employees?name=&deptId=&...` | `PKG_EMPLOYEE.search_employees` |
| `POST` | `/api/employees/{id}/terminate` | `PKG_EMPLOYEE.terminate_employee` |
| `POST` | `/api/employees/{id}/transfer` | `PKG_EMPLOYEE.transfer_employee` |
| `GET` | `/api/employees/{id}/org-chart` | `PKG_EMPLOYEE.get_org_chart` |
| `GET` | `/api/employees/{id}/direct-reports` | `PKG_EMPLOYEE.get_direct_reports` |

## Not Yet Migrated

| Legacy Component | Reason |
|---|---|
| `PKG_EMPLOYEE.promote_employee` | Requires `PKG_PAYROLL.create_salary_record` — deferred to Payroll module migration |
| `PKG_EMPLOYEE.rehire_employee` | Requires salary record creation — same dependency |
| `PKG_EMPLOYEE.get_headcount_by_dept` | Available as `EmployeeRepository.countByDeptIdAndEmploymentStatus()` but not yet exposed via REST |
| `PKG_EMPLOYEE.get_tenure_years` | Simple date calculation — can be added as a derived field |
| HRMS_EMPLOYEE form LOVs | Department, Job Title, Manager lookups — deferred to reference data API |
| HRMS_EMPLOYEE form alerts | Confirmation dialogs — handled by frontend SPA |
