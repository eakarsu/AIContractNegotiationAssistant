import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Search, Clock, CheckCircle, AlertTriangle } from 'lucide-react';
import { getDeadlines, createDeadline, getContracts, completeDeadline, exportDeadlinesCSV, downloadBlob } from '../services/api';
import { useToast } from '../hooks/useToast';
import { useEscapeKey } from '../hooks/useEscapeKey';
import TableSkeleton from '../components/skeletons/TableSkeleton';
import EmptyState from '../components/EmptyState';
import Pagination from '../components/Pagination';
import ExportButton from '../components/ExportButton';

const PAGE_SIZE = 15;

export default function Deadlines() {
  const navigate = useNavigate();
  const toast = useToast();
  const [deadlines, setDeadlines] = useState<any[]>([]);
  const [contracts, setContracts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [page, setPage] = useState(1);
  const [newDeadline, setNewDeadline] = useState({ contractId: '', title: '', description: '', dueDate: '', reminderDate: '', priority: 'medium' });

  useEscapeKey(() => setShowModal(false), showModal);

  useEffect(() => { loadData(); }, []);

  // Reset page when filters change
  useEffect(() => { setPage(1); }, [searchTerm, statusFilter]);

  const loadData = async () => {
    try {
      const [deadlinesRes, contractsRes] = await Promise.all([getDeadlines(), getContracts()]);
      setDeadlines(deadlinesRes.data);
      setContracts(contractsRes.data);
    } catch (error) {
      console.error('Failed to load data:', error);
      toast.error('Failed to load deadlines');
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await createDeadline({ ...newDeadline, contractId: parseInt(newDeadline.contractId) });
      setShowModal(false);
      setNewDeadline({ contractId: '', title: '', description: '', dueDate: '', reminderDate: '', priority: 'medium' });
      toast.success('Deadline created successfully');
      loadData();
    } catch (error) {
      console.error('Failed to create deadline:', error);
      toast.error('Failed to create deadline');
    } finally {
      setSubmitting(false);
    }
  };

  const handleComplete = async (id: number, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await completeDeadline(id);
      toast.success('Deadline marked as complete');
      loadData();
    } catch (error) {
      console.error('Failed to complete deadline:', error);
      toast.error('Failed to complete deadline');
    }
  };

  const handleExportCSV = async () => {
    try {
      const response = await exportDeadlinesCSV();
      downloadBlob(response.data, 'deadlines.csv');
      toast.success('Deadlines exported successfully');
    } catch (error) {
      console.error('Failed to export:', error);
      toast.error('Failed to export deadlines');
    }
  };

  const isOverdue = (dueDate: string) => new Date(dueDate) < new Date();

  const filteredDeadlines = deadlines.filter(deadline => {
    const matchesSearch = deadline.title.toLowerCase().includes(searchTerm.toLowerCase()) || deadline.contract?.title.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = !statusFilter || deadline.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const totalPages = Math.ceil(filteredDeadlines.length / PAGE_SIZE);
  const paginatedDeadlines = filteredDeadlines.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  if (loading) return <TableSkeleton rows={8} cols={6} />;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div><h1 className="text-2xl font-bold text-gray-900">Deadlines</h1><p className="text-gray-600">Contract deadlines and reminders</p></div>
        <div className="flex items-center gap-3">
          <ExportButton onExportCSV={handleExportCSV} />
          <button onClick={() => setShowModal(true)} className="inline-flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"><Plus size={20} />New Deadline</button>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
          <input type="text" placeholder="Search deadlines..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg" />
        </div>
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="px-4 py-2 border border-gray-300 rounded-lg">
          <option value="">All Statuses</option>
          <option value="pending">Pending</option>
          <option value="completed">Completed</option>
        </select>
      </div>

      {filteredDeadlines.length === 0 ? (
        <EmptyState
          icon={Clock}
          title="No deadlines found"
          description="Try adjusting your search or filter criteria."
        />
      ) : (
        <>
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Deadline</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Contract</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Due Date</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Priority</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {paginatedDeadlines.map((deadline) => (
                  <tr key={deadline.id} onClick={() => navigate(`/deadlines/${deadline.id}`)} className="hover:bg-gray-50 cursor-pointer">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-lg ${deadline.status === 'completed' ? 'bg-green-100' : isOverdue(deadline.dueDate) ? 'bg-red-100' : 'bg-cyan-100'}`}>
                          {deadline.status === 'completed' ? <CheckCircle className="text-green-600" size={20} /> : isOverdue(deadline.dueDate) ? <AlertTriangle className="text-red-600" size={20} /> : <Clock className="text-cyan-600" size={20} />}
                        </div>
                        <div>
                          <span className="font-medium text-gray-900">{deadline.title}</span>
                          {deadline.description && <p className="text-sm text-gray-500 truncate max-w-xs">{deadline.description}</p>}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">{deadline.contract?.title}</td>
                    <td className="px-6 py-4"><span className={`text-sm ${isOverdue(deadline.dueDate) && deadline.status !== 'completed' ? 'text-red-600 font-medium' : 'text-gray-600'}`}>{new Date(deadline.dueDate).toLocaleDateString()}</span></td>
                    <td className="px-6 py-4"><span className={`px-2 py-1 text-xs font-medium rounded-full ${deadline.priority === 'high' ? 'bg-red-100 text-red-700' : deadline.priority === 'medium' ? 'bg-yellow-100 text-yellow-700' : 'bg-green-100 text-green-700'}`}>{deadline.priority}</span></td>
                    <td className="px-6 py-4"><span className={`px-2 py-1 text-xs font-medium rounded-full ${deadline.status === 'completed' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>{deadline.status}</span></td>
                    <td className="px-6 py-4">
                      {deadline.status === 'pending' && (
                        <button onClick={(e) => handleComplete(deadline.id, e)} className="p-1 text-green-600 hover:bg-green-100 rounded"><CheckCircle size={18} /></button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <Pagination
            page={page}
            totalPages={totalPages}
            total={filteredDeadlines.length}
            limit={PAGE_SIZE}
            onPageChange={setPage}
          />
        </>
      )}

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-lg m-4">
            <div className="p-6 border-b border-gray-100"><h2 className="text-xl font-bold text-gray-900">New Deadline</h2></div>
            <form onSubmit={handleCreate} className="p-6 space-y-4">
              <div><label className="block text-sm font-medium text-gray-700 mb-1">Contract</label><select value={newDeadline.contractId} onChange={(e) => setNewDeadline({ ...newDeadline, contractId: e.target.value })} className="w-full px-4 py-2 border border-gray-300 rounded-lg" required><option value="">Select contract...</option>{contracts.map(c => <option key={c.id} value={c.id}>{c.title}</option>)}</select></div>
              <div><label className="block text-sm font-medium text-gray-700 mb-1">Title</label><input type="text" value={newDeadline.title} onChange={(e) => setNewDeadline({ ...newDeadline, title: e.target.value })} className="w-full px-4 py-2 border border-gray-300 rounded-lg" required /></div>
              <div><label className="block text-sm font-medium text-gray-700 mb-1">Description</label><textarea value={newDeadline.description} onChange={(e) => setNewDeadline({ ...newDeadline, description: e.target.value })} className="w-full px-4 py-2 border border-gray-300 rounded-lg" rows={2} /></div>
              <div className="grid grid-cols-2 gap-4">
                <div><label className="block text-sm font-medium text-gray-700 mb-1">Due Date</label><input type="date" value={newDeadline.dueDate} onChange={(e) => setNewDeadline({ ...newDeadline, dueDate: e.target.value })} className="w-full px-4 py-2 border border-gray-300 rounded-lg" required /></div>
                <div><label className="block text-sm font-medium text-gray-700 mb-1">Priority</label><select value={newDeadline.priority} onChange={(e) => setNewDeadline({ ...newDeadline, priority: e.target.value })} className="w-full px-4 py-2 border border-gray-300 rounded-lg"><option value="low">Low</option><option value="medium">Medium</option><option value="high">High</option></select></div>
              </div>
              <div className="flex justify-end gap-3">
                <button type="button" onClick={() => setShowModal(false)} className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg">Cancel</button>
                <button type="submit" disabled={submitting} className="px-4 py-2 bg-primary-600 text-white rounded-lg disabled:opacity-50">
                  {submitting ? 'Creating...' : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
