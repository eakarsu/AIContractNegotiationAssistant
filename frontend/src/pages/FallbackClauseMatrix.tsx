import { useEffect, useState } from 'react';
import api from '../services/api';

type ClausePosition = {
  id: number;
  topic: string;
  preferred: string;
  fallback: string;
  walkAway: string;
  owner: string;
};

export default function FallbackClauseMatrix() {
  const [positions, setPositions] = useState<ClausePosition[]>([]);
  const [summary, setSummary] = useState<Record<string, number>>({});
  const [recommendation, setRecommendation] = useState<any>(null);

  useEffect(() => {
    api.get('/fallback-clause-matrix').then((res) => {
      setPositions(res.data.clausePositions || []);
      setSummary(res.data.summary || {});
    });
  }, []);

  const runRecommendation = async (topic: string) => {
    const res = await api.post('/fallback-clause-matrix/recommend', { topic });
    setRecommendation(res.data);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Fallback Clause Matrix</h1>
        <p className="text-gray-600">Approved preferred, fallback, and walk-away positions for active negotiations.</p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {Object.entries(summary).map(([label, value]) => (
          <div key={label} className="bg-white border border-gray-200 rounded-lg p-4">
            <div className="text-sm text-gray-500">{label}</div>
            <div className="text-2xl font-semibold text-gray-900">{value}</div>
          </div>
        ))}
      </div>
      <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-left">
            <tr><th className="p-3">Topic</th><th className="p-3">Preferred</th><th className="p-3">Fallback</th><th className="p-3">Walk-away</th><th className="p-3">Owner</th><th className="p-3">Action</th></tr>
          </thead>
          <tbody>
            {positions.map((item) => (
              <tr key={item.id} className="border-t border-gray-100">
                <td className="p-3 font-medium">{item.topic}</td>
                <td className="p-3">{item.preferred}</td>
                <td className="p-3">{item.fallback}</td>
                <td className="p-3">{item.walkAway}</td>
                <td className="p-3">{item.owner}</td>
                <td className="p-3"><button className="px-3 py-1.5 bg-primary-600 text-white rounded-md" onClick={() => runRecommendation(item.topic)}>Recommend</button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {recommendation && (
        <div className="bg-primary-50 border border-primary-200 rounded-lg p-4">
          <h2 className="font-semibold text-primary-900">{recommendation.topic}</h2>
          <p className="text-primary-800">{recommendation.recommendedFallback}</p>
          <p className="text-sm text-primary-700 mt-2">{recommendation.negotiationNote}</p>
        </div>
      )}
    </div>
  );
}
