import { useEffect, useState } from 'react';
import api from '../services/api';

export default function ClauseDiffViewer() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    api.get('/custom-views/clause-diff')
      .then((r) => setData(r.data))
      .catch((e) => setError(e.message || 'Failed to load diff'))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="p-4 text-gray-500">Loading clause diff...</div>;
  if (error) return <div className="p-4 text-red-600">Error: {error}</div>;
  if (!data) return null;

  const maxLines = Math.max(data.original.length, data.counterparty.length);
  const changedSet = new Set(data.changes.map((c) => c.line));

  return (
    <div className="bg-white rounded-lg shadow border border-gray-200 p-5">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900">
          Clause Diff: {data.clause_title}
        </h3>
        <span className="text-xs px-2 py-1 rounded bg-amber-100 text-amber-800">
          {data.changes.length} changes
        </span>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <div className="text-xs font-semibold text-gray-600 mb-2 uppercase">Our Version</div>
          <div className="bg-red-50 border border-red-200 rounded font-mono text-sm">
            {Array.from({ length: maxLines }).map((_, i) => {
              const line = data.original[i];
              const isChanged = line && changedSet.has(line.line);
              return (
                <div
                  key={i}
                  className={`flex border-b border-red-100 last:border-b-0 ${isChanged ? 'bg-red-100' : ''}`}
                >
                  <span className="w-8 text-right pr-2 py-1 text-gray-400 select-none">
                    {line ? line.line : ''}
                  </span>
                  <span className={`flex-1 px-2 py-1 ${isChanged ? 'text-red-800 line-through' : 'text-gray-800'}`}>
                    {line ? line.text : ' '}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        <div>
          <div className="text-xs font-semibold text-gray-600 mb-2 uppercase">Counterparty Markup</div>
          <div className="bg-green-50 border border-green-200 rounded font-mono text-sm">
            {Array.from({ length: maxLines }).map((_, i) => {
              const line = data.counterparty[i];
              const isChanged = line && changedSet.has(line.line);
              return (
                <div
                  key={i}
                  className={`flex border-b border-green-100 last:border-b-0 ${isChanged ? 'bg-green-100' : ''}`}
                >
                  <span className="w-8 text-right pr-2 py-1 text-gray-400 select-none">
                    {line ? line.line : ''}
                  </span>
                  <span className={`flex-1 px-2 py-1 ${isChanged ? 'text-green-800 font-semibold' : 'text-gray-800'}`}>
                    {line ? line.text : ' '}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <div className="mt-4">
        <div className="text-xs font-semibold text-gray-600 mb-2 uppercase">Change Summary</div>
        <ul className="space-y-1">
          {data.changes.map((c) => (
            <li key={c.line} className="text-sm text-gray-700">
              <span className="inline-block w-12 text-gray-500">L{c.line}</span>
              <span className="inline-block w-20 text-xs uppercase font-semibold text-amber-700">{c.type}</span>
              <span>{c.summary}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
