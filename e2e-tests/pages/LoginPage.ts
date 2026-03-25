import { type Page, type Locator } from '@playwright/test';

/**
 * Login Page Object Model
 *
 * Replaces: UFT Reusable Action "Login" + Object Repository entries for HRMS_LOGIN form
 *
 * UFT legacy equivalent:
 *   Browser("HRMS").Page("Login").WebEdit("email").Set "admin@test.com"
 *   Browser("HRMS").Page("Login").WebEdit("password").SetSecure "encrypted"
 *   Browser("HRMS").Page("Login").WebButton("Sign In").Click
 *
 * Playwright POM equivalent:
 *   Encapsulates locators as class properties, actions as methods
 */
export class LoginPage {
  readonly page: Page;
  readonly emailInput: Locator;
  readonly passwordInput: Locator;
  readonly signInButton: Locator;
  readonly errorMessage: Locator;
  readonly forgotPasswordLink: Locator;
  readonly rememberMeCheckbox: Locator;
  readonly pageTitle: Locator;

  constructor(page: Page) {
    this.page = page;
    this.emailInput = page.getByLabel('Email');
    this.passwordInput = page.getByLabel('Password');
    this.signInButton = page.getByRole('button', { name: 'Sign In' });
    this.errorMessage = page.locator('[data-testid="login-error"]');
    this.forgotPasswordLink = page.getByRole('link', { name: 'Forgot Password' });
    this.rememberMeCheckbox = page.getByRole('checkbox', { name: 'Remember me' });
    this.pageTitle = page.getByRole('heading', { name: 'Sign In' });
  }

  /**
   * Navigate to login page
   * Replaces: SystemUtil.Run "chrome.exe", "https://app.com/login"
   */
  async goto() {
    await this.page.goto('/login');
  }

  /**
   * Perform login with credentials
   * Replaces: UFT RunAction "Login", oneIteration, username, password
   *
   * UFT equivalent:
   *   Browser("HRMS").Page("Login").WebEdit("email").Set user
   *   Browser("HRMS").Page("Login").WebEdit("password").SetSecure pass
   *   Browser("HRMS").Page("Login").WebButton("Sign In").Click
   */
  async login(email: string, password: string) {
    await this.emailInput.fill(email);
    await this.passwordInput.fill(password);
    await this.signInButton.click();
  }

  /**
   * Login and wait for dashboard to load
   * Replaces: Login action + Browser("HRMS").Page("Dashboard").Sync
   */
  async loginAndWaitForDashboard(email: string, password: string) {
    await this.login(email, password);
    await this.page.waitForURL('**/dashboard', { timeout: 10_000 });
  }

  /**
   * Check if login error is displayed
   * Replaces: If Browser("HRMS").Page("Login").WebElement("error").Exist(5) Then ...
   */
  async getErrorMessage(): Promise<string | null> {
    return this.errorMessage.textContent();
  }
}
