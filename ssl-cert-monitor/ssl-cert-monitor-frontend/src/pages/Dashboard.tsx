import { useEffect, useState } from "react";
import {
  getDashboardStats,
  getTypeBreakdown,
  DashboardStats,
  TypeBreakdown,
  CERT_TYPE_LABELS,
  STATUS_CONFIG,
  scanAllCertificates,
} from "../services/api";
import { useNavigate } from "react-router-dom";
import {
  PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer,
} from "recharts";
import {
  Shield, ShieldAlert, ShieldX, ShieldQuestion, AlertTriangle, RefreshCw, Server,
} from "lucide-react";

const PIE_COLORS = ["#22c55e", "#eab308", "#ef4444", "#991b1b", "#9ca3af", "#f97316"];

export default function Dashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [breakdown, setBreakdown] = useState<TypeBreakdown[]>([]);
  const [loading, setLoading] = useState(true);
  const [scanning, setScanning] = useState(false);
  const navigate = useNavigate();

  const fetchData = async () => {
    setLoading(true);
    try {
      const [s, b] = await Promise.all([getDashboardStats(), getTypeBreakdown()]);
      setStats(s);
      setBreakdown(b);
    } catch (e) {
      console.error("Failed to fetch dashboard data:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const handleScanAll = async () => {
    setScanning(true);
    try {
      await scanAllCertificates();
      await fetchData();
    } catch (e) {
      console.error("Scan failed:", e);
    } finally {
      setScanning(false);
    }
  };

  if (loading || !stats) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="w-8 h-8 animate-spin text-blue-500" />
        <span className="ml-3 text-lg text-gray-600">Loading dashboard...</span>
      </div>
    );
  }

  const pieData = [
    { name: "Valid", value: stats.valid_count },
    { name: "Expiring Soon", value: stats.expiring_soon_count },
    { name: "Critical", value: stats.critical_count },
    { name: "Expired", value: stats.expired_count },
    { name: "Unknown", value: stats.unknown_count },
    { name: "Error", value: stats.error_count },
  ].filter((d) => d.value > 0);

  const barData = breakdown.map((b) => ({
    name: CERT_TYPE_LABELS[b.certificate_type],
    Valid: b.valid,
    "Expiring Soon": b.expiring_soon,
    Critical: b.critical,
    Expired: b.expired,
  }));

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Certificate Dashboard</h1>
          <p className="text-gray-500 mt-1">Organization-wide SSL certificate health overview</p>
        </div>
        <button
          onClick={handleScanAll}
          disabled={scanning}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
        >
          <RefreshCw className={`w-4 h-4 ${scanning ? "animate-spin" : ""}`} />
          {scanning ? "Scanning..." : "Scan All Certificates"}
        </button>
      </div>

      {/* Status Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <StatusCard
          icon={<Shield className="w-6 h-6 text-green-600" />}
          label="Valid"
          count={stats.valid_count}
          color="border-green-200 bg-green-50"
        />
        <StatusCard
          icon={<AlertTriangle className="w-6 h-6 text-yellow-600" />}
          label="Expiring Soon"
          count={stats.expiring_soon_count}
          color="border-yellow-200 bg-yellow-50"
        />
        <StatusCard
          icon={<ShieldAlert className="w-6 h-6 text-red-600" />}
          label="Critical"
          count={stats.critical_count}
          color="border-red-200 bg-red-50"
        />
        <StatusCard
          icon={<ShieldX className="w-6 h-6 text-red-800" />}
          label="Expired"
          count={stats.expired_count}
          color="border-red-300 bg-red-100"
        />
        <StatusCard
          icon={<ShieldQuestion className="w-6 h-6 text-gray-500" />}
          label="Unknown"
          count={stats.unknown_count}
          color="border-gray-200 bg-gray-50"
        />
        <StatusCard
          icon={<Server className="w-6 h-6 text-blue-600" />}
          label="Total"
          count={stats.total_certificates}
          color="border-blue-200 bg-blue-50"
        />
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Pie Chart - Status Distribution */}
        <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Status Distribution</h2>
          <ResponsiveContainer width="100%" height={280}>
            <PieChart>
              <Pie
                data={pieData}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={100}
                paddingAngle={2}
                dataKey="value"
                label={({ name, value }) => `${name}: ${value}`}
              >
                {pieData.map((_, index) => (
                  <Cell key={index} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Bar Chart - Certificates by Type */}
        <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Certificates by Type</h2>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={barData}>
              <XAxis dataKey="name" tick={{ fontSize: 11 }} />
              <YAxis allowDecimals={false} />
              <Tooltip />
              <Legend />
              <Bar dataKey="Valid" stackId="a" fill="#22c55e" />
              <Bar dataKey="Expiring Soon" stackId="a" fill="#eab308" />
              <Bar dataKey="Critical" stackId="a" fill="#ef4444" />
              <Bar dataKey="Expired" stackId="a" fill="#991b1b" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Environment Distribution */}
      <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">By Environment</h2>
        <div className="flex flex-wrap gap-4">
          {Object.entries(stats.by_environment).map(([env, count]) => (
            <div key={env} className="flex items-center gap-3 px-4 py-3 bg-gray-50 rounded-lg border border-gray-200">
              <span className="text-sm font-medium text-gray-600">{env}</span>
              <span className="text-xl font-bold text-gray-900">{count}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Expiring Certificates Table */}
      {stats.expiring_certificates.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Certificates Expiring Within 30 Days
          </h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-3 px-4 font-medium text-gray-600">Name</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-600">Host</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-600">Type</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-600">Status</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-600">Days Left</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-600">Expiry Date</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-600">Owner</th>
                </tr>
              </thead>
              <tbody>
                {stats.expiring_certificates.map((cert) => {
                  const statusCfg = STATUS_CONFIG[cert.status];
                  return (
                    <tr
                      key={cert.id}
                      className="border-b border-gray-100 hover:bg-gray-50 cursor-pointer"
                      onClick={() => navigate(`/certificates/${cert.id}`)}
                    >
                      <td className="py-3 px-4 font-medium text-gray-900">{cert.name}</td>
                      <td className="py-3 px-4 text-gray-600">{cert.hostname}:{cert.port}</td>
                      <td className="py-3 px-4">
                        <span className="px-2 py-1 bg-blue-50 text-blue-700 rounded text-xs font-medium">
                          {CERT_TYPE_LABELS[cert.certificate_type]}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <span className={`px-2 py-1 rounded text-xs font-semibold ${statusCfg.bg} ${statusCfg.color}`}>
                          {statusCfg.label}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <span className={`font-bold ${(cert.days_until_expiry ?? 0) <= 7 ? "text-red-600" : "text-yellow-600"}`}>
                          {cert.days_until_expiry} days
                        </span>
                      </td>
                      <td className="py-3 px-4 text-gray-600">
                        {cert.expiry_date ? new Date(cert.expiry_date).toLocaleDateString() : "N/A"}
                      </td>
                      <td className="py-3 px-4 text-gray-600">{cert.owner_team || "N/A"}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Recent Incidents */}
      {stats.recent_incidents.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Recent ServiceNow Incidents</h2>
          <div className="space-y-3">
            {stats.recent_incidents.map((inc) => (
              <div key={inc.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div>
                  <p className="text-sm font-medium text-gray-900">{inc.subject}</p>
                  <p className="text-xs text-gray-500">
                    {inc.created_at ? new Date(inc.created_at).toLocaleString() : ""}
                  </p>
                </div>
                <span className={`text-xs font-medium px-2 py-1 rounded ${
                  inc.status === "SENT" ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"
                }`}>
                  {inc.status}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function StatusCard({ icon, label, count, color }: {
  icon: React.ReactNode; label: string; count: number; color: string;
}) {
  return (
    <div className={`rounded-xl border p-4 ${color} transition-transform hover:scale-105`}>
      <div className="flex items-center gap-3">
        {icon}
        <div>
          <p className="text-2xl font-bold text-gray-900">{count}</p>
          <p className="text-xs font-medium text-gray-600">{label}</p>
        </div>
      </div>
    </div>
  );
}
