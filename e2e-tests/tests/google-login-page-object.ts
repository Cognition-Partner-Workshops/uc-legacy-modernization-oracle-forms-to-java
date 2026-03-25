import { type Page, type Locator, expect } from '@playwright/test';

/**
 * Page Object Model for the Google Sign-In page.
 *
 * Encapsulates selectors and actions for the Google login flow,
 * making tests more maintainable and readable.
 */
export class GoogleLoginPage {
  readonly page: Page;
  readonly emailInput: Locator;
  readonly passwordInput: Locator;
  readonly nextButton: Locator;
  readonly passwordNextButton: Locator;
  readonly errorMessage: Locator;
  readonly forgotEmailLink: Locator;
  readonly createAccountLink: Locator;

  constructor(page: Page) {
    this.page = page;
    this.emailInput = page.locator('input[type="email"]');
    this.passwordInput = page.locator('input[type="password"]');
    this.nextButton = page.locator('#identifierNext button, #identifierNext');
    this.passwordNextButton = page.locator('#passwordNext button, #passwordNext');
    this.errorMessage = page.locator('[aria-live="assertive"], .o6cuMc, .dEOOab');
    this.forgotEmailLink = page.locator('button:has-text("Forgot email?"), a:has-text("Forgot email?")');
    this.createAccountLink = page.locator('button:has-text("Create account"), a:has-text("Create account")');
  }

  /**
   * Navigate to the Google sign-in page.
   */
  async goto(): Promise<void> {
    await this.page.goto('https://accounts.google.com/signin');
    await expect(this.emailInput).toBeVisible();
  }

  /**
   * Enter the email address and click Next.
   */
  async enterEmail(email: string): Promise<void> {
    await this.emailInput.fill(email);
    await this.nextButton.click();
  }

  /**
   * Wait for the password input to appear and enter the password.
   */
  async enterPassword(password: string): Promise<void> {
    await expect(this.passwordInput).toBeVisible({ timeout: 10_000 });
    await this.passwordInput.fill(password);
    await this.passwordNextButton.click();
  }

  /**
   * Perform a complete login: enter email, then password.
   */
  async login(email: string, password: string): Promise<void> {
    await this.goto();
    await this.enterEmail(email);
    await this.enterPassword(password);
  }

  /**
   * Check if an error message is displayed.
   */
  async expectError(): Promise<void> {
    await expect(this.errorMessage).toBeVisible({ timeout: 5_000 });
  }

  /**
   * Check if the user was redirected after successful login.
   */
  async expectSuccessfulLogin(): Promise<void> {
    await this.page.waitForURL(
      /myaccount\.google\.com|mail\.google\.com/,
      { timeout: 30_000 }
    );
  }
}
