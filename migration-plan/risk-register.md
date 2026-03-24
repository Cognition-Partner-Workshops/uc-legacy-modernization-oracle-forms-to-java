# Risk Register

## Migration Risks

| ID | Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|---|
| R-001 | Undocumented business rules in Forms triggers | High | High | Thorough code analysis in Phase 1; build test harness before migrating |
| R-002 | Data integrity issues during dual-running period | Medium | Critical | Implement data reconciliation checks; use event sourcing for sync |
| R-003 | Performance regression in Java vs PL/SQL for bulk operations | Medium | High | Benchmark critical paths; use Spring Batch for payroll; profile early |
| R-004 | Integration partner (ADP) format changes during migration | Low | Medium | Abstract integration layer; implement adapter pattern |
| R-005 | Knowledge loss — key PL/SQL developers leave during migration | Medium | High | Document everything in Phase 1; pair programming during Phase 4 |
| R-006 | Scope creep — adding new features during migration | High | Medium | Strict feature freeze on new functionality; only bug fixes in legacy |
| R-007 | Oracle-specific SQL incompatible with target DB | Medium | Medium | Catalog Oracle-specific features early; test with PostgreSQL in CI |
| R-008 | User resistance to new UI | Medium | Medium | Involve users in UAT; maintain familiar workflow patterns |
| R-009 | Circular dependency between PKG_EMPLOYEE and PKG_PAYROLL | Low | Low | Break dependency with event-based communication in Java |
| R-010 | Tax calculation migration introduces rounding differences | Medium | High | Use BigDecimal; compare penny-for-penny against legacy output |
