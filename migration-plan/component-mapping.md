# Component Mapping: Oracle Forms → Java Spring Boot

## Package-to-Service Mapping

### PKG_EMPLOYEE → EmployeeService

| PL/SQL Procedure/Function | Java Method | Notes |
|---|---|---|
| `create_employee()` | `EmployeeService.create(CreateEmployeeRequest)` | Replaces Forms PRE-INSERT trigger logic too |
| `update_employee()` | `EmployeeService.update(Long id, UpdateEmployeeRequest)` | |
| `terminate_employee()` | `EmployeeService.terminate(Long id, TerminationRequest)` | State machine validation |
| `generate_emp_number()` | `EmployeeNumberGenerator.next()` | Fix race condition: use DB sequence directly |
| `search_employees()` | `EmployeeService.search(EmployeeSearchCriteria)` | Fix SQL injection: use Spring Data Specifications |
| `get_employee()` | `EmployeeService.findById(Long id)` | |
| `get_org_chart()` | `EmployeeService.getOrgChart(Long rootEmpId)` | Fix performance: use adjacency list with recursive CTE |
| `transfer_employee()` | `EmployeeService.transfer(Long id, TransferRequest)` | |
| `get_direct_reports()` | `EmployeeService.getDirectReports(Long managerId)` | |

### PKG_PAYROLL → PayrollService

| PL/SQL Procedure/Function | Java Method | Notes |
|---|---|---|
| `create_payroll_run()` | `PayrollService.createRun(CreateRunRequest)` | |
| `calculate_payroll()` | `PayrollService.calculate(Long runId)` | Fix: Use Spring Batch, eliminate partial commits |
| `calculate_employee_pay()` | `PayrollCalculator.calculateForEmployee(Employee, PayPeriod)` | Extract as strategy pattern |
| `approve_payroll()` | `PayrollService.approve(Long runId, ApprovalRequest)` | |
| `reverse_payroll()` | `PayrollService.reverse(Long runId, String reason)` | |
| `calculate_federal_tax()` | `TaxCalculator.calculateFederal(TaxableIncome)` | Fix: Externalize brackets to config |
| `calculate_state_tax()` | `TaxCalculator.calculateState(TaxableIncome, String state)` | |
| `calculate_fica()` | `TaxCalculator.calculateFICA(TaxableIncome)` | |

### PKG_LEAVE → LeaveService

| PL/SQL Procedure/Function | Java Method | Notes |
|---|---|---|
| `submit_leave_request()` | `LeaveService.submit(LeaveRequest)` | |
| `approve_leave_request()` | `LeaveService.approve(Long requestId, String approverId)` | |
| `reject_leave_request()` | `LeaveService.reject(Long requestId, RejectionRequest)` | |
| `cancel_leave_request()` | `LeaveService.cancel(Long requestId, String reason)` | |
| `run_monthly_accrual()` | `LeaveAccrualJob.execute()` | Spring Batch job |
| `process_carryover()` | `LeaveCarryoverJob.execute()` | Fix double-subtraction bug |

### PKG_SECURITY → SecurityService (Spring Security)

| PL/SQL Procedure/Function | Java Equivalent | Notes |
|---|---|---|
| `authenticate()` | `AuthenticationProvider.authenticate()` | Spring Security standard |
| `is_session_valid()` | JWT token validation | Stateless sessions |
| `has_permission()` | `@PreAuthorize` / `SecurityContext` | Role-based access control |
| `hash_password()` | `BCryptPasswordEncoder.encode()` | Fix: MD5 → BCrypt |
| `encrypt_ssn()` / `decrypt_ssn()` | `AES256TextEncryptor` | Fix: Use proper key management |

## Forms-to-React Mapping

### HRMS_EMPLOYEE → EmployeePage

| Forms Element | React Component | Notes |
|---|---|---|
| CVS_MAIN (Tab Canvas) | `<Tabs>` component | Material UI or custom |
| TP_PERSONAL | `<PersonalInfoTab>` | Form fields with validation |
| TP_JOB | `<JobAssignmentTab>` | Includes salary display |
| TP_DEPENDENTS | `<DependentsTab>` | Editable table |
| TP_HISTORY | `<HistoryTab>` | Read-only timeline |
| LOV_DEPARTMENTS | `<DepartmentSelect>` (async combobox) | API-backed autocomplete |
| LOV_JOB_TITLES | `<JobTitleSelect>` (async combobox) | |
| LOV_MANAGERS | `<ManagerSelect>` (async combobox) | |
| WHEN-VALIDATE-ITEM triggers | React Hook Form + Zod schema | Client-side validation |
| POST-QUERY trigger | `useQuery` hook (React Query) | Data fetching |
| PRE-INSERT trigger | `useMutation` + API call | Server-side defaults |

### HRMS_LOGIN → LoginPage

| Forms Element | React Component |
|---|---|
| WIN_LOGIN | `<LoginPage>` (full-page layout) |
| LOGIN.USERNAME | `<TextField>` |
| LOGIN.PASSWORD | `<TextField type="password">` |
| BTN_LOGIN | `<Button onClick={handleLogin}>` |
| ERROR_MSG display | `<Alert severity="error">` |

## Trigger Migration Guide

| Forms Trigger Type | Java/React Equivalent |
|---|---|
| WHEN-NEW-FORM-INSTANCE | React `useEffect` on mount + API auth check |
| WHEN-VALIDATE-ITEM | React Hook Form field validation |
| PRE-INSERT | Service layer defaults (`@PrePersist` JPA callback) |
| PRE-UPDATE | Service layer audit (`@PreUpdate` JPA callback) |
| POST-QUERY | JPA entity lifecycle / DTO mapping |
| ON-ERROR | Global error handler (`@ControllerAdvice`) |
| KEY-EXIT | React router navigation guard |
| WHEN-BUTTON-PRESSED | React `onClick` → API call via React Query mutation |
