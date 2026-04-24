import { useState } from 'react';
import api from '../services/api';

const tabs = [
  { id: 'scan', label: 'Scan Compliance', endpoint: '/ai/compliance-audit-agents/scan-compliance' },
  { id: 'evidence', label: 'Generate Evidence', endpoint: '/ai/compliance-audit-agents/generate-evidence' },
  { id: 'remediation', label: 'Remediation Plan', endpoint: '/ai/compliance-audit-agents/remediation-plan' },
];

const formFields: Record<string, { key: string; label: string; type: 'input' | 'textarea'; placeholder: string }[]> = {
  scan: [
    { key: 'framework', label: 'Framework', type: 'input', placeholder: 'e.g., SOC2, GDPR, HIPAA, ISO 27001' },
    { key: 'scope', label: 'Scope', type: 'input', placeholder: 'e.g., Full organization, IT department' },
    { key: 'current_state', label: 'Current State', type: 'textarea', placeholder: 'Describe current compliance posture...' },
  ],
  evidence: [
    { key: 'framework', label: 'Framework', type: 'input', placeholder: 'e.g., SOC2, GDPR' },
    { key: 'control', label: 'Control', type: 'input', placeholder: 'e.g., CC6.1 - Logical Access Controls' },
    { key: 'requirement', label: 'Requirement', type: 'textarea', placeholder: 'Describe the specific requirement...' },
  ],
  remediation: [
    { key: 'findings', label: 'Findings', type: 'textarea', placeholder: 'Describe audit findings to remediate...' },
    { key: 'framework', label: 'Framework', type: 'input', placeholder: 'e.g., SOC2, PCI-DSS' },
    { key: 'timeline', label: 'Timeline', type: 'input', placeholder: 'e.g., 90 days, 6 months' },
  ],
};

function renderResult(obj: any, depth = 0): JSX.Element | null {
  if (!obj) return null;
  if (typeof obj === 'string') return <p className="text-gray-700 whitespace-pre-wrap leading-relaxed">{obj}</p>;
  if (Array.isArray(obj)) return (
    <div className={depth > 0 ? 'ml-4' : ''}>
      {obj.map((item, i) => (
        <div key={i} className="bg-gray-50 p-3 rounded-lg mb-2 border-l-4 border-indigo-500">
          {typeof item === 'object' ? renderResult(item, depth + 1) : <span className="text-gray-700">{String(item)}</span>}
        </div>
      ))}
    </div>
  );
  return (
    <div className={depth > 0 ? 'ml-4' : ''}>
      {Object.entries(obj).map(([k, v]) => (
        <div key={k} className="mb-3">
          <div className="text-xs font-bold text-indigo-600 uppercase mb-1">{k.replace(/_/g, ' ')}</div>
          {typeof v === 'object' && v !== null ? renderResult(v, depth + 1) : (
            <div className="text-gray-700 bg-gray-50 px-3 py-2 rounded text-sm">
              {typeof v === 'number' ? <span className="text-green-600 font-bold text-lg">{v}</span> :
               typeof v === 'boolean' ? <span className={`font-bold ${v ? 'text-green-600' : 'text-red-500'}`}>{v ? 'Yes' : 'No'}</span> :
               String(v)}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

export default function ComplianceAuditAgents() {
  const [activeTab, setActiveTab] = useState('scan');
  const [formData, setFormData] = useState<Record<string, string>>({});
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async () => {
    const tab = tabs.find(t => t.id === activeTab)!;
    setLoading(true);
    setError('');
    setResult(null);
    try {
      const res = await api.post(tab.endpoint, formData);
      setResult(res.data);
    } catch (e: any) {
      setError(e.response?.data?.error || e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Compliance Audit Agents</h1>
        <p className="text-gray-500 mt-1">AI-powered compliance scanning, evidence generation, and remediation planning</p>
      </div>

      <div className="flex gap-2 mb-6">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => { setActiveTab(tab.id); setResult(null); setError(''); }}
            className={`px-4 py-2 rounded-lg font-medium transition ${
              activeTab === tab.id
                ? 'bg-indigo-600 text-white'
                : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-200'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
        {formFields[activeTab].map(field => (
          <div key={field.key} className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">{field.label}</label>
            {field.type === 'textarea' ? (
              <textarea
                className="w-full border border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                rows={4}
                placeholder={field.placeholder}
                value={formData[field.key] || ''}
                onChange={e => setFormData({ ...formData, [field.key]: e.target.value })}
              />
            ) : (
              <input
                className="w-full border border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                placeholder={field.placeholder}
                value={formData[field.key] || ''}
                onChange={e => setFormData({ ...formData, [field.key]: e.target.value })}
              />
            )}
          </div>
        ))}
        <button
          onClick={handleSubmit}
          disabled={loading}
          className="bg-indigo-600 text-white px-6 py-2.5 rounded-lg font-medium hover:bg-indigo-700 disabled:opacity-50 transition"
        >
          {loading ? 'Analyzing...' : 'Run Analysis'}
        </button>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-xl mb-6">{error}</div>
      )}

      {result && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-bold text-gray-900 mb-4">Results</h2>
          {renderResult(result)}
        </div>
      )}
    </div>
  );
}
