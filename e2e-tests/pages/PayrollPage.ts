import { type Page, type Locator } from '@playwright/test';

/**
 * Payroll Page Object Model
 *
 * Replaces: UFT Object Repository entries for HRMS_PAYROLL form
 * Maps form blocks (PAYROLL_RUN, PAYROLL_DETAIL, PAY_PERIOD) to POM locators
 *
 * UFT legacy:
 *   Browser("HRMS").Page("Payroll").WebList("period").Select "January 2024"
 *   Browser("HRMS").Page("Payroll").WebButton("Create Run").Click
 *   Browser("HRMS").Page("Payroll").WebButton("Calculate").Click
 */
export class PayrollPage {
  readonly page: Page;

  /* Payroll Run List */
  readonly payrollRunsTable: Locator;
  readonly payrollRunRows: Locator;
  readonly createRunButton: Locator;
  readonly periodSelect: Locator;
  readonly runTypeSelect: Locator;

  /* Payroll Run Detail */
  readonly runStatus: Locator;
  readonly calculateButton: Locator;
  readonly approveButton: Locator;
  readonly reverseButton: Locator;
  readonly employeeCount: Locator;
  readonly totalGross: Locator;
  readonly totalNet: Locator;

  /* Payroll Detail Table */
  readonly payDetailsTable: Locator;
  readonly payDetailRows: Locator;

  /* Employee Pay Breakdown */
  readonly basePay: Locator;
  readonly federalTax: Locator;
  readonly stateTax: Locator;
  readonly ficaTax: Locator;
  readonly medicareTax: Locator;
  readonly netPay: Locator;

  /* Messages */
  readonly successMessage: Locator;
  readonly errorMessage: Locator;

  constructor(page: Page) {
    this.page = page;

    /* Payroll Run List */
    this.payrollRunsTable = page.locator('table[data-testid="payroll-runs-table"]');
    this.payrollRunRows = page.locator('table[data-testid="payroll-runs-table"] tbody tr');
    this.createRunButton = page.getByRole('button', { name: 'Create Run' });
    this.periodSelect = page.getByLabel('Pay Period');
    this.runTypeSelect = page.getByLabel('Run Type');

    /* Payroll Run Detail */
    this.runStatus = page.locator('[data-testid="run-status"]');
    this.calculateButton = page.getByRole('button', { name: 'Calculate' });
    this.approveButton = page.getByRole('button', { name: 'Approve' });
    this.reverseButton = page.getByRole('button', { name: 'Reverse' });
    this.employeeCount = page.locator('[data-testid="employee-count"]');
    this.totalGross = page.locator('[data-testid="total-gross"]');
    this.totalNet = page.locator('[data-testid="total-net"]');

    /* Payroll Detail Table */
    this.payDetailsTable = page.locator('table[data-testid="pay-details-table"]');
    this.payDetailRows = page.locator('table[data-testid="pay-details-table"] tbody tr');

    /* Employee Pay Breakdown */
    this.basePay = page.locator('[data-testid="base-pay"]');
    this.federalTax = page.locator('[data-testid="federal-tax"]');
    this.stateTax = page.locator('[data-testid="state-tax"]');
    this.ficaTax = page.locator('[data-testid="fica-tax"]');
    this.medicareTax = page.locator('[data-testid="medicare-tax"]');
    this.netPay = page.locator('[data-testid="net-pay"]');

    /* Messages */
    this.successMessage = page.locator('[data-testid="success-message"]');
    this.errorMessage = page.locator('[data-testid="error-message"]');
  }

  /** Navigate to payroll module */
  async goto() {
    await this.page.goto('/payroll');
  }

  /**
   * Create a new payroll run
   * Replaces: UFT HRMS_PAYROLL form create run flow
   *
   * UFT equivalent:
   *   Browser("HRMS").Page("Payroll").WebButton("Create Run").Click
   *   Browser("HRMS").Page("Payroll").WebList("period").Select period
   *   Browser("HRMS").Page("Payroll").WebList("run_type").Select runType
   *   Browser("HRMS").Page("Payroll").WebButton("Submit").Click
   */
  async createPayrollRun(periodId: string, runType: string) {
    await this.createRunButton.click();
    await this.periodSelect.selectOption(periodId);
    await this.runTypeSelect.selectOption(runType);
    await this.page.getByRole('button', { name: 'Submit' }).click();
  }

  /**
   * Calculate payroll for the current run
   * Replaces: Browser("HRMS").Page("Payroll").WebButton("Calculate").Click
   */
  async calculatePayroll() {
    await this.calculateButton.click();
    // Payroll calculation may take time (replaces UFT Wait + Sync)
    await this.page.waitForLoadState('networkidle');
  }

  /**
   * Approve the payroll run
   * Replaces: Browser("HRMS").Page("Payroll").WebButton("Approve").Click
   */
  async approvePayrollRun() {
    await this.approveButton.click();
  }

  /**
   * Get employee pay details from a row
   * Replaces: WebTable("payroll_detail").GetCellData(row, col)
   */
  async getEmployeePayRow(employeeName: string): Promise<Locator> {
    return this.payDetailRows.filter({ hasText: employeeName });
  }
}
