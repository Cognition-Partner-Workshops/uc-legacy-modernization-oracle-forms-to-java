# Migration Timeline

## Overview

Total estimated duration: 12-18 months (workshop exercises focus on the first 6 weeks)

## Phase 1: Understand (Weeks 1-3)

| Week | Activities | Deliverables |
|---|---|---|
| 1 | Legacy code analysis — schema, packages, dependencies | Dependency map, code metrics report |
| 2 | Business rule extraction — Forms triggers, PL/SQL logic | Business rules catalog |
| 3 | Integration mapping — file feeds, batch jobs, external systems | Integration inventory, data flow diagrams |

## Phase 2: Plan (Weeks 4-6)

| Week | Activities | Deliverables |
|---|---|---|
| 4 | Architecture design — target stack, module boundaries, API design | Architecture overview, API specification |
| 5 | Component mapping — Forms/PL/SQL → Java/React equivalents | Component mapping document |
| 6 | Migration planning — ordering, risk register, timeline | Migration plan, risk register |

## Phase 3: Safeguard (Weeks 7-10)

| Week | Activities | Deliverables |
|---|---|---|
| 7-8 | Test harness development — scenario definitions, comparators | Business scenario test suite |
| 9 | Performance baseline — benchmark critical operations | Performance baseline report |
| 10 | Infrastructure setup — CI/CD pipeline, dev environments | Running pipeline, dev/staging environments |

## Phase 4: Execute (Weeks 11-24+)

| Weeks | Module | Complexity | Dependencies |
|---|---|---|---|
| 11-12 | Security/Auth | Medium | None (foundation) |
| 13-16 | Employee | High | Security |
| 17-19 | Leave | Medium | Security, Employee |
| 20-24 | Payroll | Very High | Security, Employee |
| 25-27 | Performance | Medium | Security, Employee |
| 28-30 | Reports | Low | All modules |
| 31-33 | Integration | Medium | Payroll, Employee |

## Post-Migration (Months 10-18)

- Legacy system decommission planning
- Database platform migration (Oracle → PostgreSQL) if desired
- Performance optimization based on production metrics
- Feature development on new platform
