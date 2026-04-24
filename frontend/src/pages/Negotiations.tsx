import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Search, MessageSquare, Clock } from 'lucide-react';
import { getNegotiations, createNegotiation, getContracts, getParties, exportNegotiationsCSV, downloadBlob } from '../services/api';
import { useToast } from '../hooks/useToast';
import { useEscapeKey } from '../hooks/useEscapeKey';
import TableSkeleton from '../components/skeletons/TableSkeleton';
import EmptyState from '../components/EmptyState';
import Pagination from '../components/Pagination';
import ExportButton from '../components/ExportButton';

const PAGE_SIZE = 15;

export default function Negotiations() {
  const navigate = useNavigate();
  const toast = useToast();
  const [negotiations, setNegotiations] = useState<any[]>([]);
  const [contracts, setContracts] = useState<any[]>([]);
  const [parties, setParties] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [page, setPage] = useState(1);
  const [newNegotiation, setNewNegotiation] = useState({ contractId: '', partyId: '', proposedChanges: '', notes: '', priority: 'medium', dueDate: '' });

  const closeModal = useCallback(() => setShowModal(false), []);
  useEscapeKey(closeModal, showModal);

  useEffect(() => { loadData(); }, []);

  // Reset page when filters change
  useEffect(() => { setPage(1); }, [searchTerm, statusFilter]);

  const loadData = async () => {
    try {
      const [negRes, conRes, parRes] = await Promise.all([getNegotiations(), getContracts(), getParties()]);
      setNegotiations(negRes.data);
      setContracts(conRes.data);
      setParties(parRes.data);
    } catch (error) {
      console.error('Failed to load data:', error);
      toast.error('Failed to load negotiations');
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (submitting) return;
    setSubmitting(true);
    try {
      await createNegotiation({
        ...newNegotiation,
        contractId: parseInt(newNegotiation.contractId),
        partyId: newNegotiation.partyId ? parseInt(newNegotiation.partyId) : null,
        dueDate: newNegotiation.dueDate ? new Date(newNegotiation.dueDate) : null
      });
      setShowModal(false);
      setNewNegotiation({ contractId: '', partyId: '', proposedChanges: '', notes: '', priority: 'medium', dueDate: '' });
      toast.success('Negotiation created');
      loadData();
    } catch (error) {
      console.error('Failed to create negotiation:', error);
      toast.error('Failed to create negotiation');
    } finally {
      setSubmitting(false);
    }
  };

  const handleExportCSV = async () => {
    try {
      const response = await exportNegotiationsCSV();
      downloadBlob(response.data, 'negotiations.csv');
      toast.success('CSV exported');
    } catch (error) {
      console.error('Failed to export CSV:', error);
      toast.error('Failed to export CSV');
    }
  };

  const filteredNegotiations = negotiations.filter(neg => {
    const matchesSearch = neg.contract?.title.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = !statusFilter || neg.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const totalPages = Math.ceil(filteredNegotiations.length / PAGE_SIZE);
  const paginatedNegotiations = filteredNegotiations.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  if (loading) return <TableSkeleton rows={8} cols={6} />;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div><h1 className="text-2xl font-bold text-gray-900">Negotiations</h1><p className="text-gray-600">Track contract negotiations</p></div>
        <div className="flex items-center gap-3">
          <ExportButton onExportCSV={handleExportCSV} />
          <button onClick={() => setShowModal(true)} className="inline-flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"><Plus size={20} />New Negotiation</button>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
          <input type="text" placeholder="Search negotiations..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg" />
        </div>
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="px-4 py-2 border border-gray-300 rounded-lg">
          <option value="">All Statuses</option>
          <option value="pending">Pending</option>
          <option value="in_progress">In Progress</option>
          <option value="completed">Completed</option>
        </select>
      </div>

      {filteredNegotiations.length === 0 ? (
        <EmptyState
          icon={MessageSquare}
          title="No negotiations found"
          description="Try adjusting your search or filter criteria."
        />
      ) : (
        <>
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Contract</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Party</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Round</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Priority</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Due Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {paginatedNegotiations.map((neg) => (
                  <tr key={neg.id} onClick={() => navigate(`/negotiations/${neg.id}`)} className="hover:bg-gray-50 cursor-pointer">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-purple-100 rounded-lg"><MessageSquare className="text-purple-600" size={20} /></div>
                        <span className="font-medium text-gray-900">{neg.contract?.title}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">{neg.party?.name || '-'}</td>
                    <td className="px-6 py-4 text-sm text-gray-600">Round {neg.round}</td>
                    <td className="px-6 py-4"><span className={`px-2 py-1 text-xs font-medium rounded-full ${neg.status === 'completed' ? 'bg-green-100 text-green-700' : neg.status === 'in_progress' ? 'bg-blue-100 text-blue-700' : 'bg-yellow-100 text-yellow-700'}`}>{neg.status}</span></td>
                    <td className="px-6 py-4"><span className={`px-2 py-1 text-xs font-medium rounded-full ${neg.priority === 'high' ? 'bg-red-100 text-red-700' : neg.priority === 'medium' ? 'bg-yellow-100 text-yellow-700' : 'bg-green-100 text-green-700'}`}>{neg.priority}</span></td>
                    <td className="px-6 py-4 text-sm text-gray-600">{neg.dueDate ? new Date(neg.dueDate).toLocaleDateString() : '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <Pagination
            page={page}
            totalPages={totalPages}
            total={filteredNegotiations.length}
            limit={PAGE_SIZE}
            onPageChange={setPage}
          />
        </>
      )}

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-lg m-4">
            <div className="p-6 border-b border-gray-100"><h2 className="text-xl font-bold text-gray-900">New Negotiation</h2></div>
            <form onSubmit={handleCreate} className="p-6 space-y-4">
              <div><label className="block text-sm font-medium text-gray-700 mb-1">Contract</label><select value={newNegotiation.contractId} onChange={(e) => setNewNegotiation({ ...newNegotiation, contractId: e.target.value })} className="w-full px-4 py-2 border border-gray-300 rounded-lg" required><option value="">Select contract...</option>{contracts.map(c => <option key={c.id} value={c.id}>{c.title}</option>)}</select></div>
              <div><label className="block text-sm font-medium text-gray-700 mb-1">Party</label><select value={newNegotiation.partyId} onChange={(e) => setNewNegotiation({ ...newNegotiation, partyId: e.target.value })} className="w-full px-4 py-2 border border-gray-300 rounded-lg"><option value="">Select party...</option>{parties.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}</select></div>
              <div className="grid grid-cols-2 gap-4">
                <div><label className="block text-sm font-medium text-gray-700 mb-1">Priority</label><select value={newNegotiation.priority} onChange={(e) => setNewNegotiation({ ...newNegotiation, priority: e.target.value })} className="w-full px-4 py-2 border border-gray-300 rounded-lg"><option value="low">Low</option><option value="medium">Medium</option><option value="high">High</option></select></div>
                <div><label className="block text-sm font-medium text-gray-700 mb-1">Due Date</label><input type="date" value={newNegotiation.dueDate} onChange={(e) => setNewNegotiation({ ...newNegotiation, dueDate: e.target.value })} className="w-full px-4 py-2 border border-gray-300 rounded-lg" /></div>
              </div>
              <div><label className="block text-sm font-medium text-gray-700 mb-1">Proposed Changes</label><textarea value={newNegotiation.proposedChanges} onChange={(e) => setNewNegotiation({ ...newNegotiation, proposedChanges: e.target.value })} className="w-full px-4 py-2 border border-gray-300 rounded-lg" rows={3} /></div>
              <div><label className="block text-sm font-medium text-gray-700 mb-1">Notes</label><textarea value={newNegotiation.notes} onChange={(e) => setNewNegotiation({ ...newNegotiation, notes: e.target.value })} className="w-full px-4 py-2 border border-gray-300 rounded-lg" rows={2} /></div>
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
