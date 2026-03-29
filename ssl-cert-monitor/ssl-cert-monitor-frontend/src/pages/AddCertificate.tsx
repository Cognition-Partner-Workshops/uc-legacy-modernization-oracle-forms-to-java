import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { createCertificate, CertificateType, CERT_TYPE_LABELS } from "../services/api";
import { ArrowLeft, Plus } from "lucide-react";

export default function AddCertificate() {
  const navigate = useNavigate();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState({
    name: "",
    hostname: "",
    port: 443,
    certificate_type: "DATABASE_SERVER" as CertificateType,
    environment: "Production",
    owner_team: "",
    owner_email: "",
    description: "",
    enabled: true,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSaving(true);
    try {
      const cert = await createCertificate(form);
      navigate(`/certificates/${cert.id}`);
    } catch (err) {
      setError("Failed to create certificate. Please check the form and try again.");
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  const updateField = (field: string, value: string | number | boolean) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <button onClick={() => navigate(-1)} className="p-2 rounded-lg hover:bg-gray-100 transition-colors">
          <ArrowLeft className="w-5 h-5 text-gray-600" />
        </button>
        <h1 className="text-2xl font-bold text-gray-900">Add New Certificate</h1>
      </div>

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">{error}</div>
      )}

      <form onSubmit={handleSubmit} className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm space-y-5">
        <FormField label="Certificate Name" required>
          <input
            type="text"
            value={form.name}
            onChange={(e) => updateField("name", e.target.value)}
            placeholder="e.g., Oracle DB Production"
            className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          />
        </FormField>

        <div className="grid grid-cols-2 gap-4">
          <FormField label="Hostname" required>
            <input
              type="text"
              value={form.hostname}
              onChange={(e) => updateField("hostname", e.target.value)}
              placeholder="e.g., db.example.com"
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </FormField>
          <FormField label="Port">
            <input
              type="number"
              value={form.port}
              onChange={(e) => updateField("port", parseInt(e.target.value) || 443)}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </FormField>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <FormField label="Certificate Type" required>
            <select
              value={form.certificate_type}
              onChange={(e) => updateField("certificate_type", e.target.value)}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {(Object.keys(CERT_TYPE_LABELS) as CertificateType[]).map((type) => (
                <option key={type} value={type}>{CERT_TYPE_LABELS[type]}</option>
              ))}
            </select>
          </FormField>
          <FormField label="Environment">
            <select
              value={form.environment}
              onChange={(e) => updateField("environment", e.target.value)}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="Production">Production</option>
              <option value="Staging">Staging</option>
              <option value="Development">Development</option>
              <option value="DR">DR</option>
              <option value="QA">QA</option>
            </select>
          </FormField>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <FormField label="Owner Team">
            <input
              type="text"
              value={form.owner_team}
              onChange={(e) => updateField("owner_team", e.target.value)}
              placeholder="e.g., DBA Team"
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </FormField>
          <FormField label="Owner Email">
            <input
              type="email"
              value={form.owner_email}
              onChange={(e) => updateField("owner_email", e.target.value)}
              placeholder="e.g., team@example.com"
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </FormField>
        </div>

        <FormField label="Description">
          <textarea
            value={form.description}
            onChange={(e) => updateField("description", e.target.value)}
            rows={3}
            placeholder="Brief description of this certificate..."
            className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
          />
        </FormField>

        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            id="enabled"
            checked={form.enabled}
            onChange={(e) => updateField("enabled", e.target.checked)}
            className="rounded border-gray-300"
          />
          <label htmlFor="enabled" className="text-sm text-gray-700">Enable monitoring for this certificate</label>
        </div>

        <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 text-sm font-medium"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={saving}
            className="flex items-center gap-2 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 text-sm font-medium transition-colors"
          >
            <Plus className="w-4 h-4" />
            {saving ? "Creating..." : "Create Certificate"}
          </button>
        </div>
      </form>
    </div>
  );
}

function FormField({ label, required, children }: {
  label: string; required?: boolean; children: React.ReactNode;
}) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      {children}
    </div>
  );
}
