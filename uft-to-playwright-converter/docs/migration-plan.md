# UFT to Playwright Migration Plan (800 Scripts)

## Executive Summary

This document outlines the plan to migrate 800 UFT (Unified Functional Testing) VBScript test scripts to Playwright TypeScript tests using the automated converter tool in this project. The approach combines automated conversion with manual review to achieve a high-quality, maintainable Playwright test suite.

---

## Phase 1: Discovery & Assessment (Week 1-2)

### 1.1 Inventory Collection
- Export all 800 UFT scripts from ALM/file system
- Export all Object Repositories (shared and local)
- Export DataTable files and external test data
- Document the application URLs and environments

### 1.2 Automated Analysis
Run the analyzer across all scripts:
```bash
npx uft2playwright analyze --input ./uft-scripts --output ./analysis-output
```

This produces:
- **Complexity distribution**: How many scripts are low/medium/high/very-high complexity
- **Object type inventory**: Which UFT object types are used and how frequently
- **Unsupported patterns**: Desktop objects, COM automation, etc. that need manual handling
- **Effort estimate**: Total hours needed for the full migration
- **Conversion confidence**: Expected automated conversion success rate

### 1.3 Script Categorization

| Category | Criteria | Expected Count | Approach |
|---|---|---|---|
| **Auto-convertible** | Web-only, standard objects, >80% confidence | ~500 (62%) | Fully automated |
| **Semi-auto** | Web + some unsupported patterns, 40-80% confidence | ~200 (25%) | Auto-convert + manual fix |
| **Manual** | Desktop/COM/SAP objects, <40% confidence | ~60 (8%) | Rewrite from scratch |
| **Deprecate** | Obsolete, redundant, or no longer relevant | ~40 (5%) | Archive and skip |

### 1.4 Questionnaire Completion
Complete the discovery questionnaire (`docs/migration-questionnaire.md`) with the QA team covering:
- Application architecture and authentication
- UFT script structure and conventions
- Data sources and environments
- Team skills and timeline

---

## Phase 2: Infrastructure Setup (Week 2-3)

### 2.1 Playwright Project Setup
```bash
# Initialize converted project
mkdir playwright-tests && cd playwright-tests
npm init playwright@latest
```

### 2.2 Environment Configuration
- Configure base URLs for all test environments
- Set up test credential management (environment variables)
- Configure CI/CD pipeline (GitHub Actions / Azure DevOps / Jenkins)
- Set up Playwright reporting (HTML report, JUnit for CI)

### 2.3 Page Object Architecture
Define the Page Object structure based on application screens:
```
tests/
  pages/
    login.page.ts
    dashboard.page.ts
    employee-list.page.ts
    employee-form.page.ts
    leave.page.ts
    payroll.page.ts
    ...
  fixtures/
    test-data.ts
    auth.fixture.ts
  specs/
    auth/
    employee/
    leave/
    payroll/
```

### 2.4 Custom Mapping Overrides
Create `mapping-overrides.yaml` for project-specific selector mappings:
- Map UFT object names to actual HTML selectors (IDs, data-testid, etc.)
- This is the single most impactful step for conversion accuracy

---

## Phase 3: Batch Conversion (Week 3-6)

### 3.1 Conversion Execution Strategy

Process scripts in batches of 50-100, organized by module:

| Batch | Module | Scripts | Priority |
|---|---|---|---|
| 1 | Authentication/Login | ~30 | Critical |
| 2 | Employee CRUD | ~120 | Critical |
| 3 | Employee Search/Reports | ~80 | High |
| 4 | Leave Management | ~100 | High |
| 5 | Payroll Processing | ~90 | High |
| 6 | Performance Reviews | ~60 | Medium |
| 7 | Administration/Config | ~50 | Medium |
| 8 | Integration/API | ~70 | Medium |
| 9 | Edge Cases/Negative | ~100 | Low |
| 10 | Remaining/Misc | ~100 | Low |

### 3.2 Per-Batch Workflow

For each batch:

```bash
# 1. Convert the batch
npx uft2playwright convert \
  --input ./uft-scripts/batch-N \
  --output ./playwright-output/batch-N \
  --config ./config/project-config.yaml

# 2. Review the conversion report
open ./playwright-output/batch-N/reports/conversion-report.html

# 3. Copy successful conversions to main project
cp ./playwright-output/batch-N/tests/*.spec.ts ./playwright-tests/tests/specs/module/

# 4. Fix partial conversions (TODO items)
# Search for TODO comments and fix manually

# 5. Run tests
npx playwright test tests/specs/module/ --reporter=html

# 6. Fix failures and iterate
```

### 3.3 Quality Gates Per Batch
- All scripts must compile without TypeScript errors
- At minimum 70% of tests should pass on first run
- All TODO comments must be resolved before moving to next batch
- Page Objects must be consolidated (no duplicates)

---

## Phase 4: Manual Conversion & Refinement (Week 5-8)

### 4.1 Handle Semi-Auto Scripts
For scripts with partial conversion:
- Review and fix TODO comments
- Replace `SetSecure` with actual test credentials
- Replace hard-coded waits with Playwright auto-waiting
- Fix selector issues using browser DevTools
- Convert DataTable references to test data fixtures

### 4.2 Handle Manual-Only Scripts
For scripts that cannot be auto-converted:
- Analyze the original UFT script behavior
- Write new Playwright tests from scratch using Page Objects
- Focus on business logic, not UI mechanics

### 4.3 Consolidate Page Objects
- Merge auto-generated Page Objects with manual ones
- Remove duplicates
- Add missing selectors
- Verify all selectors work against the application

### 4.4 Test Data Migration
- Convert UFT DataTable Excel files to JSON/TypeScript fixtures
- Create Playwright fixtures for shared test data
- Set up test data seeding/cleanup via API calls

---

## Phase 5: Validation & Stabilization (Week 7-10)

### 5.1 Full Suite Execution
```bash
# Run full suite across all browsers
npx playwright test --reporter=html

# Run with retries for flaky tests
npx playwright test --retries=3
```

### 5.2 Flaky Test Resolution
- Identify flaky tests from retry analysis
- Replace timeouts with proper wait conditions
- Add error recovery mechanisms
- Use `test.describe.configure({ mode: 'serial' })` for order-dependent tests

### 5.3 Performance Optimization
- Enable parallel execution where possible
- Use `test.describe.parallel()` for independent test groups
- Optimize test data setup with API calls instead of UI setup
- Use `storageState` for authentication reuse

### 5.4 CI/CD Integration
```yaml
# Example GitHub Actions workflow
name: Playwright Tests
on: [push, pull_request]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
      - run: npm ci
      - run: npx playwright install --with-deps
      - run: npx playwright test
      - uses: actions/upload-artifact@v4
        if: always()
        with:
          name: playwright-report
          path: playwright-report/
```

---

## Phase 6: Decommission UFT (Week 10-12)

### 6.1 Parallel Run Period
- Run both UFT and Playwright suites in parallel for 2 weeks
- Compare results to ensure functional equivalence
- Resolve any discrepancies

### 6.2 Cutover
- Switch CI/CD to use Playwright tests
- Archive UFT scripts (do not delete)
- Decommission UFT licenses
- Update team documentation

### 6.3 Knowledge Transfer
- Conduct Playwright training for QA team
- Document Playwright conventions and best practices
- Create onboarding guide for new team members

---

## Effort Estimates

| Phase | Duration | Team Size | Total Hours |
|---|---|---|---|
| Discovery & Assessment | 2 weeks | 2 people | 80 |
| Infrastructure Setup | 1 week | 2 people | 40 |
| Batch Conversion (Auto) | 3 weeks | 3 people | 240 |
| Manual Conversion | 3 weeks | 4 people | 320 |
| Validation & Stabilization | 3 weeks | 3 people | 240 |
| Decommission | 2 weeks | 2 people | 80 |
| **Total** | **~12 weeks** | **3-4 people** | **~1,000 hours** |

Note: The automated converter reduces the manual effort from ~3,000 hours to ~1,000 hours (67% reduction).

---

## Risk Register

| Risk | Impact | Probability | Mitigation |
|---|---|---|---|
| Application UI changes during migration | High | Medium | Freeze UI changes or coordinate timing |
| Test data inconsistencies | Medium | High | Standardize test data management early |
| Selector instability | Medium | High | Use data-testid attributes; coordinate with dev team |
| Team skill gap (TypeScript/Playwright) | Medium | Medium | Schedule training in Phase 1 |
| UFT scripts with undocumented behavior | High | Medium | Involve SMEs in manual review |
| Environment access issues | Medium | Low | Set up VPN/credentials in Phase 2 |
| Flaky tests post-conversion | Medium | High | Budget stabilization time; use retries |

---

## Success Metrics

| Metric | Target |
|---|---|
| Scripts converted | 95% (760/800) |
| Automated conversion rate | 60%+ fully automated |
| Test pass rate (post-conversion) | 90%+ on first full run |
| Average conversion confidence | 75%+ |
| Execution time reduction | 40%+ faster than UFT |
| CI/CD integration | Tests run on every PR |
| Team independence | No UFT dependency within 12 weeks |
