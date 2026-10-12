import FormattedAIReport from "../components/FormattedAIReport";
import { useState, useEffect, useRef } from 'react';
import api from '../services/api';
import { Sparkles, FileText, Users, BarChart3, Layers, Shield, TrendingUp, Edit3, Play, Clock } from 'lucide-react';
import { AI_EXAMPLE_LABELS, ALL_RECORDS, contractAIRequestPayload, fillContractAIExample, type AIExampleField, type SavedAIReference } from '../utils/contract-ai-examples';

type Tool = {
  id: string;
  name: string;
  description: string;
  icon: any;
  fields: AIExampleField[];
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
  const [form, setForm] = useState<Record<string, string | number>>({});
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [history, setHistory] = useState<any[]>([]);
  const [showHistory, setShowHistory] = useState(false);
  const [contracts, setContracts] = useState<SavedAIReference[]>([]);
  const [parties, setParties] = useState<SavedAIReference[]>([]);
  const [referencesLoading, setReferencesLoading] = useState(false);
  const [referenceError, setReferenceError] = useState<string | null>(null);
  const [status, setStatus] = useState<string | null>(null);
  const request = useRef<AbortController | null>(null);
  const activeTool = useRef(activeId);
  activeTool.current = activeId;

  const tool = tools.find(t => t.id === activeId)!;

  useEffect(() => {
    request.current?.abort();
    request.current = null;
    setForm({}); setResult(null); setError(null); setStatus(null); setHistory([]); setLoading(false);
    return () => { request.current?.abort(); request.current = null; };
  }, [activeId]);

  useEffect(() => {
    const controller = new AbortController();
    const needsContracts = tool.fields.some(field => field.name === 'contract_id') || ['historical-analytics', 'pricing-recommender'].includes(activeId);
    const needsParties = tool.fields.some(field => field.name === 'party_id');
    setContracts([]); setParties([]); setReferenceError(null);
    setReferencesLoading(needsContracts || needsParties);
    const load = async () => {
      const options = { params: { limit: 100 }, signal: controller.signal };
      const responses = await Promise.allSettled([
        needsContracts ? api.get('/contracts', options) : Promise.resolve(null),
        needsParties ? api.get('/parties', options) : Promise.resolve(null),
      ]);
      if (controller.signal.aborted) return;
      const [contractResponse, partyResponse] = responses;
      const contractRecords = contractResponse.status === 'fulfilled' ? contractResponse.value?.data?.data : null;
      const partyRecords = partyResponse.status === 'fulfilled' ? partyResponse.value?.data?.data : null;
      if (needsContracts && Array.isArray(contractRecords)) setContracts(contractRecords);
      if (needsParties && Array.isArray(partyRecords)) setParties(partyRecords);
      if ((needsContracts && !Array.isArray(contractRecords)) || (needsParties && !Array.isArray(partyRecords))) setReferenceError('Could not load saved references. You can enter a real contract ID or retry this tool; examples will never invent record IDs.');
      setReferencesLoading(false);
    };
    void load();
    return () => controller.abort();
  }, [activeId]);

  const loadHistory = async (toolId: string, signal: AbortSignal) => {
    try {
      const { data } = await api.get('/ai/results', { params: { feature: toolId, limit: 20 }, signal });
      if (!signal.aborted && activeTool.current === toolId) {
        if (!Array.isArray(data?.data)) throw new TypeError('Unexpected saved AI results response');
        setHistory(data.data);
      }
    } catch (e: any) { if (!signal.aborted && activeTool.current === toolId) setError(e.response?.data?.error || e.message); }
  };

  useEffect(() => {
    const controller = new AbortController();
    if (showHistory) void loadHistory(activeId, controller.signal);
    return () => controller.abort();
  }, [showHistory, activeId]);

  const fillExample = (index: number) => {
    const filled = fillContractAIExample(activeId, index, tool.fields, form, contracts, parties);
    setForm(filled.values); setResult(null); setError(null);
    setStatus(filled.missingReference
      ? 'The editable fields are filled. Select or enter an existing contract ID before generating; no sample contract was created.'
      : 'All inputs are filled, including optional fields. Review them, then generate with OpenRouter.');
  };

  const cancel = () => {
    if (request.current) {
      request.current.abort(); request.current = null; setLoading(false); setResult(null); setError(null);
      setStatus('Request canceled. Your inputs are ready to edit.');
    } else {
      setForm({}); setResult(null); setError(null); setStatus(null);
    }
  };

  const submit = async () => {
    if (request.current) return;
    setError(null); setResult(null); setStatus(null);
    const missing = tool.fields.find(f => f.required && (!form[f.name] || String(form[f.name]).trim() === ''));
    if (missing) { setError(`${missing.label} is required`); return; }
    let payload: Record<string, string | number>;
    try { payload = contractAIRequestPayload(activeId, tool.fields, form); }
    catch (e: any) { setError(e.message); return; }
    const controller = new AbortController();
    request.current = controller;
    setLoading(true);
    try {
      const { data } = await api.post(`/ai/${activeId}`, payload, { signal: controller.signal });
      if (controller.signal.aborted || activeTool.current !== activeId) return;
      setResult(data);
      if (showHistory) void loadHistory(activeId, controller.signal);
    } catch (e: any) {
      if (!controller.signal.aborted && activeTool.current === activeId) setError(e.response?.data?.error || e.response?.data?.errors?.[0]?.msg || e.message);
    } finally {
      if (request.current === controller) { request.current = null; setLoading(false); }
    }
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
              aria-pressed={activeId === t.id}
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
          <p className="text-sm text-gray-600 mb-3">Fill every input with an editable example. Planning text is fictional; contract and party references use your saved records. Examples do not run AI.</p>
          <div className="flex flex-wrap gap-2 mb-4">
            {AI_EXAMPLE_LABELS.map((label, index) => (
              <button key={label} type="button" onClick={() => fillExample(index)} disabled={loading || referencesLoading}
                className="border border-purple-200 bg-purple-50 text-purple-700 rounded-lg px-3 py-2 text-sm hover:bg-purple-100 disabled:opacity-50">
                Fill: {label}
              </button>
            ))}
          </div>
          {referencesLoading && <p className="text-sm text-gray-500 mb-3" role="status">Loading saved references…</p>}
          {referenceError && <p className="text-sm text-amber-700 mb-3" role="status">{referenceError}</p>}
          <div className="space-y-3">
            {tool.fields.map(f => (
              <div key={f.name}>
                <label htmlFor={`ai-${activeId}-${f.name}`} className="block text-sm font-medium text-gray-700 mb-1">
                  {f.label}{f.required ? <span className="text-red-500"> *</span> : <span className="text-gray-500 font-normal"> (optional)</span>}
                </label>
                {f.type === 'textarea' ? (
                  <textarea
                    id={`ai-${activeId}-${f.name}`}
                    disabled={loading}
                    rows={4}
                    value={form[f.name] ?? ''}
                    onChange={e => setForm({ ...form, [f.name]: e.target.value })}
                    className="w-full border rounded px-3 py-2 text-sm"
                  />
                ) : f.name === 'party_id' || (activeId === 'historical-analytics' && f.name === 'contract_type') ? (
                  <select id={`ai-${activeId}-${f.name}`} disabled={loading} value={form[f.name] ?? ''}
                    onChange={e => setForm({ ...form, [f.name]: e.target.value })} className="w-full border rounded px-3 py-2 text-sm">
                    <option value="">Select scope…</option>
                    <option value={ALL_RECORDS}>{f.name === 'party_id' ? 'All parties' : 'All contract types'}</option>
                    {f.name === 'party_id'
                      ? parties.map(party => <option key={party.id} value={party.id}>{party.name || `Party #${party.id}`} (#{party.id})</option>)
                      : [...new Set(contracts.map(contract => contract.contractType).filter((type): type is string => !!type))].map(type => <option key={type} value={type}>{type}</option>)}
                  </select>
                ) : f.type === 'select' ? (
                  <select
                    id={`ai-${activeId}-${f.name}`}
                    disabled={loading}
                    value={form[f.name] ?? ''}
                    onChange={e => setForm({ ...form, [f.name]: e.target.value })}
                    className="w-full border rounded px-3 py-2 text-sm"
                  >
                    <option value="">Select...</option>
                    {f.options?.map(o => <option key={o} value={o}>{o}</option>)}
                  </select>
                ) : (
                  <input
                    id={`ai-${activeId}-${f.name}`}
                    disabled={loading}
                    type={f.type || 'text'}
                    min={f.type === 'number' ? 1 : undefined}
                    step={f.type === 'number' ? 1 : undefined}
                    list={f.name === 'contract_id' ? `saved-contracts-${activeId}` : undefined}
                    value={form[f.name] ?? ''}
                    onChange={e => setForm({ ...form, [f.name]: e.target.value })}
                    className="w-full border rounded px-3 py-2 text-sm"
                  />
                )}
                {f.name === 'contract_id' && <>
                  <datalist id={`saved-contracts-${activeId}`}>
                    {contracts.map(contract => <option key={contract.id} value={contract.id}>{contract.title || `Contract #${contract.id}`}</option>)}
                  </datalist>
                  <p className="text-xs text-gray-500 mt-1">Choose a saved contract from the suggestions or enter its actual ID.</p>
                </>}
              </div>
            ))}
            <button
              onClick={submit}
              disabled={loading}
              className="w-full bg-purple-600 text-white py-2 rounded-lg hover:bg-purple-700 disabled:opacity-50 flex items-center justify-center gap-2"
            >
              <Play className="w-4 h-4" /> {loading ? 'Generating…' : 'Generate with OpenRouter'}
            </button>
            <button type="button" onClick={cancel} className="w-full border border-gray-300 text-gray-700 py-2 rounded-lg hover:bg-gray-50">{loading ? 'Cancel request' : 'Cancel'}</button>
            {status && <p role="status" className="text-sm text-gray-600">{status}</p>}
            {error && <div role="alert" className="bg-red-50 border border-red-200 text-red-700 p-3 rounded text-sm">{error}</div>}
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold mb-4">Result</h2>
          {loading && <div className="text-gray-500">Running...</div>}
          {!loading && !result && <div className="text-gray-400 text-sm">No result yet. Run a tool to see output.</div>}
          {result && (
            <div>
              {result.model && <div className="text-xs text-gray-500 mb-2">Model: {result.model} · Tokens: {result.usage?.total_tokens || 'n/a'}</div>}
              <FormattedAIReport response={result} />
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
                <FormattedAIReport response={r.output} />
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
