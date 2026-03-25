import { test, expect } from '../fixtures/test-fixtures';

/**
 * Navigation & Dashboard Tests
 *
 * Migrated from: UFT test script for main HRMS navigation
 *
 * UFT legacy:
 *   Browser("HRMS").Page("Dashboard").Link("Employees").Click
 *   Browser("HRMS").Sync
 *   If Browser("HRMS").Page("Employees").Exist(10) Then
 *     Reporter.ReportEvent micPass, "Navigation", "Employee page loaded"
 *   End If
 *
 * Key conversions:
 *   - Link("text").Click → getByRole('link', { name: 'text' }).click()
 *   - Browser.Sync → removed (auto-wait)
 *   - .Exist(10) → expect().toHaveURL() with auto-retry
 *   - Page title check → expect(page).toHaveTitle()
 */
test.describe('Dashboard Navigation', () => {
  test.beforeEach(async ({ loginPage }) => {
    await loginPage.goto();
    await loginPage.loginAndWaitForDashboard(
      process.env.ADMIN_USERNAME || 'james.richardson@company.com',
      process.env.ADMIN_PASSWORD || 'test_password_123'
    );
  });

  test('should display welcome message on dashboard', async ({ dashboardPage }) => {
    /**
     * Replaces:
     *   If Browser("HRMS").Page("Dashboard").WebElement("welcome").Exist(10) Then
     *     Reporter.ReportEvent micPass, "Dashboard", "Welcome message shown"
     *   End If
     */
    await expect(dashboardPage.welcomeMessage).toBeVisible();
  });

  test('should navigate to Employees module', async ({ dashboardPage }) => {
    /**
     * Replaces:
     *   Browser("HRMS").Page("Dashboard").Link("Employees").Click
     *   Browser("HRMS").Sync
     *   Page Checkpoint — title contains "Employees"
     */
    await dashboardPage.goToEmployees();
    await expect(dashboardPage.page).toHaveURL(/employees/);
  });

  test('should navigate to Leave module', async ({ dashboardPage }) => {
    await dashboardPage.goToLeave();
    await expect(dashboardPage.page).toHaveURL(/leave/);
  });

  test('should navigate to Payroll module', async ({ dashboardPage }) => {
    await dashboardPage.goToPayroll();
    await expect(dashboardPage.page).toHaveURL(/payroll/);
  });

  test('should navigate to Performance module', async ({ dashboardPage }) => {
    await dashboardPage.goToPerformance();
    await expect(dashboardPage.page).toHaveURL(/performance/);
  });

  test('should perform quick search from dashboard', async ({ dashboardPage }) => {
    /**
     * Quick search
     *
     * UFT equivalent:
     *   Browser("HRMS").Page("Dashboard").WebEdit("search").Set "Richardson"
     *   Set WshShell = CreateObject("WScript.Shell")
     *   WshShell.SendKeys "{ENTER}"
     *
     * Playwright: fill() + keyboard.press('Enter')
     */
    await dashboardPage.quickSearch('Richardson');
    await expect(dashboardPage.page).toHaveURL(/search|employees/);
  });
});
