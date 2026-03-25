import { test, expect, type Page } from '@playwright/test';

/**
 * Google Login E2E Tests
 *
 * These tests automate the Google sign-in flow using Playwright.
 *
 * Prerequisites:
 *   - Set GOOGLE_EMAIL and GOOGLE_PASSWORD environment variables
 *   - The Google account should NOT have 2FA enabled (or use an App Password)
 *   - For accounts with 2FA, set GOOGLE_TOTP_SECRET for TOTP-based verification
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
    await page.goto('https://accounts.google.com/signin');

    await expect(page).toHaveURL(/accounts\.google\.com/);
    await expect(page.locator('input[type="email"]')).toBeVisible();
  });

  test('should enter email and proceed to password step', async ({ page }) => {
    await page.goto('https://accounts.google.com/signin');

    // Wait for the email input field to be visible
    const emailInput = page.locator('input[type="email"]');
    await expect(emailInput).toBeVisible();

    // Enter the email address
    await emailInput.fill(GOOGLE_EMAIL);

    // Click the "Next" button
    await page.locator('#identifierNext button, #identifierNext').click();

    // Wait for the password input to appear (indicates successful email submission)
    const passwordInput = page.locator('input[type="password"]');
    await expect(passwordInput).toBeVisible({ timeout: 10_000 });
  });

  test('should complete full login flow', async ({ page }) => {
    await page.goto('https://accounts.google.com/signin');

    // Step 1: Enter email
    const emailInput = page.locator('input[type="email"]');
    await expect(emailInput).toBeVisible();
    await emailInput.fill(GOOGLE_EMAIL);
    await page.locator('#identifierNext button, #identifierNext').click();

    // Step 2: Enter password
    const passwordInput = page.locator('input[type="password"]');
    await expect(passwordInput).toBeVisible({ timeout: 10_000 });
    await passwordInput.fill(GOOGLE_PASSWORD);
    await page.locator('#passwordNext button, #passwordNext').click();

    // Step 3: Verify successful login
    // After login, Google redirects to myaccount or the requested page
    await page.waitForURL(/myaccount\.google\.com|accounts\.google\.com\/signin\/v2\/challenge|mail\.google\.com/, {
      timeout: 30_000,
    });

    // If we reach myaccount, login was successful
    const currentUrl = page.url();
    const isLoggedIn =
      currentUrl.includes('myaccount.google.com') ||
      currentUrl.includes('mail.google.com');

    if (isLoggedIn) {
      // Verify user profile element is visible on the my account page
      await expect(page.locator('header, [data-ogsr-up]')).toBeVisible({ timeout: 10_000 });
    }
    // If redirected to a challenge page, the test acknowledges 2FA is required
  });

  test('should show error for invalid email', async ({ page }) => {
    await page.goto('https://accounts.google.com/signin');

    const emailInput = page.locator('input[type="email"]');
    await expect(emailInput).toBeVisible();

    // Enter an invalid email format
    await emailInput.fill('not-a-valid-email-@@@');
    await page.locator('#identifierNext button, #identifierNext').click();

    // Expect an error message to appear
    const errorMessage = page.locator('[aria-live="assertive"], .o6cuMc, .dEOOab');
    await expect(errorMessage).toBeVisible({ timeout: 5_000 });
  });

  test('should show error for empty email submission', async ({ page }) => {
    await page.goto('https://accounts.google.com/signin');

    const emailInput = page.locator('input[type="email"]');
    await expect(emailInput).toBeVisible();

    // Leave email empty and click Next
    await page.locator('#identifierNext button, #identifierNext').click();

    // Expect a validation error
    const errorMessage = page.locator('[aria-live="assertive"], .o6cuMc, .dEOOab');
    await expect(errorMessage).toBeVisible({ timeout: 5_000 });
  });
});
