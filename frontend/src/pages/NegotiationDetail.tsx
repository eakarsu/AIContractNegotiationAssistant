import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, MessageSquare, Edit, Trash2, ArrowRight } from 'lucide-react';
import { getNegotiation, updateNegotiation, deleteNegotiation, advanceNegotiation } from '../services/api';
import { useToast } from '../hooks/useToast';
import { useConfirm } from '../hooks/useConfirm';
import { useEscapeKey } from '../hooks/useEscapeKey';
import DetailSkeleton from '../components/skeletons/DetailSkeleton';

export default function NegotiationDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const toast = useToast();
  const confirm = useConfirm();
  const [negotiation, setNegotiation] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [editData, setEditData] = useState<any>({});
  const [submitting, setSubmitting] = useState(false);
  const [advanceData, setAdvanceData] = useState({ proposedChanges: '', counterProposal: '', notes: '' });

  const closeEditing = useCallback(() => setEditing(false), []);
  useEscapeKey(closeEditing, editing);

  useEffect(() => { loadNegotiation(); }, [id]);

  const loadNegotiation = async () => {
    try {
      const response = await getNegotiation(parseInt(id!));
      setNegotiation(response.data);
      setEditData(response.data);
    } catch (error) {
      toast.error('Failed to load negotiation');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdate = async () => {
    if (submitting) return;
    setSubmitting(true);
    try {
      await updateNegotiation(parseInt(id!), editData);
      setEditing(false);
      toast.success('Negotiation updated');
      loadNegotiation();
    } catch (error) {
      toast.error('Failed to update negotiation');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    const confirmed = await confirm('Are you sure you want to delete this negotiation?');
    if (!confirmed) return;
    if (submitting) return;
    setSubmitting(true);
    try {
      await deleteNegotiation(parseInt(id!));
      toast.success('Negotiation deleted');
      navigate('/negotiations');
    } catch (error) {
      toast.error('Failed to delete negotiation');
    } finally {
      setSubmitting(false);
    }
  };

  const handleAdvance = async () => {
    if (submitting) return;
    setSubmitting(true);
    try {
      await advanceNegotiation(parseInt(id!), advanceData);
      setAdvanceData({ proposedChanges: '', counterProposal: '', notes: '' });
      toast.success('Advanced to next round');
      loadNegotiation();
    } catch (error) {
      toast.error('Failed to advance negotiation');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <DetailSkeleton />;
  if (!negotiation) return <div className="text-center py-12 text-gray-500">Negotiation not found</div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button onClick={() => navigate('/negotiations')} className="p-2 hover:bg-gray-100 rounded-lg"><ArrowLeft size={20} /></button>
          <div><h1 className="text-2xl font-bold text-gray-900">Negotiation - {negotiation.contract?.title}</h1><p className="text-gray-600">Round {negotiation.round}</p></div>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => setEditing(!editing)} className="inline-flex items-center gap-2 px-4 py-2 bg-primary-100 text-primary-700 rounded-lg hover:bg-primary-200"><Edit size={20} />Edit</button>
          <button onClick={handleDelete} disabled={submitting} className="inline-flex items-center gap-2 px-4 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 disabled:opacity-50"><Trash2 size={20} />Delete</button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Negotiation Details</h2>
            {editing ? (
              <div className="space-y-4">
                <div><label className="block text-sm font-medium text-gray-700 mb-1">Status</label><select value={editData.status} onChange={(e) => setEditData({ ...editData, status: e.target.value })} className="w-full px-4 py-2 border border-gray-300 rounded-lg"><option value="pending">Pending</option><option value="in_progress">In Progress</option><option value="completed">Completed</option></select></div>
                <div><label className="block text-sm font-medium text-gray-700 mb-1">Proposed Changes</label><textarea value={editData.proposedChanges || ''} onChange={(e) => setEditData({ ...editData, proposedChanges: e.target.value })} className="w-full px-4 py-2 border border-gray-300 rounded-lg" rows={4} /></div>
                <div><label className="block text-sm font-medium text-gray-700 mb-1">Counter Proposal</label><textarea value={editData.counterProposal || ''} onChange={(e) => setEditData({ ...editData, counterProposal: e.target.value })} className="w-full px-4 py-2 border border-gray-300 rounded-lg" rows={4} /></div>
                <div><label className="block text-sm font-medium text-gray-700 mb-1">Notes</label><textarea value={editData.notes || ''} onChange={(e) => setEditData({ ...editData, notes: e.target.value })} className="w-full px-4 py-2 border border-gray-300 rounded-lg" rows={3} /></div>
                <div className="flex justify-end gap-3">
                  <button onClick={() => setEditing(false)} className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg">Cancel</button>
                  <button onClick={handleUpdate} disabled={submitting} className="px-4 py-2 bg-primary-600 text-white rounded-lg disabled:opacity-50">
                    {submitting ? 'Saving...' : 'Save'}
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                {negotiation.proposedChanges && <div><h3 className="font-medium text-gray-900">Proposed Changes</h3><p className="text-gray-600 mt-1">{negotiation.proposedChanges}</p></div>}
                {negotiation.counterProposal && <div><h3 className="font-medium text-gray-900">Counter Proposal</h3><p className="text-gray-600 mt-1">{negotiation.counterProposal}</p></div>}
                {negotiation.notes && <div><h3 className="font-medium text-gray-900">Notes</h3><p className="text-gray-600 mt-1">{negotiation.notes}</p></div>}
              </div>
            )}
          </div>

          {negotiation.status !== 'completed' && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Advance to Next Round</h2>
              <div className="space-y-4">
                <div><label className="block text-sm font-medium text-gray-700 mb-1">New Proposed Changes</label><textarea value={advanceData.proposedChanges} onChange={(e) => setAdvanceData({ ...advanceData, proposedChanges: e.target.value })} className="w-full px-4 py-2 border border-gray-300 rounded-lg" rows={3} /></div>
                <div><label className="block text-sm font-medium text-gray-700 mb-1">Counter Proposal</label><textarea value={advanceData.counterProposal} onChange={(e) => setAdvanceData({ ...advanceData, counterProposal: e.target.value })} className="w-full px-4 py-2 border border-gray-300 rounded-lg" rows={3} /></div>
                <div><label className="block text-sm font-medium text-gray-700 mb-1">Notes</label><textarea value={advanceData.notes} onChange={(e) => setAdvanceData({ ...advanceData, notes: e.target.value })} className="w-full px-4 py-2 border border-gray-300 rounded-lg" rows={2} /></div>
                <button onClick={handleAdvance} disabled={submitting} className="inline-flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50">
                  <ArrowRight size={20} />{submitting ? 'Advancing...' : `Advance to Round ${negotiation.round + 1}`}
                </button>
              </div>
            </div>
          )}
        </div>

        <div className="space-y-6">
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Status</h2>
            <div className="space-y-4">
              <div className="flex justify-between"><span className="text-gray-600">Status</span><span className={`px-2 py-1 text-xs font-medium rounded-full ${negotiation.status === 'completed' ? 'bg-green-100 text-green-700' : negotiation.status === 'in_progress' ? 'bg-blue-100 text-blue-700' : 'bg-yellow-100 text-yellow-700'}`}>{negotiation.status}</span></div>
              <div className="flex justify-between"><span className="text-gray-600">Round</span><span className="font-medium">{negotiation.round}</span></div>
              <div className="flex justify-between"><span className="text-gray-600">Priority</span><span className={`px-2 py-1 text-xs font-medium rounded-full ${negotiation.priority === 'high' ? 'bg-red-100 text-red-700' : negotiation.priority === 'medium' ? 'bg-yellow-100 text-yellow-700' : 'bg-green-100 text-green-700'}`}>{negotiation.priority}</span></div>
              {negotiation.dueDate && <div className="flex justify-between"><span className="text-gray-600">Due Date</span><span className="font-medium">{new Date(negotiation.dueDate).toLocaleDateString()}</span></div>}
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Related</h2>
            <div className="space-y-3">
              <div onClick={() => navigate(`/contracts/${negotiation.contract?.id}`)} className="p-3 bg-gray-50 rounded-lg cursor-pointer hover:bg-gray-100">
                <span className="text-sm text-gray-500">Contract</span>
                <p className="font-medium text-gray-900">{negotiation.contract?.title}</p>
              </div>
              {negotiation.party && (
                <div onClick={() => navigate(`/parties/${negotiation.party?.id}`)} className="p-3 bg-gray-50 rounded-lg cursor-pointer hover:bg-gray-100">
                  <span className="text-sm text-gray-500">Party</span>
                  <p className="font-medium text-gray-900">{negotiation.party?.name}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
