import { useEffect, useState } from 'react';
import api from '../services/api';

export default function RedlinePDF() {
  const [contracts, setContracts] = useState([]);
  const [selected, setSelected] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);
  const [message, setMessage] = useState(null);

  useEffect(() => {
    api.get('/custom-views/contracts-list')
      .then((r) => {
        setContracts(r.data || []);
        if (r.data && r.data.length) setSelected(r.data[0].id);
      })
      .catch((e) => setError(e.message || 'Failed to load contracts'));
  }, []);

  const exportPdf = async () => {
    setBusy(true);
    setError(null);
    setMessage(null);
    try {
      const contract = contracts.find((c) => c.id === selected);
      const r = await api.post(
        '/custom-views/redline-pdf',
        { contract_id: selected, contract_title: contract ? contract.title : selected },
        { responseType: 'blob' }
      );
      const blob = new Blob([r.data], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `redline_${selected}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
      setMessage('PDF exported successfully.');
    } catch (e) {
      setError(e.message || 'Failed to export PDF');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow border border-gray-200 p-5">
      <h3 className="text-lg font-semibold text-gray-900 mb-2">Redline PDF Export</h3>
      <p className="text-sm text-gray-500 mb-4">
        Pick a contract and export a redlined PDF with track-changes annotations.
      </p>

      <div className="flex items-end gap-3 flex-wrap">
        <div className="flex-1 min-w-[240px]">
          <label className="block text-xs font-semibold text-gray-600 mb-1">Contract</label>
          <select
            className="w-full border border-gray-300 rounded px-3 py-2 text-sm"
            value={selected}
            onChange={(e) => setSelected(e.target.value)}
            disabled={!contracts.length}
          >
            {contracts.map((c) => (
              <option key={c.id} value={c.id}>
                {c.title} ({c.status})
              </option>
            ))}
          </select>
        </div>
        <button
          onClick={exportPdf}
          disabled={!selected || busy}
          className="px-4 py-2 rounded bg-primary-600 text-white text-sm font-medium hover:bg-primary-700 disabled:opacity-50"
        >
          {busy ? 'Exporting...' : 'Export Redline PDF'}
        </button>
      </div>

      {message && (
        <div className="mt-3 text-sm text-green-700 bg-green-50 border border-green-200 rounded p-2">
          {message}
        </div>
      )}
      {error && (
        <div className="mt-3 text-sm text-red-700 bg-red-50 border border-red-200 rounded p-2">
          {error}
        </div>
      )}

      {contracts.length > 0 && (
        <div className="mt-4">
          <div className="text-xs font-semibold text-gray-600 mb-1 uppercase">Available Contracts</div>
          <ul className="text-sm text-gray-700 space-y-1">
            {contracts.map((c) => (
              <li key={c.id} className="flex justify-between border-b border-gray-100 py-1">
                <span>{c.title}</span>
                <span className="text-gray-500 text-xs">{c.status} · ${c.value.toLocaleString()}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
