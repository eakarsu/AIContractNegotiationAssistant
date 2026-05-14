import { useState } from 'react';
import api from '../services/api';
import { GitCompareArrows, Play } from 'lucide-react';

export default function StandardTermsCompareStateless() {
  const [proposedTerms, setProposedTerms] = useState('');
  const [contractType, setContractType] = useState('');
  const [industry, setIndustry] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const submit = async () => {
    setError(null);
    setResult(null);
    if (!proposedTerms.trim()) {
      setError('Proposed terms is required');
      return;
    }
    if (!contractType.trim()) {
      setError('Contract type is required');
      return;
    }
    setLoading(true);
    try {
      const { data } = await api.post('/ai/standard-terms-compare', {
        proposed_terms: proposedTerms,
        contract_type: contractType,
        industry: industry || undefined,
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
          <GitCompareArrows className="w-7 h-7 text-blue-600" />
          Standard Terms Compare (Stateless)
        </h1>
        <p className="text-gray-600">Compare proposed terms against industry-standard contract terms</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h2 className="text-lg font-semibold mb-4">Input</h2>
          <div className="space-y-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Contract Type <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={contractType}
                onChange={(e) => setContractType(e.target.value)}
                placeholder="e.g., MSA, NDA, Lease, Employment"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Industry</label>
              <input
                type="text"
                value={industry}
                onChange={(e) => setIndustry(e.target.value)}
                placeholder="e.g., SaaS, Construction, Healthcare"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Proposed Terms <span className="text-red-500">*</span>
              </label>
              <textarea
                rows={12}
                value={proposedTerms}
                onChange={(e) => setProposedTerms(e.target.value)}
                placeholder="Paste proposed contract terms..."
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
              />
            </div>
            <button
              onClick={submit}
              disabled={loading}
              className="w-full bg-primary-600 text-white py-2 rounded-lg hover:bg-primary-700 disabled:opacity-50 flex items-center justify-center gap-2"
            >
              <Play className="w-4 h-4" /> {loading ? 'Comparing...' : 'Compare Terms'}
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
          {loading && <div className="text-gray-500">Comparing...</div>}
          {!loading && !result && (
            <div className="text-gray-400 text-sm">No comparison yet. Submit to see results.</div>
          )}
          {result && (
            <div>
              {(result.contract_type || result.industry) && (
                <div className="text-xs text-gray-500 mb-2">
                  {result.contract_type && `Type: ${result.contract_type}`}
                  {result.industry && ` · Industry: ${result.industry}`}
                </div>
              )}
              <pre className="bg-gray-50 p-3 rounded text-xs overflow-auto max-h-[600px] whitespace-pre-wrap">
                {typeof result.comparison === 'string' ? result.comparison : JSON.stringify(result.comparison, null, 2)}
              </pre>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
