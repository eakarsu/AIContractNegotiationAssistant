import { useEffect, useState } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Cell,
} from 'recharts';
import api from '../services/api';

const STATUS_COLOR = {
  draft: '#9CA3AF',
  internal_review: '#60A5FA',
  sent: '#34D399',
  received: '#F59E0B',
  counter: '#A78BFA',
  executed: '#10B981',
};

export default function NegotiationTimeline() {
  const [contract, setContract] = useState('');
  const [revisions, setRevisions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    api.get('/custom-views/negotiation-timeline')
      .then((r) => {
        setContract(r.data.contract);
        setRevisions(r.data.revisions || []);
      })
      .catch((e) => setError(e.message || 'Failed to load timeline'))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="p-4 text-gray-500">Loading timeline...</div>;
  if (error) return <div className="p-4 text-red-600">Error: {error}</div>;

  // Build horizontal bar data: x = day, y = version
  const data = revisions.map((r) => ({
    name: r.version,
    day: r.day,
    changes: r.changes,
    status: r.status,
    date: r.date,
    author: r.author,
  }));

  return (
    <div className="bg-white rounded-lg shadow border border-gray-200 p-5">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">Negotiation Timeline</h3>
          <p className="text-sm text-gray-500">{contract}</p>
        </div>
        <span className="text-xs px-2 py-1 rounded bg-indigo-100 text-indigo-700">
          {revisions.length} revisions
        </span>
      </div>

      <div style={{ width: '100%', height: 360 }}>
        <ResponsiveContainer>
          <BarChart data={data} layout="vertical" margin={{ top: 10, right: 30, left: 80, bottom: 10 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
            <XAxis type="number" dataKey="day" label={{ value: 'Days since draft', position: 'insideBottom', offset: -2 }} />
            <YAxis type="category" dataKey="name" width={110} />
            <Tooltip
              formatter={(value, name) => (name === 'day' ? [`Day ${value}`, 'Days'] : [value, name])}
              labelFormatter={(label) => `Revision: ${label}`}
              content={({ active, payload }) => {
                if (!active || !payload || !payload.length) return null;
                const p = payload[0].payload;
                return (
                  <div className="bg-white border border-gray-200 rounded shadow p-2 text-xs">
                    <div className="font-semibold">{p.name}</div>
                    <div>Date: {p.date}</div>
                    <div>Author: {p.author}</div>
                    <div>Day {p.day} / {p.changes} changes</div>
                    <div>Status: {p.status}</div>
                  </div>
                );
              }}
            />
            <Legend />
            <Bar dataKey="day" name="Day in negotiation" barSize={18}>
              {data.map((entry, idx) => (
                <Cell key={idx} fill={STATUS_COLOR[entry.status] || '#6366F1'} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="mt-4 flex flex-wrap gap-3 text-xs">
        {Object.entries(STATUS_COLOR).map(([k, v]) => (
          <div key={k} className="flex items-center gap-1">
            <span className="inline-block w-3 h-3 rounded" style={{ background: v }} />
            <span className="text-gray-700">{k.replace(/_/g, ' ')}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
