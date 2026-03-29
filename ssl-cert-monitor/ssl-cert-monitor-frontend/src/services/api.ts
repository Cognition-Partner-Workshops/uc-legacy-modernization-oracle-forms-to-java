const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:8000";

export interface Certificate {
  id: number;
  name: string;
  hostname: string;
  port: number;
  certificate_type: CertificateType;
  status: CertificateStatus;
  issuer: string | null;
  subject: string | null;
  serial_number: string | null;
  issued_date: string | null;
  expiry_date: string | null;
  days_until_expiry: number | null;
  environment: string;
  owner_team: string | null;
  owner_email: string | null;
  description: string | null;
  enabled: boolean;
  servicenow_incident_id: string | null;
  incident_created_at: string | null;
  last_checked: string | null;
  created_at: string | null;
  updated_at: string | null;
}

export type CertificateType =
  | "DATABASE_SERVER"
  | "OKTA"
  | "LOAD_BALANCER"
  | "JAVA_APP"
  | "THIRD_PARTY";

export type CertificateStatus =
  | "VALID"
  | "EXPIRING_SOON"
  | "CRITICAL"
  | "EXPIRED"
  | "UNKNOWN"
  | "ERROR";

export interface DashboardStats {
  total_certificates: number;
  valid_count: number;
  expiring_soon_count: number;
  critical_count: number;
  expired_count: number;
  unknown_count: number;
  error_count: number;
  by_type: Record<string, number>;
  by_environment: Record<string, number>;
  recent_incidents: Array<{
    id: number;
    certificate_id: number;
    subject: string;
    status: string;
    created_at: string | null;
  }>;
  expiring_certificates: Certificate[];
}

export interface TypeBreakdown {
  certificate_type: CertificateType;
  total: number;
  valid: number;
  expiring_soon: number;
  critical: number;
  expired: number;
}

export interface Setting {
  id: number;
  key: string;
  value: string | null;
  description: string | null;
  updated_at: string | null;
}

export interface NotificationLog {
  id: number;
  certificate_id: number;
  notification_type: string;
  recipient: string | null;
  subject: string | null;
  message: string | null;
  status: string;
  error_message: string | null;
  created_at: string | null;
}

export interface CertificateCreate {
  name: string;
  hostname: string;
  port: number;
  certificate_type: CertificateType;
  environment: string;
  owner_team?: string;
  owner_email?: string;
  description?: string;
  enabled: boolean;
}

async function fetchJson<T>(url: string, options?: RequestInit): Promise<T> {
  const response = await fetch(`${API_BASE}${url}`, {
    headers: { "Content-Type": "application/json" },
    ...options,
  });
  if (!response.ok) {
    throw new Error(`API error: ${response.status} ${response.statusText}`);
  }
  if (response.status === 204) return undefined as T;
  return response.json();
}

// Dashboard
export const getDashboardStats = () => fetchJson<DashboardStats>("/api/dashboard/stats");
export const getTypeBreakdown = () => fetchJson<TypeBreakdown[]>("/api/dashboard/type-breakdown");

// Certificates
export const getCertificates = (params?: Record<string, string>) => {
  const query = params ? "?" + new URLSearchParams(params).toString() : "";
  return fetchJson<Certificate[]>(`/api/certificates${query}`);
};
export const getCertificate = (id: number) => fetchJson<Certificate>(`/api/certificates/${id}`);
export const createCertificate = (data: CertificateCreate) =>
  fetchJson<Certificate>("/api/certificates", { method: "POST", body: JSON.stringify(data) });
export const updateCertificate = (id: number, data: Partial<CertificateCreate>) =>
  fetchJson<Certificate>(`/api/certificates/${id}`, { method: "PUT", body: JSON.stringify(data) });
export const deleteCertificate = (id: number) =>
  fetchJson<void>(`/api/certificates/${id}`, { method: "DELETE" });
export const scanCertificate = (id: number) =>
  fetchJson<Certificate>(`/api/certificates/${id}/scan`, { method: "POST" });
export const scanAllCertificates = () =>
  fetchJson<Certificate[]>("/api/certificates/scan/all", { method: "POST" });

// Settings
export const getSettings = () => fetchJson<Setting[]>("/api/settings");
export const updateSetting = (key: string, value: string, description?: string) =>
  fetchJson<Setting>("/api/settings", {
    method: "PUT",
    body: JSON.stringify({ key, value, description }),
  });
export const bulkUpdateSettings = (settings: Array<{ key: string; value: string; description?: string }>) =>
  fetchJson<Setting[]>("/api/settings/bulk", { method: "PUT", body: JSON.stringify(settings) });
export const getNotificationLogs = (limit?: number) =>
  fetchJson<NotificationLog[]>(`/api/settings/notifications${limit ? `?limit=${limit}` : ""}`);

// Helpers
export const CERT_TYPE_LABELS: Record<CertificateType, string> = {
  DATABASE_SERVER: "Database Server",
  OKTA: "Okta",
  LOAD_BALANCER: "Load Balancer",
  JAVA_APP: "Java Application",
  THIRD_PARTY: "Third Party",
};

export const STATUS_CONFIG: Record<CertificateStatus, { label: string; color: string; bg: string }> = {
  VALID: { label: "Valid", color: "text-green-700", bg: "bg-green-100" },
  EXPIRING_SOON: { label: "Expiring Soon", color: "text-yellow-700", bg: "bg-yellow-100" },
  CRITICAL: { label: "Critical", color: "text-red-700", bg: "bg-red-100" },
  EXPIRED: { label: "Expired", color: "text-red-900", bg: "bg-red-200" },
  UNKNOWN: { label: "Unknown", color: "text-gray-700", bg: "bg-gray-100" },
  ERROR: { label: "Error", color: "text-orange-700", bg: "bg-orange-100" },
};
