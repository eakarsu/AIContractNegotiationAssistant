import { useState } from 'react';
import api from '../services/api';
import { AlertTriangle, Play } from 'lucide-react';

export default function HighlightRisksStateless() {
  const [contractText, setContractText] = useState('');
  const [partyPerspective, setPartyPerspective] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const submit = async () => {
    setError(null);
    setResult(null);
    if (!contractText.trim()) {
      setError('Contract text is required');
      return;
    }
    setLoading(true);
    try {
      const { data } = await api.post('/ai/highlight-risks', {
        contract_text: contractText,
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
          <AlertTriangle className="w-7 h-7 text-amber-600" />
          Highlight Risks (Stateless)
        </h1>
        <p className="text-gray-600">Identify risk clauses in contract text without saving</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h2 className="text-lg font-semibold mb-4">Input</h2>
          <div className="space-y-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Contract Text <span className="text-red-500">*</span>
              </label>
              <textarea
                rows={12}
                value={contractText}
                onChange={(e) => setContractText(e.target.value)}
                placeholder="Paste full contract text..."
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Party Perspective</label>
              <input
                type="text"
                value={partyPerspective}
                onChange={(e) => setPartyPerspective(e.target.value)}
                placeholder="e.g., the receiving party, buyer, vendor"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
              />
            </div>
            <button
              onClick={submit}
              disabled={loading}
              className="w-full bg-primary-600 text-white py-2 rounded-lg hover:bg-primary-700 disabled:opacity-50 flex items-center justify-center gap-2"
            >
              <Play className="w-4 h-4" /> {loading ? 'Analyzing...' : 'Analyze Risks'}
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
          {loading && <div className="text-gray-500">Analyzing...</div>}
          {!loading && !result && (
            <div className="text-gray-400 text-sm">No analysis yet. Submit to see results.</div>
          )}
          {result && (
            <div>
              {result.party_perspective && (
                <div className="text-xs text-gray-500 mb-2">Perspective: {result.party_perspective}</div>
              )}
              <pre className="bg-gray-50 p-3 rounded text-xs overflow-auto max-h-[600px] whitespace-pre-wrap">
                {typeof result.analysis === 'string' ? result.analysis : JSON.stringify(result.analysis, null, 2)}
              </pre>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
