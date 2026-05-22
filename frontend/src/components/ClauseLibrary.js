import { useEffect, useState } from 'react';
import api from '../services/api';

const emptyForm = { category: '', text: '', risk_score: 0 };

export default function ClauseLibrary() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(emptyForm);

  const reload = () => {
    setLoading(true);
    api.get('/custom-views/clause-library')
      .then((r) => setItems(r.data || []))
      .catch((e) => setError(e.message || 'Failed to load'))
      .finally(() => setLoading(false));
  };

  useEffect(() => { reload(); }, []);

  const resetForm = () => {
    setForm(emptyForm);
    setEditingId(null);
  };

  const submit = async (e) => {
    e.preventDefault();
    if (!form.category.trim() || !form.text.trim()) {
      setError('Category and text are required');
      return;
    }
    try {
      if (editingId) {
        await api.put(`/custom-views/clause-library/${editingId}`, form);
      } else {
        await api.post('/custom-views/clause-library', form);
      }
      resetForm();
      reload();
    } catch (e) {
      setError(e.message || 'Save failed');
    }
  };

  const startEdit = (it) => {
    setEditingId(it.id);
    setForm({ category: it.category, text: it.text, risk_score: it.risk_score });
  };

  const remove = async (id) => {
    try {
      await api.delete(`/custom-views/clause-library/${id}`);
      reload();
    } catch (e) {
      setError(e.message || 'Delete failed');
    }
  };

  const riskColor = (s) => {
    if (s >= 7) return 'bg-red-100 text-red-800';
    if (s >= 4) return 'bg-amber-100 text-amber-800';
    return 'bg-green-100 text-green-800';
  };

  return (
    <div className="bg-white rounded-lg shadow border border-gray-200 p-5">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900">Standard Clause Library</h3>
        <span className="text-xs px-2 py-1 rounded bg-gray-100 text-gray-700">
          {items.length} clauses
        </span>
      </div>

      {error && (
        <div className="mb-3 text-sm text-red-700 bg-red-50 border border-red-200 rounded p-2">
          {error}
        </div>
      )}

      <form onSubmit={submit} className="grid grid-cols-12 gap-2 mb-4">
        <input
          className="col-span-3 border border-gray-300 rounded px-2 py-1 text-sm"
          placeholder="Category"
          value={form.category}
          onChange={(e) => setForm({ ...form, category: e.target.value })}
        />
        <input
          className="col-span-6 border border-gray-300 rounded px-2 py-1 text-sm"
          placeholder="Clause text"
          value={form.text}
          onChange={(e) => setForm({ ...form, text: e.target.value })}
        />
        <input
          type="number"
          min="0"
          max="10"
          className="col-span-1 border border-gray-300 rounded px-2 py-1 text-sm"
          placeholder="Risk"
          value={form.risk_score}
          onChange={(e) => setForm({ ...form, risk_score: Number(e.target.value) })}
        />
        <button
          type="submit"
          className="col-span-1 px-2 py-1 rounded bg-primary-600 text-white text-sm hover:bg-primary-700"
        >
          {editingId ? 'Update' : 'Add'}
        </button>
        <button
          type="button"
          onClick={resetForm}
          className="col-span-1 px-2 py-1 rounded bg-gray-200 text-gray-700 text-sm hover:bg-gray-300"
        >
          Clear
        </button>
      </form>

      {loading ? (
        <div className="text-gray-500 text-sm">Loading...</div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-gray-600">
              <tr>
                <th className="text-left px-3 py-2">Category</th>
                <th className="text-left px-3 py-2">Text</th>
                <th className="text-left px-3 py-2">Risk</th>
                <th className="text-right px-3 py-2">Actions</th>
              </tr>
            </thead>
            <tbody>
              {items.map((it) => (
                <tr key={it.id} className="border-t border-gray-100 align-top">
                  <td className="px-3 py-2 font-medium text-gray-900">{it.category}</td>
                  <td className="px-3 py-2 text-gray-700">{it.text}</td>
                  <td className="px-3 py-2">
                    <span className={`px-2 py-0.5 rounded text-xs font-semibold ${riskColor(it.risk_score)}`}>
                      {it.risk_score}
                    </span>
                  </td>
                  <td className="px-3 py-2 text-right whitespace-nowrap">
                    <button
                      onClick={() => startEdit(it)}
                      className="px-2 py-1 text-xs rounded bg-blue-50 text-blue-700 hover:bg-blue-100 mr-1"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => remove(it.id)}
                      className="px-2 py-1 text-xs rounded bg-red-50 text-red-700 hover:bg-red-100"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
