import { test, expect } from '@playwright/test';
import { GoogleLoginPage } from './google-login-page-object';

/**
 * Google Login E2E Tests
 *
 * These tests automate the Google sign-in flow using Playwright.
 *
 * Prerequisites:
 *   - Set GOOGLE_EMAIL and GOOGLE_PASSWORD environment variables
 *   - The Google account should NOT have 2FA enabled (or use an App Password)
 *
 * Usage:
 *   GOOGLE_EMAIL=user@gmail.com GOOGLE_PASSWORD=pass npx playwright test
 */

const GOOGLE_EMAIL = process.env.GOOGLE_EMAIL ?? '';
const GOOGLE_PASSWORD = process.env.GOOGLE_PASSWORD ?? '';

test.describe('Google Login', () => {
  test.beforeEach(async ({ page }) => {
    test.skip(!GOOGLE_EMAIL || !GOOGLE_PASSWORD, 'GOOGLE_EMAIL and GOOGLE_PASSWORD environment variables are required');
  });

  test('should navigate to Google sign-in page', async ({ page }) => {
    const loginPage = new GoogleLoginPage(page);
    await loginPage.goto();

    await expect(page).toHaveURL(/accounts\.google\.com/);
  });

  test('should enter email and proceed to password step', async ({ page }) => {
    const loginPage = new GoogleLoginPage(page);
    await loginPage.goto();
    await loginPage.enterEmail(GOOGLE_EMAIL);

    await expect(loginPage.passwordInput).toBeVisible({ timeout: 10_000 });
  });

  test('should complete full login flow', async ({ page }) => {
    const loginPage = new GoogleLoginPage(page);
    await loginPage.login(GOOGLE_EMAIL, GOOGLE_PASSWORD);

    // Wait for redirect after login
    await page.waitForURL(
      /myaccount\.google\.com|mail\.google\.com|accounts\.google\.com\/signin\/v2\/challenge/,
      { timeout: 30_000 },
    );

    const currentUrl = page.url();

    if (currentUrl.includes('challenge')) {
      // 2FA or additional verification was triggered — fail explicitly so this
      // is not silently treated as a successful login.
      test.fail(true, 'Google requested an additional security challenge (2FA / CAPTCHA). Use an account without 2FA or an App Password.');
    }

    // Verify we landed on a logged-in Google page
    await expect(page).toHaveURL(/myaccount\.google\.com|mail\.google\.com/);
    await expect(page.locator('header')).toBeVisible({ timeout: 10_000 });
  });

  test('should show error for invalid email', async ({ page }) => {
    const loginPage = new GoogleLoginPage(page);
    await loginPage.goto();
    await loginPage.enterEmail('not-a-valid-email-@@@');

    await loginPage.expectError();
  });

  test('should show error for empty email submission', async ({ page }) => {
    const loginPage = new GoogleLoginPage(page);
    await loginPage.goto();

    // Click Next without entering an email
    await loginPage.nextButton.click();

    await loginPage.expectError();
  });
});
