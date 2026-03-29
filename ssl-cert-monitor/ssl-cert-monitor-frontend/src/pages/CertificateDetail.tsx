import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  getCertificate,
  scanCertificate,
  deleteCertificate,
  Certificate,
  CERT_TYPE_LABELS,
  STATUS_CONFIG,
} from "../services/api";
import {
  ArrowLeft, RefreshCw, Trash2, Shield, Clock, Server, User, Mail, FileText,
} from "lucide-react";

export default function CertificateDetail() {
  const { id } = useParams<{ id: string }>();
  const [cert, setCert] = useState<Certificate | null>(null);
  const [loading, setLoading] = useState(true);
  const [scanning, setScanning] = useState(false);
  const navigate = useNavigate();

  const fetchData = async () => {
    if (!id) return;
    setLoading(true);
    try {
      const data = await getCertificate(parseInt(id));
      setCert(data);
    } catch (e) {
      console.error("Failed to fetch certificate:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, [id]);

  const handleScan = async () => {
    if (!id) return;
    setScanning(true);
    try {
      const updated = await scanCertificate(parseInt(id));
      setCert(updated);
    } catch (e) {
      console.error("Scan failed:", e);
    } finally {
      setScanning(false);
    }
  };

  const handleDelete = async () => {
    if (!id || !confirm("Are you sure you want to delete this certificate?")) return;
    try {
      await deleteCertificate(parseInt(id));
      navigate("/certificates");
    } catch (e) {
      console.error("Delete failed:", e);
    }
  };

  if (loading || !cert) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="w-8 h-8 animate-spin text-blue-500" />
        <span className="ml-3 text-lg text-gray-600">Loading certificate details...</span>
      </div>
    );
  }

  const statusCfg = STATUS_CONFIG[cert.status];
  const daysColor =
    cert.days_until_expiry === null ? "text-gray-400" :
    cert.days_until_expiry <= 0 ? "text-red-800" :
    cert.days_until_expiry <= 7 ? "text-red-600" :
    cert.days_until_expiry <= 30 ? "text-yellow-600" :
    "text-green-600";

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate(-1)}
            className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-gray-600" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{cert.name}</h1>
            <p className="text-gray-500 font-mono text-sm">{cert.hostname}:{cert.port}</p>
          </div>
          <span className={`px-3 py-1 rounded-lg text-sm font-semibold ${statusCfg.bg} ${statusCfg.color}`}>
            {statusCfg.label}
          </span>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={handleScan}
            disabled={scanning}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
          >
            <RefreshCw className={`w-4 h-4 ${scanning ? "animate-spin" : ""}`} />
            {scanning ? "Scanning..." : "Scan Now"}
          </button>
          <button
            onClick={handleDelete}
            className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
          >
            <Trash2 className="w-4 h-4" />
            Delete
          </button>
        </div>
      </div>

      {/* Days Until Expiry Banner */}
      {cert.days_until_expiry !== null && cert.days_until_expiry <= 30 && (
        <div className={`p-4 rounded-xl border ${
          cert.days_until_expiry <= 0 ? "bg-red-50 border-red-300" :
          cert.days_until_expiry <= 7 ? "bg-red-50 border-red-200" :
          "bg-yellow-50 border-yellow-200"
        }`}>
          <div className="flex items-center gap-3">
            <Clock className={`w-5 h-5 ${daysColor}`} />
            <span className={`font-bold text-lg ${daysColor}`}>
              {cert.days_until_expiry <= 0
                ? `Certificate expired ${Math.abs(cert.days_until_expiry)} days ago!`
                : `Certificate expires in ${cert.days_until_expiry} days`}
            </span>
          </div>
          <p className="mt-2 text-sm text-gray-600">
            {cert.days_until_expiry <= 7
              ? "A ServiceNow incident will be created automatically for this certificate."
              : "Email notifications are being sent to the team about this certificate."}
          </p>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Certificate Information */}
        <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Shield className="w-5 h-5 text-blue-600" />
            Certificate Information
          </h2>
          <div className="space-y-4">
            <InfoRow label="Type" value={CERT_TYPE_LABELS[cert.certificate_type]} />
            <InfoRow label="Subject" value={cert.subject || "N/A"} mono />
            <InfoRow label="Issuer" value={cert.issuer || "N/A"} mono />
            <InfoRow label="Serial Number" value={cert.serial_number || "N/A"} mono />
            <InfoRow
              label="Issued Date"
              value={cert.issued_date ? new Date(cert.issued_date).toLocaleDateString() : "N/A"}
            />
            <InfoRow
              label="Expiry Date"
              value={cert.expiry_date ? new Date(cert.expiry_date).toLocaleDateString() : "N/A"}
            />
            <InfoRow
              label="Days Until Expiry"
              value={cert.days_until_expiry !== null ? `${cert.days_until_expiry} days` : "N/A"}
              valueClass={daysColor}
            />
          </div>
        </div>

        {/* Metadata */}
        <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Server className="w-5 h-5 text-blue-600" />
            Details & Ownership
          </h2>
          <div className="space-y-4">
            <InfoRow label="Environment" value={cert.environment} />
            <InfoRow label="Enabled" value={cert.enabled ? "Yes" : "No"} />
            <InfoRow label="Owner Team" value={cert.owner_team || "N/A"} icon={<User className="w-4 h-4 text-gray-400" />} />
            <InfoRow label="Owner Email" value={cert.owner_email || "N/A"} icon={<Mail className="w-4 h-4 text-gray-400" />} />
            <InfoRow label="Description" value={cert.description || "N/A"} icon={<FileText className="w-4 h-4 text-gray-400" />} />
            <InfoRow
              label="Last Checked"
              value={cert.last_checked ? new Date(cert.last_checked).toLocaleString() : "Never"}
            />
            <InfoRow
              label="Created"
              value={cert.created_at ? new Date(cert.created_at).toLocaleString() : "N/A"}
            />
          </div>
        </div>
      </div>

      {/* ServiceNow Incident */}
      <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">ServiceNow Incident</h2>
        {cert.servicenow_incident_id ? (
          <div className="flex items-center gap-4">
            <span className="px-3 py-1 bg-purple-100 text-purple-700 rounded-lg font-medium">
              {cert.servicenow_incident_id}
            </span>
            <span className="text-sm text-gray-600">
              Created: {cert.incident_created_at ? new Date(cert.incident_created_at).toLocaleString() : "N/A"}
            </span>
          </div>
        ) : (
          <p className="text-gray-500 text-sm">
            No incident created. Incidents are automatically created when a certificate is within 7 days of expiry.
          </p>
        )}
      </div>
    </div>
  );
}

function InfoRow({ label, value, mono, icon, valueClass }: {
  label: string; value: string; mono?: boolean; icon?: React.ReactNode; valueClass?: string;
}) {
  return (
    <div className="flex items-start justify-between py-2 border-b border-gray-50">
      <div className="flex items-center gap-2">
        {icon}
        <span className="text-sm text-gray-500 font-medium">{label}</span>
      </div>
      <span className={`text-sm text-right max-w-xs break-all ${mono ? "font-mono text-xs" : ""} ${valueClass || "text-gray-900"}`}>
        {value}
      </span>
    </div>
  );
}
