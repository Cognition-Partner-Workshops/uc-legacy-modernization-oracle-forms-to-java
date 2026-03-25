# Legacy Modernization: Oracle Forms to Java

This repository supports the **Oracle Forms to Java** modernization use case. It provides migration planning artifacts, a target Java Spring Boot application structure, and a test harness for validating functional equivalence between the legacy Oracle Forms/PL/SQL system and its modernized Java counterpart.

## Source System

The legacy system is an Oracle Forms 11g/12c **HR Management System (HRMS)** with:
- 18 Oracle Forms modules (.fmb)
- 12 PL/SQL packages (~15,000 lines)
- 42 database tables
- 200+ form triggers
- External integrations (GL feed, benefits provider, time & attendance)

See: [ts-plsql-oracle-forms-legacy-codebase](https://github.com/Cognition-Partner-Workshops/ts-plsql-oracle-forms-legacy-codebase)

## Repository Structure

```
├── MIGRATION_NOTES.md                # Documents translation decisions, bug fixes, and what's not yet migrated
│
├── migration-plan/
│   ├── assessment-report.md          # Legacy system assessment findings
│   ├── migration-strategy.md         # Chosen strategy and rationale
│   ├── component-mapping.md          # Forms/PL/SQL → Java mapping
│   ├── risk-register.md              # Identified risks and mitigations
│   ├── timeline.md                   # Phase-based migration timeline
│   └── decision-log.md              # Key architectural decisions (ADRs)
│
├── java-target/
│   ├── pom.xml                       # Maven project configuration
│   ├── src/
│   │   ├── main/
│   │   │   ├── java/com/hrms/
│   │   │   │   ├── HrmsApplication.java
│   │   │   │   ├── employee/         # ✅ Employee module — MIGRATED (see below)
│   │   │   │   ├── payroll/          # Payroll module (stub — pending migration)
│   │   │   │   ├── leave/            # Leave module (stub — pending migration)
│   │   │   │   ├── security/         # Auth module (stub — pending migration)
│   │   │   │   └── common/           # Shared utilities (stub — pending migration)
│   │   │   └── resources/
│   │   │       ├── application.yml
│   │   │       └── db/migration/     # Flyway migrations
│   │   └── test/
│   │       └── java/com/hrms/        # Unit and integration tests
│   └── docker-compose.yml            # Local dev with Oracle XE or PostgreSQL
│
├── test-harness/
│   ├── README.md                     # How to run equivalence tests
│   ├── scenarios/                    # Business scenario definitions
│   │   ├── employee-crud.yaml
│   │   ├── payroll-calculation.yaml
│   │   ├── leave-workflow.yaml
│   │   └── security-auth.yaml
│   └── comparators/                  # Output comparison utilities
│       └── result-comparator.py
│
└── docs/
    ├── architecture-overview.md      # Target architecture diagram
    ├── api-design.md                 # REST API design for migrated system
    └── data-migration.md             # Database migration approach
```

## Employee Module (Migrated)

The employee module has been migrated from `PKG_EMPLOYEE` (967 lines of PL/SQL) + `HRMS_EMPLOYEE` Oracle Form + `HRMS_VALIDATION_LIB` PLL to Spring Boot. See [`MIGRATION_NOTES.md`](MIGRATION_NOTES.md) for full details.

### Components

| Java Component | Replaces | Purpose |
|---|---|---|
| `EmployeeServiceImpl` | PKG_EMPLOYEE body | Full CRUD, search, terminate, transfer, org chart |
| `EmployeeController` | HRMS_EMPLOYEE form | REST API with 8 endpoints |
| `EmployeeRepository` | Direct SQL in PKG_EMPLOYEE | Spring Data JPA with Specifications |
| `EmployeeSpecifications` | Dynamic SQL in search_employees | Type-safe JPA Criteria queries |
| `Employee` | EMPLOYEES table + Forms data block | JPA entity with validation |
| `EmployeeServiceImplTest` | — | 11 unit tests validating parity with legacy |

### REST API

| Method | Endpoint | Legacy Equivalent |
|---|---|---|
| `POST` | `/api/employees` | `PKG_EMPLOYEE.create_employee` |
| `PUT` | `/api/employees/{id}` | `PKG_EMPLOYEE.update_employee` |
| `GET` | `/api/employees/{id}` | `PKG_EMPLOYEE.get_employee` |
| `GET` | `/api/employees?name=&deptId=&...` | `PKG_EMPLOYEE.search_employees` |
| `POST` | `/api/employees/{id}/terminate` | `PKG_EMPLOYEE.terminate_employee` |
| `POST` | `/api/employees/{id}/transfer` | `PKG_EMPLOYEE.transfer_employee` |
| `GET` | `/api/employees/{id}/org-chart` | `PKG_EMPLOYEE.get_org_chart` |
| `GET` | `/api/employees/{id}/direct-reports` | `PKG_EMPLOYEE.get_direct_reports` |

### Bugs Fixed During Migration

| Issue | Severity | Legacy Location | Fix |
|---|---|---|---|
| SQL injection in search | Critical | PKG_EMPLOYEE.pkb line 442-499 | JPA Specifications (parameterized queries) |
| Race condition in emp number generation | High | PKG_EMPLOYEE.pkb line 37-55 | Sequence-derived emp number from DB-assigned ID |
| Circular dependency with PKG_PAYROLL | Medium | PKG_EMPLOYEE ↔ PKG_PAYROLL | Decoupled via service design (Spring Events) |
| Client/server validation drift | Medium | HRMS_VALIDATION_LIB vs PKG_VALIDATION | Unified Jakarta Bean Validation annotations |

## Migration Approach

### Strategy: Strangler Fig Pattern

The recommended migration strategy uses the **Strangler Fig** pattern:

1. **Phase 1 — Understand**: Analyze the legacy system, document business rules embedded in PL/SQL and Forms triggers, identify technical debt
2. **Phase 2 — Plan**: Map components to Java equivalents, design REST APIs, plan database migration from Oracle-specific features to portable SQL
3. **Phase 3 — Safeguard**: Build test harness capturing current system behavior as executable specifications
4. **Phase 4 — Execute**: Migrate module by module (Employee → Leave → Payroll → Performance), routing traffic through an API gateway

### Key Migration Decisions

| Legacy Component | Target Technology | Rationale |
|---|---|---|
| Oracle Forms UI | React + TypeScript | Modern SPA, component reusability |
| PL/SQL packages | Spring Boot services | Industry standard, testable, portable |
| Oracle DB procedures | JPA/Hibernate + service layer | ORM for CRUD, native SQL for complex queries |
| Forms triggers | Spring validation + events | Declarative validation, event-driven architecture |
| UTL_FILE integrations | Spring Integration / Apache Camel | Robust integration patterns |
| Oracle Reports | JasperReports or API-driven | Self-service reporting |
| DBMS_SCHEDULER jobs | Spring Batch | Managed batch processing |

### Technical Debt Addressed During Migration

The legacy system contains intentional technical debt that this migration resolves:

- **Race condition** in employee number generation → Sequence-backed ID generation
- **SQL injection** in search → Parameterized queries via JPA
- **MD5 password hashing** → BCrypt via Spring Security
- **Circular package dependencies** → Clean dependency injection
- **Cursor-loop payroll processing** → Batch processing with Spring Batch
- **Hard-coded tax brackets** → Externalized configuration
- **Client/server validation drift** → Single validation layer with Bean Validation

## Workshop Usage

This repo is used in the **Oracle Forms Modernization Workshop**, specifically:

| Lab | Module | Focus |
|---|---|---|
| Lab 1 | System Understanding | Analyze the legacy codebase, map dependencies |
| Lab 2 | Migration Planning | Create migration strategy, component mapping |
| Lab 3 | Test Harness | Build equivalence tests for critical business logic |
| Lab 4 | Forms-to-Java Migration | Migrate Employee module end-to-end |

## Getting Started

```bash
# Clone both repos
git clone https://github.com/Cognition-Partner-Workshops/ts-plsql-oracle-forms-legacy-codebase.git
git clone https://github.com/Cognition-Partner-Workshops/uc-legacy-modernization-oracle-forms-to-java.git

# Review the legacy system
cd ts-plsql-oracle-forms-legacy-codebase
# Start with README.md, then explore schema/, plsql/, forms/

# Work through migration planning
cd ../uc-legacy-modernization-oracle-forms-to-java
# Start with migration-plan/assessment-report.md
```

## License

MIT
