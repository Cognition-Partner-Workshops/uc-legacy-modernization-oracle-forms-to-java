# Application Inventory — Oracle Forms HRMS

> **Scope**: Complete catalog of every program unit in the legacy Oracle Forms 11g/12c HR Management System.
> **Source repo**: `ts-plsql-oracle-forms-legacy-codebase`

---

## Summary Metrics

| Category | Count | Total LOC |
|---|---|---|
| PL/SQL Package Specs (.pks) | 11 | 999 |
| PL/SQL Package Bodies (.pkb) | 11 | 4,170 |
| Oracle Forms Modules (.fmb XML) | 6 | 1,359 |
| PL/SQL Libraries (.pll) | 2 | 286 |
| Menu Modules (.mmb) | 1 | 60 |
| Database Triggers | 2 | 214 |
| Schema DDL (tables) | 4 scripts | 751 |
| Views | 1 script (5 views) | 159 |
| Sequences | 1 script (24 sequences) | 49 |
| Seed Data | 2 scripts | — |
| **Total** | **~40 source files** | **~8,047** |

---

## 1. Oracle Forms Modules

| Module | File | LOC | Canvases / Tabs | Primary Data Blocks | PL/SQL Package Dependency | Description |
|---|---|---|---|---|---|---|
| **HRMS_LOGIN** | `HRMS_LOGIN.xml` | 130 | WIN_LOGIN | LOGIN | PKG_SECURITY | Authentication entry point; username/password form |
| **HRMS_MENU** | `HRMS_MENU.xml` | 175 | CVS_MENU | MENU_OPTIONS | PKG_SECURITY | Main navigation; dispatches to module forms |
| **HRMS_EMPLOYEE** | `HRMS_EMPLOYEE.xml` | 538 | CVS_MAIN (TP_PERSONAL, TP_JOB, TP_DEPENDENTS, TP_HISTORY) | EMPLOYEE, DEPENDENT, SALARY, HISTORY | PKG_EMPLOYEE, PKG_PAYROLL, PKG_VALIDATION | Employee master record CRUD, tabbed layout |
| **HRMS_LEAVE** | `HRMS_LEAVE.xml` | 219 | — | LEAVE_REQUEST, LEAVE_BALANCE | PKG_LEAVE, PKG_EMPLOYEE | Leave request/approve/reject workflow |
| **HRMS_PAYROLL** | `HRMS_PAYROLL.xml` | 166 | — | PAYROLL_RUN, PAYROLL_DETAIL, PAY_PERIOD | PKG_PAYROLL | Payroll run creation, calculation, approval |
| **HRMS_PERFORMANCE** | `HRMS_PERFORMANCE.xml` | 131 | — | REVIEW_CYCLE, PERFORMANCE_REVIEW, PERFORMANCE_GOAL | PKG_PERFORMANCE | Performance review cycles and goal tracking |

### Forms Libraries (.pll)

| Library | File | LOC | Attached To | Description |
|---|---|---|---|---|
| **HRMS_COMMON_LIB** | `HRMS_COMMON_LIB.pll.sql` | 151 | All forms | Shared formatting, navigation helpers, PKG_COMMON / PKG_SECURITY wrappers |
| **HRMS_VALIDATION_LIB** | `HRMS_VALIDATION_LIB.pll.sql` | 135 | HRMS_EMPLOYEE, HRMS_LEAVE, HRMS_PAYROLL | Client-side WHEN-VALIDATE-ITEM trigger helpers |

### Menu Modules (.mmb)

| Module | File | LOC | Description |
|---|---|---|---|
| **HRMS_MENU** | `HRMS_MENU.mmb.sql` | 60 | Top-level menu bar with File, Employee, Payroll, Leave, Performance, Reports, Admin items |

---

## 2. PL/SQL Packages

### 2.1 Core Business Packages

| Package | Spec LOC | Body LOC | Total LOC | Dependencies | Called By | Known Issues |
|---|---|---|---|---|---|---|
| **PKG_EMPLOYEE** | 192 | 966 | 1,158 | PKG_COMMON, PKG_AUDIT, PKG_NOTIFICATION, PKG_PAYROLL | HRMS_EMPLOYEE form, batch jobs | Circular dependency with PKG_PAYROLL; SQL injection in `search_employees`; race condition in `generate_emp_number`; `get_org_chart` timeout for deep hierarchies |
| **PKG_PAYROLL** | 164 | 897 | 1,061 | PKG_EMPLOYEE, PKG_COMMON, PKG_AUDIT, PKG_NOTIFICATION | HRMS_PAYROLL form, DBMS_SCHEDULER | Circular dependency with PKG_EMPLOYEE; hard-coded 2024 tax brackets; row-by-row cursor loop; partial commits every 50 employees; overtime misses holidays |
| **PKG_LEAVE** | 128 | 673 | 801 | PKG_EMPLOYEE, PKG_COMMON, PKG_AUDIT, PKG_NOTIFICATION | HRMS_LEAVE form, batch accrual job | Half-day overlap detection bug; carryover double-subtraction; holiday observed-date bug |
| **PKG_PERFORMANCE** | 97 | 320 | 417 | PKG_EMPLOYEE, PKG_COMMON, PKG_AUDIT, PKG_NOTIFICATION | HRMS_PERFORMANCE form, batch calibration | — |
| **PKG_SECURITY** | 63 | 237 | 300 | PKG_COMMON, PKG_AUDIT, PKG_EMPLOYEE | HRMS_LOGIN form, all forms (session validation) | MD5 password hashing; hard-coded encryption key; no account lockout; timing attack on login |
| **PKG_INTEGRATION** | 50 | 213 | 263 | PKG_COMMON, PKG_PAYROLL, PKG_EMPLOYEE | Batch scheduler (nightly/weekly) | UTL_FILE flat-file exchange; ADP vendor-specific format; no retry logic; cleartext FTP creds |

### 2.2 Infrastructure / Utility Packages

| Package | Spec LOC | Body LOC | Total LOC | Dependencies | Called By | Known Issues |
|---|---|---|---|---|---|---|
| **PKG_COMMON** | 121 | 283 | 404 | None (base package) | All packages, all forms | — |
| **PKG_AUDIT** | 32 | 72 | 104 | None (base package) | All packages, DB triggers | — |
| **PKG_NOTIFICATION** | 42 | 177 | 219 | PKG_COMMON | PKG_EMPLOYEE, PKG_LEAVE, PKG_PAYROLL, PKG_PERFORMANCE | Hard-coded SMTP; no rate limiting; HTML templates as string constants |
| **PKG_REPORTING** | 63 | 207 | 270 | PKG_EMPLOYEE, PKG_PAYROLL, PKG_COMMON | HRMS_REPORTS form, Oracle Reports, batch jobs | Stale denormalized tables; hard-coded fiscal year start |
| **PKG_VALIDATION** | 47 | 125 | 172 | PKG_COMMON | All forms (WHEN-VALIDATE-ITEM), PKG_EMPLOYEE, PKG_PAYROLL | Client/server validation drift |

---

## 3. Database Triggers

| Trigger | File | LOC | Fires On | Description |
|---|---|---|---|---|
| **TRG_AUDIT** | `trg_audit.sql` | 84 | After INSERT/UPDATE/DELETE on audited tables | Captures old/new values into AUDIT_LOG via PKG_AUDIT |
| **TRG_EMPLOYEES** | `trg_employees.sql` | 130 | Before INSERT/UPDATE on EMPLOYEES | Auto-populates audit columns, validates status transitions, generates history records |

---

## 4. Database Schema Objects

### 4.1 Tables (24 tables)

| # | Table | DDL Script | Domain | Key Relationships |
|---|---|---|---|---|
| 1 | DEPARTMENTS | 01_core_tables.sql | Core | Self-ref (PARENT_DEPT_ID); FK → LOCATIONS |
| 2 | LOCATIONS | 01_core_tables.sql | Core | — |
| 3 | JOB_GRADES | 01_core_tables.sql | Core | — |
| 4 | JOB_TITLES | 01_core_tables.sql | Core | FK → JOB_GRADES |
| 5 | EMPLOYEES | 01_core_tables.sql | Core | FK → DEPARTMENTS, JOB_TITLES, LOCATIONS; self-ref (MANAGER_EMP_ID) |
| 6 | EMPLOYEE_HISTORY | 01_core_tables.sql | Core | FK → EMPLOYEES |
| 7 | EMPLOYEE_DEPENDENTS | 01_core_tables.sql | Core | FK → EMPLOYEES |
| 8 | EMERGENCY_CONTACTS | 01_core_tables.sql | Core | FK → EMPLOYEES |
| 9 | SALARY_RECORDS | 02_payroll_tables.sql | Payroll | FK → EMPLOYEES |
| 10 | PAY_ELEMENTS | 02_payroll_tables.sql | Payroll | — |
| 11 | EMPLOYEE_PAY_ELEMENTS | 02_payroll_tables.sql | Payroll | FK → EMPLOYEES, PAY_ELEMENTS |
| 12 | PAY_PERIODS | 02_payroll_tables.sql | Payroll | — |
| 13 | PAYROLL_RUNS | 02_payroll_tables.sql | Payroll | FK → PAY_PERIODS |
| 14 | PAYROLL_DETAILS | 02_payroll_tables.sql | Payroll | FK → PAYROLL_RUNS, EMPLOYEES, PAY_ELEMENTS |
| 15 | TAX_BRACKETS | 02_payroll_tables.sql | Payroll | — |
| 16 | EMPLOYEE_TAX_INFO | 02_payroll_tables.sql | Payroll | FK → EMPLOYEES |
| 17 | EMPLOYEE_BANK_ACCOUNTS | 02_payroll_tables.sql | Payroll | FK → EMPLOYEES |
| 18 | LEAVE_TYPES | 03_leave_tables.sql | Leave | — |
| 19 | LEAVE_BALANCES | 03_leave_tables.sql | Leave | FK → EMPLOYEES, LEAVE_TYPES |
| 20 | LEAVE_REQUESTS | 03_leave_tables.sql | Leave | FK → EMPLOYEES, LEAVE_TYPES |
| 21 | LEAVE_ACCRUAL_LOG | 03_leave_tables.sql | Leave | FK → EMPLOYEES, LEAVE_TYPES |
| 22 | HOLIDAYS | 03_leave_tables.sql | Leave | — |
| 23 | REVIEW_CYCLES | 04_performance_tables.sql | Performance | — |
| 24 | PERFORMANCE_REVIEWS | 04_performance_tables.sql | Performance | FK → REVIEW_CYCLES, EMPLOYEES |
| 25 | PERFORMANCE_GOALS | 04_performance_tables.sql | Performance | FK → PERFORMANCE_REVIEWS, EMPLOYEES |
| 26 | AUDIT_LOG | 04_performance_tables.sql | System | — |
| 27 | SYSTEM_PARAMETERS | 04_performance_tables.sql | System | — |
| 28 | NOTIFICATION_QUEUE | 04_performance_tables.sql | System | — |
| 29 | USER_SESSIONS | 04_performance_tables.sql | System | FK → EMPLOYEES |
| 30 | LOOKUP_VALUES | 04_performance_tables.sql | System | Self-ref (PARENT_LOOKUP_ID) |

### 4.2 Views (5 views)

| View | LOC | Description |
|---|---|---|
| VW_ACTIVE_EMPLOYEES | ~37 | Denormalized active employee data with dept, job, manager, location, salary |
| VW_ORG_HIERARCHY | ~11 | Hierarchical org chart using CONNECT BY (performance issue >500 rows) |
| VW_EMPLOYEE_COMPENSATION | ~18 | Compensation with compa-ratio against grade midpoint |
| VW_LEAVE_SUMMARY | ~18 | Current-year leave balances with utilization % |
| VW_PAYROLL_LATEST | ~21 | Latest approved payroll run breakdown per employee |
| VW_PENDING_APPROVALS | ~25 | Unified pending approval items across Leave and Performance modules |

### 4.3 Sequences (24 sequences)

| Sequence | Start | Description |
|---|---|---|
| SEQ_DEPARTMENT | 100 | Department PKs |
| SEQ_LOCATION | 100 | Location PKs |
| SEQ_JOB_GRADE | 100 | Job grade PKs |
| SEQ_JOB_TITLE | 100 | Job title PKs |
| SEQ_EMPLOYEE | 10000 | Employee PKs |
| SEQ_EMP_HISTORY | 1 | Employee history PKs |
| SEQ_DEPENDENT | 1 | Dependent PKs |
| SEQ_EMERGENCY_CONTACT | 1 | Emergency contact PKs |
| SEQ_EMP_NUMBER | 1000 | Employee number suffix (race condition — unused in favor of MAX+1) |
| SEQ_SALARY | 1 | Salary record PKs |
| SEQ_PAY_ELEMENT | 1 | Pay element PKs |
| SEQ_EMP_PAY_ELEMENT | 1 | Employee pay element PKs |
| SEQ_PAY_PERIOD | 1 | Pay period PKs |
| SEQ_PAYROLL_RUN | 1 | Payroll run PKs |
| SEQ_PAYROLL_DETAIL | 1 | Payroll detail PKs |
| SEQ_TAX_BRACKET | 1 | Tax bracket PKs |
| SEQ_LEAVE_TYPE | 1 | Leave type PKs |
| SEQ_LEAVE_BALANCE | 1 | Leave balance PKs |
| SEQ_LEAVE_REQUEST | 1 | Leave request PKs |
| SEQ_LEAVE_ACCRUAL | 1 | Leave accrual log PKs |
| SEQ_HOLIDAY | 1 | Holiday PKs |
| SEQ_REVIEW_CYCLE | 1 | Review cycle PKs |
| SEQ_PERF_REVIEW | 1 | Performance review PKs |
| SEQ_PERF_GOAL | 1 | Performance goal PKs |
| SEQ_AUDIT | 1 | Audit log PKs (CACHE 100) |
| SEQ_NOTIFICATION | 1 | Notification queue PKs |
| SEQ_USER_SESSION | 1 | User session PKs |
| SEQ_SYSTEM_PARAM | 1 | System parameter PKs |
| SEQ_LOOKUP | 1 | Lookup value PKs |

---

## 5. Batch / Scheduled Jobs

| Job | Schedule | PL/SQL Entry Point | Description |
|---|---|---|---|
| Notification Queue Processor | Every 5 minutes | `PKG_NOTIFICATION.process_queue` | Dequeues pending notifications and sends via UTL_MAIL |
| Monthly Leave Accrual | 1st of each month | `PKG_LEAVE.run_monthly_accrual` | Accrues leave balances for all active employees |
| Reporting Table Refresh | Nightly | `PKG_REPORTING.refresh_reporting_tables` | Refreshes denormalized reporting tables |
| GL Journal Generation | Per payroll run | `PKG_INTEGRATION.generate_gl_journal` | Generates flat-file GL journal entries |
| Benefits Feed Export | Weekly | `PKG_INTEGRATION.export_benefits_feed` | Exports employee/benefits data in ADP format |

---

## 6. External Integrations

| Integration | Direction | Format | Transport | Package |
|---|---|---|---|---|
| General Ledger (GL) | Outbound | Flat file (fixed-width) | UTL_FILE → shared filesystem | PKG_INTEGRATION |
| Benefits Provider (ADP) | Outbound | ADP vendor format | UTL_FILE → FTP | PKG_INTEGRATION |
| Time & Attendance | Inbound | CSV | File pickup via UTL_FILE | PKG_INTEGRATION |
| Org Structure Sync | Outbound | Custom | Direct DB link / flat file | PKG_INTEGRATION |

---

## 7. Inventory Completeness Matrix

| Deliverable | Status | Notes |
|---|---|---|
| All Forms modules cataloged | Complete | 6 forms + 2 PLL + 1 MMB |
| All PL/SQL packages cataloged | Complete | 11 packages (spec + body) |
| All database triggers cataloged | Complete | 2 triggers |
| All tables enumerated | Complete | 30 tables across 4 DDL scripts |
| All views enumerated | Complete | 5 views + 1 pending approvals union |
| All sequences enumerated | Complete | 24+ sequences |
| Batch jobs documented | Complete | 5 scheduled jobs |
| External integrations documented | Complete | 4 integration points |
| Technical debt items cross-referenced | Complete | See `assessment-report.md` TD-001 through TD-027 |
