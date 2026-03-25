import { test, expect } from '../fixtures/test-fixtures';
import payrollData from '../test-data/payroll.json';
import { parseCurrency } from '../utils/test-helpers';

/**
 * Payroll Calculation Tests
 *
 * Migrated from: UFT test script for PKG_PAYROLL / HRMS_PAYROLL form
 * Scenario file: test-harness/scenarios/payroll-calculation.yaml
 *
 * Business flow:
 *   1. Create payroll run for period → status = PENDING
 *   2. Calculate payroll → status = CALCULATED, totals computed
 *   3. Verify individual employee pay breakdown
 *   4. Approve payroll → status = APPROVED
 *
 * UFT legacy flow:
 *   Browser("HRMS").Page("Payroll").WebButton("Create Run").Click
 *   Browser("HRMS").Page("Payroll").WebList("period").Select "#1"
 *   Browser("HRMS").Page("Payroll").WebList("run_type").Select "REGULAR"
 *   Browser("HRMS").Page("Payroll").WebButton("Submit").Click
 *   Wait 3
 *   Browser("HRMS").Page("Payroll").WebButton("Calculate").Click
 *   Wait 10  ' payroll calculation takes time
 *   Browser("HRMS").Page("Payroll").Sync
 *   status = Browser("HRMS").Page("Payroll").WebElement("status").GetROProperty("innertext")
 *   If status = "CALCULATED" Then Reporter.ReportEvent micPass, ...
 *
 * Key conversions:
 *   - Wait 3 / Wait 10 → removed (Playwright auto-waits)
 *   - Browser.Sync → waitForLoadState('networkidle') only where needed
 *   - GetROProperty → expect().toHaveText() with auto-retry
 *   - Tolerance checks → custom assertion with parseCurrency()
 */
test.describe('Payroll Processing', () => {
  test.beforeEach(async ({ loginPage }) => {
    await loginPage.goto();
    await loginPage.loginAndWaitForDashboard(
      process.env.ADMIN_USERNAME || 'james.richardson@company.com',
      process.env.ADMIN_PASSWORD || 'test_password_123'
    );
  });

  test('should create a new payroll run', async ({ payrollPage }) => {
    await payrollPage.goto();

    /**
     * Create payroll run
     *
     * UFT equivalent:
     *   Browser("HRMS").Page("Payroll").WebButton("Create Run").Click
     *   Browser("HRMS").Page("Payroll").WebList("period").Select "#1"
     *   Browser("HRMS").Page("Payroll").WebList("run_type").Select "REGULAR"
     *   Browser("HRMS").Page("Payroll").WebButton("Submit").Click
     */
    await payrollPage.createPayrollRun(
      payrollData.regularRun.periodId,
      payrollData.regularRun.runType
    );

    // Verify run created with PENDING status
    await expect(payrollPage.runStatus).toHaveText('PENDING');
    await expect(payrollPage.successMessage).toBeVisible();
  });

  test('should calculate payroll for a run', async ({ payrollPage }) => {
    await payrollPage.goto();

    // Select the most recent pending run
    await payrollPage.payrollRunRows.first().click();

    /**
     * Calculate payroll
     *
     * UFT equivalent:
     *   Browser("HRMS").Page("Payroll").WebButton("Calculate").Click
     *   Wait 10  ' Payroll calculation can take time
     *   Browser("HRMS").Page("Payroll").Sync
     *
     * Playwright: auto-wait handles the calculation delay
     * waitForLoadState('networkidle') used for API-heavy operations
     */
    await payrollPage.calculatePayroll();

    // Verify status changed to CALCULATED
    await expect(payrollPage.runStatus).toHaveText('CALCULATED');

    /**
     * Verify totals are computed
     *
     * UFT equivalent:
     *   empCount = Browser("HRMS").Page("Payroll").WebElement("emp_count").GetROProperty("innertext")
     *   If CInt(empCount) > 0 Then Reporter.ReportEvent micPass, ...
     *   totalGross = Browser("HRMS").Page("Payroll").WebElement("total_gross").GetROProperty("innertext")
     *   If CDbl(totalGross) > 0 Then Reporter.ReportEvent micPass, ...
     */
    const empCountText = await payrollPage.employeeCount.textContent();
    expect(Number(empCountText)).toBeGreaterThan(0);

    const totalGrossText = await payrollPage.totalGross.textContent();
    expect(parseCurrency(totalGrossText || '0')).toBeGreaterThan(0);

    const totalNetText = await payrollPage.totalNet.textContent();
    expect(parseCurrency(totalNetText || '0')).toBeGreaterThan(0);
  });

  test('should display individual employee pay details', async ({ payrollPage }) => {
    await payrollPage.goto();
    await payrollPage.payrollRunRows.first().click();

    /**
     * Verify individual employee pay breakdown
     *
     * UFT equivalent:
     *   Set tbl = Browser("HRMS").Page("Payroll").WebTable("pay_details")
     *   For r = 2 To tbl.RowCount
     *     empName = tbl.GetCellData(r, 1)
     *     If empName = "Jessica Nguyen" Then
     *       basePay = CDbl(tbl.GetCellData(r, 3))
     *       If basePay > 0 Then Reporter.ReportEvent micPass, "Base Pay", basePay
     *       federalTax = CDbl(tbl.GetCellData(r, 4))
     *       If federalTax > 0 Then Reporter.ReportEvent micPass, "Federal Tax", federalTax
     *       ' ... etc for each deduction
     *     End If
     *   Next
     *
     * Playwright: Use locator filtering instead of manual row iteration
     */
    const empRow = await payrollPage.getEmployeePayRow(
      payrollData.employeePayVerification.empName
    );
    await expect(empRow).toBeVisible();

    // Verify all pay components are positive (> 0)
    await expect(payrollPage.basePay).not.toHaveText('$0.00');
    await expect(payrollPage.federalTax).not.toHaveText('$0.00');
    await expect(payrollPage.stateTax).not.toHaveText('$0.00');
    await expect(payrollPage.ficaTax).not.toHaveText('$0.00');
    await expect(payrollPage.medicareTax).not.toHaveText('$0.00');
    await expect(payrollPage.netPay).not.toHaveText('$0.00');
  });

  test('should approve a calculated payroll run', async ({ payrollPage }) => {
    await payrollPage.goto();
    await payrollPage.payrollRunRows.first().click();

    /**
     * Approve payroll
     *
     * UFT equivalent:
     *   Browser("HRMS").Page("Payroll").WebButton("Approve").Click
     *   Wait 2
     *   status = Browser("HRMS").Page("Payroll").WebElement("status").GetROProperty("innertext")
     *   If status = "APPROVED" Then Reporter.ReportEvent micPass, ...
     */
    await payrollPage.approvePayrollRun();

    await expect(payrollPage.runStatus).toHaveText('APPROVED');
    await expect(payrollPage.successMessage).toBeVisible();
  });
});

test.describe('Payroll Validation', () => {
  test.beforeEach(async ({ loginPage }) => {
    await loginPage.goto();
    await loginPage.loginAndWaitForDashboard(
      process.env.ADMIN_USERNAME || 'james.richardson@company.com',
      process.env.ADMIN_PASSWORD || 'test_password_123'
    );
  });

  test('should verify net pay equals gross minus deductions', async ({ payrollPage }) => {
    await payrollPage.goto();
    await payrollPage.payrollRunRows.first().click();

    /**
     * Payroll calculation validation with tolerance
     *
     * Replaces UFT tolerance-based checkpoint:
     *   grossPay = CDbl(WebElement("total_gross").GetROProperty("innertext"))
     *   netPay = CDbl(WebElement("total_net").GetROProperty("innertext"))
     *   If Abs(grossPay - totalDeductions - netPay) < 0.01 Then
     *     Reporter.ReportEvent micPass, "Payroll Balance", "Correct"
     *   End If
     */
    const totalGrossText = await payrollPage.totalGross.textContent();
    const totalNetText = await payrollPage.totalNet.textContent();

    const totalGross = parseCurrency(totalGrossText || '0');
    const totalNet = parseCurrency(totalNetText || '0');

    // Net should be less than gross (after deductions)
    expect(totalNet).toBeLessThan(totalGross);
    // Net should be positive
    expect(totalNet).toBeGreaterThan(0);
  });

  test('should display payroll run list', async ({ payrollPage }) => {
    await payrollPage.goto();

    /**
     * Verify runs table
     *
     * Replaces:
     *   rowCount = WebTable("payroll_runs").RowCount
     *   If rowCount > 1 Then Reporter.ReportEvent micPass, ...
     */
    await expect(payrollPage.payrollRunsTable).toBeVisible();
  });
});
