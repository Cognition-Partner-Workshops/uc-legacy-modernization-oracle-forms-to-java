# HRMS E2E Tests — Playwright

End-to-end tests for the modernized HRMS application, migrated from UFT/QTP (VBScript) to Playwright (TypeScript).

## Migration Reference

This test suite was created following the **UFT to Playwright Conversion Guide**. Key mappings applied:

| UFT Concept | Playwright Equivalent |
|---|---|
| Object Repository (.tsr) | Page Object Model (`pages/`) |
| Reusable Actions | POM class methods |
| DataTable (.xls) | JSON test data (`test-data/`) |
| Recovery Scenarios | `test.afterEach()` + fixtures |
| Environment vars (env.xml) | `.env` + `process.env` |
| Test.tsp (settings) | `playwright.config.ts` |
| Function Libraries (.qfl) | Utility modules (`utils/`) |
| Reporter.ReportEvent | `expect()` assertions |
| Wait / Exist | Auto-wait (built-in) |
| SetSecure | `process.env.PASSWORD` |

## Project Structure

```
e2e-tests/
├── tests/                    # Test specifications
│   ├── auth.spec.ts          # Authentication & authorization
│   ├── employee-crud.spec.ts # Employee CRUD operations
│   ├── leave-workflow.spec.ts# Leave request workflow
│   ├── payroll.spec.ts       # Payroll processing
│   └── navigation.spec.ts   # Dashboard & navigation
├── pages/                    # Page Object Model (replaces .tsr)
│   ├── LoginPage.ts
│   ├── DashboardPage.ts
│   ├── EmployeePage.ts
│   ├── LeavePage.ts
│   ├── PayrollPage.ts
│   └── PerformancePage.ts
├── fixtures/
│   └── test-fixtures.ts      # Custom fixtures (replaces Action params)
├── test-data/                # Test data (replaces DataTable .xls)
│   ├── employees.json
│   ├── users.json
│   ├── leave-requests.json
│   └── payroll.json
├── utils/                    # Utilities (replaces .qfl libraries)
│   ├── api-helpers.ts
│   └── test-helpers.ts
├── playwright.config.ts      # Config (replaces Test.tsp)
├── .env.example              # Environment vars (replaces env.xml)
└── tsconfig.json
```

## Setup

```bash
cd e2e-tests
npm install
npx playwright install
```

## Configuration

Copy `.env.example` to `.env` and update values:

```bash
cp .env.example .env
```

## Running Tests

```bash
# Run all tests
npm test

# Run specific browser
npm run test:chromium

# Run in headed mode (visible browser)
npm run test:headed

# Run with trace for debugging
npm run test:trace

# View HTML report
npm run report
```

## Test Scenarios

Tests mirror the business scenarios defined in `test-harness/scenarios/`:

| Test File | Scenario | Legacy Equivalent |
|---|---|---|
| `auth.spec.ts` | Login, logout, authorization | `security-auth.yaml` / PKG_SECURITY |
| `employee-crud.spec.ts` | Create, read, transfer, terminate | `employee-crud.yaml` / PKG_EMPLOYEE |
| `leave-workflow.spec.ts` | Submit, approve, cancel leave | `leave-workflow.yaml` / PKG_LEAVE |
| `payroll.spec.ts` | Create run, calculate, approve | `payroll-calculation.yaml` / PKG_PAYROLL |
| `navigation.spec.ts` | Dashboard navigation | HRMS_MAIN form navigation |
