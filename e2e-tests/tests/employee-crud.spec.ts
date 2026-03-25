import { test, expect } from '../fixtures/test-fixtures';
import employeeData from '../test-data/employees.json';
import { generateTestEmail } from '../utils/test-helpers';

/**
 * Employee CRUD Tests
 *
 * Migrated from: UFT test script for PKG_EMPLOYEE / HRMS_EMPLOYEE form
 * Scenario file: test-harness/scenarios/employee-crud.yaml
 *
 * UFT legacy flow:
 *   1. Create: Insert mode → fill fields → Save → verify EMP_NUMBER generated
 *   2. Read:   Query mode → search by ID → verify fields populated
 *   3. Update: Transfer department → verify dept changed
 *   4. Search: Execute query → check row count and data
 *   5. Delete: Terminate → verify status changed to TERMINATED
 *
 * Key UFT-to-Playwright conversions applied:
 *   - WebEdit("field").Set value → getByLabel('Field').fill(value)
 *   - WebList("dept").Select → getByLabel('Dept').selectOption()
 *   - WebButton("Save").Click → getByRole('button', { name: 'Save' }).click()
 *   - WebTable("results").RowCount → locator('table tbody tr').count()
 *   - WebTable("results").GetCellData(r,c) → locator('tr').nth(r).locator('td').nth(c).textContent()
 *   - GetROProperty("value") → locator.inputValue()
 *   - Reporter.ReportEvent → expect() assertions
 *   - Wait / .Exist → auto-wait (removed)
 */
test.describe('Employee CRUD Operations', () => {
  test.beforeEach(async ({ loginPage }) => {
    /**
     * Login before each test
     * Replaces: UFT Recovery Scenario that ensures user is logged in
     */
    await loginPage.goto();
    await loginPage.loginAndWaitForDashboard(
      process.env.ADMIN_USERNAME || 'james.richardson@company.com',
      process.env.ADMIN_PASSWORD || 'test_password_123'
    );
  });

  test('should create a new employee', async ({ employeePage }) => {
    await employeePage.goto();

    // Use unique email to avoid conflicts
    const testEmployee = {
      ...employeeData.newEmployee,
      email: generateTestEmail('jane.testsmith'),
    };

    /**
     * Create employee via form
     *
     * UFT equivalent:
     *   Browser("HRMS").Page("Employee").WebButton("Add").Click
     *   Browser("HRMS").Page("Employee").WebEdit("first_name").Set "JANE"
     *   Browser("HRMS").Page("Employee").WebEdit("last_name").Set "TESTSMITH"
     *   Browser("HRMS").Page("Employee").WebEdit("email").Set "jane.testsmith@company.com"
     *   Browser("HRMS").Page("Employee").WebEdit("hire_date").Set "06/01/2024"
     *   Browser("HRMS").Page("Employee").WebList("department").Select "#31"
     *   Browser("HRMS").Page("Employee").WebList("job_title").Select "#50"
     *   Browser("HRMS").Page("Employee").WebEdit("salary").Set "75000"
     *   Browser("HRMS").Page("Employee").WebButton("Save").Click
     */
    await employeePage.createEmployee(testEmployee);

    // Verify creation — Replaces: Reporter.ReportEvent micPass/micFail
    await expect(employeePage.successMessage).toBeVisible();

    // Verify employee number generated (EMP-*)
    // Replaces: GetROProperty("innertext") check with regex
    await expect(employeePage.employeeNumber).toHaveText(/EMP-\d+/);

    // Verify employment status is ACTIVE
    await expect(employeePage.employmentStatus).toHaveText('ACTIVE');
  });

  test('should display employee details after creation', async ({ employeePage }) => {
    await employeePage.goto();

    // Search for existing employee
    await employeePage.searchEmployee('TESTSMITH');

    /**
     * Verify search results
     * Replaces:
     *   rowCount = WebTable("results").RowCount
     *   If rowCount >= 1 Then Reporter.ReportEvent micPass, ...
     */
    const rowCount = await employeePage.getTableRowCount();
    expect(rowCount).toBeGreaterThanOrEqual(1);

    // Click to view details
    await employeePage.selectEmployeeByName('TESTSMITH');

    // Verify detail view shows correct data
    // Replaces: Standard Checkpoint on each field
    await expect(employeePage.page.getByText('JANE')).toBeVisible();
    await expect(employeePage.page.getByText('TESTSMITH')).toBeVisible();
  });

  test('should transfer employee to a new department', async ({ employeePage }) => {
    await employeePage.goto();
    await employeePage.searchEmployee('TESTSMITH');
    await employeePage.selectEmployeeByName('TESTSMITH');

    /**
     * Transfer employee
     *
     * UFT equivalent:
     *   Browser("HRMS").Page("Employee").WebButton("Transfer").Click
     *   Browser("HRMS").Page("Transfer").WebList("new_dept").Select "#32"
     *   Browser("HRMS").Page("Transfer").WebEdit("effective_date").Set "09/01/2024"
     *   Browser("HRMS").Page("Transfer").WebEdit("reason").Set "Reorganization"
     *   Browser("HRMS").Page("Transfer").WebButton("Confirm").Click
     */
    await employeePage.transferEmployee(
      employeeData.transferData.newDeptId,
      employeeData.transferData.effectiveDate,
      employeeData.transferData.reason
    );

    await expect(employeePage.successMessage).toBeVisible();
  });

  test('should terminate an employee', async ({ employeePage }) => {
    await employeePage.goto();
    await employeePage.searchEmployee('TESTSMITH');
    await employeePage.selectEmployeeByName('TESTSMITH');

    /**
     * Terminate employee
     *
     * UFT equivalent:
     *   Browser("HRMS").Page("Employee").WebButton("Terminate").Click
     *   Browser("HRMS").Page("Terminate").WebEdit("termination_date").Set "12/31/2024"
     *   Browser("HRMS").Page("Terminate").WebList("reason").Select "VOLUNTARY"
     *   Browser("HRMS").Page("Terminate").WebButton("Confirm").Click
     */
    await employeePage.terminateEmployee(
      employeeData.terminationData.terminationDate,
      employeeData.terminationData.reason
    );

    // Verify status changed to TERMINATED
    await expect(employeePage.employmentStatus).toHaveText('TERMINATED');
  });

  /**
   * Data-driven search tests
   *
   * Replaces UFT DataTable-driven search:
   *   For i = 1 To DataTable.GetRowCount
   *     DataTable.SetCurrentRow(i)
   *     searchTerm = DataTable("searchTerm", dtGlobalSheet)
   *     expectedCount = DataTable("expectedMinResults", dtGlobalSheet)
   *     Browser("HRMS").Page("Employee").WebEdit("search").Set searchTerm
   *     Browser("HRMS").Page("Employee").WebButton("Search").Click
   *     actualCount = Browser("HRMS").Page("Employee").WebTable("results").RowCount - 1
   *     If actualCount >= expectedCount Then
   *       Reporter.ReportEvent micPass, "Search", "Found " & actualCount
   *     End If
   *   Next
   */
  for (const searchTest of employeeData.searchTests) {
    test(`should search employees: "${searchTest.searchTerm}"`, async ({ employeePage }) => {
      await employeePage.goto();
      await employeePage.searchEmployee(searchTest.searchTerm);

      const rowCount = await employeePage.getTableRowCount();

      if (searchTest.expectedMinResults > 0) {
        expect(rowCount).toBeGreaterThanOrEqual(searchTest.expectedMinResults);
      } else {
        // Verify empty results or no-data message
        expect(rowCount).toBe(0);
      }
    });
  }

  test('should validate required fields on create', async ({ employeePage }) => {
    await employeePage.goto();

    /**
     * Validation test — submit with missing first name
     *
     * Replaces: UFT form validation check
     *   Browser("HRMS").Page("Employee").WebButton("Add").Click
     *   Browser("HRMS").Page("Employee").WebEdit("first_name").Set ""
     *   Browser("HRMS").Page("Employee").WebButton("Save").Click
     *   If Browser("HRMS").Page("Employee").WebElement("error").Exist Then
     *     Reporter.ReportEvent micPass, "Validation", "Error shown"
     *   End If
     */
    const invalidData = employeeData.validationTests.missingFirstName;
    await employeePage.createEmployee(invalidData);

    // Validation error should appear
    await expect(employeePage.validationErrors).toBeVisible();
  });

  test('should validate email format', async ({ employeePage }) => {
    await employeePage.goto();

    const invalidData = employeeData.validationTests.invalidEmail;
    await employeePage.createEmployee(invalidData);

    await expect(employeePage.validationErrors).toBeVisible();
  });

  test('should validate salary is positive', async ({ employeePage }) => {
    await employeePage.goto();

    const invalidData = employeeData.validationTests.negativeSalary;
    await employeePage.createEmployee(invalidData);

    await expect(employeePage.validationErrors).toBeVisible();
  });
});

test.describe('Employee Table Operations', () => {
  test.beforeEach(async ({ loginPage }) => {
    await loginPage.goto();
    await loginPage.loginAndWaitForDashboard(
      process.env.ADMIN_USERNAME || 'james.richardson@company.com',
      process.env.ADMIN_PASSWORD || 'test_password_123'
    );
  });

  test('should display employee list with data', async ({ employeePage }) => {
    await employeePage.goto();

    /**
     * Verify table has rows
     *
     * Replaces:
     *   rowCount = Browser("HRMS").Page("Employee").WebTable("results").RowCount
     *   If rowCount > 1 Then  ' >1 to skip header
     *     Reporter.ReportEvent micPass, "Table", "Has data"
     *   End If
     */
    await expect(employeePage.employeeTable).toBeVisible();
    const rowCount = await employeePage.getTableRowCount();
    expect(rowCount).toBeGreaterThan(0);
  });

  test('should filter employees by status', async ({ employeePage }) => {
    await employeePage.goto();

    /**
     * Filter by ACTIVE status
     * Replaces: WebList("status_filter").Select "Active"
     */
    await employeePage.statusFilter.selectOption('ACTIVE');

    // All visible rows should show ACTIVE status
    const rowCount = await employeePage.getTableRowCount();
    for (let i = 0; i < rowCount; i++) {
      const statusCell = employeePage.employeeRows.nth(i).locator('[data-testid="status-cell"]');
      await expect(statusCell).toHaveText('ACTIVE');
    }
  });
});
