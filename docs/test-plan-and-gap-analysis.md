# Test Plan & Coverage Gap Analysis

## HRMS Modernization: Oracle Forms to Java Spring Boot

---

## Table of Contents

1. [Executive Summary](#1-executive-summary)
2. [Current State Assessment](#2-current-state-assessment)
3. [Test Coverage Gap Analysis](#3-test-coverage-gap-analysis)
4. [Test Plan](#4-test-plan)
   - 4.1 [Unit Tests](#41-unit-tests)
   - 4.2 [Integration Tests](#42-integration-tests)
   - 4.3 [API / Controller Tests](#43-api--controller-tests)
   - 4.4 [Security Tests](#44-security-tests)
   - 4.5 [Data Migration & Equivalence Tests](#45-data-migration--equivalence-tests)
   - 4.6 [Performance Tests](#46-performance-tests)
   - 4.7 [Batch Processing Tests](#47-batch-processing-tests)
   - 4.8 [End-to-End Tests](#48-end-to-end-tests)
5. [Module-by-Module Test Matrix](#5-module-by-module-test-matrix)
6. [Technical Debt Verification Tests](#6-technical-debt-verification-tests)
7. [Test Infrastructure & Tooling](#7-test-infrastructure--tooling)
8. [Test Execution Strategy](#8-test-execution-strategy)
9. [Recommendations & Priority](#9-recommendations--priority)

---

## 1. Executive Summary

This document provides a comprehensive test plan for the HRMS modernization project (Oracle Forms/PL/SQL to Java Spring Boot) and identifies all gaps in the current test coverage.

### Key Findings

| Metric | Current State | Target State |
|---|---|---|
| JUnit unit tests | **0** | ~150-200 |
| Integration tests | **0** | ~50-70 |
| API/controller tests | **0** | ~60-80 |
| Security tests | **0** | ~20-30 |
| Performance tests | **0** | ~10-15 |
| Equivalence test scenarios (YAML) | **4** (not executable as Java) | 4+ (executable) |
| Python comparator utility | **1** (not integrated into CI) | 1 (CI-integrated) |
| Code coverage | **0%** | **80%+ line coverage** |
| Migrated modules with tests | **0 of 7** | **7 of 7** |

**Critical gap**: The project has **zero automated tests** in the Java codebase. The `src/test/` directory does not exist. While 4 YAML-based equivalence test scenarios are defined in `test-harness/scenarios/`, they are not executable within the Java build and have no runner implementation.

---

## 2. Current State Assessment

### 2.1 What Exists Today

#### Java Source Code (`java-target/src/main/`)
- **HrmsApplication.java** - Spring Boot entry point
- **Employee module** (partially migrated):
  - `Employee.java` - JPA entity with validation annotations and lifecycle callbacks (`@PrePersist`, `@PreUpdate`)
  - `EmployeeService.java` - Service interface (8 methods, no implementation)
  - `CreateEmployeeRequest.java` - Request DTO with Bean Validation
  - `UpdateEmployeeRequest.java` - Request DTO with Bean Validation
  - `TerminationRequest.java` - Request DTO with Bean Validation
  - `TransferRequest.java` - Request DTO with Bean Validation
  - `EmployeeSearchCriteria.java` - Search criteria DTO
  - `OrgChartNode.java` - Org chart tree node DTO

#### Missing Java Source Code (Not Yet Migrated)
- **No controllers** - Zero REST endpoints implemented
- **No service implementations** - Only the `EmployeeService` interface exists
- **No repository layer** - No Spring Data JPA repositories
- **No security configuration** - No Spring Security config, JWT filters, or auth controllers
- **No payroll module** - No PayrollService, TaxCalculator, PayrollController, Spring Batch jobs
- **No leave module** - No LeaveService, LeaveController, accrual jobs
- **No performance module** - No PerformanceService, PerformanceController
- **No common/shared utilities** - No PKG_COMMON equivalent
- **No exception handling** - No `@ControllerAdvice`, no custom exceptions
- **No event publishers** - No Spring Application Events (needed to break circular dependency)

#### Test Harness (`test-harness/`)
- 4 YAML scenario files defining business test cases:
  - `employee-crud.yaml` - 5 steps (create, read, transfer, search, terminate)
  - `payroll-calculation.yaml` - 4 steps (create run, calculate, verify pay, approve)
  - `leave-workflow.yaml` - 5 steps (submit, approve, verify balance, cancel, verify restore)
  - `security-auth.yaml` - 5 steps (login, check admin perm, check non-admin perm, invalid login, logout)
- `result-comparator.py` - Python utility for comparing legacy vs modern output (JSON-based)

#### Test Dependencies (in `pom.xml`)
- `spring-boot-starter-test` (JUnit 5, Mockito, AssertJ, Spring Test)
- `spring-security-test`
- `H2` database (test scope)

### 2.2 What Does NOT Exist

| Category | Status |
|---|---|
| `src/test/java/` directory | **Missing entirely** |
| Unit tests for any class | **None** |
| Integration tests | **None** |
| Controller/API tests | **None** |
| Security tests | **None** |
| Performance/load tests | **None** |
| CI/CD pipeline with test execution | **Not configured** |
| Code coverage reporting (JaCoCo) | **Not configured** |
| Test data fixtures | **None** |
| Testcontainers setup for Oracle/PostgreSQL | **Not configured** |
| Test harness runner (Python `run_scenarios.py`) | **Referenced in README but does not exist** |

---

## 3. Test Coverage Gap Analysis

### 3.1 Gap Summary by Module

| Module | Legacy Package | Java Code Exists | Tests Exist | Equivalence Scenario | Gap Level |
|---|---|---|---|---|---|
| Employee | PKG_EMPLOYEE | Partial (interface + entity) | **No** | Yes (employee-crud.yaml) | **CRITICAL** |
| Payroll | PKG_PAYROLL | **No** | **No** | Yes (payroll-calculation.yaml) | **CRITICAL** |
| Leave | PKG_LEAVE | **No** | **No** | Yes (leave-workflow.yaml) | **CRITICAL** |
| Security | PKG_SECURITY | **No** | **No** | Yes (security-auth.yaml) | **CRITICAL** |
| Performance | PKG_PERFORMANCE | **No** | **No** | **No** | **CRITICAL** |
| Reports | PKG_REPORTING | **No** | **No** | **No** | **HIGH** |
| Integration | PKG_INTEGRATION | **No** | **No** | **No** | **HIGH** |
| Common | PKG_COMMON | **No** | **No** | **No** | **MEDIUM** |
| Notification | PKG_NOTIFICATION | **No** | **No** | **No** | **MEDIUM** |

### 3.2 Gap by Test Type

| Test Type | Current Count | Required Count | Gap |
|---|---|---|---|
| **Unit Tests** - Service layer | 0 | ~80 | 80 tests missing |
| **Unit Tests** - Entity/DTO validation | 0 | ~30 | 30 tests missing |
| **Unit Tests** - Utility/helper classes | 0 | ~20 | 20 tests missing |
| **Integration Tests** - Repository layer | 0 | ~30 | 30 tests missing |
| **Integration Tests** - Service + DB | 0 | ~25 | 25 tests missing |
| **API Tests** - Controller endpoints | 0 | ~60 | 60 tests missing |
| **Security Tests** - Auth/authz | 0 | ~25 | 25 tests missing |
| **Batch Tests** - Spring Batch jobs | 0 | ~10 | 10 tests missing |
| **Performance Tests** - Benchmarks | 0 | ~10 | 10 tests missing |
| **Equivalence Tests** - Legacy vs modern | 0 (4 YAML, not executable) | ~20 | 20 tests missing |
| **TOTAL** | **0** | **~310** | **~310 tests missing** |

### 3.3 Gap by API Endpoint

The API design document (`docs/api-design.md`) specifies **30+ REST endpoints** across 5 modules. None have controller implementations or tests.

#### Authentication Endpoints (3 endpoints, 0 tested)
| Endpoint | Test Coverage |
|---|---|
| `POST /api/v1/auth/login` | **None** |
| `POST /api/v1/auth/logout` | **None** |
| `POST /api/v1/auth/change-password` | **None** |

#### Employee Endpoints (10 endpoints, 0 tested)
| Endpoint | Test Coverage |
|---|---|
| `GET /api/v1/employees` | **None** |
| `POST /api/v1/employees` | **None** |
| `GET /api/v1/employees/{id}` | **None** |
| `PUT /api/v1/employees/{id}` | **None** |
| `POST /api/v1/employees/{id}/terminate` | **None** |
| `POST /api/v1/employees/{id}/transfer` | **None** |
| `GET /api/v1/employees/{id}/direct-reports` | **None** |
| `GET /api/v1/employees/{id}/org-chart` | **None** |
| `GET /api/v1/employees/{id}/salary-history` | **None** |
| `GET /api/v1/employees/{id}/history` | **None** |

#### Leave Endpoints (7 endpoints, 0 tested)
| Endpoint | Test Coverage |
|---|---|
| `GET /api/v1/leave/requests` | **None** |
| `POST /api/v1/leave/requests` | **None** |
| `POST /api/v1/leave/requests/{id}/approve` | **None** |
| `POST /api/v1/leave/requests/{id}/reject` | **None** |
| `POST /api/v1/leave/requests/{id}/cancel` | **None** |
| `GET /api/v1/leave/balances` | **None** |
| `GET /api/v1/leave/pending-approvals` | **None** |

#### Payroll Endpoints (6 endpoints, 0 tested)
| Endpoint | Test Coverage |
|---|---|
| `GET /api/v1/payroll/periods` | **None** |
| `POST /api/v1/payroll/runs` | **None** |
| `POST /api/v1/payroll/runs/{id}/calculate` | **None** |
| `POST /api/v1/payroll/runs/{id}/approve` | **None** |
| `POST /api/v1/payroll/runs/{id}/reverse` | **None** |
| `GET /api/v1/payroll/runs/{id}/details` | **None** |

#### Performance Endpoints (7 endpoints, 0 tested)
| Endpoint | Test Coverage |
|---|---|
| `GET /api/v1/performance/cycles` | **None** |
| `GET /api/v1/performance/reviews` | **None** |
| `POST /api/v1/performance/reviews/{id}/self-assessment` | **None** |
| `POST /api/v1/performance/reviews/{id}/manager-review` | **None** |
| `GET /api/v1/performance/goals` | **None** |
| `POST /api/v1/performance/goals` | **None** |
| `PUT /api/v1/performance/goals/{id}/progress` | **None** |

### 3.4 Gap by Technical Debt Item

The assessment report identifies **27 technical debt items** that must be validated as resolved during migration. None have regression tests.

| TD ID | Description | Regression Test | Status |
|---|---|---|---|
| TD-001 | MD5 password hashing -> BCrypt | **Missing** | No security module |
| TD-002 | No account lockout -> lockout policy | **Missing** | No security module |
| TD-003 | Hard-coded encryption key -> key management | **Missing** | No security module |
| TD-004 | SQL injection in search -> parameterized queries | **Missing** | No EmployeeService impl |
| TD-005 | Cleartext password transmission -> HTTPS+JWT | **Missing** | No security module |
| TD-010 | Race condition in emp number gen -> sequence | **Missing** | No EmployeeService impl |
| TD-011 | Partial payroll commits -> atomic batch | **Missing** | No payroll module |
| TD-012 | Double-subtraction in carryover -> idempotent | **Missing** | No leave module |
| TD-013 | Row-by-row payroll -> bulk/batch processing | **Missing** | No payroll module |
| TD-014 | Slow CONNECT BY -> recursive CTE | **Missing** | No org chart impl |
| TD-015 | Circular dependency -> event decoupling | **Missing** | No events impl |
| TD-020 | Hard-coded tax brackets -> config | **Missing** | No payroll module |
| TD-021 | Overtime missing holidays -> holiday-aware calc | **Missing** | No payroll module |
| TD-022 | Half-day leave overlap -> proper overlap check | **Missing** | No leave module |
| TD-023 | Holiday detection -> observed dates | **Missing** | No leave module |
| TD-024 | Hard-coded SMTP -> externalized config | **Missing** | No notification module |
| TD-025 | HTML as string constants -> templates | **Missing** | No notification module |
| TD-026 | Validation drift -> single validation layer | **Missing** | Partially (Bean Validation annotations exist) |
| TD-027 | No rate limiting -> rate-limited notifications | **Missing** | No notification module |

---

## 4. Test Plan

### 4.1 Unit Tests

Unit tests isolate individual classes using mocks (Mockito) and run without Spring context or database.

#### 4.1.1 Employee Module Unit Tests

| Test Class | Test Case | Priority | Notes |
|---|---|---|---|
| `EmployeeTest` | `shouldSetDefaultsOnCreate` | P0 | Verify `@PrePersist` sets createdDate, activeFlag="Y", status="ACTIVE" |
| `EmployeeTest` | `shouldUpdateModifiedDateOnUpdate` | P0 | Verify `@PreUpdate` sets modifiedDate |
| `EmployeeTest` | `shouldRequireFirstName` | P1 | Bean validation - `@NotBlank` |
| `EmployeeTest` | `shouldRequireLastName` | P1 | Bean validation - `@NotBlank` |
| `EmployeeTest` | `shouldValidateEmailFormat` | P1 | Bean validation - `@Email` |
| `EmployeeTest` | `shouldRequireHireDate` | P1 | Bean validation - `@NotNull` |
| `EmployeeTest` | `shouldRequireDeptId` | P1 | Bean validation - `@NotNull` |
| `EmployeeTest` | `shouldRequireJobId` | P1 | Bean validation - `@NotNull` |
| `CreateEmployeeRequestTest` | `shouldRejectBlankFirstName` | P0 | Validation constraint |
| `CreateEmployeeRequestTest` | `shouldRejectBlankLastName` | P0 | Validation constraint |
| `CreateEmployeeRequestTest` | `shouldRejectInvalidEmail` | P1 | `@Email` constraint |
| `CreateEmployeeRequestTest` | `shouldRejectPastHireDate` | P1 | `@FutureOrPresent` constraint |
| `CreateEmployeeRequestTest` | `shouldRejectNegativeSalary` | P0 | `@Positive` constraint |
| `CreateEmployeeRequestTest` | `shouldRejectNullDeptId` | P0 | `@NotNull` constraint |
| `CreateEmployeeRequestTest` | `shouldRejectNullJobId` | P0 | `@NotNull` constraint |
| `CreateEmployeeRequestTest` | `shouldAcceptValidRequest` | P0 | Happy path |
| `UpdateEmployeeRequestTest` | `shouldRejectBlankNames` | P1 | Validation constraints |
| `UpdateEmployeeRequestTest` | `shouldRejectInvalidEmail` | P1 | `@Email` constraint |
| `TerminationRequestTest` | `shouldRejectNullDate` | P1 | `@NotNull` constraint |
| `TerminationRequestTest` | `shouldRejectBlankReason` | P1 | `@NotBlank` constraint |
| `TransferRequestTest` | `shouldRejectNullDeptId` | P1 | `@NotNull` constraint |
| `TransferRequestTest` | `shouldRejectNullEffectiveDate` | P1 | `@NotNull` constraint |
| `EmployeeServiceImplTest` | `shouldCreateEmployeeWithGeneratedNumber` | P0 | Verify emp number generation (TD-010 fix) |
| `EmployeeServiceImplTest` | `shouldCreateEmployeeWithActiveStatus` | P0 | Default status |
| `EmployeeServiceImplTest` | `shouldUpdateEmployeeFields` | P0 | Field mapping |
| `EmployeeServiceImplTest` | `shouldTerminateEmployee` | P0 | Status transition |
| `EmployeeServiceImplTest` | `shouldRejectTerminationOfAlreadyTerminated` | P1 | State machine |
| `EmployeeServiceImplTest` | `shouldTransferEmployee` | P0 | Dept change |
| `EmployeeServiceImplTest` | `shouldSearchByName` | P1 | Search criteria (TD-004 fix) |
| `EmployeeServiceImplTest` | `shouldSearchByDepartment` | P1 | Search criteria |
| `EmployeeServiceImplTest` | `shouldSearchByMultipleCriteria` | P1 | Combined filters |
| `EmployeeServiceImplTest` | `shouldReturnDirectReports` | P1 | Manager hierarchy |
| `EmployeeServiceImplTest` | `shouldBuildOrgChart` | P1 | Recursive tree (TD-014 fix) |
| `EmployeeServiceImplTest` | `shouldPublishEventOnCreate` | P1 | Event decoupling (TD-015 fix) |
| `EmployeeServiceImplTest` | `shouldThrowWhenEmployeeNotFound` | P0 | Error handling |
| `EmployeeNumberGeneratorTest` | `shouldGenerateUniqueNumbers` | P0 | Sequence-backed (TD-010 fix) |
| `EmployeeNumberGeneratorTest` | `shouldHandleConcurrentRequests` | P1 | Thread safety |

#### 4.1.2 Payroll Module Unit Tests

| Test Class | Test Case | Priority |
|---|---|---|
| `PayrollServiceImplTest` | `shouldCreatePayrollRun` | P0 |
| `PayrollServiceImplTest` | `shouldCalculatePayrollForAllEmployees` | P0 |
| `PayrollServiceImplTest` | `shouldApproveCalculatedRun` | P0 |
| `PayrollServiceImplTest` | `shouldRejectApprovalOfPendingRun` | P1 |
| `PayrollServiceImplTest` | `shouldReverseApprovedRun` | P1 |
| `PayrollServiceImplTest` | `shouldHandleCalculationFailureAtomically` | P0 | TD-011 fix |
| `TaxCalculatorTest` | `shouldCalculateFederalTaxFromConfig` | P0 | TD-020 fix |
| `TaxCalculatorTest` | `shouldCalculateStateTax` | P0 |
| `TaxCalculatorTest` | `shouldCalculateFICA` | P0 |
| `TaxCalculatorTest` | `shouldCalculateMedicare` | P0 |
| `TaxCalculatorTest` | `shouldUseBigDecimalForPrecision` | P0 | Rounding accuracy |
| `TaxCalculatorTest` | `shouldHandleZeroIncome` | P1 |
| `TaxCalculatorTest` | `shouldHandleHighIncome` | P1 |
| `PayrollCalculatorTest` | `shouldCalculateBasePay` | P0 |
| `PayrollCalculatorTest` | `shouldCalculateOvertimeWithHolidays` | P1 | TD-021 fix |
| `PayrollCalculatorTest` | `shouldCalculateNetPay` | P0 |
| `PayrollCalculatorTest` | `shouldMatchLegacyOutputWithinTolerance` | P0 | Penny-for-penny (R-010) |

#### 4.1.3 Leave Module Unit Tests

| Test Class | Test Case | Priority |
|---|---|---|
| `LeaveServiceImplTest` | `shouldSubmitLeaveRequest` | P0 |
| `LeaveServiceImplTest` | `shouldCalculateTotalDays` | P0 |
| `LeaveServiceImplTest` | `shouldApproveRequest` | P0 |
| `LeaveServiceImplTest` | `shouldRejectRequest` | P1 |
| `LeaveServiceImplTest` | `shouldCancelRequest` | P0 |
| `LeaveServiceImplTest` | `shouldRestoreBalanceOnCancellation` | P0 |
| `LeaveServiceImplTest` | `shouldDeductBalanceOnApproval` | P0 |
| `LeaveServiceImplTest` | `shouldRejectIfInsufficientBalance` | P1 |
| `LeaveServiceImplTest` | `shouldDetectOverlappingRequests` | P1 |
| `LeaveServiceImplTest` | `shouldHandleHalfDayOverlap` | P1 | TD-022 fix |
| `LeaveServiceImplTest` | `shouldDetectObservedHolidays` | P1 | TD-023 fix |
| `LeaveAccrualJobTest` | `shouldAccrueMonthlyLeave` | P0 |
| `LeaveCarryoverJobTest` | `shouldProcessCarryoverIdempotently` | P0 | TD-012 fix |
| `LeaveCarryoverJobTest` | `shouldNotDoubleSubtract` | P0 | TD-012 fix |

#### 4.1.4 Security Module Unit Tests

| Test Class | Test Case | Priority |
|---|---|---|
| `SecurityServiceTest` | `shouldAuthenticateValidCredentials` | P0 |
| `SecurityServiceTest` | `shouldRejectInvalidCredentials` | P0 |
| `SecurityServiceTest` | `shouldLockAccountAfterMaxAttempts` | P0 | TD-002 fix |
| `SecurityServiceTest` | `shouldUseBCryptForPasswordHashing` | P0 | TD-001 fix |
| `SecurityServiceTest` | `shouldNotUseMD5` | P0 | TD-001 fix |
| `JwtTokenProviderTest` | `shouldGenerateValidToken` | P0 |
| `JwtTokenProviderTest` | `shouldValidateToken` | P0 |
| `JwtTokenProviderTest` | `shouldRejectExpiredToken` | P1 |
| `JwtTokenProviderTest` | `shouldRejectTamperedToken` | P1 |
| `PermissionServiceTest` | `shouldGrantAdminPermission` | P0 |
| `PermissionServiceTest` | `shouldDenyUnauthorizedAccess` | P0 |
| `EncryptionServiceTest` | `shouldEncryptSSN` | P1 | TD-003 fix |
| `EncryptionServiceTest` | `shouldUseExternalKeyManagement` | P1 | TD-003 fix |

#### 4.1.5 Performance Module Unit Tests

| Test Class | Test Case | Priority |
|---|---|---|
| `PerformanceServiceTest` | `shouldSubmitSelfAssessment` | P1 |
| `PerformanceServiceTest` | `shouldSubmitManagerReview` | P1 |
| `PerformanceServiceTest` | `shouldAddGoal` | P1 |
| `PerformanceServiceTest` | `shouldUpdateGoalProgress` | P1 |
| `PerformanceServiceTest` | `shouldListReviewCycles` | P1 |

#### 4.1.6 Common / Notification Module Unit Tests

| Test Class | Test Case | Priority |
|---|---|---|
| `NotificationServiceTest` | `shouldSendEmail` | P2 |
| `NotificationServiceTest` | `shouldUseTemplatesNotHardcodedHTML` | P2 | TD-025 fix |
| `NotificationServiceTest` | `shouldUseExternalSMTPConfig` | P2 | TD-024 fix |
| `NotificationServiceTest` | `shouldRateLimitBulkNotifications` | P2 | TD-027 fix |

### 4.2 Integration Tests

Integration tests verify component interactions with a real database (H2 for fast tests, Testcontainers for Oracle/PostgreSQL fidelity).

| Test Class | Test Case | Priority | Notes |
|---|---|---|---|
| `EmployeeRepositoryIntTest` | `shouldSaveAndRetrieveEmployee` | P0 | JPA mapping validation |
| `EmployeeRepositoryIntTest` | `shouldEnforceUniqueEmpNumber` | P0 | Constraint check |
| `EmployeeRepositoryIntTest` | `shouldSearchWithSpecifications` | P0 | Dynamic query (TD-004 fix) |
| `EmployeeRepositoryIntTest` | `shouldPaginateResults` | P1 | Spring Data pagination |
| `EmployeeRepositoryIntTest` | `shouldRunOrgChartRecursiveQuery` | P1 | CTE performance (TD-014 fix) |
| `PayrollRepositoryIntTest` | `shouldSavePayrollRunWithDetails` | P0 | Complex entity graph |
| `PayrollRepositoryIntTest` | `shouldCalculateInAtomicTransaction` | P0 | TD-011 fix |
| `LeaveRepositoryIntTest` | `shouldSaveLeaveRequest` | P0 | |
| `LeaveRepositoryIntTest` | `shouldUpdateBalance` | P0 | Concurrent balance updates |
| `FlywayMigrationIntTest` | `shouldApplyAllMigrations` | P0 | Schema validation |
| `FlywayMigrationIntTest` | `shouldBeCompatibleWithPostgreSQL` | P1 | Dual-database support |
| `EventPublishingIntTest` | `shouldPublishEmployeeCreatedEvent` | P1 | TD-015 fix |
| `EventPublishingIntTest` | `shouldNotifyPayrollOnEmployeeChange` | P1 | Event subscription |

### 4.3 API / Controller Tests

Tests for REST endpoints using `@WebMvcTest` or `MockMvc`.

| Test Class | Test Case | Priority |
|---|---|---|
| **EmployeeControllerTest** | | |
| | `POST /employees - should create employee (201)` | P0 |
| | `POST /employees - should reject invalid input (400)` | P0 |
| | `GET /employees/{id} - should return employee (200)` | P0 |
| | `GET /employees/{id} - should return 404 for unknown` | P0 |
| | `PUT /employees/{id} - should update employee (200)` | P0 |
| | `POST /employees/{id}/terminate - should terminate (200)` | P0 |
| | `POST /employees/{id}/transfer - should transfer (200)` | P0 |
| | `GET /employees - should search with filters` | P1 |
| | `GET /employees - should paginate results` | P1 |
| | `GET /employees/{id}/direct-reports - should list reports` | P1 |
| | `GET /employees/{id}/org-chart - should return tree` | P1 |
| | `GET /employees/{id}/salary-history - should return history` | P2 |
| | `GET /employees/{id}/history - should return emp history` | P2 |
| **AuthControllerTest** | | |
| | `POST /auth/login - should return JWT on valid login` | P0 |
| | `POST /auth/login - should return 401 on invalid login` | P0 |
| | `POST /auth/login - should lock account after max attempts` | P0 |
| | `POST /auth/logout - should invalidate token` | P1 |
| | `POST /auth/change-password - should change password` | P1 |
| | `All endpoints - should reject unauthenticated requests` | P0 |
| **LeaveControllerTest** | | |
| | `POST /leave/requests - should submit leave request` | P0 |
| | `POST /leave/requests/{id}/approve - should approve` | P0 |
| | `POST /leave/requests/{id}/reject - should reject` | P1 |
| | `POST /leave/requests/{id}/cancel - should cancel` | P0 |
| | `GET /leave/balances - should return balances` | P1 |
| | `GET /leave/pending-approvals - should list pending` | P1 |
| **PayrollControllerTest** | | |
| | `POST /payroll/runs - should create run` | P0 |
| | `POST /payroll/runs/{id}/calculate - should calculate` | P0 |
| | `POST /payroll/runs/{id}/approve - should approve` | P0 |
| | `POST /payroll/runs/{id}/reverse - should reverse` | P1 |
| | `GET /payroll/runs/{id}/details - should return details` | P1 |
| | `GET /payroll/periods - should list periods` | P2 |
| **PerformanceControllerTest** | | |
| | `GET /performance/cycles - should list cycles` | P2 |
| | `GET /performance/reviews - should list reviews` | P2 |
| | `POST /performance/reviews/{id}/self-assessment` | P2 |
| | `POST /performance/reviews/{id}/manager-review` | P2 |
| | `POST /performance/goals - should create goal` | P2 |
| | `PUT /performance/goals/{id}/progress - should update` | P2 |

### 4.4 Security Tests

| Test Class | Test Case | Priority | Notes |
|---|---|---|---|
| `AuthenticationIntTest` | `shouldAuthenticateWithBCrypt` | P0 | TD-001 fix verification |
| `AuthenticationIntTest` | `shouldRejectMD5HashedPasswords` | P0 | TD-001 regression |
| `AuthenticationIntTest` | `shouldLockAfterFailedAttempts` | P0 | TD-002 fix verification |
| `AuthenticationIntTest` | `shouldTransmitPasswordOverHTTPS` | P1 | TD-005 fix |
| `AuthorizationIntTest` | `shouldEnforceRoleBasedAccess` | P0 | |
| `AuthorizationIntTest` | `adminShouldApprovePayroll` | P0 | |
| `AuthorizationIntTest` | `nonAdminShouldNotApprovePayroll` | P0 | |
| `AuthorizationIntTest` | `managerShouldApproveLeave` | P0 | |
| `AuthorizationIntTest` | `employeeShouldOnlySeeOwnData` | P1 | |
| `JwtSecurityTest` | `shouldRequireJwtForProtectedEndpoints` | P0 | |
| `JwtSecurityTest` | `shouldAllowAnonymousAccessToLogin` | P0 | |
| `JwtSecurityTest` | `shouldRejectExpiredTokens` | P0 | |
| `JwtSecurityTest` | `shouldRejectInvalidTokens` | P0 | |
| `EncryptionTest` | `shouldNotUseHardCodedKey` | P0 | TD-003 fix |
| `EncryptionTest` | `shouldEncryptSensitiveData` | P1 | |
| `SqlInjectionTest` | `shouldPreventSqlInjectionInSearch` | P0 | TD-004 fix |
| `SqlInjectionTest` | `shouldUseParameterizedQueries` | P0 | TD-004 fix |
| `CsrfTest` | `shouldProtectAgainstCsrf` | P2 | |
| `CorsTest` | `shouldConfigureCorsCorrectly` | P2 | |

### 4.5 Data Migration & Equivalence Tests

These tests verify that the modernized Java system produces functionally equivalent results to the legacy Oracle Forms/PL/SQL system.

| Test Class | Test Case | Priority | Source |
|---|---|---|---|
| `EmployeeCrudEquivalenceTest` | `shouldCreateEmployeeMatchingLegacy` | P0 | employee-crud.yaml step 1 |
| `EmployeeCrudEquivalenceTest` | `shouldReadEmployeeMatchingLegacy` | P0 | employee-crud.yaml step 2 |
| `EmployeeCrudEquivalenceTest` | `shouldTransferMatchingLegacy` | P0 | employee-crud.yaml step 3 |
| `EmployeeCrudEquivalenceTest` | `shouldSearchMatchingLegacy` | P0 | employee-crud.yaml step 4 |
| `EmployeeCrudEquivalenceTest` | `shouldTerminateMatchingLegacy` | P0 | employee-crud.yaml step 5 |
| `PayrollEquivalenceTest` | `shouldCreateRunMatchingLegacy` | P0 | payroll-calculation.yaml step 1 |
| `PayrollEquivalenceTest` | `shouldCalculateMatchingLegacy` | P0 | payroll-calculation.yaml step 2 |
| `PayrollEquivalenceTest` | `shouldVerifyPayMatchingLegacy` | P0 | payroll-calculation.yaml step 3 |
| `PayrollEquivalenceTest` | `shouldApproveRunMatchingLegacy` | P0 | payroll-calculation.yaml step 4 |
| `LeaveEquivalenceTest` | `shouldSubmitRequestMatchingLegacy` | P0 | leave-workflow.yaml step 1 |
| `LeaveEquivalenceTest` | `shouldApproveMatchingLegacy` | P0 | leave-workflow.yaml step 2 |
| `LeaveEquivalenceTest` | `shouldVerifyBalanceMatchingLegacy` | P0 | leave-workflow.yaml step 3 |
| `LeaveEquivalenceTest` | `shouldCancelMatchingLegacy` | P0 | leave-workflow.yaml step 4 |
| `LeaveEquivalenceTest` | `shouldRestoreBalanceMatchingLegacy` | P0 | leave-workflow.yaml step 5 |
| `SecurityEquivalenceTest` | `shouldLoginMatchingLegacy` | P0 | security-auth.yaml step 1 |
| `SecurityEquivalenceTest` | `shouldCheckPermissionsMatchingLegacy` | P0 | security-auth.yaml steps 2-3 |
| `SecurityEquivalenceTest` | `shouldRejectInvalidLoginMatchingLegacy` | P0 | security-auth.yaml step 4 |
| `SecurityEquivalenceTest` | `shouldLogoutMatchingLegacy` | P0 | security-auth.yaml step 5 |

### 4.6 Performance Tests

| Test Class | Test Case | Priority | Benchmark |
|---|---|---|---|
| `EmployeeSearchPerfTest` | `shouldSearchUnder200ms` | P1 | <200ms for name search |
| `OrgChartPerfTest` | `shouldLoadOrgChartUnder500ms` | P1 | <500ms for 500+ employees (TD-014) |
| `PayrollCalcPerfTest` | `shouldCalculatePayrollUnder5min` | P0 | <5min for 500 employees |
| `PayrollCalcPerfTest` | `shouldBeFasterThanLegacyCursorLoop` | P1 | Benchmark vs legacy (TD-013) |
| `ConcurrentAccessPerfTest` | `shouldHandl200ConcurrentUsers` | P1 | Matches legacy capacity |
| `EmpNumberGenerationPerfTest` | `shouldNotCreateDuplicatesUnderLoad` | P0 | Thread-safe (TD-010) |
| `LeaveBalancePerfTest` | `shouldHandleConcurrentBalanceUpdates` | P1 | No race conditions |
| `BulkNotificationPerfTest` | `shouldRateLimitNotifications` | P2 | TD-027 |

### 4.7 Batch Processing Tests

| Test Class | Test Case | Priority | Notes |
|---|---|---|---|
| `PayrollBatchJobTest` | `shouldProcessAllEmployeesInChunks` | P0 | Spring Batch |
| `PayrollBatchJobTest` | `shouldRollbackChunkOnError` | P0 | TD-011 fix |
| `PayrollBatchJobTest` | `shouldRestartFromLastCheckpoint` | P1 | Recovery |
| `PayrollBatchJobTest` | `shouldSkipInvalidEmployees` | P1 | Skip policy |
| `PayrollBatchJobTest` | `shouldSupportParallelChunks` | P2 | Performance |
| `LeaveAccrualBatchTest` | `shouldAccrueForAllEmployees` | P0 | Monthly job |
| `LeaveAccrualBatchTest` | `shouldBeIdempotent` | P0 | Re-run safety |
| `LeaveCarryoverBatchTest` | `shouldProcessCarryover` | P0 | |
| `LeaveCarryoverBatchTest` | `shouldNotDoubleSubtract` | P0 | TD-012 fix |
| `NotificationQueueBatchTest` | `shouldProcessQueue` | P2 | 5-min schedule |
| `ReportingRefreshBatchTest` | `shouldRefreshReportingTables` | P2 | Nightly job |
| `GLJournalBatchTest` | `shouldGenerateGLJournal` | P2 | Per payroll run |
| `BenefitsFeedBatchTest` | `shouldExportBenefitsFeed` | P2 | Weekly |

### 4.8 End-to-End Tests

Full stack tests exercising the API from HTTP request through to database and back.

| Test Class | Test Case | Priority |
|---|---|---|
| `EmployeeLifecycleE2ETest` | `shouldCreateReadUpdateTerminateEmployee` | P0 |
| `PayrollE2ETest` | `shouldRunFullPayrollCycle` | P0 |
| `LeaveE2ETest` | `shouldSubmitApproveVerifyCancelLeave` | P0 |
| `AuthE2ETest` | `shouldLoginAccessProtectedResourceLogout` | P0 |
| `CrossModuleE2ETest` | `shouldReflectTerminationInPayroll` | P1 |
| `CrossModuleE2ETest` | `shouldNotifyOnLeaveApproval` | P1 |
| `DataMigrationE2ETest` | `shouldWorkWithOracleAndPostgreSQL` | P1 |

---

## 5. Module-by-Module Test Matrix

| Module | Unit Tests | Integration Tests | API Tests | Security Tests | Perf Tests | E2E Tests | Total |
|---|---|---|---|---|---|---|---|
| Employee | 37 | 5 | 13 | 2 | 2 | 1 | **60** |
| Payroll | 17 | 2 | 6 | 0 | 2 | 1 | **28** |
| Leave | 14 | 2 | 6 | 0 | 1 | 1 | **24** |
| Security | 13 | 0 | 6 | 14 | 0 | 1 | **34** |
| Performance | 5 | 0 | 6 | 0 | 0 | 0 | **11** |
| Common/Notification | 4 | 0 | 0 | 0 | 1 | 0 | **5** |
| Batch/Integration | 0 | 0 | 0 | 0 | 0 | 2 | **2** |
| Cross-cutting | 0 | 6 | 0 | 3 | 2 | 2 | **13** |
| Equivalence | 18 | 0 | 0 | 0 | 0 | 0 | **18** |
| Batch Jobs | 13 | 0 | 0 | 0 | 0 | 0 | **13** |
| **TOTAL** | **121** | **15** | **37** | **19** | **8** | **8** | **~208** |

---

## 6. Technical Debt Verification Tests

Each technical debt item from the assessment report must have at least one regression test verifying the fix.

| TD ID | Description | Verification Test | Test Type |
|---|---|---|---|
| TD-001 | MD5 -> BCrypt | `SecurityServiceTest.shouldUseBCryptForPasswordHashing` | Unit |
| TD-002 | No lockout -> lockout | `SecurityServiceTest.shouldLockAccountAfterMaxAttempts` | Unit + Integration |
| TD-003 | Hard-coded key -> KMS | `EncryptionTest.shouldNotUseHardCodedKey` | Unit |
| TD-004 | SQL injection -> parameterized | `SqlInjectionTest.shouldPreventSqlInjectionInSearch` | Integration |
| TD-005 | Cleartext -> HTTPS | `AuthenticationIntTest.shouldTransmitPasswordOverHTTPS` | Integration |
| TD-010 | Race condition -> sequence | `EmpNumberGenerationPerfTest.shouldNotCreateDuplicatesUnderLoad` | Performance |
| TD-011 | Partial commits -> atomic | `PayrollBatchJobTest.shouldRollbackChunkOnError` | Integration |
| TD-012 | Double-subtraction -> idempotent | `LeaveCarryoverBatchTest.shouldNotDoubleSubtract` | Unit + Integration |
| TD-013 | Row-by-row -> bulk | `PayrollCalcPerfTest.shouldBeFasterThanLegacyCursorLoop` | Performance |
| TD-014 | CONNECT BY -> CTE | `OrgChartPerfTest.shouldLoadOrgChartUnder500ms` | Performance |
| TD-015 | Circular dep -> events | `EventPublishingIntTest.shouldPublishEmployeeCreatedEvent` | Integration |
| TD-020 | Hard-coded tax -> config | `TaxCalculatorTest.shouldCalculateFederalTaxFromConfig` | Unit |
| TD-021 | Missing holidays in OT | `PayrollCalculatorTest.shouldCalculateOvertimeWithHolidays` | Unit |
| TD-022 | Half-day overlap | `LeaveServiceImplTest.shouldHandleHalfDayOverlap` | Unit |
| TD-023 | Observed holidays | `LeaveServiceImplTest.shouldDetectObservedHolidays` | Unit |
| TD-024 | Hard-coded SMTP | `NotificationServiceTest.shouldUseExternalSMTPConfig` | Unit |
| TD-025 | HTML as constants | `NotificationServiceTest.shouldUseTemplatesNotHardcodedHTML` | Unit |
| TD-026 | Validation drift | `CreateEmployeeRequestTest` (already uses Bean Validation) | Unit |
| TD-027 | No rate limiting | `NotificationServiceTest.shouldRateLimitBulkNotifications` | Unit |

---

## 7. Test Infrastructure & Tooling

### 7.1 Required Additions to `pom.xml`

```xml
<!-- Code Coverage -->
<plugin>
    <groupId>org.jacoco</groupId>
    <artifactId>jacoco-maven-plugin</artifactId>
    <version>0.8.11</version>
</plugin>

<!-- Testcontainers for Oracle/PostgreSQL -->
<dependency>
    <groupId>org.testcontainers</groupId>
    <artifactId>junit-jupiter</artifactId>
    <scope>test</scope>
</dependency>
<dependency>
    <groupId>org.testcontainers</groupId>
    <artifactId>oracle-xe</artifactId>
    <scope>test</scope>
</dependency>
<dependency>
    <groupId>org.testcontainers</groupId>
    <artifactId>postgresql</artifactId>
    <scope>test</scope>
</dependency>
```

### 7.2 Test Directory Structure

```
src/test/
├── java/com/hrms/
│   ├── HrmsApplicationTest.java           # Context loads test
│   ├── employee/
│   │   ├── EmployeeTest.java
│   │   ├── CreateEmployeeRequestTest.java
│   │   ├── EmployeeServiceImplTest.java
│   │   ├── EmployeeControllerTest.java
│   │   ├── EmployeeRepositoryIntTest.java
│   │   └── EmployeeCrudEquivalenceTest.java
│   ├── payroll/
│   │   ├── PayrollServiceImplTest.java
│   │   ├── TaxCalculatorTest.java
│   │   ├── PayrollCalculatorTest.java
│   │   ├── PayrollControllerTest.java
│   │   ├── PayrollBatchJobTest.java
│   │   └── PayrollEquivalenceTest.java
│   ├── leave/
│   │   ├── LeaveServiceImplTest.java
│   │   ├── LeaveControllerTest.java
│   │   ├── LeaveAccrualBatchTest.java
│   │   ├── LeaveCarryoverBatchTest.java
│   │   └── LeaveEquivalenceTest.java
│   ├── security/
│   │   ├── SecurityServiceTest.java
│   │   ├── JwtTokenProviderTest.java
│   │   ├── AuthControllerTest.java
│   │   ├── AuthenticationIntTest.java
│   │   ├── AuthorizationIntTest.java
│   │   └── SecurityEquivalenceTest.java
│   ├── performance/
│   │   └── PerformanceServiceTest.java
│   ├── common/
│   │   └── NotificationServiceTest.java
│   └── e2e/
│       ├── EmployeeLifecycleE2ETest.java
│       ├── PayrollE2ETest.java
│       ├── LeaveE2ETest.java
│       ├── AuthE2ETest.java
│       └── CrossModuleE2ETest.java
└── resources/
    ├── application-test.yml
    └── test-data/
        ├── employees.json
        ├── departments.json
        └── payroll-fixtures.json
```

### 7.3 CI/CD Integration

```yaml
# Suggested GitHub Actions workflow
test:
  steps:
    - mvn test                          # Unit tests
    - mvn verify -P integration-test    # Integration tests
    - mvn jacoco:report                 # Coverage report
    - Upload coverage to Codecov/SonarQube
    - python test-harness/comparators/result-comparator.py  # Equivalence check
```

### 7.4 Coverage Targets

| Module | Line Coverage Target | Branch Coverage Target |
|---|---|---|
| Service layer | 85% | 80% |
| Controller layer | 80% | 75% |
| Entity/DTO layer | 90% | 85% |
| Security | 90% | 85% |
| Batch jobs | 80% | 75% |
| **Overall** | **80%** | **75%** |

---

## 8. Test Execution Strategy

### 8.1 Phased Approach (Aligned with Migration Phases)

| Phase | Focus | Tests to Write First |
|---|---|---|
| **Phase 3 (Safeguard)** | Test harness setup | Equivalence tests, test infrastructure, CI pipeline |
| **Phase 4a (Security)** | Security module | SecurityServiceTest, JwtTokenProviderTest, AuthControllerTest, AuthenticationIntTest |
| **Phase 4b (Employee)** | Employee module | EmployeeTest, EmployeeServiceImplTest, EmployeeControllerTest, EmployeeRepositoryIntTest |
| **Phase 4c (Leave)** | Leave module | LeaveServiceImplTest, LeaveControllerTest, LeaveAccrualBatchTest |
| **Phase 4d (Payroll)** | Payroll module | TaxCalculatorTest, PayrollServiceImplTest, PayrollBatchJobTest, PayrollControllerTest |
| **Phase 4e (Performance)** | Performance module | PerformanceServiceTest, PerformanceControllerTest |
| **Post-migration** | Cross-cutting | E2E tests, performance tests, database migration tests |

### 8.2 Test Pyramid

```
        /  E2E  \          ~8 tests    (slow, high confidence)
       /  API    \         ~37 tests   (medium speed)
      / Integration\       ~15 tests   (medium speed)
     /    Unit      \     ~121 tests   (fast, isolated)
    /  Equivalence   \    ~18 tests    (legacy comparison)
   /  Batch/Perf      \  ~21 tests    (specialized)
```

### 8.3 Test Data Strategy

- **Unit tests**: Use builder pattern / test fixtures (in-memory)
- **Integration tests**: H2 with Flyway migrations for speed; Testcontainers (Oracle XE / PostgreSQL) for fidelity
- **E2E tests**: Dedicated test data set matching legacy employee IDs referenced in YAML scenarios (e.g., emp_id 34 = Jessica Nguyen)
- **Equivalence tests**: Capture legacy system output as golden files; compare against modern API output

---

## 9. Recommendations & Priority

### 9.1 Immediate Actions (P0)

1. **Create `src/test/java/` directory** and establish test infrastructure
2. **Add JaCoCo plugin** to `pom.xml` for coverage tracking
3. **Write `HrmsApplicationTest`** - verify Spring context loads (smoke test)
4. **Write Employee entity and DTO validation tests** - these can be written today against existing code
5. **Add Testcontainers dependencies** to `pom.xml`
6. **Set up CI pipeline** with `mvn test` as a gate

### 9.2 Short-Term Actions (P1)

7. **Implement `run_scenarios.py`** - the test harness runner referenced in `test-harness/README.md` does not exist
8. **Write security module tests first** (aligns with migration order: Security is Phase 4a)
9. **Write EmployeeService implementation tests** when the service impl is created
10. **Create test data fixtures** matching the employee IDs in YAML scenarios

### 9.3 Medium-Term Actions (P2)

11. **Add performance benchmark tests** once modules are implemented
12. **Add database platform migration tests** (Oracle -> PostgreSQL compatibility)
13. **Add notification and reporting module tests**
14. **Integrate equivalence test results** into CI dashboard

### 9.4 Risk Mitigations via Testing

| Risk (from risk-register.md) | Mitigation Test |
|---|---|
| R-001: Undocumented business rules | Equivalence tests capturing legacy behavior |
| R-002: Data integrity during dual-run | Integration tests with shared DB scenarios |
| R-003: Performance regression | Performance benchmark tests (payroll, org chart) |
| R-007: Oracle-specific SQL incompatibility | Testcontainers with both Oracle XE and PostgreSQL |
| R-010: Tax calculation rounding | `PayrollCalculatorTest.shouldMatchLegacyOutputWithinTolerance` |

---

## Appendix: Summary Metrics

| Category | Count |
|---|---|
| Total test cases planned | **~208** |
| P0 (Critical) tests | ~95 |
| P1 (High) tests | ~75 |
| P2 (Medium) tests | ~38 |
| Technical debt items with planned verification | **19/19** (100%) |
| API endpoints with planned tests | **33/33** (100%) |
| Modules with planned tests | **7/7** (100%) |
| Current test count | **0** |
| Current code coverage | **0%** |
| Target code coverage | **80%+** |
