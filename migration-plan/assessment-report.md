# Legacy System Assessment Report

## Executive Summary

This document captures the assessment findings for the Oracle Forms 11g/12c HR Management System (HRMS). The system has been in production for approximately 15 years, serving ~200 concurrent users across 3 regional offices. The assessment identifies modernization drivers, technical risks, and recommended migration approach.

## System Overview

| Attribute | Value |
|---|---|
| Platform | Oracle Forms 12c (12.2.1.4) on Oracle Database 19c |
| Age | ~15 years (original deployment ~2009, Forms upgrade in 2018) |
| Users | ~200 concurrent, ~800 total named users |
| Lines of Code | ~15,000 (PL/SQL) + ~12,000 (Forms triggers/PLL) |
| Database Objects | 42 tables, 15 views, 35+ sequences, 12 packages, 50+ triggers |
| Forms Modules | 18 .fmb files, 2 .pll libraries, 1 .mmb menu module |
| Integrations | GL feed (flat file), benefits provider (ADP format), time & attendance (CSV) |
| Deployment | Oracle Application Server (OAS) / WebLogic |

## Modernization Drivers

1. **End of Extended Support**: Oracle Forms 12c extended support ending; no viable in-place upgrade path
2. **Developer Shortage**: Increasingly difficult to hire Oracle Forms/PL/SQL developers
3. **User Experience**: Java applet-based UI no longer acceptable; browser plugin deprecation
4. **Integration Limitations**: File-based integrations (UTL_FILE) are brittle and hard to monitor
5. **Testing Gap**: No automated test suite; all testing is manual
6. **Deployment Rigidity**: Monolithic deployment; changes require full Forms recompilation

## Technical Debt Inventory

### Critical (Must Address During Migration)

| ID | Category | Location | Description | Risk |
|---|---|---|---|---|
| TD-001 | Security | PKG_SECURITY.hash_password | MD5 password hashing | Data breach |
| TD-002 | Security | PKG_SECURITY.authenticate | No account lockout | Brute force attacks |
| TD-003 | Security | PKG_SECURITY body | Hard-coded encryption key | Key compromise |
| TD-004 | Security | PKG_EMPLOYEE.search_employees | SQL injection via string concatenation | Data exfiltration |
| TD-005 | Security | HRMS_LOGIN form | Password transmitted in cleartext | Credential theft |

### High (Should Address During Migration)

| ID | Category | Location | Description | Impact |
|---|---|---|---|---|
| TD-010 | Data Integrity | PKG_EMPLOYEE.generate_emp_number | Race condition (no SELECT FOR UPDATE) | Duplicate employee numbers |
| TD-011 | Data Integrity | PKG_PAYROLL.calculate_payroll | Partial commits every 50 employees | Half-calculated payroll on failure |
| TD-012 | Data Integrity | PKG_LEAVE.process_carryover | Double-subtraction if run twice | Incorrect leave balances |
| TD-013 | Performance | PKG_PAYROLL (cursor loop) | Row-by-row processing instead of bulk collect | Slow payroll runs |
| TD-014 | Performance | VW_ORG_HIERARCHY | Recursive CONNECT BY with >500 employees | Timeout on org chart |
| TD-015 | Maintainability | PKG_EMPLOYEE ↔ PKG_PAYROLL | Circular package dependency | Compilation order issues |

### Medium (Address Opportunistically)

| ID | Category | Location | Description |
|---|---|---|---|
| TD-020 | Correctness | PKG_PAYROLL.calculate_federal_tax | Hard-coded 2024 tax brackets instead of table lookup |
| TD-021 | Correctness | PKG_PAYROLL overtime calculation | Doesn't account for holidays |
| TD-022 | Correctness | PKG_LEAVE overlap detection | Doesn't handle half-day requests |
| TD-023 | Correctness | PKG_LEAVE holiday detection | Only checks exact date, not observed dates |
| TD-024 | Maintainability | PKG_NOTIFICATION | Hard-coded SMTP configuration |
| TD-025 | Maintainability | PKG_NOTIFICATION | HTML email templates as string constants |
| TD-026 | Maintainability | HRMS_VALIDATION_LIB | Client/server validation drift |
| TD-027 | Performance | PKG_NOTIFICATION | No rate limiting on bulk notifications |

## Dependency Map

```
HRMS_LOGIN ──→ PKG_SECURITY
     │
     ▼
HRMS_MENU ──→ PKG_SECURITY
     │
     ├──→ HRMS_EMPLOYEE ──→ PKG_EMPLOYEE ──→ PKG_COMMON, PKG_AUDIT
     │         │                    ↕ (circular)
     │         │              PKG_PAYROLL ──→ PKG_COMMON, PKG_AUDIT
     │         │
     │         └──→ PKG_VALIDATION
     │
     ├──→ HRMS_PAYROLL ──→ PKG_PAYROLL ──→ PKG_COMMON, PKG_AUDIT
     │
     ├──→ HRMS_LEAVE ──→ PKG_LEAVE ──→ PKG_COMMON, PKG_NOTIFICATION
     │
     └──→ HRMS_PERFORMANCE ──→ PKG_PERFORMANCE ──→ PKG_COMMON, PKG_NOTIFICATION

Shared Libraries:
  HRMS_COMMON_LIB.pll ──→ PKG_COMMON, PKG_SECURITY (attached to all forms)
  HRMS_VALIDATION_LIB.pll ──→ PKG_VALIDATION (attached to data-entry forms)

Batch/Integration:
  DBMS_SCHEDULER ──→ PKG_NOTIFICATION.process_queue (every 5 min)
  DBMS_SCHEDULER ──→ PKG_LEAVE.run_monthly_accrual (monthly)
  DBMS_SCHEDULER ──→ PKG_REPORTING.refresh_reporting_tables (nightly)
  DBMS_SCHEDULER ──→ PKG_INTEGRATION.generate_gl_journal (per payroll run)
  DBMS_SCHEDULER ──→ PKG_INTEGRATION.export_benefits_feed (weekly)
```

## Recommendations

1. **Migration Strategy**: Strangler Fig pattern — migrate module by module behind an API gateway
2. **Migration Order**: Security → Employee → Leave → Payroll → Performance → Reports → Integration
3. **Target Stack**: Java 17 + Spring Boot 3 + React (TypeScript) + PostgreSQL (or retain Oracle DB)
4. **Timeline**: 4-phase approach over 12-18 months (see timeline.md)
5. **Test Harness**: Build before migrating — capture current behavior as executable specifications
