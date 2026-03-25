# Google Login - Playwright E2E Tests

Automated end-to-end tests for the Google sign-in flow using [Playwright](https://playwright.dev/).

## Project Structure

```
e2e-tests/
├── playwright.config.ts              # Playwright configuration
├── tests/
│   ├── google-login.spec.ts          # Google login test suite
│   └── google-login-page-object.ts   # Page Object Model for Google login
├── package.json
└── README.md
```

## Prerequisites

- Node.js >= 18
- npm >= 8

## Setup

```bash
cd e2e-tests
npm install
npx playwright install chromium
```

## Running Tests

### Set Credentials

Tests require Google account credentials via environment variables:

```bash
export GOOGLE_EMAIL="your-email@gmail.com"
export GOOGLE_PASSWORD="your-password"
```

> **Note:** For accounts with 2FA enabled, use an [App Password](https://support.google.com/accounts/answer/185833) instead of your regular password.

### Run All Tests

```bash
npm test
```

### Run in Headed Mode (visible browser)

```bash
npm run test:headed
```

### Run in Debug Mode

```bash
npm run test:debug
```

### View HTML Report

```bash
npm run test:report
```

## Test Cases

| Test | Description |
|------|-------------|
| Navigate to sign-in page | Verifies the Google sign-in page loads and the email input is visible |
| Enter email and proceed | Enters email and verifies the password step appears |
| Full login flow | Completes the entire login (email → password → redirect) |
| Invalid email error | Enters invalid email format and verifies error message |
| Empty email error | Submits empty email and verifies validation error |

## Page Object Model

The `GoogleLoginPage` class (`tests/google-login-page-object.ts`) provides a reusable abstraction for the Google sign-in page:

```typescript
import { GoogleLoginPage } from './google-login-page-object';

test('example using page object', async ({ page }) => {
  const loginPage = new GoogleLoginPage(page);
  await loginPage.goto();
  await loginPage.enterEmail('user@gmail.com');
  await loginPage.enterPassword('password');
  await loginPage.expectSuccessfulLogin();
});
```

## Important Notes

- Google may present CAPTCHAs or additional security challenges during automated login
- Tests that require valid credentials are skipped when `GOOGLE_EMAIL` / `GOOGLE_PASSWORD` are not set
- For CI environments, consider using a dedicated test account with relaxed security settings
