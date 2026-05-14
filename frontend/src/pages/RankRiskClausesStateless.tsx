import { useState } from 'react';
import api from '../services/api';
import { ListOrdered, Play } from 'lucide-react';

export default function RankRiskClausesStateless() {
  const [clausesText, setClausesText] = useState('');
  const [contractType, setContractType] = useState('');
  const [partyPerspective, setPartyPerspective] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const submit = async () => {
    setError(null);
    setResult(null);
    const clauses = clausesText
      .split(/\n{2,}/)
      .map((c) => c.trim())
      .filter(Boolean);
    if (clauses.length === 0) {
      setError('Enter at least one clause (separate clauses with a blank line)');
      return;
    }
    setLoading(true);
    try {
      const { data } = await api.post('/ai/rank-risk-clauses', {
        clauses,
        contract_type: contractType || undefined,
        party_perspective: partyPerspective || undefined,
      });
      setResult(data);
    } catch (e: any) {
      setError(e.response?.data?.error || e.response?.data?.errors?.[0]?.msg || e.message);
    }
    setLoading(false);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <ListOrdered className="w-7 h-7 text-amber-600" />
          Rank Risk Clauses
        </h1>
        <p className="text-gray-600">Score and rank candidate clauses by risk severity</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h2 className="text-lg font-semibold mb-4">Input</h2>
          <div className="space-y-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Clauses <span className="text-red-500">*</span>
              </label>
              <textarea
                rows={12}
                value={clausesText}
                onChange={(e) => setClausesText(e.target.value)}
                placeholder="Paste clauses, separated by a blank line..."
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
              />
              <p className="text-xs text-gray-500 mt-1">Separate clauses with a blank line.</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Contract Type</label>
              <input
                type="text"
                value={contractType}
                onChange={(e) => setContractType(e.target.value)}
                placeholder="e.g., MSA, SaaS, NDA"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Party Perspective</label>
              <input
                type="text"
                value={partyPerspective}
                onChange={(e) => setPartyPerspective(e.target.value)}
                placeholder="e.g., buyer, vendor"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
              />
            </div>
            <button
              onClick={submit}
              disabled={loading}
              className="w-full bg-primary-600 text-white py-2 rounded-lg hover:bg-primary-700 disabled:opacity-50 flex items-center justify-center gap-2"
            >
              <Play className="w-4 h-4" /> {loading ? 'Ranking...' : 'Rank Clauses'}
            </button>
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 p-3 rounded text-sm">
                {error}
              </div>
            )}
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h2 className="text-lg font-semibold mb-4">Result</h2>
          {loading && <div className="text-gray-500">Ranking...</div>}
          {!loading && !result && (
            <div className="text-gray-400 text-sm">No ranking yet.</div>
          )}
          {result && (
            <div>
              {typeof result.count === 'number' && (
                <div className="text-xs text-gray-500 mb-2">Clauses analyzed: {result.count}</div>
              )}
              <pre className="bg-gray-50 p-3 rounded text-xs overflow-auto max-h-[600px] whitespace-pre-wrap">
                {typeof result.ranking === 'string' ? result.ranking : JSON.stringify(result.ranking, null, 2)}
              </pre>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
