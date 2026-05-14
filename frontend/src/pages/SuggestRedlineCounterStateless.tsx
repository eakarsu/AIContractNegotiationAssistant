import { useState } from 'react';
import api from '../services/api';
import { GitPullRequest, Play } from 'lucide-react';

export default function SuggestRedlineCounterStateless() {
  const [originalClause, setOriginalClause] = useState('');
  const [counterpartyRedline, setCounterpartyRedline] = useState('');
  const [ourPosition, setOurPosition] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const submit = async () => {
    setError(null);
    setResult(null);
    if (!originalClause.trim() || !counterpartyRedline.trim()) {
      setError('Original clause and counterparty redline are required');
      return;
    }
    setLoading(true);
    try {
      const { data } = await api.post('/ai/suggest-redline-counter', {
        original_clause: originalClause,
        counterparty_redline: counterpartyRedline,
        our_position: ourPosition || undefined,
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
          <GitPullRequest className="w-7 h-7 text-amber-600" />
          Suggest Redline Counter
        </h1>
        <p className="text-gray-600">Get a counter-redline plus fallback positions</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h2 className="text-lg font-semibold mb-4">Input</h2>
          <div className="space-y-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Original Clause <span className="text-red-500">*</span>
              </label>
              <textarea
                rows={6}
                value={originalClause}
                onChange={(e) => setOriginalClause(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Counterparty Redline <span className="text-red-500">*</span>
              </label>
              <textarea
                rows={6}
                value={counterpartyRedline}
                onChange={(e) => setCounterpartyRedline(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Our Position / Priorities</label>
              <textarea
                rows={3}
                value={ourPosition}
                onChange={(e) => setOurPosition(e.target.value)}
                placeholder="Optional context on our priorities..."
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
              />
            </div>
            <button
              onClick={submit}
              disabled={loading}
              className="w-full bg-primary-600 text-white py-2 rounded-lg hover:bg-primary-700 disabled:opacity-50 flex items-center justify-center gap-2"
            >
              <Play className="w-4 h-4" /> {loading ? 'Generating...' : 'Suggest Counter'}
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
          {loading && <div className="text-gray-500">Generating counter...</div>}
          {!loading && !result && (
            <div className="text-gray-400 text-sm">No counter-redline yet.</div>
          )}
          {result && (
            <pre className="bg-gray-50 p-3 rounded text-xs overflow-auto max-h-[600px] whitespace-pre-wrap">
              {typeof result.counter_redline === 'string'
                ? result.counter_redline
                : JSON.stringify(result.counter_redline, null, 2)}
            </pre>
          )}
        </div>
      </div>
    </div>
  );
}
