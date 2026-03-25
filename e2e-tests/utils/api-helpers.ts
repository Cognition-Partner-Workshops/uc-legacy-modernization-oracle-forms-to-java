import { type APIRequestContext } from '@playwright/test';

/**
 * API Helper Utilities
 *
 * Replaces: UFT COM/ActiveX objects for DB and API access
 * In UFT, you'd use:
 *   Set conn = CreateObject("ADODB.Connection")
 *   conn.Open "Provider=OraOLEDB.Oracle;..."
 *
 * In Playwright, use the built-in API request context or npm packages
 */

const API_BASE = process.env.API_BASE_URL || 'http://localhost:8080/api/v1';

export interface AuthToken {
  token: string;
  expiresIn: number;
}

/**
 * Authenticate via API and return JWT token
 * Replaces: UFT PKG_SECURITY.authenticate call
 */
export async function apiLogin(
  request: APIRequestContext,
  username: string,
  password: string
): Promise<AuthToken> {
  const response = await request.post(`${API_BASE}/auth/login`, {
    data: { username, password },
  });
  return response.json();
}

/**
 * Create an employee via API (for test setup)
 * Replaces: UFT DataTable-driven employee creation via DB
 */
export async function apiCreateEmployee(
  request: APIRequestContext,
  token: string,
  employeeData: Record<string, unknown>
): Promise<Record<string, unknown>> {
  const response = await request.post(`${API_BASE}/employees`, {
    data: employeeData,
    headers: { Authorization: `Bearer ${token}` },
  });
  return response.json();
}

/**
 * Get employee by ID via API
 * Replaces: UFT Database Checkpoint for employee lookup
 */
export async function apiGetEmployee(
  request: APIRequestContext,
  token: string,
  empId: number
): Promise<Record<string, unknown>> {
  const response = await request.get(`${API_BASE}/employees/${empId}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return response.json();
}

/**
 * Create a payroll run via API (for test setup)
 */
export async function apiCreatePayrollRun(
  request: APIRequestContext,
  token: string,
  periodId: number,
  runType: string
): Promise<Record<string, unknown>> {
  const response = await request.post(`${API_BASE}/payroll/runs`, {
    data: { periodId, runType },
    headers: { Authorization: `Bearer ${token}` },
  });
  return response.json();
}

/**
 * Submit a leave request via API (for test setup)
 */
export async function apiSubmitLeaveRequest(
  request: APIRequestContext,
  token: string,
  leaveData: Record<string, unknown>
): Promise<Record<string, unknown>> {
  const response = await request.post(`${API_BASE}/leave/requests`, {
    data: leaveData,
    headers: { Authorization: `Bearer ${token}` },
  });
  return response.json();
}
