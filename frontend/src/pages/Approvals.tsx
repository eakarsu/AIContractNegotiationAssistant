import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Search, CheckCircle, Clock, XCircle } from 'lucide-react';
import { getApprovals, createApproval, getContracts, approveApproval, rejectApproval } from '../services/api';
import { useToast } from '../hooks/useToast';
import { useEscapeKey } from '../hooks/useEscapeKey';
import TableSkeleton from '../components/skeletons/TableSkeleton';
import EmptyState from '../components/EmptyState';
import Pagination from '../components/Pagination';

const PAGE_SIZE = 15;

export default function Approvals() {
  const navigate = useNavigate();
  const toast = useToast();
  const [approvals, setApprovals] = useState<any[]>([]);
  const [contracts, setContracts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [page, setPage] = useState(1);
  const [newApproval, setNewApproval] = useState({ contractId: '', approverName: '', approverRole: '', dueDate: '' });

  const closeModal = useCallback(() => setShowModal(false), []);
  useEscapeKey(closeModal, showModal);

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    try {
      const [approvalsRes, contractsRes] = await Promise.all([getApprovals(), getContracts()]);
      setApprovals(approvalsRes.data);
      setContracts(contractsRes.data);
    } catch (error) {
      console.error('Failed to load data:', error);
      toast.error('Failed to load approvals');
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await createApproval({ ...newApproval, contractId: parseInt(newApproval.contractId), dueDate: newApproval.dueDate ? new Date(newApproval.dueDate) : null });
      setShowModal(false);
      setNewApproval({ contractId: '', approverName: '', approverRole: '', dueDate: '' });
      toast.success('Approval request created successfully');
      loadData();
    } catch (error) {
      console.error('Failed to create approval:', error);
      toast.error('Failed to create approval request');
    } finally {
      setSubmitting(false);
    }
  };

  const handleApprove = async (id: number, e: React.MouseEvent) => {
    e.stopPropagation();
    setSubmitting(true);
    try {
      await approveApproval(id);
      toast.success('Approval granted successfully');
      loadData();
    } catch (error) {
      console.error('Failed to approve:', error);
      toast.error('Failed to approve');
    } finally {
      setSubmitting(false);
    }
  };

  const handleReject = async (id: number, e: React.MouseEvent) => {
    e.stopPropagation();
    const reason = prompt('Reason for rejection:');
    if (reason) {
      setSubmitting(true);
      try {
        await rejectApproval(id, reason);
        toast.success('Approval rejected');
        loadData();
      } catch (error) {
        console.error('Failed to reject:', error);
        toast.error('Failed to reject approval');
      } finally {
        setSubmitting(false);
      }
    }
  };

  const filteredApprovals = approvals.filter(approval => {
    const matchesSearch = approval.contract?.title.toLowerCase().includes(searchTerm.toLowerCase()) || approval.approverName.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = !statusFilter || approval.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  // Reset to page 1 when filters change
  useEffect(() => { setPage(1); }, [searchTerm, statusFilter]);

  const totalPages = Math.ceil(filteredApprovals.length / PAGE_SIZE);
  const paginatedApprovals = filteredApprovals.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  if (loading) return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div><h1 className="text-2xl font-bold text-gray-900">Approvals</h1><p className="text-gray-600">Contract approval workflows</p></div>
      </div>
      <TableSkeleton rows={8} cols={6} />
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div><h1 className="text-2xl font-bold text-gray-900">Approvals</h1><p className="text-gray-600">Contract approval workflows</p></div>
        <button onClick={() => setShowModal(true)} className="inline-flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"><Plus size={20} />Request Approval</button>
      </div>

      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
          <input type="text" placeholder="Search approvals..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg" />
        </div>
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="px-4 py-2 border border-gray-300 rounded-lg">
          <option value="">All Statuses</option>
          <option value="pending">Pending</option>
          <option value="approved">Approved</option>
          <option value="rejected">Rejected</option>
          <option value="revision_requested">Revision Requested</option>
        </select>
      </div>

      {filteredApprovals.length === 0 ? (
        <EmptyState
          icon={CheckCircle}
          title="No approvals found"
          description="No approval requests match your current filters."
        />
      ) : (
        <>
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Contract</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Approver</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Role</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Due Date</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {paginatedApprovals.map((approval) => (
                  <tr key={approval.id} onClick={() => navigate(`/approvals/${approval.id}`)} className="hover:bg-gray-50 cursor-pointer">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-lg ${approval.status === 'approved' ? 'bg-green-100' : approval.status === 'rejected' ? 'bg-red-100' : 'bg-yellow-100'}`}>
                          {approval.status === 'approved' ? <CheckCircle className="text-green-600" size={20} /> : approval.status === 'rejected' ? <XCircle className="text-red-600" size={20} /> : <Clock className="text-yellow-600" size={20} />}
                        </div>
                        <span className="font-medium text-gray-900">{approval.contract?.title}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">{approval.approverName}</td>
                    <td className="px-6 py-4 text-sm text-gray-600">{approval.approverRole}</td>
                    <td className="px-6 py-4"><span className={`px-2 py-1 text-xs font-medium rounded-full ${approval.status === 'approved' ? 'bg-green-100 text-green-700' : approval.status === 'rejected' ? 'bg-red-100 text-red-700' : approval.status === 'revision_requested' ? 'bg-orange-100 text-orange-700' : 'bg-yellow-100 text-yellow-700'}`}>{approval.status.replace('_', ' ')}</span></td>
                    <td className="px-6 py-4 text-sm text-gray-600">{approval.dueDate ? new Date(approval.dueDate).toLocaleDateString() : '-'}</td>
                    <td className="px-6 py-4">
                      {approval.status === 'pending' && (
                        <div className="flex gap-2" onClick={(e) => e.stopPropagation()}>
                          <button onClick={(e) => handleApprove(approval.id, e)} disabled={submitting} className="p-1 text-green-600 hover:bg-green-100 rounded disabled:opacity-50"><CheckCircle size={18} /></button>
                          <button onClick={(e) => handleReject(approval.id, e)} disabled={submitting} className="p-1 text-red-600 hover:bg-red-100 rounded disabled:opacity-50"><XCircle size={18} /></button>
                        </div>
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
            total={filteredApprovals.length}
            limit={PAGE_SIZE}
            onPageChange={setPage}
          />
        </>
      )}

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md m-4">
            <div className="p-6 border-b border-gray-100"><h2 className="text-xl font-bold text-gray-900">Request Approval</h2></div>
            <form onSubmit={handleCreate} className="p-6 space-y-4">
              <div><label className="block text-sm font-medium text-gray-700 mb-1">Contract</label><select value={newApproval.contractId} onChange={(e) => setNewApproval({ ...newApproval, contractId: e.target.value })} className="w-full px-4 py-2 border border-gray-300 rounded-lg" required><option value="">Select contract...</option>{contracts.map(c => <option key={c.id} value={c.id}>{c.title}</option>)}</select></div>
              <div><label className="block text-sm font-medium text-gray-700 mb-1">Approver Name</label><input type="text" value={newApproval.approverName} onChange={(e) => setNewApproval({ ...newApproval, approverName: e.target.value })} className="w-full px-4 py-2 border border-gray-300 rounded-lg" required /></div>
              <div><label className="block text-sm font-medium text-gray-700 mb-1">Approver Role</label><input type="text" value={newApproval.approverRole} onChange={(e) => setNewApproval({ ...newApproval, approverRole: e.target.value })} className="w-full px-4 py-2 border border-gray-300 rounded-lg" required /></div>
              <div><label className="block text-sm font-medium text-gray-700 mb-1">Due Date</label><input type="date" value={newApproval.dueDate} onChange={(e) => setNewApproval({ ...newApproval, dueDate: e.target.value })} className="w-full px-4 py-2 border border-gray-300 rounded-lg" /></div>
              <div className="flex justify-end gap-3"><button type="button" onClick={() => setShowModal(false)} className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg">Cancel</button><button type="submit" disabled={submitting} className="px-4 py-2 bg-primary-600 text-white rounded-lg disabled:opacity-50">{submitting ? 'Requesting...' : 'Request'}</button></div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
