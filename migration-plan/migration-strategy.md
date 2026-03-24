# Migration Strategy

## Chosen Approach: Strangler Fig Pattern

### Why Strangler Fig?

The Strangler Fig pattern allows incremental migration of the Oracle Forms HRMS system while keeping the legacy system operational. New functionality is built in the target stack (Java/Spring Boot) and traffic is gradually routed from the legacy system to the new one.

**Rejected alternatives:**
- **Big Bang Rewrite**: Too risky for a business-critical system with 200+ users
- **Lift and Shift**: Doesn't address technical debt or platform concerns
- **Re-platform (Forms to APEX)**: Still Oracle-dependent; doesn't solve developer shortage

### Migration Phases

#### Phase 1: Understand (Weeks 1-3)
- Analyze legacy codebase: forms, packages, triggers, views, integrations
- Document business rules embedded in PL/SQL and Forms triggers
- Map data flows and integration points
- Identify hidden business logic in form-level triggers

#### Phase 2: Plan (Weeks 4-6)
- Design target architecture (microservices vs modular monolith)
- Create component mapping (Forms → REST API + React)
- Design database migration strategy
- Establish coding standards and project structure
- Plan integration migration approach

#### Phase 3: Safeguard (Weeks 7-10)
- Build test harness capturing current system behavior
- Define business scenarios as executable specifications
- Create data comparison utilities
- Establish performance benchmarks

#### Phase 4: Execute (Weeks 11-24+)
- Migrate module by module in this order:
  1. **Security/Auth** (PKG_SECURITY → Spring Security): Foundation for all other modules
  2. **Employee** (PKG_EMPLOYEE + HRMS_EMPLOYEE → Employee Service): Core entity, most dependencies
  3. **Leave** (PKG_LEAVE + HRMS_LEAVE → Leave Service): Self-contained, good validation target
  4. **Payroll** (PKG_PAYROLL + HRMS_PAYROLL → Payroll Service): Complex business logic, batch processing
  5. **Performance** (PKG_PERFORMANCE + HRMS_PERFORMANCE → Performance Service): Lower risk
  6. **Reports** (PKG_REPORTING + Oracle Reports → Reporting Service): Can run in parallel
  7. **Integration** (PKG_INTEGRATION → Spring Integration): Last, as it touches external systems

### Component Mapping

| Legacy | Target | Notes |
|---|---|---|
| Oracle Forms UI (.fmb) | React + TypeScript SPA | Component per form tab page |
| PL/SQL Package Spec (.pks) | Java Service Interface | 1:1 package → service mapping |
| PL/SQL Package Body (.pkb) | Java Service Implementation | Business logic migration |
| Forms Triggers | Spring Events + Bean Validation | Decouple validation from UI |
| PLL Libraries | Shared Java utilities | Common formatting, validation |
| Oracle Reports (.rdf) | REST API + React dashboard | Self-service reporting |
| UTL_FILE integration | Spring Integration channels | File → API where possible |
| DBMS_SCHEDULER jobs | Spring Batch + @Scheduled | Managed batch processing |

### Database Strategy

**Option A: Retain Oracle Database** (lower risk)
- Keep Oracle DB, migrate PL/SQL logic to Java
- Use Spring Data JPA for CRUD operations
- Use native SQL for complex queries (payroll calculations)
- Migrate Oracle-specific features (CONNECT BY → recursive CTE) gradually

**Option B: Migrate to PostgreSQL** (higher value)
- Full platform independence
- Requires data migration and SQL dialect translation
- Use Flyway for version-controlled migrations
- Oracle → PostgreSQL type mappings well-documented

**Recommendation**: Start with Option A, plan for Option B as a follow-on project.
