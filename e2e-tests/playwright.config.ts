import { defineConfig, devices } from '@playwright/test';

/**
 * Playwright Configuration
 *
 * Replaces: UFT Test.tsp (test settings) + env.xml (environment variables)
 *
 * Conversion notes (from UFT to Playwright guide):
 * - UFT Object Sync Timeout → playwright.config.ts timeout
 * - UFT Recovery Scenarios → retries + screenshot on failure
 * - UFT Environment variables → .env + process.env
 * - UFT Browser selection → Playwright projects (Chromium, Firefox, WebKit)
 */
export default defineConfig({
  testDir: './tests',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : 4,
  reporter: [
    ['html', { open: 'never' }],
    ['list'],
  ],

  use: {
    baseURL: process.env.BASE_URL || 'http://localhost:3000',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    actionTimeout: 10_000,
  },

  /* Global timeout per test (replaces UFT Object Sync Timeout) */
  timeout: 30_000,

  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] },
    },
    {
      name: 'webkit',
      use: { ...devices['Desktop Safari'] },
    },
  ],
});
