# Dependency Map — Oracle Forms HRMS

> Visual dependency maps for all components of the legacy Oracle Forms HRMS system.
> Every diagram uses **Mermaid** syntax for rendering in GitHub / compatible viewers.

---

## Table of Contents

1. [System-Wide Component Dependency Graph](#1-system-wide-component-dependency-graph)
2. [PL/SQL Package Dependency Graph](#2-plsql-package-dependency-graph)
3. [Forms → Package Call Graph](#3-forms--package-call-graph)
4. [Database Table Relationships (ERD)](#4-database-table-relationships-erd)
5. [Batch Job / Scheduler Flow](#5-batch-job--scheduler-flow)
6. [External Integration Data Flow](#6-external-integration-data-flow)
7. [User Authentication & Session Flow](#7-user-authentication--session-flow)
8. [Leave Request Workflow](#8-leave-request-workflow)
9. [Payroll Processing Pipeline](#9-payroll-processing-pipeline)
10. [Module Migration Order (Strangler Fig)](#10-module-migration-order-strangler-fig)

---

## 1. System-Wide Component Dependency Graph

Shows every major component category and how they relate at the highest level.

```mermaid
graph TB
    subgraph "Oracle Forms UI"
        LOGIN[HRMS_LOGIN.fmb]
        MENU[HRMS_MENU.fmb]
        EMP_FORM[HRMS_EMPLOYEE.fmb]
        LEAVE_FORM[HRMS_LEAVE.fmb]
        PAY_FORM[HRMS_PAYROLL.fmb]
        PERF_FORM[HRMS_PERFORMANCE.fmb]
    end

    subgraph "Forms Libraries"
        COMMON_LIB[HRMS_COMMON_LIB.pll]
        VALID_LIB[HRMS_VALIDATION_LIB.pll]
    end

    subgraph "PL/SQL Packages"
        PKG_SEC[PKG_SECURITY]
        PKG_EMP[PKG_EMPLOYEE]
        PKG_PAY[PKG_PAYROLL]
        PKG_LV[PKG_LEAVE]
        PKG_PERF[PKG_PERFORMANCE]
        PKG_INT[PKG_INTEGRATION]
        PKG_RPT[PKG_REPORTING]
        PKG_NOTIF[PKG_NOTIFICATION]
        PKG_COM[PKG_COMMON]
        PKG_AUD[PKG_AUDIT]
        PKG_VAL[PKG_VALIDATION]
    end

    subgraph "Database"
        TABLES[(30 Tables)]
        VIEWS[(6 Views)]
        SEQS[(24+ Sequences)]
        TRIGS[2 DB Triggers]
    end

    subgraph "External Systems"
        GL[General Ledger]
        ADP[Benefits Provider - ADP]
        TIME[Time & Attendance]
    end

    LOGIN --> PKG_SEC
    MENU --> PKG_SEC
    EMP_FORM --> PKG_EMP
    EMP_FORM --> PKG_VAL
    LEAVE_FORM --> PKG_LV
    PAY_FORM --> PKG_PAY
    PERF_FORM --> PKG_PERF

    COMMON_LIB --> PKG_COM
    COMMON_LIB --> PKG_SEC
    VALID_LIB --> PKG_VAL

    PKG_EMP <--> PKG_PAY
    PKG_EMP --> PKG_COM
    PKG_EMP --> PKG_AUD
    PKG_EMP --> PKG_NOTIF
    PKG_PAY --> PKG_COM
    PKG_PAY --> PKG_AUD
    PKG_PAY --> PKG_NOTIF
    PKG_LV --> PKG_EMP
    PKG_LV --> PKG_COM
    PKG_LV --> PKG_AUD
    PKG_LV --> PKG_NOTIF
    PKG_PERF --> PKG_EMP
    PKG_PERF --> PKG_COM
    PKG_PERF --> PKG_AUD
    PKG_PERF --> PKG_NOTIF
    PKG_INT --> PKG_PAY
    PKG_INT --> PKG_EMP
    PKG_INT --> PKG_COM
    PKG_RPT --> PKG_EMP
    PKG_RPT --> PKG_PAY
    PKG_RPT --> PKG_COM
    PKG_NOTIF --> PKG_COM
    PKG_SEC --> PKG_COM
    PKG_SEC --> PKG_AUD
    PKG_SEC --> PKG_EMP
    PKG_VAL --> PKG_COM

    PKG_EMP --> TABLES
    PKG_PAY --> TABLES
    PKG_LV --> TABLES
    PKG_PERF --> TABLES
    PKG_INT --> GL
    PKG_INT --> ADP
    PKG_INT --> TIME
    TRIGS --> PKG_AUD
```

---

## 2. PL/SQL Package Dependency Graph

Focused view on inter-package dependencies. The **red** edge marks the circular dependency.

```mermaid
graph LR
    PKG_COMMON["PKG_COMMON<br/>(base)"]
    PKG_AUDIT["PKG_AUDIT<br/>(base)"]

    PKG_VALIDATION --> PKG_COMMON
    PKG_NOTIFICATION --> PKG_COMMON
    PKG_SECURITY --> PKG_COMMON
    PKG_SECURITY --> PKG_AUDIT
    PKG_SECURITY --> PKG_EMPLOYEE

    PKG_EMPLOYEE --> PKG_COMMON
    PKG_EMPLOYEE --> PKG_AUDIT
    PKG_EMPLOYEE --> PKG_NOTIFICATION
    PKG_EMPLOYEE --> PKG_PAYROLL

    PKG_PAYROLL --> PKG_COMMON
    PKG_PAYROLL --> PKG_AUDIT
    PKG_PAYROLL --> PKG_NOTIFICATION
    PKG_PAYROLL --> PKG_EMPLOYEE

    PKG_LEAVE --> PKG_EMPLOYEE
    PKG_LEAVE --> PKG_COMMON
    PKG_LEAVE --> PKG_AUDIT
    PKG_LEAVE --> PKG_NOTIFICATION

    PKG_PERFORMANCE --> PKG_EMPLOYEE
    PKG_PERFORMANCE --> PKG_COMMON
    PKG_PERFORMANCE --> PKG_AUDIT
    PKG_PERFORMANCE --> PKG_NOTIFICATION

    PKG_INTEGRATION --> PKG_PAYROLL
    PKG_INTEGRATION --> PKG_EMPLOYEE
    PKG_INTEGRATION --> PKG_COMMON

    PKG_REPORTING --> PKG_EMPLOYEE
    PKG_REPORTING --> PKG_PAYROLL
    PKG_REPORTING --> PKG_COMMON

    linkStyle 7 stroke:red,stroke-width:3
    linkStyle 11 stroke:red,stroke-width:3
```

### Circular Dependency Detail

```mermaid
graph LR
    A["PKG_EMPLOYEE<br/>create_employee()"] -- "calls create_salary_record()" --> B["PKG_PAYROLL<br/>create_salary_record()"]
    B -- "calls is_active()" --> A
    style A fill:#ffcccc
    style B fill:#ffcccc
```

**Resolution in target architecture**: Use Spring Application Events. `EmployeeService` publishes a `NewEmployeeEvent`; `PayrollService` subscribes and creates the salary record asynchronously.

---

## 3. Forms → Package Call Graph

Which Forms modules call which PL/SQL packages.

```mermaid
graph TD
    subgraph "Forms Modules"
        F_LOGIN[HRMS_LOGIN]
        F_MENU[HRMS_MENU]
        F_EMP[HRMS_EMPLOYEE]
        F_LEAVE[HRMS_LEAVE]
        F_PAY[HRMS_PAYROLL]
        F_PERF[HRMS_PERFORMANCE]
    end

    subgraph "Libraries"
        L_COMMON[HRMS_COMMON_LIB]
        L_VALID[HRMS_VALIDATION_LIB]
    end

    subgraph "Packages"
        P_SEC[PKG_SECURITY]
        P_EMP[PKG_EMPLOYEE]
        P_PAY[PKG_PAYROLL]
        P_LV[PKG_LEAVE]
        P_PERF[PKG_PERFORMANCE]
        P_COM[PKG_COMMON]
        P_VAL[PKG_VALIDATION]
        P_AUD[PKG_AUDIT]
        P_NOTIF[PKG_NOTIFICATION]
    end

    F_LOGIN --> P_SEC
    F_MENU --> P_SEC

    F_EMP --> P_EMP
    F_EMP --> P_PAY
    F_EMP --> P_VAL
    F_EMP --> L_VALID
    F_EMP --> L_COMMON

    F_LEAVE --> P_LV
    F_LEAVE --> P_EMP
    F_LEAVE --> L_VALID
    F_LEAVE --> L_COMMON

    F_PAY --> P_PAY
    F_PAY --> L_COMMON

    F_PERF --> P_PERF
    F_PERF --> L_COMMON

    L_COMMON --> P_COM
    L_COMMON --> P_SEC
    L_VALID --> P_VAL

    P_EMP --> P_AUD
    P_EMP --> P_NOTIF
    P_PAY --> P_AUD
    P_PAY --> P_NOTIF
    P_LV --> P_AUD
    P_LV --> P_NOTIF
    P_PERF --> P_AUD
    P_PERF --> P_NOTIF
```

---

## 4. Database Table Relationships (ERD)

Domain-grouped entity relationships.

```mermaid
erDiagram
    DEPARTMENTS ||--o{ EMPLOYEES : "employs"
    DEPARTMENTS ||--o{ DEPARTMENTS : "parent_of"
    LOCATIONS ||--o{ EMPLOYEES : "hosts"
    JOB_GRADES ||--o{ JOB_TITLES : "salary_range"
    JOB_TITLES ||--o{ EMPLOYEES : "assigned"
    EMPLOYEES ||--o{ EMPLOYEES : "manages"

    EMPLOYEES ||--o{ EMPLOYEE_HISTORY : "tracks_changes"
    EMPLOYEES ||--o{ EMPLOYEE_DEPENDENTS : "has_dependents"
    EMPLOYEES ||--o{ EMERGENCY_CONTACTS : "emergency"

    EMPLOYEES ||--o{ SALARY_RECORDS : "compensation"
    EMPLOYEES ||--o{ EMPLOYEE_PAY_ELEMENTS : "pay_config"
    EMPLOYEES ||--o{ EMPLOYEE_TAX_INFO : "tax_filing"
    EMPLOYEES ||--o{ EMPLOYEE_BANK_ACCOUNTS : "direct_deposit"
    PAY_ELEMENTS ||--o{ EMPLOYEE_PAY_ELEMENTS : "element_def"
    PAY_ELEMENTS ||--o{ PAYROLL_DETAILS : "pay_line"
    PAY_PERIODS ||--o{ PAYROLL_RUNS : "period"
    PAYROLL_RUNS ||--o{ PAYROLL_DETAILS : "run_detail"
    EMPLOYEES ||--o{ PAYROLL_DETAILS : "employee_pay"

    EMPLOYEES ||--o{ LEAVE_BALANCES : "leave_bal"
    EMPLOYEES ||--o{ LEAVE_REQUESTS : "leave_req"
    EMPLOYEES ||--o{ LEAVE_ACCRUAL_LOG : "accrual"
    LEAVE_TYPES ||--o{ LEAVE_BALANCES : "type_bal"
    LEAVE_TYPES ||--o{ LEAVE_REQUESTS : "type_req"
    LEAVE_TYPES ||--o{ LEAVE_ACCRUAL_LOG : "type_accrual"

    REVIEW_CYCLES ||--o{ PERFORMANCE_REVIEWS : "cycle"
    EMPLOYEES ||--o{ PERFORMANCE_REVIEWS : "reviewed"
    PERFORMANCE_REVIEWS ||--o{ PERFORMANCE_GOALS : "goals"
    EMPLOYEES ||--o{ PERFORMANCE_GOALS : "owns"

    EMPLOYEES ||--o{ USER_SESSIONS : "sessions"
```

---

## 5. Batch Job / Scheduler Flow

All `DBMS_SCHEDULER`-triggered batch processes and their timing.

```mermaid
graph TB
    subgraph "DBMS_SCHEDULER"
        SCHED_5M["Every 5 min"]
        SCHED_MONTH["Monthly (1st)"]
        SCHED_NIGHT["Nightly"]
        SCHED_PAYRUN["Per Payroll Run"]
        SCHED_WEEK["Weekly"]
    end

    SCHED_5M --> NOTIF_PROC["PKG_NOTIFICATION<br/>.process_queue"]
    SCHED_MONTH --> LEAVE_ACC["PKG_LEAVE<br/>.run_monthly_accrual"]
    SCHED_NIGHT --> RPT_REF["PKG_REPORTING<br/>.refresh_reporting_tables"]
    SCHED_PAYRUN --> GL_GEN["PKG_INTEGRATION<br/>.generate_gl_journal"]
    SCHED_WEEK --> BEN_FEED["PKG_INTEGRATION<br/>.export_benefits_feed"]

    NOTIF_PROC --> NOTIF_Q[(NOTIFICATION_QUEUE)]
    NOTIF_PROC --> UTL_MAIL["UTL_MAIL<br/>(SMTP Server)"]
    LEAVE_ACC --> LB[(LEAVE_BALANCES)]
    LEAVE_ACC --> LAL[(LEAVE_ACCRUAL_LOG)]
    RPT_REF --> RPT_TABLES["Denormalized<br/>Reporting Tables"]
    GL_GEN --> UTL_FILE_GL["UTL_FILE<br/>→ GL Flat File"]
    BEN_FEED --> UTL_FILE_BEN["UTL_FILE<br/>→ ADP Feed File"]

    style UTL_MAIL fill:#ffe0b2
    style UTL_FILE_GL fill:#ffe0b2
    style UTL_FILE_BEN fill:#ffe0b2
```

---

## 6. External Integration Data Flow

```mermaid
graph LR
    subgraph "HRMS Database"
        PR[(PAYROLL_RUNS<br/>PAYROLL_DETAILS)]
        EMP[(EMPLOYEES<br/>SALARY_RECORDS)]
        TA_STAGE["Staging Tables"]
    end

    subgraph "PKG_INTEGRATION"
        GL_PROC[generate_gl_journal]
        BEN_PROC[export_benefits_feed]
        TA_PROC[import_time_attendance]
        SYNC_PROC[sync_org_structure]
    end

    subgraph "External Systems"
        GL_SYS["General Ledger<br/>(ERP)"]
        ADP_SYS["ADP Benefits<br/>Provider"]
        TA_SYS["Time &<br/>Attendance"]
        ORG_SYS["Org Structure<br/>(Directory)"]
    end

    PR --> GL_PROC
    GL_PROC -- "UTL_FILE<br/>fixed-width flat file" --> GL_SYS

    EMP --> BEN_PROC
    BEN_PROC -- "UTL_FILE + FTP<br/>ADP vendor format" --> ADP_SYS

    TA_SYS -- "CSV file drop<br/>UTL_FILE pickup" --> TA_PROC
    TA_PROC --> TA_STAGE

    ORG_SYS <-- "DB link / flat file" --> SYNC_PROC

    style GL_SYS fill:#c8e6c9
    style ADP_SYS fill:#c8e6c9
    style TA_SYS fill:#c8e6c9
    style ORG_SYS fill:#c8e6c9
```

---

## 7. User Authentication & Session Flow

```mermaid
sequenceDiagram
    participant User
    participant HRMS_LOGIN as HRMS_LOGIN Form
    participant PKG_SEC as PKG_SECURITY
    participant EMPLOYEES as EMPLOYEES Table
    participant SESSIONS as USER_SESSIONS Table
    participant PKG_EMP as PKG_EMPLOYEE
    participant PKG_AUD as PKG_AUDIT

    User->>HRMS_LOGIN: Enter username + password
    HRMS_LOGIN->>PKG_SEC: authenticate(username, password, ip)
    PKG_SEC->>EMPLOYEES: SELECT EMP_ID WHERE UPPER(EMAIL) = UPPER(username)

    alt Employee not found
        PKG_SEC-->>HRMS_LOGIN: RAISE -20301 Invalid credentials
    end

    Note over PKG_SEC: No account lockout (TD-002)
    Note over PKG_SEC: MD5 hash comparison (TD-001)

    PKG_SEC->>SESSIONS: INSERT new session (ACTIVE)
    PKG_SEC->>PKG_EMP: set_session_context(username, emp_id)
    PKG_SEC->>PKG_AUD: log_action(USER_SESSIONS, session_id, INSERT)
    PKG_SEC-->>HRMS_LOGIN: Return session_id

    HRMS_LOGIN->>User: Navigate to HRMS_MENU

    Note over User,PKG_SEC: Session timeout: 30 min (DB server time)
    Note over User,PKG_SEC: No session refresh on activity
```

---

## 8. Leave Request Workflow

```mermaid
stateDiagram-v2
    [*] --> PENDING : submit_leave_request()
    PENDING --> APPROVED : approve_leave_request()
    PENDING --> REJECTED : reject_leave_request()
    PENDING --> CANCELLED : cancel_leave_request()
    APPROVED --> CANCELLED : cancel_leave_request()
    APPROVED --> TAKEN : (date passes)

    state PENDING {
        note right of PENDING
            - Validates employee active
            - Checks leave type & tenure
            - Calculates business days
            - Checks overlap (BUG: ignores half-day)
            - Checks balance
            - Updates PENDING in LEAVE_BALANCES
            - Notifies manager
        end note
    }

    state APPROVED {
        note right of APPROVED
            - Moves PENDING → USED in balance
            - Notifies employee
        end note
    }

    state CANCELLED {
        note right of CANCELLED
            - Restores balance (PENDING or USED)
        end note
    }
```

---

## 9. Payroll Processing Pipeline

```mermaid
flowchart TD
    A["create_payroll_run(period_id)"] --> B["STATUS = PENDING"]
    B --> C["calculate_payroll(run_id)"]
    C --> D["STATUS = CALCULATING"]
    D --> E{"For each<br/>active employee"}

    E --> F["calculate_employee_pay()"]
    F --> G["Get annual salary"]
    G --> H["Compute period gross"]
    H --> I["calculate_federal_tax()"]
    I --> J["calculate_state_tax()"]
    J --> K["calculate_fica()"]
    K --> L["calculate_medicare()"]
    L --> M["Process deductions<br/>& benefits"]
    M --> N["Insert PAYROLL_DETAILS"]
    N --> O{"Every 50 employees"}

    O -- "Yes" --> P["COMMIT<br/>(partial — BUG TD-011)"]
    O -- "No" --> E

    P --> E

    E -- "All done" --> Q["Update run totals"]
    Q --> R{"Errors?"}
    R -- "Yes" --> S["STATUS = ERROR"]
    R -- "No" --> T["STATUS = CALCULATED"]
    T --> U["approve_payroll(run_id)"]
    U --> V["STATUS = APPROVED"]
    V --> W["generate_gl_journal(run_id)"]

    style P fill:#ffcdd2
    style S fill:#ffcdd2
```

---

## 10. Module Migration Order (Strangler Fig)

```mermaid
gantt
    title Migration Execution Order
    dateFormat  YYYY-MM-DD
    axisFormat  Week %W

    section Phase 1 - Foundation
    Security / Auth (PKG_SECURITY)       :a1, 2025-03-17, 2w

    section Phase 2 - Core Entity
    Employee (PKG_EMPLOYEE + Form)       :a2, after a1, 4w

    section Phase 3 - Self-Contained
    Leave (PKG_LEAVE + Form)             :a3, after a2, 3w

    section Phase 4 - Complex
    Payroll (PKG_PAYROLL + Form)         :a4, after a3, 5w

    section Phase 5 - Lower Risk
    Performance (PKG_PERFORMANCE + Form) :a5, after a4, 3w

    section Phase 6 - Reporting
    Reports (PKG_REPORTING)              :a6, after a5, 2w

    section Phase 7 - Integration
    Integration (PKG_INTEGRATION)        :a7, after a5, 3w
```

### Dependency Chain Rationale

```mermaid
graph TD
    SEC["Security<br/>(Foundation)"] --> EMP["Employee<br/>(Core Entity)"]
    EMP --> LEAVE["Leave<br/>(Self-contained)"]
    EMP --> PAY["Payroll<br/>(Complex logic)"]
    EMP --> PERF["Performance<br/>(Lower risk)"]
    PAY --> RPT["Reports<br/>(Reads all)"]
    PAY --> INT["Integration<br/>(External systems)"]
    PERF --> RPT
    LEAVE --> RPT

    style SEC fill:#c8e6c9
    style EMP fill:#fff9c4
    style PAY fill:#ffcdd2
    style LEAVE fill:#bbdefb
    style PERF fill:#bbdefb
    style RPT fill:#e1bee7
    style INT fill:#e1bee7
```

| Color | Meaning |
|---|---|
| Green | Foundation — no upstream dependencies |
| Yellow | Core entity — most other modules depend on this |
| Blue | Medium complexity — can migrate in parallel after Employee |
| Red | Highest complexity — payroll has the most business logic and bugs |
| Purple | Support modules — migrate last, read from all others |
