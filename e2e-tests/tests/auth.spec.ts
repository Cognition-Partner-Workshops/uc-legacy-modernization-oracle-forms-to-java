import { test, expect } from '../fixtures/test-fixtures';
import users from '../test-data/users.json';

/**
 * Authentication & Security Tests
 *
 * Migrated from: UFT test script for PKG_SECURITY / HRMS_LOGIN form
 * Scenario file: test-harness/scenarios/security-auth.yaml
 *
 * UFT legacy equivalent:
 *   SystemUtil.Run "chrome.exe", "https://app.com/login"
 *   Browser("HRMS").Page("Login").WebEdit("email").Set "admin@test.com"
 *   Browser("HRMS").Page("Login").WebEdit("password").SetSecure "encrypted"
 *   Browser("HRMS").Page("Login").WebButton("Sign In").Click
 *   Browser("HRMS").Page("Dashboard").Sync
 *   If Browser("HRMS").Page("Dashboard").WebElement("welcome").Exist(10) Then
 *     Reporter.ReportEvent micPass, "Login", "Success"
 *   Else
 *     Reporter.ReportEvent micFail, "Login", "Failed"
 *   End If
 *
 * Playwright conversion:
 *   - SystemUtil.Run → page.goto()
 *   - WebEdit.Set → locator.fill()
 *   - SetSecure → process.env.PASSWORD
 *   - WebButton.Click → locator.click()
 *   - Browser.Sync → auto-wait (built-in)
 *   - .Exist(10) → expect().toBeVisible()
 *   - Reporter.ReportEvent → expect() assertions (auto-retry)
 */
test.describe('Authentication', () => {
  test('should login with valid admin credentials', async ({ loginPage, page }) => {
    await loginPage.goto();
    await loginPage.login(users.adminUser.username, users.adminUser.password);

    // Replaces: Browser("HRMS").Page("Dashboard").Sync + .Exist(10)
    await expect(page).toHaveURL(/dashboard/);
    await expect(page.getByText('Welcome')).toBeVisible();
  });

  test('should reject invalid password', async ({ loginPage }) => {
    await loginPage.goto();
    await loginPage.login(
      users.invalidCredentials[0].username,
      users.invalidCredentials[0].password
    );

    // Replaces: If .Exist Then Reporter.ReportEvent micFail ...
    await expect(loginPage.errorMessage).toBeVisible();
  });

  test('should reject non-existent user', async ({ loginPage }) => {
    await loginPage.goto();
    await loginPage.login(
      users.invalidCredentials[1].username,
      users.invalidCredentials[1].password
    );

    await expect(loginPage.errorMessage).toBeVisible();
  });

  test('should reject empty credentials', async ({ loginPage }) => {
    await loginPage.goto();
    await loginPage.login(
      users.invalidCredentials[2].username,
      users.invalidCredentials[2].password
    );

    // Form validation should prevent submission or show error
    await expect(loginPage.errorMessage).toBeVisible();
  });

  test('should logout successfully', async ({ authenticatedPage }) => {
    // authenticatedPage fixture handles login (replaces UFT Recovery Scenario)
    await authenticatedPage.logout();

    // Replaces: Browser("HRMS").Page("Login").Exist(10)
    await expect(authenticatedPage.page).toHaveURL(/login/);
  });

  /**
   * Data-driven login test
   *
   * Replaces UFT DataTable-driven approach:
   *   For i = 1 To DataTable.GetRowCount
   *     DataTable.SetCurrentRow(i)
   *     Browser("HRMS").Page("Login").WebEdit("email").Set DataTable("username", dtGlobalSheet)
   *     ...
   *   Next
   */
  for (const cred of users.invalidCredentials) {
    test(`should reject login: ${cred.description}`, async ({ loginPage }) => {
      await loginPage.goto();
      await loginPage.login(cred.username, cred.password);

      await expect(loginPage.errorMessage).toBeVisible();
    });
  }
});

test.describe('Authorization', () => {
  test('should redirect unauthenticated users to login', async ({ page }) => {
    // Replaces: Browser("HRMS").Navigate "https://app.com/employees"
    await page.goto('/employees');

    // Should redirect to login page
    await expect(page).toHaveURL(/login/);
  });

  test('should show admin navigation options for admin user', async ({ authenticatedPage }) => {
    // Admin should see payroll and all modules
    await expect(authenticatedPage.payrollLink).toBeVisible();
    await expect(authenticatedPage.employeesLink).toBeVisible();
    await expect(authenticatedPage.leaveLink).toBeVisible();
  });
});
