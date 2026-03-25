import { type Page, type Locator } from '@playwright/test';

/**
 * Leave Page Object Model
 *
 * Replaces: UFT Object Repository entries for HRMS_LEAVE form
 * Maps form blocks (LEAVE_REQUEST, LEAVE_BALANCE, PENDING_APPROVALS) to POM locators
 *
 * UFT legacy:
 *   Browser("HRMS").Page("Leave").WebList("leave_type").Select "PTO"
 *   Browser("HRMS").Page("Leave").WebEdit("start_date").Set "08/12/2024"
 *   Browser("HRMS").Page("Leave").WebButton("Submit").Click
 */
export class LeavePage {
  readonly page: Page;

  /* Leave Request Form */
  readonly leaveTypeSelect: Locator;
  readonly startDateInput: Locator;
  readonly endDateInput: Locator;
  readonly halfDayCheckbox: Locator;
  readonly reasonInput: Locator;
  readonly submitButton: Locator;

  /* Leave Request List */
  readonly requestsTable: Locator;
  readonly requestRows: Locator;
  readonly newRequestButton: Locator;
  readonly statusFilter: Locator;

  /* Leave Balances */
  readonly balancesTab: Locator;
  readonly balanceCards: Locator;

  /* Pending Approvals (Manager view) */
  readonly pendingApprovalsTab: Locator;
  readonly approvalRows: Locator;
  readonly approveButton: Locator;
  readonly rejectButton: Locator;
  readonly cancelRequestButton: Locator;

  /* Status & Messages */
  readonly requestStatus: Locator;
  readonly totalDaysDisplay: Locator;
  readonly successMessage: Locator;
  readonly errorMessage: Locator;

  constructor(page: Page) {
    this.page = page;

    /* Leave Request Form */
    this.leaveTypeSelect = page.getByLabel('Leave Type');
    this.startDateInput = page.getByLabel('Start Date');
    this.endDateInput = page.getByLabel('End Date');
    this.halfDayCheckbox = page.getByRole('checkbox', { name: 'Half Day' });
    this.reasonInput = page.getByLabel('Reason');
    this.submitButton = page.getByRole('button', { name: 'Submit' });

    /* Leave Request List */
    this.requestsTable = page.locator('table[data-testid="leave-requests-table"]');
    this.requestRows = page.locator('table[data-testid="leave-requests-table"] tbody tr');
    this.newRequestButton = page.getByRole('button', { name: 'New Request' });
    this.statusFilter = page.getByLabel('Status');

    /* Leave Balances */
    this.balancesTab = page.getByRole('tab', { name: 'Balances' });
    this.balanceCards = page.locator('[data-testid="balance-card"]');

    /* Pending Approvals */
    this.pendingApprovalsTab = page.getByRole('tab', { name: 'Pending Approvals' });
    this.approvalRows = page.locator('table[data-testid="pending-approvals-table"] tbody tr');
    this.approveButton = page.getByRole('button', { name: 'Approve' });
    this.rejectButton = page.getByRole('button', { name: 'Reject' });
    this.cancelRequestButton = page.getByRole('button', { name: 'Cancel Request' });

    /* Status & Messages */
    this.requestStatus = page.locator('[data-testid="request-status"]');
    this.totalDaysDisplay = page.locator('[data-testid="total-days"]');
    this.successMessage = page.locator('[data-testid="success-message"]');
    this.errorMessage = page.locator('[data-testid="error-message"]');
  }

  /** Navigate to leave module */
  async goto() {
    await this.page.goto('/leave');
  }

  /**
   * Submit a new leave request
   * Replaces: UFT HRMS_LEAVE form insert + submit flow
   *
   * UFT equivalent:
   *   Browser("HRMS").Page("Leave").WebButton("New").Click
   *   Browser("HRMS").Page("Leave").WebList("leave_type").Select leaveType
   *   Browser("HRMS").Page("Leave").WebEdit("start_date").Set startDate
   *   Browser("HRMS").Page("Leave").WebEdit("end_date").Set endDate
   *   Browser("HRMS").Page("Leave").WebEdit("reason").Set reason
   *   Browser("HRMS").Page("Leave").WebButton("Submit").Click
   */
  async submitLeaveRequest(data: {
    leaveType: string;
    startDate: string;
    endDate: string;
    halfDay?: boolean;
    reason: string;
  }) {
    await this.newRequestButton.click();
    await this.leaveTypeSelect.selectOption(data.leaveType);
    await this.startDateInput.fill(data.startDate);
    await this.endDateInput.fill(data.endDate);

    if (data.halfDay) {
      await this.halfDayCheckbox.check();
    }

    await this.reasonInput.fill(data.reason);
    await this.submitButton.click();
  }

  /**
   * Approve a leave request (manager action)
   * Replaces: UFT HRMS_LEAVE_APPROVAL form approve action
   */
  async approveRequest(requestIndex: number) {
    await this.pendingApprovalsTab.click();
    await this.approvalRows.nth(requestIndex).getByRole('button', { name: 'Approve' }).click();
  }

  /**
   * Cancel a leave request
   * Replaces: UFT HRMS_LEAVE form cancel action
   */
  async cancelRequest(reason: string) {
    await this.cancelRequestButton.click();
    // Handle confirmation dialog
    this.page.on('dialog', async (dialog) => {
      await dialog.accept();
    });
  }

  /** Get leave balance for a specific type */
  async getLeaveBalance(leaveType: string): Promise<string | null> {
    await this.balancesTab.click();
    return this.page
      .locator(`[data-testid="balance-card"]:has-text("${leaveType}")`)
      .locator('[data-testid="balance-value"]')
      .textContent();
  }
}
