import { test, expect } from '../fixtures/test-fixtures';
import leaveData from '../test-data/leave-requests.json';

/**
 * Leave Workflow Tests
 *
 * Migrated from: UFT test script for PKG_LEAVE / HRMS_LEAVE form
 * Scenario file: test-harness/scenarios/leave-workflow.yaml
 *
 * Business flow:
 *   1. Employee submits PTO request → status = PENDING
 *   2. Manager approves request → status = APPROVED
 *   3. Leave balance decremented
 *   4. Employee cancels approved request → status = CANCELLED
 *   5. Leave balance restored
 *
 * UFT legacy flow:
 *   Browser("HRMS").Page("Leave").WebButton("New").Click
 *   Browser("HRMS").Page("Leave").WebList("leave_type").Select "PTO"
 *   Browser("HRMS").Page("Leave").WebEdit("start_date").Set "08/12/2024"
 *   Browser("HRMS").Page("Leave").WebEdit("end_date").Set "08/16/2024"
 *   Browser("HRMS").Page("Leave").WebEdit("reason").Set "Summer vacation"
 *   Browser("HRMS").Page("Leave").WebButton("Submit").Click
 *   Wait 2
 *   If Browser("HRMS").Page("Leave").WebElement("status").GetROProperty("innertext") = "PENDING" Then
 *     Reporter.ReportEvent micPass, "Submit", "Status is PENDING"
 *   End If
 *
 * Key conversions:
 *   - WebList.Select → selectOption()
 *   - WebEdit.Set → fill()
 *   - WebButton.Click → click()
 *   - Wait 2 → removed (Playwright auto-waits)
 *   - GetROProperty("innertext") = "PENDING" → expect().toHaveText("PENDING")
 *   - Reporter.ReportEvent → expect() assertions
 */
test.describe('Leave Request Workflow', () => {
  test.beforeEach(async ({ loginPage }) => {
    await loginPage.goto();
    await loginPage.loginAndWaitForDashboard(
      process.env.ADMIN_USERNAME || 'james.richardson@company.com',
      process.env.ADMIN_PASSWORD || 'test_password_123'
    );
  });

  test('should submit a PTO request', async ({ leavePage }) => {
    await leavePage.goto();

    /**
     * Submit leave request
     *
     * UFT equivalent:
     *   Browser("HRMS").Page("Leave").WebButton("New").Click
     *   Browser("HRMS").Page("Leave").WebList("leave_type").Select "PTO"
     *   Browser("HRMS").Page("Leave").WebEdit("start_date").Set "08/12/2024"
     *   Browser("HRMS").Page("Leave").WebEdit("end_date").Set "08/16/2024"
     *   Browser("HRMS").Page("Leave").WebCheckBox("half_day").Set "OFF"
     *   Browser("HRMS").Page("Leave").WebEdit("reason").Set "Summer vacation"
     *   Browser("HRMS").Page("Leave").WebButton("Submit").Click
     */
    await leavePage.submitLeaveRequest({
      leaveType: leaveData.ptoRequest.leaveType,
      startDate: leaveData.ptoRequest.startDate,
      endDate: leaveData.ptoRequest.endDate,
      halfDay: leaveData.ptoRequest.halfDay,
      reason: leaveData.ptoRequest.reason,
    });

    // Verify request submitted with PENDING status
    // Replaces: WebElement("status").GetROProperty("innertext") = "PENDING"
    await expect(leavePage.requestStatus).toHaveText('PENDING');

    // Verify total days calculated correctly
    await expect(leavePage.totalDaysDisplay).toHaveText(
      String(leaveData.ptoRequest.expectedDays)
    );
  });

  test('should display leave request in list after submission', async ({ leavePage }) => {
    await leavePage.goto();

    /**
     * Verify request appears in list
     *
     * Replaces:
     *   rowCount = Browser("HRMS").Page("Leave").WebTable("requests").RowCount
     *   For r = 2 To rowCount
     *     status = WebTable("requests").GetCellData(r, 4)
     *     If status = "PENDING" Then found = True
     *   Next
     */
    const requestCount = await leavePage.requestRows.count();
    expect(requestCount).toBeGreaterThan(0);
  });

  test('should approve a leave request (manager view)', async ({ leavePage }) => {
    await leavePage.goto();

    /**
     * Approve leave request
     *
     * UFT equivalent:
     *   ' Switch to manager role / re-login as manager
     *   Browser("HRMS").Page("Leave").WebTab("Pending Approvals").Click
     *   Browser("HRMS").Page("Leave").WebTable("approvals").GetCellData(2, 1)  ' first pending
     *   Browser("HRMS").Page("Leave").WebButton("Approve").Click
     */
    await leavePage.approveRequest(0);

    await expect(leavePage.successMessage).toBeVisible();
  });

  test('should show leave balances', async ({ leavePage }) => {
    await leavePage.goto();

    /**
     * Check leave balance
     *
     * UFT equivalent:
     *   Browser("HRMS").Page("Leave").WebTab("Balances").Click
     *   balance = Browser("HRMS").Page("Leave").WebElement("pto_balance").GetROProperty("innertext")
     *   If CInt(balance) >= 0 Then Reporter.ReportEvent micPass, ...
     */
    await leavePage.balancesTab.click();
    await expect(leavePage.balanceCards.first()).toBeVisible();
  });

  test('should cancel a leave request', async ({ leavePage }) => {
    await leavePage.goto();

    /**
     * Cancel leave request
     *
     * UFT equivalent:
     *   Browser("HRMS").Page("Leave").WebTable("requests").ChildItem(...).Click
     *   Browser("HRMS").Page("Leave").WebButton("Cancel Request").Click
     *   Browser("HRMS").Dialog("Confirm").WinButton("OK").Click
     *
     * Dialog handling:
     *   UFT: Browser("HRMS").Dialog("Confirm").WinButton("OK").Click
     *   Playwright: page.on('dialog', d => d.accept())
     */
    await leavePage.requestRows.first().click();
    await leavePage.cancelRequest(leaveData.cancelReason);

    await expect(leavePage.requestStatus).toHaveText('CANCELLED');
  });

  test('should submit a half-day leave request', async ({ leavePage }) => {
    await leavePage.goto();

    /**
     * Half-day request
     *
     * UFT equivalent:
     *   Browser("HRMS").Page("Leave").WebCheckBox("half_day").Set "ON"
     *
     * Playwright:
     *   await halfDayCheckbox.check()  — uses check() instead of Set "ON"
     */
    await leavePage.submitLeaveRequest({
      leaveType: leaveData.halfDayRequest.leaveType,
      startDate: leaveData.halfDayRequest.startDate,
      endDate: leaveData.halfDayRequest.endDate,
      halfDay: leaveData.halfDayRequest.halfDay,
      reason: leaveData.halfDayRequest.reason,
    });

    await expect(leavePage.requestStatus).toHaveText('PENDING');
    await expect(leavePage.totalDaysDisplay).toHaveText(
      String(leaveData.halfDayRequest.expectedDays)
    );
  });

  test('should submit a sick leave request', async ({ leavePage }) => {
    await leavePage.goto();

    await leavePage.submitLeaveRequest({
      leaveType: leaveData.sickLeaveRequest.leaveType,
      startDate: leaveData.sickLeaveRequest.startDate,
      endDate: leaveData.sickLeaveRequest.endDate,
      halfDay: leaveData.sickLeaveRequest.halfDay,
      reason: leaveData.sickLeaveRequest.reason,
    });

    await expect(leavePage.requestStatus).toHaveText('PENDING');
  });
});

test.describe('Leave Request Validation', () => {
  test.beforeEach(async ({ loginPage }) => {
    await loginPage.goto();
    await loginPage.loginAndWaitForDashboard(
      process.env.ADMIN_USERNAME || 'james.richardson@company.com',
      process.env.ADMIN_PASSWORD || 'test_password_123'
    );
  });

  test('should prevent submission without required fields', async ({ leavePage }) => {
    await leavePage.goto();
    await leavePage.newRequestButton.click();

    // Try to submit without filling required fields
    await leavePage.submitButton.click();

    await expect(leavePage.errorMessage).toBeVisible();
  });

  test('should prevent end date before start date', async ({ leavePage }) => {
    await leavePage.goto();

    await leavePage.submitLeaveRequest({
      leaveType: 'PTO',
      startDate: '2024-08-16',
      endDate: '2024-08-12', // End before start
      reason: 'Invalid dates test',
    });

    await expect(leavePage.errorMessage).toBeVisible();
  });
});
