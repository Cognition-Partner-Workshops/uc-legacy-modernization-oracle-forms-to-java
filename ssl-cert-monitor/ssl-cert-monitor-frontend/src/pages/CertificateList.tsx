import { useEffect, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import {
  getCertificates,
  Certificate,
  CertificateType,
  CERT_TYPE_LABELS,
  STATUS_CONFIG,
  scanAllCertificates,
} from "../services/api";
import {
  RefreshCw, Search, Database, Key, Globe, Coffee, Link2, Plus,
} from "lucide-react";

const TYPE_ICONS: Record<CertificateType, React.ReactNode> = {
  DATABASE_SERVER: <Database className="w-4 h-4" />,
  OKTA: <Key className="w-4 h-4" />,
  LOAD_BALANCER: <Globe className="w-4 h-4" />,
  JAVA_APP: <Coffee className="w-4 h-4" />,
  THIRD_PARTY: <Link2 className="w-4 h-4" />,
};

export default function CertificateList() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [certs, setCerts] = useState<Certificate[]>([]);
  const [loading, setLoading] = useState(true);
  const [scanning, setScanning] = useState(false);
  const [search, setSearch] = useState("");
  const navigate = useNavigate();

  const activeType = searchParams.get("type") as CertificateType | null;

  const fetchData = async () => {
    setLoading(true);
    try {
      const params: Record<string, string> = {};
      if (activeType) params.certificate_type = activeType;
      if (search) params.search = search;
      const data = await getCertificates(params);
      setCerts(data);
    } catch (e) {
      console.error("Failed to fetch certificates:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, [activeType]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    fetchData();
  };

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

  const typeFilters: Array<{ key: CertificateType | null; label: string }> = [
    { key: null, label: "All Types" },
    { key: "DATABASE_SERVER", label: "Database Server" },
    { key: "OKTA", label: "Okta" },
    { key: "LOAD_BALANCER", label: "Load Balancer" },
    { key: "JAVA_APP", label: "Java Application" },
    { key: "THIRD_PARTY", label: "Third Party" },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            {activeType ? CERT_TYPE_LABELS[activeType] : "All"} Certificates
          </h1>
          <p className="text-gray-500 mt-1">{certs.length} certificates found</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={handleScanAll}
            disabled={scanning}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
          >
            <RefreshCw className={`w-4 h-4 ${scanning ? "animate-spin" : ""}`} />
            {scanning ? "Scanning..." : "Scan All"}
          </button>
          <button
            onClick={() => navigate("/certificates/new")}
            className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
          >
            <Plus className="w-4 h-4" />
            Add Certificate
          </button>
        </div>
      </div>

      {/* Type Filter Tabs */}
      <div className="flex flex-wrap gap-2">
        {typeFilters.map((filter) => (
          <button
            key={filter.key ?? "all"}
            onClick={() => {
              if (filter.key) {
                setSearchParams({ type: filter.key });
              } else {
                setSearchParams({});
              }
            }}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              activeType === filter.key
                ? "bg-blue-600 text-white"
                : "bg-white text-gray-700 border border-gray-200 hover:bg-gray-50"
            }`}
          >
            {filter.key && TYPE_ICONS[filter.key]}
            {filter.label}
          </button>
        ))}
      </div>

      {/* Search */}
      <form onSubmit={handleSearch} className="flex items-center gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search by name, hostname, or team..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
        <button
          type="submit"
          className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 text-sm font-medium"
        >
          Search
        </button>
      </form>

      {/* Certificate Table */}
      {loading ? (
        <div className="flex items-center justify-center h-32">
          <RefreshCw className="w-6 h-6 animate-spin text-blue-500" />
          <span className="ml-2 text-gray-600">Loading...</span>
        </div>
      ) : certs.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-xl border border-gray-200">
          <p className="text-gray-500">No certificates found</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="text-left py-3 px-4 font-medium text-gray-600">Name</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-600">Hostname</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-600">Type</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-600">Status</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-600">Days Left</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-600">Expiry Date</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-600">Environment</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-600">Owner</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-600">Incident</th>
                </tr>
              </thead>
              <tbody>
                {certs.map((cert) => {
                  const statusCfg = STATUS_CONFIG[cert.status];
                  return (
                    <tr
                      key={cert.id}
                      className="border-b border-gray-100 hover:bg-blue-50 cursor-pointer transition-colors"
                      onClick={() => navigate(`/certificates/${cert.id}`)}
                    >
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          {TYPE_ICONS[cert.certificate_type]}
                          <span className="font-medium text-gray-900">{cert.name}</span>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-gray-600 font-mono text-xs">
                        {cert.hostname}:{cert.port}
                      </td>
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
                        {cert.days_until_expiry !== null ? (
                          <span className={`font-bold ${
                            cert.days_until_expiry <= 0 ? "text-red-800" :
                            cert.days_until_expiry <= 7 ? "text-red-600" :
                            cert.days_until_expiry <= 30 ? "text-yellow-600" :
                            "text-green-600"
                          }`}>
                            {cert.days_until_expiry <= 0 ? `${Math.abs(cert.days_until_expiry)}d overdue` : `${cert.days_until_expiry}d`}
                          </span>
                        ) : (
                          <span className="text-gray-400">N/A</span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-gray-600 text-xs">
                        {cert.expiry_date ? new Date(cert.expiry_date).toLocaleDateString() : "N/A"}
                      </td>
                      <td className="py-3 px-4">
                        <span className="px-2 py-1 bg-gray-100 text-gray-700 rounded text-xs">
                          {cert.environment}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-gray-600 text-xs">{cert.owner_team || "—"}</td>
                      <td className="py-3 px-4">
                        {cert.servicenow_incident_id ? (
                          <span className="px-2 py-1 bg-purple-100 text-purple-700 rounded text-xs font-medium">
                            {cert.servicenow_incident_id}
                          </span>
                        ) : (
                          <span className="text-gray-400">—</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
