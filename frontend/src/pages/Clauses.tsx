import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Search, Scale, AlertTriangle } from 'lucide-react';
import { getClauses, createClause, deleteClause, exportClausesCSV, downloadBlob } from '../services/api';
import { useToast } from '../hooks/useToast';
import { useEscapeKey } from '../hooks/useEscapeKey';
import { useBulkSelect } from '../hooks/useBulkSelect';
import { useConfirm } from '../hooks/useConfirm';
import CardGridSkeleton from '../components/skeletons/CardGridSkeleton';
import EmptyState from '../components/EmptyState';
import Pagination from '../components/Pagination';
import ExportButton from '../components/ExportButton';
import BulkActionBar from '../components/BulkActionBar';

const PAGE_SIZE = 15;

export default function Clauses() {
  const navigate = useNavigate();
  const toast = useToast();
  const confirm = useConfirm();
  const [clauses, setClauses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [page, setPage] = useState(1);
  const [newClause, setNewClause] = useState({
    title: '',
    content: '',
    category: 'General',
    riskLevel: 'low',
    isStandard: false,
    jurisdiction: 'United States'
  });

  useEscapeKey(() => setShowModal(false), showModal);

  useEffect(() => {
    loadClauses();
  }, []);

  // Reset page when filters change
  useEffect(() => {
    setPage(1);
  }, [searchTerm, categoryFilter]);

  const loadClauses = async () => {
    try {
      const response = await getClauses();
      setClauses(response.data);
    } catch (error) {
      console.error('Failed to load clauses:', error);
      toast.error('Failed to load clauses');
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await createClause(newClause);
      setShowModal(false);
      setNewClause({ title: '', content: '', category: 'General', riskLevel: 'low', isStandard: false, jurisdiction: 'United States' });
      toast.success('Clause created');
      loadClauses();
    } catch (error) {
      console.error('Failed to create clause:', error);
      toast.error('Failed to create clause');
    } finally {
      setSubmitting(false);
    }
  };

  const filteredClauses = clauses.filter(clause => {
    const matchesSearch = clause.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      clause.content.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = !categoryFilter || clause.category === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  const totalPages = Math.ceil(filteredClauses.length / PAGE_SIZE);
  const paginatedClauses = filteredClauses.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const { selectedIds, toggle, toggleAll, clear, isSelected, allSelected, selectedCount } = useBulkSelect(paginatedClauses);

  const handleBulkDelete = async () => {
    const ok = await confirm({
      title: 'Delete clauses',
      message: `Are you sure you want to delete ${selectedCount} clause${selectedCount > 1 ? 's' : ''}? This action cannot be undone.`,
      confirmLabel: 'Delete',
      variant: 'danger',
    });
    if (!ok) return;
    try {
      await Promise.all(Array.from(selectedIds).map(id => deleteClause(id)));
      toast.success(`${selectedCount} clause${selectedCount > 1 ? 's' : ''} deleted`);
      clear();
      loadClauses();
    } catch (error) {
      console.error('Failed to delete clauses:', error);
      toast.error('Failed to delete some clauses');
    }
  };

  const handleExportCSV = async () => {
    try {
      const response = await exportClausesCSV();
      downloadBlob(response.data, 'clauses.csv');
      toast.success('Clauses exported');
    } catch (error) {
      console.error('Failed to export clauses:', error);
      toast.error('Failed to export clauses');
    }
  };

  const categories = [...new Set(clauses.map(c => c.category))];

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Clause Library</h1>
            <p className="text-gray-600">Reusable contract clauses</p>
          </div>
        </div>
        <CardGridSkeleton count={6} />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Clause Library</h1>
          <p className="text-gray-600">Reusable contract clauses</p>
        </div>
        <div className="flex items-center gap-2">
          <ExportButton onExportCSV={handleExportCSV} />
          <button
            onClick={() => setShowModal(true)}
            className="inline-flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition"
          >
            <Plus size={20} />
            New Clause
          </button>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
          <input
            type="text"
            placeholder="Search clauses..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
          />
        </div>
        <select
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
          className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
        >
          <option value="">All Categories</option>
          {categories.map(cat => (
            <option key={cat} value={cat}>{cat}</option>
          ))}
        </select>
      </div>

      {filteredClauses.length === 0 ? (
        <EmptyState
          icon={Scale}
          title="No clauses found"
          description={searchTerm || categoryFilter ? 'Try adjusting your search or filter criteria.' : 'Create your first clause to get started.'}
          actionLabel={!searchTerm && !categoryFilter ? 'New Clause' : undefined}
          onAction={!searchTerm && !categoryFilter ? () => setShowModal(true) : undefined}
        />
      ) : (
        <>
          {paginatedClauses.length > 0 && (
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <input
                type="checkbox"
                checked={allSelected}
                onChange={toggleAll}
                className="rounded border-gray-300"
              />
              <span>Select all on this page</span>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {paginatedClauses.map((clause) => (
              <div
                key={clause.id}
                className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 cursor-pointer hover:shadow-md hover:border-primary-200 transition relative"
              >
                <div className="absolute top-3 left-3 z-10" onClick={(e) => e.stopPropagation()}>
                  <input
                    type="checkbox"
                    checked={isSelected(clause.id)}
                    onChange={() => toggle(clause.id)}
                    className="rounded border-gray-300"
                  />
                </div>
                <div onClick={() => navigate(`/clauses/${clause.id}`)}>
                  <div className="flex items-start justify-between mb-3">
                    <div className="p-2 bg-purple-100 rounded-lg ml-6">
                      <Scale className="text-purple-600" size={20} />
                    </div>
                    <div className="flex items-center gap-2">
                      {clause.isStandard && (
                        <span className="px-2 py-1 text-xs font-medium bg-blue-100 text-blue-700 rounded-full">Standard</span>
                      )}
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                        clause.riskLevel === 'high' ? 'bg-red-100 text-red-700' :
                        clause.riskLevel === 'medium' ? 'bg-yellow-100 text-yellow-700' :
                        'bg-green-100 text-green-700'
                      }`}>
                        {clause.riskLevel}
                      </span>
                    </div>
                  </div>
                  <h3 className="font-semibold text-gray-900 mb-1">{clause.title}</h3>
                  <p className="text-sm text-gray-500 mb-2">{clause.category}</p>
                  <p className="text-sm text-gray-600 line-clamp-3">{clause.content.substring(0, 150)}...</p>
                </div>
              </div>
            ))}
          </div>

          <Pagination
            page={page}
            totalPages={totalPages}
            total={filteredClauses.length}
            limit={PAGE_SIZE}
            onPageChange={setPage}
          />
        </>
      )}

      <BulkActionBar
        selectedCount={selectedCount}
        onDelete={handleBulkDelete}
        onClear={clear}
      />

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto m-4">
            <div className="p-6 border-b border-gray-100">
              <h2 className="text-xl font-bold text-gray-900">New Clause</h2>
            </div>
            <form onSubmit={handleCreate} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
                <input
                  type="text"
                  value={newClause.title}
                  onChange={(e) => setNewClause({ ...newClause, title: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                  required
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                  <select
                    value={newClause.category}
                    onChange={(e) => setNewClause({ ...newClause, category: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                  >
                    <option>General</option>
                    <option>Confidentiality</option>
                    <option>Liability</option>
                    <option>Indemnification</option>
                    <option>Termination</option>
                    <option>IP Rights</option>
                    <option>Payment</option>
                    <option>Dispute Resolution</option>
                    <option>Data Protection</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Risk Level</label>
                  <select
                    value={newClause.riskLevel}
                    onChange={(e) => setNewClause({ ...newClause, riskLevel: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Content</label>
                <textarea
                  value={newClause.content}
                  onChange={(e) => setNewClause({ ...newClause, content: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                  rows={8}
                  required
                />
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={newClause.isStandard}
                  onChange={(e) => setNewClause({ ...newClause, isStandard: e.target.checked })}
                  className="rounded border-gray-300"
                />
                <label className="text-sm text-gray-700">Mark as standard clause</label>
              </div>
              <div className="flex justify-end gap-3 pt-4">
                <button type="button" onClick={() => setShowModal(false)} className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200">Cancel</button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {submitting ? 'Creating...' : 'Create Clause'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
