const BASE = '/api/v1';

async function request<T>(url: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE}${url}`, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: 'Request failed' }));
    throw new Error(err.detail || `HTTP ${res.status}`);
  }
  return res.json();
}

// Employees
export const getEmployees = (params?: Record<string, string>) => {
  const qs = params ? '?' + new URLSearchParams(params).toString() : '';
  return request<any[]>(`/employees${qs}`);
};
export const createEmployee = (data: any) =>
  request<any>('/employees', { method: 'POST', body: JSON.stringify(data) });
export const getEmployee = (id: string) => request<any>(`/employees/${id}`);
export const transferEmployee = (id: string, data: any) =>
  request<any>(`/employees/${id}/transfer`, { method: 'POST', body: JSON.stringify(data) });
export const terminateEmployee = (id: string, data: any) =>
  request<any>(`/employees/${id}/terminate`, { method: 'POST', body: JSON.stringify(data) });

// Leave
export const getLeaveRequests = () => request<any[]>('/leave/requests');
export const createLeaveRequest = (data: any) =>
  request<any>('/leave/requests', { method: 'POST', body: JSON.stringify(data) });
export const approveLeave = (id: number) =>
  request<any>(`/leave/requests/${id}/approve`, { method: 'POST' });
export const cancelLeave = (id: number) =>
  request<any>(`/leave/requests/${id}/cancel`, { method: 'POST' });
export const getLeaveBalances = () => request<any[]>('/leave/balances');

// Payroll
export const getPayrollRuns = () => request<any[]>('/payroll/runs');
export const createPayrollRun = (data: any) =>
  request<any>('/payroll/runs', { method: 'POST', body: JSON.stringify(data) });
export const calculatePayroll = (id: number) =>
  request<any>(`/payroll/runs/${id}/calculate`, { method: 'POST' });
export const approvePayroll = (id: number) =>
  request<any>(`/payroll/runs/${id}/approve`, { method: 'POST' });

// Performance
export const getPerformanceCycles = () => request<any[]>('/performance/cycles');
export const getPerformanceReviews = () => request<any[]>('/performance/reviews');
export const submitReview = (data: any) =>
  request<any>('/performance/reviews', { method: 'POST', body: JSON.stringify(data) });
export const getGoals = () => request<any[]>('/performance/goals');
export const addGoal = (data: any) =>
  request<any>('/performance/goals', { method: 'POST', body: JSON.stringify(data) });
