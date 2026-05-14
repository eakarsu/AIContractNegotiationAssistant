import { useState, useEffect } from 'react';
import api from '../services/api';
import { Sparkles, FileText, Users, BarChart3, Layers, Shield, TrendingUp, Edit3, Play, Clock } from 'lucide-react';

type Tool = {
  id: string;
  name: string;
  description: string;
  icon: any;
  fields: { name: string; label: string; type?: string; required?: boolean; options?: string[] }[];
};

const tools: Tool[] = [
  {
    id: 'draft-from-scratch',
    name: 'AI Draft from Scratch',
    description: 'Generate a complete contract from requirements',
    icon: FileText,
    fields: [
      { name: 'contract_type', label: 'Contract Type', required: true },
      { name: 'requirements', label: 'Requirements', type: 'textarea', required: true },
      { name: 'parties', label: 'Parties' },
      { name: 'jurisdiction', label: 'Jurisdiction' },
      { name: 'value', label: 'Estimated Value' },
      { name: 'duration', label: 'Duration' },
    ],
  },
  {
    id: 'redteam-simulator',
    name: 'Red-Team Negotiation Simulator',
    description: 'AI plays the opposing party to test your strategy',
    icon: Users,
    fields: [
      { name: 'our_position', label: 'Our Position', type: 'textarea', required: true },
      { name: 'counterparty_persona', label: 'Counterparty Persona', type: 'textarea', required: true },
      { name: 'contract_type', label: 'Contract Type' },
      { name: 'rounds', label: 'Number of Rounds', type: 'number' },
    ],
  },
  {
    id: 'historical-analytics',
    name: 'Historical Contract Analytics',
    description: 'Cluster + visualize past contract outcomes',
    icon: BarChart3,
    fields: [
      { name: 'contract_type', label: 'Contract Type Filter' },
      { name: 'party_id', label: 'Party ID Filter', type: 'number' },
      { name: 'period_days', label: 'Period (Days)', type: 'number' },
    ],
  },
  {
    id: 'clause-conflict-detector',
    name: 'Clause Conflict Detector',
    description: 'Find contradictions and overlaps between clauses',
    icon: Layers,
    fields: [
      { name: 'contract_id', label: 'Contract ID', type: 'number', required: true },
    ],
  },
  {
    id: 'regulatory-monitor',
    name: 'Regulatory Update Monitor',
    description: 'Flag outdated compliance clauses',
    icon: Shield,
    fields: [
      { name: 'contract_id', label: 'Contract ID', type: 'number', required: true },
      { name: 'regulations', label: 'Regulations to check' },
    ],
  },
  {
    id: 'sentiment-analysis',
    name: 'Term Sentiment Analysis',
    description: 'Quantify favorability of contract terms',
    icon: TrendingUp,
    fields: [
      { name: 'text', label: 'Contract Text', type: 'textarea', required: true },
      { name: 'our_role', label: 'Our Role', type: 'select', options: ['buyer', 'seller', 'employer', 'employee', 'licensor', 'licensee', 'lessor', 'lessee'] },
    ],
  },
  {
    id: 'pricing-recommender',
    name: 'Precedent Pricing Recommender',
    description: 'Recommend price based on similar contracts',
    icon: TrendingUp,
    fields: [
      { name: 'contract_type', label: 'Contract Type', required: true },
      { name: 'scope', label: 'Scope', type: 'textarea' },
      { name: 'industry', label: 'Industry' },
      { name: 'region', label: 'Region' },
      { name: 'party_id', label: 'Party ID', type: 'number' },
    ],
  },
  {
    id: 'auto-redline-engine',
    name: 'Auto-Redline Engine',
    description: 'Smart counter-redlines from policy',
    icon: Edit3,
    fields: [
      { name: 'proposed_text', label: 'Proposed Text', type: 'textarea', required: true },
      { name: 'policy', label: 'Our Policy / Standards', type: 'textarea', required: true },
      { name: 'contract_type', label: 'Contract Type' },
    ],
  },
];

export default function AICustomTools() {
  const [activeId, setActiveId] = useState(tools[0].id);
  const [form, setForm] = useState<Record<string, any>>({});
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [history, setHistory] = useState<any[]>([]);
  const [showHistory, setShowHistory] = useState(false);

  const tool = tools.find(t => t.id === activeId)!;

  useEffect(() => { setForm({}); setResult(null); setError(null); }, [activeId]);

  const loadHistory = async () => {
    try {
      const { data } = await api.get('/ai/results', { params: { feature: activeId, limit: 20 } });
      setHistory(data.data || []);
    } catch (e: any) { setError(e.response?.data?.error || e.message); }
  };

  useEffect(() => { if (showHistory) loadHistory(); }, [showHistory, activeId]);

  const submit = async () => {
    setError(null); setResult(null);
    const missing = tool.fields.find(f => f.required && (!form[f.name] || String(form[f.name]).trim() === ''));
    if (missing) { setError(`${missing.label} is required`); return; }
    setLoading(true);
    try {
      const { data } = await api.post(`/ai/${activeId}`, form);
      setResult(data);
      if (showHistory) loadHistory();
    } catch (e: any) {
      setError(e.response?.data?.error || e.response?.data?.errors?.[0]?.msg || e.message);
    }
    setLoading(false);
  };

  const Icon = tool.icon;

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Sparkles className="w-7 h-7 text-purple-600" />
            AI Custom Tools
          </h1>
          <p className="text-gray-600">8 advanced AI tools for negotiation and compliance</p>
        </div>
        <button
          onClick={() => setShowHistory(!showHistory)}
          className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 flex items-center gap-2"
        >
          <Clock className="w-4 h-4" /> {showHistory ? 'Hide' : 'Show'} History
        </button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        {tools.map(t => {
          const I = t.icon;
          return (
            <button
              key={t.id}
              onClick={() => setActiveId(t.id)}
              className={`p-3 rounded-lg border-2 text-left transition ${
                activeId === t.id ? 'border-purple-600 bg-purple-50' : 'border-gray-200 bg-white hover:border-gray-300'
              }`}
            >
              <I className="w-5 h-5 text-purple-600 mb-1" />
              <div className="text-sm font-semibold">{t.name}</div>
              <div className="text-xs text-gray-500 mt-1">{t.description}</div>
            </button>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Icon className="w-5 h-5 text-purple-600" />
            {tool.name}
          </h2>
          <div className="space-y-3">
            {tool.fields.map(f => (
              <div key={f.name}>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {f.label}{f.required && <span className="text-red-500"> *</span>}
                </label>
                {f.type === 'textarea' ? (
                  <textarea
                    rows={4}
                    value={form[f.name] || ''}
                    onChange={e => setForm({ ...form, [f.name]: e.target.value })}
                    className="w-full border rounded px-3 py-2 text-sm"
                  />
                ) : f.type === 'select' ? (
                  <select
                    value={form[f.name] || ''}
                    onChange={e => setForm({ ...form, [f.name]: e.target.value })}
                    className="w-full border rounded px-3 py-2 text-sm"
                  >
                    <option value="">Select...</option>
                    {f.options?.map(o => <option key={o} value={o}>{o}</option>)}
                  </select>
                ) : (
                  <input
                    type={f.type || 'text'}
                    value={form[f.name] || ''}
                    onChange={e => setForm({ ...form, [f.name]: e.target.value })}
                    className="w-full border rounded px-3 py-2 text-sm"
                  />
                )}
              </div>
            ))}
            <button
              onClick={submit}
              disabled={loading}
              className="w-full bg-purple-600 text-white py-2 rounded-lg hover:bg-purple-700 disabled:opacity-50 flex items-center justify-center gap-2"
            >
              <Play className="w-4 h-4" /> {loading ? 'Running...' : 'Run AI Tool'}
            </button>
            {error && <div className="bg-red-50 border border-red-200 text-red-700 p-3 rounded text-sm">{error}</div>}
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold mb-4">Result</h2>
          {loading && <div className="text-gray-500">Running...</div>}
          {!loading && !result && <div className="text-gray-400 text-sm">No result yet. Run a tool to see output.</div>}
          {result && (
            <div>
              {result.model && <div className="text-xs text-gray-500 mb-2">Model: {result.model} · Tokens: {result.usage?.total_tokens || 'n/a'}</div>}
              <pre className="bg-gray-50 p-3 rounded text-xs overflow-auto max-h-[600px]">
                {JSON.stringify(result, null, 2)}
              </pre>
            </div>
          )}
        </div>
      </div>

      {showHistory && (
        <div className="mt-6 bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold mb-4">Recent Results — {tool.name}</h2>
          {history.length === 0 && <div className="text-gray-400 text-sm">No history yet.</div>}
          <div className="space-y-3">
            {history.map(r => (
              <div key={r.id} className="border rounded p-3">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-mono text-gray-500">#{r.id}</span>
                  <span className="text-xs text-gray-500">{new Date(r.createdAt).toLocaleString()}</span>
                </div>
                <pre className="text-xs bg-gray-50 p-2 rounded overflow-auto max-h-48">
                  {JSON.stringify(r.output, null, 2)}
                </pre>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
