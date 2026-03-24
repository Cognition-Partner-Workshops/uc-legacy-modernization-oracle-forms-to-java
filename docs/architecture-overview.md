# Target Architecture Overview

## Architecture Style: Modular Monolith

The modernized HRMS uses a modular monolith architecture — a single deployable application with clear module boundaries enforced by Java packages and interfaces. This provides the organizational benefits of microservices (independent module development, clear contracts) without the operational complexity.

## High-Level Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    React Frontend (SPA)                   │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌────────────┐ │
│  │ Employee  │ │ Payroll  │ │  Leave   │ │ Performance│ │
│  │  Module   │ │  Module  │ │  Module  │ │   Module   │ │
│  └──────────┘ └──────────┘ └──────────┘ └────────────┘ │
└────────────────────────┬────────────────────────────────┘
                         │ REST API (JSON)
┌────────────────────────┴────────────────────────────────┐
│              Spring Boot Application                     │
│                                                          │
│  ┌─────────────────────────────────────────────────────┐ │
│  │                  API Layer                           │ │
│  │  EmployeeController  PayrollController  LeaveCtrl   │ │
│  └──────────────────────┬──────────────────────────────┘ │
│                         │                                │
│  ┌──────────────────────┴──────────────────────────────┐ │
│  │                Service Layer                         │ │
│  │  EmployeeService  PayrollService  LeaveService      │ │
│  │  SecurityService  NotificationService  ReportSvc    │ │
│  └──────────────────────┬──────────────────────────────┘ │
│                         │                                │
│  ┌──────────────────────┴──────────────────────────────┐ │
│  │              Data Access Layer                       │ │
│  │  Spring Data JPA Repositories                       │ │
│  │  Flyway Migrations                                  │ │
│  └──────────────────────┬──────────────────────────────┘ │
│                         │                                │
│  ┌──────────────────────┴──────────────────────────────┐ │
│  │           Cross-Cutting Concerns                     │ │
│  │  Spring Security (JWT)  Spring Batch  Events        │ │
│  │  Validation  Audit  Exception Handling              │ │
│  └─────────────────────────────────────────────────────┘ │
└────────────────────────┬────────────────────────────────┘
                         │
              ┌──────────┴──────────┐
              │   Oracle Database   │
              │   (or PostgreSQL)   │
              └─────────────────────┘
```

## Module Dependencies

```
Security ← Employee ← Leave
                ↑
            Payroll ← Integration
                ↑
          Performance

Common (shared by all)
Notification (shared by Leave, Performance)
Reporting (reads from all)
```

Note: The circular dependency between PKG_EMPLOYEE and PKG_PAYROLL in the legacy system
is broken by using Spring Application Events. EmployeeService publishes events;
PayrollService subscribes to them.

## Technology Stack

| Layer | Technology | Replaces |
|---|---|---|
| Frontend | React 18 + TypeScript | Oracle Forms UI (.fmb) |
| API | Spring Boot 3 + Spring MVC | Forms → PL/SQL calls |
| Security | Spring Security + JWT | PKG_SECURITY + Forms session |
| Data | Spring Data JPA + Flyway | Direct SQL + PL/SQL packages |
| Batch | Spring Batch | DBMS_SCHEDULER + cursor loops |
| Integration | Spring Integration | UTL_FILE + flat files |
| Testing | JUnit 5 + Testcontainers | Manual testing only |
| Build | Maven + GitHub Actions | Manual deployment |
