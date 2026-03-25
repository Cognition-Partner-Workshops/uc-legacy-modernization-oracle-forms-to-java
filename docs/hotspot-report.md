# Hotspot Report — Oracle Forms HRMS

> **Purpose**: Identify high-risk, high-complexity areas in the legacy codebase that require the most care during migration to Java Spring Boot.
> **Methodology**: Each program unit is scored on three axes — **Complexity**, **Risk**, and **Lines of Code** — and cross-referenced with the technical debt catalog (TD-001 through TD-027 in `assessment-report.md`).

---

## Table of Contents

1. [Hotspot Summary Heatmap](#1-hotspot-summary-heatmap)
2. [Package-Level Analysis](#2-package-level-analysis)
3. [Hotspot Visualization](#3-hotspot-visualization)
4. [Technical Debt Cross-Reference](#4-technical-debt-cross-reference)
5. [Security Hotspots](#5-security-hotspots)
6. [Data Integrity Hotspots](#6-data-integrity-hotspots)
7. [Performance Hotspots](#7-performance-hotspots)
8. [Migration Risk Matrix](#8-migration-risk-matrix)
9. [Recommended Migration Priority](#9-recommended-migration-priority)

---

## 1. Hotspot Summary Heatmap

| Package | LOC (Body) | Complexity | Risk | Bugs / TD Items | Hotspot Score |
|---|---|---|---|---|---|
| **PKG_PAYROLL** | 897 | 🔴 Very High | 🔴 Critical | 8 | **95** |
| **PKG_EMPLOYEE** | 966 | 🔴 Very High | 🔴 Critical | 6 | **92** |
| **PKG_SECURITY** | 237 | 🟡 Medium | 🔴 Critical | 5 | **88** |
| **PKG_LEAVE** | 673 | 🟠 High | 🟠 High | 4 | **72** |
| **PKG_INTEGRATION** | 213 | 🟡 Medium | 🟠 High | 4 | **65** |
| **PKG_NOTIFICATION** | 177 | 🟢 Low | 🟡 Medium | 3 | **45** |
| **PKG_PERFORMANCE** | 320 | 🟡 Medium | 🟡 Medium | 1 | **40** |
| **PKG_REPORTING** | 207 | 🟡 Medium | 🟡 Medium | 2 | **38** |
| **PKG_COMMON** | 283 | 🟢 Low | 🟢 Low | 0 | **15** |
| **PKG_VALIDATION** | 125 | 🟢 Low | 🟢 Low | 0 | **12** |
| **PKG_AUDIT** | 72 | 🟢 Low | 🟢 Low | 0 | **10** |

> **Hotspot Score** = `(Complexity × 0.3) + (Risk × 0.4) + (TD_Count × 10 × 0.3)`, normalized to 0–100.

---

## 2. Package-Level Analysis

### 2.1 PKG_PAYROLL — Hotspot Score: 95

| Metric | Value |
|---|---|
| **Spec LOC** | 164 |
| **Body LOC** | 897 |
| **Total LOC** | 1,061 |
| **Public Procedures** | 12 |
| **Estimated Cyclomatic Complexity** | 45–55 (calculate_payroll ~15, calculate_employee_pay ~12, calculate_federal_tax ~8, calculate_state_tax ~6) |
| **Dependencies** | PKG_EMPLOYEE, PKG_COMMON, PKG_AUDIT, PKG_NOTIFICATION |
| **Circular Dependencies** | PKG_EMPLOYEE ↔ PKG_PAYROLL |

**Procedure Breakdown**:

| Procedure/Function | LOC | Complexity | Key Issues |
|---|---|---|---|
| `calculate_payroll` | ~75 | High (15) | Row-by-row cursor loop; partial COMMIT every 50 rows; WHEN OTHERS swallows errors |
| `calculate_employee_pay` | ~180 | Very High (12) | 15+ local variables; tax calc pipeline; simplified pretax deduction logic |
| `calculate_federal_tax` | ~90 | High (8) | Bracket lookup with nested IF/ELSIF; hard-coded 2024 tax constants |
| `calculate_state_tax` | ~70 | High (6) | State-specific branching; only 3 states implemented |
| `calculate_fica` | ~40 | Medium (4) | YTD wage base comparison |
| `calculate_medicare` | ~35 | Medium (3) | Additional Medicare threshold check |
| `create_salary_record` | ~30 | Low (2) | End-dates current record; inserts new |
| `get_current_salary` | ~20 | Low (1) | Simple SELECT with exception |
| `get_salary_as_of` | ~20 | Low (1) | Date-bounded salary query |
| `create_pay_periods` | ~65 | Medium (5) | Monthly/biweekly generation loops |
| `close_pay_period` | ~22 | Low (2) | Status validation and update |
| `get_current_period` | ~15 | Low (1) | Simple date lookup |
| `create_payroll_run` | ~30 | Low (2) | Period status validation |
| `approve_payroll` | ~25 | Low (2) | Status transition |
| `get_ytd_earnings` | ~20 | Low (1) | Aggregate query |

**Technical Debt Items**:
- TD-011: Row-by-row cursor processing (should be BULK COLLECT + FORALL)
- TD-012: Partial commits every 50 employees — failure leaves payroll half-calculated
- TD-013: Hard-coded 2024 tax brackets as package constants
- TD-014: Overtime calculation misses holidays in VW_ACTIVE_EMPLOYEES
- TD-015: State tax only implemented for 3 states
- TD-016: No support for retroactive pay adjustments
- TD-017: calculate_employee_pay simplified pretax deduction handling
- TD-018: No payroll reversal/void capability

---

### 2.2 PKG_EMPLOYEE — Hotspot Score: 92

| Metric | Value |
|---|---|
| **Spec LOC** | 192 |
| **Body LOC** | 966 |
| **Total LOC** | 1,158 |
| **Public Procedures** | 18 |
| **Estimated Cyclomatic Complexity** | 40–50 (create_employee ~10, search_employees ~8, get_org_chart ~7) |
| **Dependencies** | PKG_COMMON, PKG_AUDIT, PKG_NOTIFICATION, PKG_PAYROLL |
| **Circular Dependencies** | PKG_EMPLOYEE ↔ PKG_PAYROLL |

**Procedure Breakdown**:

| Procedure/Function | LOC | Complexity | Key Issues |
|---|---|---|---|
| `create_employee` | ~120 | Very High (10) | 20+ params; calls PKG_PAYROLL.create_salary_record (circular dep); multiple INSERTs |
| `update_employee` | ~90 | High (8) | Tracks old/new for history; conditional updates |
| `search_employees` | ~70 | High (8) | Dynamic SQL via string concatenation — SQL injection vulnerability |
| `get_org_chart` | ~60 | High (7) | CONNECT BY recursive query; times out for deep hierarchies (>5 levels) |
| `transfer_employee` | ~50 | Medium (5) | Cross-department validation; history record |
| `promote_employee` | ~45 | Medium (4) | Grade validation; salary update; history record |
| `terminate_employee` | ~50 | Medium (5) | Status transition; cascading updates; notification |
| `generate_emp_number` | ~30 | Medium (4) | Race condition — uses MAX()+1 instead of sequence |
| `set_session_context` | ~15 | Low (1) | SYS_CONTEXT initialization |
| `get_employee` | ~25 | Low (1) | Simple fetch by ID |
| `get_direct_reports` | ~20 | Low (1) | Manager lookup |
| `get_employee_by_number` | ~20 | Low (1) | Lookup by business key |
| `is_active` | ~10 | Low (1) | Status check |
| `get_headcount` | ~15 | Low (1) | COUNT query |
| `get_department_employees` | ~15 | Low (1) | Dept filter |
| `update_emergency_contacts` | ~35 | Low (2) | UPSERT pattern |
| `update_dependents` | ~35 | Low (2) | UPSERT pattern |
| `rehire_employee` | ~45 | Medium (4) | Status transition; validation |

**Technical Debt Items**:
- TD-003: SQL injection in `search_employees` (dynamic SQL via concatenation)
- TD-004: Race condition in `generate_emp_number` (MAX+1 instead of sequence)
- TD-005: `get_org_chart` CONNECT BY times out for deep hierarchies
- TD-006: SSN stored in EMPLOYEES table (encrypted but should be in separate secure table)
- TD-007: PHOTO_BLOB stored in EMPLOYEES table (should use file storage)
- TD-008: Circular dependency with PKG_PAYROLL

---

### 2.3 PKG_SECURITY — Hotspot Score: 88

| Metric | Value |
|---|---|
| **Spec LOC** | 63 |
| **Body LOC** | 237 |
| **Total LOC** | 300 |
| **Public Procedures** | 8 |
| **Estimated Cyclomatic Complexity** | 15–20 (authenticate ~6, has_permission ~5) |
| **Dependencies** | PKG_COMMON, PKG_AUDIT, PKG_EMPLOYEE |

**Procedure Breakdown**:

| Procedure/Function | LOC | Complexity | Key Issues |
|---|---|---|---|
| `authenticate` | ~50 | Medium (6) | Timing attack; no lockout; TOO_MANY_ROWS fallback to MIN() |
| `has_permission` | ~40 | Medium (5) | Hard-coded grade-based permission model; no RBAC table |
| `hash_password` | ~10 | Low (1) | Uses DBMS_CRYPTO.HASH_MD5 — weak algorithm |
| `encrypt_ssn` | ~12 | Low (1) | Uses hard-coded key in source code |
| `decrypt_ssn` | ~15 | Low (2) | WHEN OTHERS returns '***DECRYPT_ERROR***' |
| `change_password` | ~20 | Low (2) | Basic complexity check; stub — no actual DB update |
| `is_session_valid` | ~25 | Low (3) | 30-min timeout based on DB server time |
| `logout` | ~8 | Low (1) | Simple status update |

**Technical Debt Items**:
- TD-001: MD5 password hashing (must migrate to bcrypt/scrypt)
- TD-002: No account lockout after failed login attempts
- TD-009: Hard-coded AES-256 encryption key in source code (`c_encryption_key`)
- TD-010: Session timeout uses DB server time, not app server time
- TD-019: Timing attack on authenticate (different code paths for invalid user vs invalid password)

---

### 2.4 PKG_LEAVE — Hotspot Score: 72

| Metric | Value |
|---|---|
| **Spec LOC** | 128 |
| **Body LOC** | 673 |
| **Total LOC** | 801 |
| **Public Procedures** | 13 |
| **Estimated Cyclomatic Complexity** | 25–30 (submit_leave_request ~8, run_monthly_accrual ~7) |
| **Dependencies** | PKG_EMPLOYEE, PKG_COMMON, PKG_AUDIT, PKG_NOTIFICATION |

**Procedure Breakdown**:

| Procedure/Function | LOC | Complexity | Key Issues |
|---|---|---|---|
| `submit_leave_request` | ~140 | High (8) | Validation chain: employee, leave type, tenure, dates, overlap, balance |
| `run_monthly_accrual` | ~120 | High (7) | Nested cursor loops (employee × leave type); max balance check |
| `approve_leave_request` | ~50 | Medium (3) | FOR UPDATE lock; balance move from pending to used |
| `reject_leave_request` | ~45 | Medium (3) | Balance restoration |
| `cancel_leave_request` | ~45 | Medium (4) | Different restore logic for PENDING vs APPROVED |
| `calculate_business_days` | ~25 | Medium (4) | Day-by-day loop checking weekends + holidays |
| `process_carryover` | ~60 | Medium (5) | Year-end balance carryover with caps |
| `expire_carryover` | ~40 | Low (3) | Expiry date check — double-expires if run twice |
| `get_leave_balance` | ~20 | Low (1) | Balance formula query |
| `adjust_leave_balance` | ~30 | Low (2) | Update with auto-initialize |
| `initialize_balances` | ~20 | Low (2) | DUP_VAL_ON_INDEX safe insert |
| `check_leave_overlap` | ~15 | Low (1) | Date range overlap check |
| `get_pending_requests` | ~10 | Low (1) | Cursor query |

**Technical Debt Items**:
- TD-020: Half-day overlap detection ignores half-day requests (AM/PM not checked)
- TD-021: `expire_carryover` double-subtracts if run twice on same day
- TD-022: Holiday detection only checks exact date match, not observed dates
- TD-023: `calculate_business_days` uses day-by-day loop (slow for large ranges)

---

### 2.5 PKG_INTEGRATION — Hotspot Score: 65

| Metric | Value |
|---|---|
| **Spec LOC** | 50 |
| **Body LOC** | 213 |
| **Total LOC** | 263 |
| **Public Procedures** | 5 |
| **Estimated Cyclomatic Complexity** | 12–15 |
| **Dependencies** | PKG_COMMON, PKG_PAYROLL, PKG_EMPLOYEE |

**Technical Debt Items**:
- TD-024: GL posting uses UTL_FILE flat file instead of API
- TD-025: Benefits feed is ADP vendor-specific format
- TD-026: No retry logic for failed file transfers
- TD-027: FTP credentials stored as cleartext in SYSTEM_PARAMETERS

---

### 2.6 PKG_NOTIFICATION — Hotspot Score: 45

| Metric | Value |
|---|---|
| **Spec LOC** | 42 |
| **Body LOC** | 177 |
| **Total LOC** | 219 |
| **Public Procedures** | 4 |
| **Estimated Cyclomatic Complexity** | 8–10 |
| **Dependencies** | PKG_COMMON |

**Known Issues**:
- UTL_MAIL configuration hard-coded to legacy SMTP server
- No rate limiting on notification sends
- HTML email templates stored as string constants

---

### 2.7 PKG_PERFORMANCE — Hotspot Score: 40

| Metric | Value |
|---|---|
| **Spec LOC** | 97 |
| **Body LOC** | 320 |
| **Total LOC** | 417 |
| **Public Procedures** | 11 |
| **Estimated Cyclomatic Complexity** | 12–15 |
| **Dependencies** | PKG_EMPLOYEE, PKG_COMMON, PKG_AUDIT, PKG_NOTIFICATION |

Relatively clean module. Main complexity is in `generate_reviews_for_cycle` (bulk creation) and `get_rating_distribution`.

---

### 2.8 PKG_REPORTING — Hotspot Score: 38

| Metric | Value |
|---|---|
| **Spec LOC** | 63 |
| **Body LOC** | 207 |
| **Total LOC** | 270 |
| **Public Procedures** | 8 |
| **Estimated Cyclomatic Complexity** | 10–12 |
| **Dependencies** | PKG_EMPLOYEE, PKG_PAYROLL, PKG_COMMON |

**Known Issues**:
- Denormalized reporting tables only refreshed nightly — stale during business hours
- Some reports use hard-coded fiscal year start (October 1)

---

### 2.9–2.11 Low-Risk Packages

| Package | LOC | Complexity | Notes |
|---|---|---|---|
| PKG_COMMON (404) | 283 body | Low | Base utility — no bugs identified |
| PKG_VALIDATION (172) | 125 body | Low | Pure functions — easy to migrate |
| PKG_AUDIT (104) | 72 body | Low | Simple INSERT-based logging |

---

## 3. Hotspot Visualization

### 3.1 Bubble Chart — LOC vs Complexity vs Risk

```mermaid
quadrantChart
    title Package Hotspot Analysis
    x-axis "Low Complexity" --> "High Complexity"
    y-axis "Low Risk" --> "High Risk"
    quadrant-1 "Critical Hotspots"
    quadrant-2 "High Risk, Lower Complexity"
    quadrant-3 "Low Priority"
    quadrant-4 "Complex but Manageable"
    PKG_PAYROLL: [0.9, 0.95]
    PKG_EMPLOYEE: [0.85, 0.9]
    PKG_SECURITY: [0.5, 0.92]
    PKG_LEAVE: [0.65, 0.7]
    PKG_INTEGRATION: [0.4, 0.65]
    PKG_NOTIFICATION: [0.3, 0.45]
    PKG_PERFORMANCE: [0.4, 0.4]
    PKG_REPORTING: [0.35, 0.38]
    PKG_COMMON: [0.15, 0.1]
    PKG_VALIDATION: [0.1, 0.08]
    PKG_AUDIT: [0.08, 0.05]
```

### 3.2 Technical Debt Distribution by Category

```mermaid
pie title Technical Debt Items by Category
    "Security" : 5
    "Data Integrity" : 6
    "Performance" : 5
    "Architecture" : 4
    "Integration" : 4
    "Business Logic" : 3
```

### 3.3 LOC Distribution Across Packages

```mermaid
pie title PL/SQL Body LOC by Package
    "PKG_EMPLOYEE (966)" : 966
    "PKG_PAYROLL (897)" : 897
    "PKG_LEAVE (673)" : 673
    "PKG_PERFORMANCE (320)" : 320
    "PKG_COMMON (283)" : 283
    "PKG_SECURITY (237)" : 237
    "PKG_INTEGRATION (213)" : 213
    "PKG_REPORTING (207)" : 207
    "PKG_NOTIFICATION (177)" : 177
    "PKG_VALIDATION (125)" : 125
    "PKG_AUDIT (72)" : 72
```

---

## 4. Technical Debt Cross-Reference

Complete mapping of all technical debt items from `assessment-report.md` to hotspot analysis.

| TD ID | Package | Category | Severity | Description | Migration Impact |
|---|---|---|---|---|---|
| TD-001 | PKG_SECURITY | Security | 🔴 Critical | MD5 password hashing | Replace with BCrypt via Spring Security |
| TD-002 | PKG_SECURITY | Security | 🔴 Critical | No account lockout | Implement with Spring Security lockout policy |
| TD-003 | PKG_EMPLOYEE | Security | 🔴 Critical | SQL injection in search_employees | Use Spring Data JPA Specifications / Criteria API |
| TD-004 | PKG_EMPLOYEE | Data Integrity | 🟠 High | Race condition in generate_emp_number (MAX+1) | Use database sequence + @GeneratedValue |
| TD-005 | PKG_EMPLOYEE | Performance | 🟠 High | get_org_chart CONNECT BY timeout | Use recursive CTE with depth limit or materialized path |
| TD-006 | PKG_EMPLOYEE | Architecture | 🟡 Medium | SSN in EMPLOYEES table | Separate secure table with field-level encryption |
| TD-007 | PKG_EMPLOYEE | Architecture | 🟡 Medium | PHOTO_BLOB in EMPLOYEES | Use S3/MinIO file storage service |
| TD-008 | PKG_EMPLOYEE / PKG_PAYROLL | Architecture | 🟠 High | Circular dependency | Spring Application Events for async decoupling |
| TD-009 | PKG_SECURITY | Security | 🔴 Critical | Hard-coded encryption key | Use Spring Vault or env-based key management |
| TD-010 | PKG_SECURITY | Architecture | 🟡 Medium | Session timeout uses DB time | JWT with configurable expiry |
| TD-011 | PKG_PAYROLL | Performance | 🟠 High | Row-by-row cursor loop | Spring Batch with chunk-oriented processing |
| TD-012 | PKG_PAYROLL | Data Integrity | 🔴 Critical | Partial commits every 50 rows | Transactional boundaries via @Transactional |
| TD-013 | PKG_PAYROLL | Business Logic | 🟠 High | Hard-coded 2024 tax brackets | Configuration table + admin UI |
| TD-014 | PKG_PAYROLL | Business Logic | 🟡 Medium | Overtime misses holidays | Integrate with holiday calendar service |
| TD-015 | PKG_PAYROLL | Business Logic | 🟡 Medium | State tax only 3 states | Tax calculation service with pluggable state modules |
| TD-016 | PKG_PAYROLL | Data Integrity | 🟡 Medium | No retroactive pay adjustment | Implement adjustment payroll run type |
| TD-017 | PKG_PAYROLL | Data Integrity | 🟡 Medium | Simplified pretax deductions | Full pretax/posttax deduction ordering |
| TD-018 | PKG_PAYROLL | Data Integrity | 🟠 High | No payroll reversal/void | Implement reversal run type with offsetting entries |
| TD-019 | PKG_SECURITY | Security | 🟠 High | Timing attack on authenticate | Constant-time comparison in Spring Security |
| TD-020 | PKG_LEAVE | Data Integrity | 🟠 High | Half-day overlap not checked | Include AM/PM in overlap query |
| TD-021 | PKG_LEAVE | Data Integrity | 🟠 High | expire_carryover double-subtracts | Idempotency check (processed flag) |
| TD-022 | PKG_LEAVE | Business Logic | 🟡 Medium | Holiday observed dates not handled | Observed date calculation logic |
| TD-023 | PKG_LEAVE | Performance | 🟡 Medium | Business days loop slow | Set-based calculation or lookup table |
| TD-024 | PKG_INTEGRATION | Integration | 🟠 High | GL via flat file | REST/SOAP API integration |
| TD-025 | PKG_INTEGRATION | Integration | 🟡 Medium | ADP vendor-specific format | Abstraction layer with pluggable format adapters |
| TD-026 | PKG_INTEGRATION | Integration | 🟠 High | No retry logic | Spring Retry with exponential backoff |
| TD-027 | PKG_INTEGRATION | Security | 🔴 Critical | FTP creds in cleartext | Encrypted credentials in Vault / env config |

---

## 5. Security Hotspots

```mermaid
graph TD
    subgraph "Critical Security Issues"
        S1["TD-001: MD5 Hashing<br/>PKG_SECURITY.hash_password<br/>Line: 14–24"]
        S2["TD-002: No Account Lockout<br/>PKG_SECURITY.authenticate<br/>Line: 30–80"]
        S3["TD-003: SQL Injection<br/>PKG_EMPLOYEE.search_employees<br/>Line: ~445–454"]
        S4["TD-009: Hard-coded Key<br/>PKG_SECURITY body<br/>Line: 7"]
        S5["TD-027: Cleartext FTP Creds<br/>SYSTEM_PARAMETERS table"]
    end

    subgraph "High Security Issues"
        S6["TD-019: Timing Attack<br/>PKG_SECURITY.authenticate<br/>Line: ~47–50"]
    end

    S1 --> FIX1["Spring Security BCryptPasswordEncoder"]
    S2 --> FIX2["Spring Security with MaxFailedAttempts"]
    S3 --> FIX3["JPA Criteria API / Specifications"]
    S4 --> FIX4["Spring Vault / externalized config"]
    S5 --> FIX5["Encrypted credential store"]
    S6 --> FIX6["Constant-time password comparison"]

    style S1 fill:#ffcdd2
    style S2 fill:#ffcdd2
    style S3 fill:#ffcdd2
    style S4 fill:#ffcdd2
    style S5 fill:#ffcdd2
    style S6 fill:#ffe0b2
```

---

## 6. Data Integrity Hotspots

```mermaid
graph TD
    subgraph "Critical"
        D1["TD-012: Partial Commits<br/>PKG_PAYROLL.calculate_payroll<br/>COMMIT every 50 rows"]
    end

    subgraph "High"
        D2["TD-004: Race Condition<br/>PKG_EMPLOYEE.generate_emp_number<br/>MAX()+1 pattern"]
        D3["TD-018: No Payroll Reversal<br/>PKG_PAYROLL — no void capability"]
        D4["TD-020: Half-day Overlap<br/>PKG_LEAVE.check_leave_overlap"]
        D5["TD-021: Double Expiry<br/>PKG_LEAVE.expire_carryover"]
    end

    subgraph "Medium"
        D6["TD-016: No Retro Pay<br/>PKG_PAYROLL"]
        D7["TD-017: Simplified Pretax<br/>PKG_PAYROLL.calculate_employee_pay"]
    end

    style D1 fill:#ffcdd2
    style D2 fill:#ffe0b2
    style D3 fill:#ffe0b2
    style D4 fill:#ffe0b2
    style D5 fill:#ffe0b2
```

---

## 7. Performance Hotspots

```mermaid
graph TD
    subgraph "High Impact"
        P1["TD-011: Cursor Loop<br/>PKG_PAYROLL.calculate_payroll<br/>Row-by-row for ~800 employees"]
        P2["TD-005: CONNECT BY Timeout<br/>PKG_EMPLOYEE.get_org_chart<br/>Deep hierarchy >5 levels"]
    end

    subgraph "Medium Impact"
        P3["TD-023: Day-by-Day Loop<br/>PKG_LEAVE.calculate_business_days<br/>Slow for large date ranges"]
        P4["Stale Reporting Tables<br/>PKG_REPORTING.refresh_reporting_tables<br/>Only refreshed nightly"]
    end

    P1 --> FIX_P1["Spring Batch chunk processing<br/>BULK COLLECT equivalent"]
    P2 --> FIX_P2["Materialized path column<br/>or adjacency list with depth limit"]
    P3 --> FIX_P3["Pre-computed business day calendar table"]
    P4 --> FIX_P4["Event-driven cache invalidation<br/>or materialized views"]

    style P1 fill:#ffe0b2
    style P2 fill:#ffe0b2
```

---

## 8. Migration Risk Matrix

```mermaid
graph LR
    subgraph "Highest Risk - Migrate Carefully"
        HR1["PKG_PAYROLL<br/>Score: 95<br/>897 LOC · 8 TD items"]
        HR2["PKG_EMPLOYEE<br/>Score: 92<br/>966 LOC · 6 TD items"]
        HR3["PKG_SECURITY<br/>Score: 88<br/>237 LOC · 5 TD items"]
    end

    subgraph "Medium Risk - Standard Care"
        MR1["PKG_LEAVE<br/>Score: 72<br/>673 LOC · 4 TD items"]
        MR2["PKG_INTEGRATION<br/>Score: 65<br/>213 LOC · 4 TD items"]
    end

    subgraph "Lower Risk - Straightforward"
        LR1["PKG_NOTIFICATION<br/>Score: 45"]
        LR2["PKG_PERFORMANCE<br/>Score: 40"]
        LR3["PKG_REPORTING<br/>Score: 38"]
    end

    subgraph "Minimal Risk - Direct Port"
        MIN1["PKG_COMMON<br/>Score: 15"]
        MIN2["PKG_VALIDATION<br/>Score: 12"]
        MIN3["PKG_AUDIT<br/>Score: 10"]
    end

    style HR1 fill:#ffcdd2
    style HR2 fill:#ffcdd2
    style HR3 fill:#ffcdd2
    style MR1 fill:#ffe0b2
    style MR2 fill:#ffe0b2
    style LR1 fill:#fff9c4
    style LR2 fill:#fff9c4
    style LR3 fill:#fff9c4
    style MIN1 fill:#c8e6c9
    style MIN2 fill:#c8e6c9
    style MIN3 fill:#c8e6c9
```

---

## 9. Recommended Migration Priority

Based on the Strangler Fig pattern, hotspot scores, and dependency analysis:

| Priority | Package | Rationale | Estimated Effort |
|---|---|---|---|
| **1** | PKG_COMMON, PKG_AUDIT, PKG_VALIDATION | Foundation with zero bugs; all other packages depend on these | 1 week |
| **2** | PKG_SECURITY | Critical security fixes (MD5, lockout, hard-coded key); gates all other modules | 2 weeks |
| **3** | PKG_EMPLOYEE | Core entity; most modules depend on employee data; resolve circular dep | 4 weeks |
| **4** | PKG_NOTIFICATION | Shared service; simple but used by 4 business packages | 1 week |
| **5** | PKG_LEAVE | Self-contained domain; 4 bugs to fix but well-isolated | 3 weeks |
| **6** | PKG_PAYROLL | Highest complexity; migrate after Employee to break circular dep | 5 weeks |
| **7** | PKG_PERFORMANCE | Lower risk; depends only on Employee | 3 weeks |
| **8** | PKG_REPORTING | Read-only; can run against old or new schema during transition | 2 weeks |
| **9** | PKG_INTEGRATION | External system coupling; migrate last to minimize disruption | 3 weeks |

### Migration Flow

```mermaid
flowchart LR
    A["Phase 1<br/>Foundation<br/>COMMON + AUDIT<br/>+ VALIDATION"] --> B["Phase 2<br/>Security<br/>PKG_SECURITY"]
    B --> C["Phase 3<br/>Core Entity<br/>PKG_EMPLOYEE"]
    C --> D["Phase 4<br/>Notifications<br/>PKG_NOTIFICATION"]
    D --> E["Phase 5<br/>Leave Mgmt<br/>PKG_LEAVE"]
    D --> F["Phase 6<br/>Payroll<br/>PKG_PAYROLL"]
    F --> G["Phase 7<br/>Performance<br/>PKG_PERFORMANCE"]
    E --> H["Phase 8<br/>Reporting<br/>PKG_REPORTING"]
    F --> H
    G --> H
    H --> I["Phase 9<br/>Integration<br/>PKG_INTEGRATION"]

    style A fill:#c8e6c9
    style B fill:#c8e6c9
    style C fill:#fff9c4
    style D fill:#c8e6c9
    style E fill:#bbdefb
    style F fill:#ffcdd2
    style G fill:#bbdefb
    style H fill:#e1bee7
    style I fill:#e1bee7
```
