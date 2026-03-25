/**
 * Test Helper Utilities
 *
 * Replaces: UFT Function Libraries (.qfl) — shared utility functions
 *
 * In UFT:
 *   ExecuteFile "C:\UFT\Libraries\Common.qfl"
 *   Call FormatDate(...)
 *
 * In Playwright:
 *   import { formatDate } from '../utils/test-helpers';
 */

/**
 * Format a date string for form input
 * Replaces: UFT VBScript FormatDateTime()
 */
export function formatDate(date: Date): string {
  return date.toISOString().split('T')[0]; // YYYY-MM-DD
}

/**
 * Generate a unique test identifier
 * Replaces: UFT Environment("TestRunID") or timestamp-based IDs
 */
export function generateTestId(): string {
  return `TEST-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
}

/**
 * Generate a unique email for test data
 * Avoids collision with existing employees
 */
export function generateTestEmail(prefix: string = 'test'): string {
  return `${prefix}.${Date.now()}@testcompany.com`;
}

/**
 * Wait helper for API-dependent operations
 * Replaces: UFT Wait(seconds) — but prefer Playwright auto-wait when possible
 *
 * Note from conversion guide: Avoid hard-coded waits. Use Playwright's
 * auto-wait, waitForResponse, or expect() assertions which auto-retry.
 */
export async function waitForCondition(
  checkFn: () => Promise<boolean>,
  timeoutMs: number = 10_000,
  intervalMs: number = 500
): Promise<void> {
  const startTime = Date.now();
  while (Date.now() - startTime < timeoutMs) {
    if (await checkFn()) return;
    await new Promise((resolve) => setTimeout(resolve, intervalMs));
  }
  throw new Error(`Condition not met within ${timeoutMs}ms`);
}

/**
 * Parse currency string to number
 * Replaces: UFT VBScript CDbl() / CCur()
 */
export function parseCurrency(value: string): number {
  return parseFloat(value.replace(/[$,]/g, ''));
}

/**
 * Compare numbers with tolerance (for payroll calculations)
 * Replaces: UFT checkpoint with tolerance parameter
 */
export function isWithinTolerance(
  actual: number,
  expected: number,
  tolerance: number = 0.01
): boolean {
  return Math.abs(actual - expected) <= tolerance;
}
