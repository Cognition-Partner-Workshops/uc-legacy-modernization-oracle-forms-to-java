import { type Page, type Locator } from '@playwright/test';

/**
 * Dashboard Page Object Model
 *
 * Replaces: UFT Object Repository entries for HRMS_MAIN form (post-login landing)
 *
 * UFT legacy:
 *   Browser("HRMS").Page("Dashboard").WebElement("welcome").GetROProperty("innertext")
 *   Browser("HRMS").Page("Dashboard").Link("Employees").Click
 */
export class DashboardPage {
  readonly page: Page;
  readonly welcomeMessage: Locator;
  readonly employeesLink: Locator;
  readonly leaveLink: Locator;
  readonly payrollLink: Locator;
  readonly performanceLink: Locator;
  readonly logoutButton: Locator;
  readonly userProfileMenu: Locator;
  readonly notificationBadge: Locator;
  readonly quickSearchInput: Locator;

  constructor(page: Page) {
    this.page = page;
    this.welcomeMessage = page.getByText('Welcome');
    this.employeesLink = page.getByRole('link', { name: 'Employees' });
    this.leaveLink = page.getByRole('link', { name: 'Leave' });
    this.payrollLink = page.getByRole('link', { name: 'Payroll' });
    this.performanceLink = page.getByRole('link', { name: 'Performance' });
    this.logoutButton = page.getByRole('button', { name: 'Logout' });
    this.userProfileMenu = page.locator('[data-testid="user-profile-menu"]');
    this.notificationBadge = page.locator('[data-testid="notification-badge"]');
    this.quickSearchInput = page.getByPlaceholder('Search employees...');
  }

  /** Navigate to Employees module */
  async goToEmployees() {
    await this.employeesLink.click();
    await this.page.waitForURL('**/employees');
  }

  /** Navigate to Leave module */
  async goToLeave() {
    await this.leaveLink.click();
    await this.page.waitForURL('**/leave');
  }

  /** Navigate to Payroll module */
  async goToPayroll() {
    await this.payrollLink.click();
    await this.page.waitForURL('**/payroll');
  }

  /** Navigate to Performance module */
  async goToPerformance() {
    await this.performanceLink.click();
    await this.page.waitForURL('**/performance');
  }

  /**
   * Perform logout
   * Replaces: Browser("HRMS").Page("Dashboard").WebButton("Logout").Click
   */
  async logout() {
    await this.logoutButton.click();
    await this.page.waitForURL('**/login');
  }

  /**
   * Quick search from dashboard
   * Replaces: Browser("HRMS").Page("Dashboard").WebEdit("search").Set query
   */
  async quickSearch(query: string) {
    await this.quickSearchInput.fill(query);
    await this.page.keyboard.press('Enter');
  }
}
