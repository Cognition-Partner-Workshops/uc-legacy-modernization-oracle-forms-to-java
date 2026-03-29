import { useEffect, useState } from "react";
import {
  getSettings,
  bulkUpdateSettings,
  getNotificationLogs,
  Setting,
  NotificationLog,
} from "../services/api";
import { Save, RefreshCw, Bell, Mail, Server, Clock } from "lucide-react";

const SETTING_GROUPS = [
  {
    title: "Email Configuration (SMTP)",
    icon: <Mail className="w-5 h-5 text-blue-600" />,
    keys: ["smtp_host", "smtp_port", "smtp_username", "smtp_password", "email_from", "team_notification_email"],
  },
  {
    title: "ServiceNow Configuration",
    icon: <Server className="w-5 h-5 text-purple-600" />,
    keys: ["servicenow_instance_url", "servicenow_username", "servicenow_password", "servicenow_assignment_group"],
  },
  {
    title: "Monitoring Configuration",
    icon: <Clock className="w-5 h-5 text-green-600" />,
    keys: ["scan_interval_hours", "expiry_warning_days", "expiry_critical_days"],
  },
];

export default function Settings() {
  const [settings, setSettings] = useState<Setting[]>([]);
  const [logs, setLogs] = useState<NotificationLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [editValues, setEditValues] = useState<Record<string, string>>({});
  const [activeTab, setActiveTab] = useState<"settings" | "logs">("settings");

  const fetchData = async () => {
    setLoading(true);
    try {
      const [s, l] = await Promise.all([getSettings(), getNotificationLogs(50)]);
      setSettings(s);
      setLogs(l);
      const vals: Record<string, string> = {};
      for (const setting of s) {
        vals[setting.key] = setting.value || "";
      }
      setEditValues(vals);
    } catch (e) {
      console.error("Failed to fetch settings:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const handleSave = async () => {
    setSaving(true);
    setSaved(false);
    try {
      const updates = Object.entries(editValues).map(([key, value]) => ({
        key,
        value,
        description: settings.find((s) => s.key === key)?.description || undefined,
      }));
      await bulkUpdateSettings(updates);
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (e) {
      console.error("Failed to save settings:", e);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="w-8 h-8 animate-spin text-blue-500" />
        <span className="ml-3 text-lg text-gray-600">Loading settings...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
          <p className="text-gray-500 mt-1">Configure email, ServiceNow, and monitoring settings</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-gray-200">
        <button
          onClick={() => setActiveTab("settings")}
          className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
            activeTab === "settings"
              ? "border-blue-600 text-blue-600"
              : "border-transparent text-gray-500 hover:text-gray-700"
          }`}
        >
          Configuration
        </button>
        <button
          onClick={() => setActiveTab("logs")}
          className={`flex items-center gap-2 px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
            activeTab === "logs"
              ? "border-blue-600 text-blue-600"
              : "border-transparent text-gray-500 hover:text-gray-700"
          }`}
        >
          <Bell className="w-4 h-4" />
          Notification Logs
        </button>
      </div>

      {activeTab === "settings" ? (
        <div className="space-y-6">
          {SETTING_GROUPS.map((group) => (
            <div key={group.title} className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
              <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                {group.icon}
                {group.title}
              </h2>
              <div className="space-y-4">
                {group.keys.map((key) => {
                  const setting = settings.find((s) => s.key === key);
                  const isPassword = key.includes("password");
                  return (
                    <div key={key} className="grid grid-cols-3 gap-4 items-center">
                      <div>
                        <label className="text-sm font-medium text-gray-700">
                          {formatLabel(key)}
                        </label>
                        {setting?.description && (
                          <p className="text-xs text-gray-400">{setting.description}</p>
                        )}
                      </div>
                      <div className="col-span-2">
                        <input
                          type={isPassword ? "password" : "text"}
                          value={editValues[key] || ""}
                          onChange={(e) => setEditValues((prev) => ({ ...prev, [key]: e.target.value }))}
                          className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                          placeholder={setting?.description || ""}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}

          <div className="flex items-center justify-end gap-3">
            {saved && (
              <span className="text-sm text-green-600 font-medium">Settings saved successfully!</span>
            )}
            <button
              onClick={handleSave}
              disabled={saving}
              className="flex items-center gap-2 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
            >
              <Save className="w-4 h-4" />
              {saving ? "Saving..." : "Save Settings"}
            </button>
          </div>
        </div>
      ) : (
        /* Notification Logs Tab */
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          {logs.length === 0 ? (
            <div className="text-center py-12">
              <Bell className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500">No notification logs yet</p>
              <p className="text-gray-400 text-sm mt-1">
                Notifications are sent when certificates are expiring
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="text-left py-3 px-4 font-medium text-gray-600">Date</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-600">Type</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-600">Recipient</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-600">Subject</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-600">Status</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-600">Error</th>
                  </tr>
                </thead>
                <tbody>
                  {logs.map((log) => (
                    <tr key={log.id} className="border-b border-gray-100">
                      <td className="py-3 px-4 text-gray-600 text-xs">
                        {log.created_at ? new Date(log.created_at).toLocaleString() : "N/A"}
                      </td>
                      <td className="py-3 px-4">
                        <span className={`px-2 py-1 rounded text-xs font-medium ${
                          log.notification_type === "EMAIL"
                            ? "bg-blue-100 text-blue-700"
                            : "bg-purple-100 text-purple-700"
                        }`}>
                          {log.notification_type}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-gray-600 text-xs">{log.recipient || "N/A"}</td>
                      <td className="py-3 px-4 text-gray-900 text-xs max-w-xs truncate">{log.subject || "N/A"}</td>
                      <td className="py-3 px-4">
                        <span className={`px-2 py-1 rounded text-xs font-semibold ${
                          log.status === "SENT"
                            ? "bg-green-100 text-green-700"
                            : "bg-red-100 text-red-700"
                        }`}>
                          {log.status}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-red-600 text-xs max-w-xs truncate">
                        {log.error_message || "—"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function formatLabel(key: string): string {
  return key
    .replace(/_/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase())
    .replace("Smtp", "SMTP")
    .replace("Servicenow", "ServiceNow");
}
