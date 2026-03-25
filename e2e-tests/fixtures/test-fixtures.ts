import { test as base } from '@playwright/test';
import { LoginPage } from '../pages/LoginPage';
import { DashboardPage } from '../pages/DashboardPage';
import { EmployeePage } from '../pages/EmployeePage';
import { LeavePage } from '../pages/LeavePage';
import { PayrollPage } from '../pages/PayrollPage';
import { PerformancePage } from '../pages/PerformancePage';

/**
 * Custom Playwright Fixtures
 *
 * Replaces: UFT Action parameters + Environment variables + shared state
 *
 * In UFT, shared state was passed via:
 *   - Action parameters (input/output)
 *   - Environment("key") variables
 *   - DataTable global/local sheets
 *
 * In Playwright, fixtures provide:
 *   - Dependency injection of page objects
 *   - Automatic setup/teardown
 *   - Shared state via test.use()
 */
type HrmsFixtures = {
  loginPage: LoginPage;
  dashboardPage: DashboardPage;
  employeePage: EmployeePage;
  leavePage: LeavePage;
  payrollPage: PayrollPage;
  performancePage: PerformancePage;
  authenticatedPage: DashboardPage;
};

export const test = base.extend<HrmsFixtures>({
  loginPage: async ({ page }, use) => {
    await use(new LoginPage(page));
  },

  dashboardPage: async ({ page }, use) => {
    await use(new DashboardPage(page));
  },

  employeePage: async ({ page }, use) => {
    await use(new EmployeePage(page));
  },

  leavePage: async ({ page }, use) => {
    await use(new LeavePage(page));
  },

  payrollPage: async ({ page }, use) => {
    await use(new PayrollPage(page));
  },

  performancePage: async ({ page }, use) => {
    await use(new PerformancePage(page));
  },

  /**
   * Pre-authenticated page fixture
   *
   * Replaces: UFT Recovery Scenario that re-logs in on session expiry
   * Automatically logs in before the test and provides a DashboardPage
   */
  authenticatedPage: async ({ page }, use) => {
    const loginPage = new LoginPage(page);
    await loginPage.goto();
    await loginPage.loginAndWaitForDashboard(
      process.env.ADMIN_USERNAME || 'james.richardson@company.com',
      process.env.ADMIN_PASSWORD || 'test_password_123'
    );
    await use(new DashboardPage(page));
  },
});

export { expect } from '@playwright/test';
