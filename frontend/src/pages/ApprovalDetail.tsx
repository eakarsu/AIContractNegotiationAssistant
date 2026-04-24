import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, CheckCircle, XCircle, Clock, Trash2, RotateCcw } from 'lucide-react';
import { getApproval, deleteApproval, approveApproval, rejectApproval, requestRevision } from '../services/api';
import { useToast } from '../hooks/useToast';
import { useConfirm } from '../hooks/useConfirm';
import { useEscapeKey } from '../hooks/useEscapeKey';
import DetailSkeleton from '../components/skeletons/DetailSkeleton';

export default function ApprovalDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const toast = useToast();
  const confirm = useConfirm();
  const [approval, setApproval] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [editing, setEditing] = useState(false);

  const closeEditMode = useCallback(() => setEditing(false), []);
  useEscapeKey(closeEditMode, editing);

  useEffect(() => { loadApproval(); }, [id]);

  const loadApproval = async () => {
    try {
      const response = await getApproval(parseInt(id!));
      setApproval(response.data);
    } catch (error) {
      console.error('Failed to load approval:', error);
      toast.error('Failed to load approval details');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    const confirmed = await confirm({
      title: 'Delete Approval Request',
      message: 'Are you sure you want to delete this approval request? This action cannot be undone.',
      confirmLabel: 'Delete',
      variant: 'danger',
    });
    if (confirmed) {
      setSubmitting(true);
      try {
        await deleteApproval(parseInt(id!));
        toast.success('Approval request deleted');
        navigate('/approvals');
      } catch (error) {
        console.error('Failed to delete:', error);
        toast.error('Failed to delete approval request');
      } finally {
        setSubmitting(false);
      }
    }
  };

  const handleApprove = async () => {
    const confirmed = await confirm({
      title: 'Approve Request',
      message: 'Are you sure you want to approve this request?',
      confirmLabel: 'Approve',
    });
    if (confirmed) {
      const comments = prompt('Add comments (optional):');
      setSubmitting(true);
      try {
        await approveApproval(parseInt(id!), comments || undefined);
        toast.success('Approval granted successfully');
        loadApproval();
      } catch (error) {
        console.error('Failed to approve:', error);
        toast.error('Failed to approve request');
      } finally {
        setSubmitting(false);
      }
    }
  };

  const handleReject = async () => {
    const confirmed = await confirm({
      title: 'Reject Request',
      message: 'Are you sure you want to reject this approval request?',
      confirmLabel: 'Reject',
      variant: 'danger',
    });
    if (confirmed) {
      const reason = prompt('Reason for rejection:');
      if (reason) {
        setSubmitting(true);
        try {
          await rejectApproval(parseInt(id!), reason);
          toast.success('Approval rejected');
          loadApproval();
        } catch (error) {
          console.error('Failed to reject:', error);
          toast.error('Failed to reject request');
        } finally {
          setSubmitting(false);
        }
      }
    }
  };

  const handleRequestRevision = async () => {
    const confirmed = await confirm({
      title: 'Request Revision',
      message: 'Are you sure you want to request a revision for this approval?',
      confirmLabel: 'Request Revision',
    });
    if (confirmed) {
      const comments = prompt('What revisions are needed?');
      if (comments) {
        setSubmitting(true);
        try {
          await requestRevision(parseInt(id!), comments);
          toast.success('Revision requested successfully');
          loadApproval();
        } catch (error) {
          console.error('Failed to request revision:', error);
          toast.error('Failed to request revision');
        } finally {
          setSubmitting(false);
        }
      }
    }
  };

  if (loading) return <DetailSkeleton />;
  if (!approval) return <div className="text-center py-12 text-gray-500">Approval not found</div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button onClick={() => navigate('/approvals')} className="p-2 hover:bg-gray-100 rounded-lg"><ArrowLeft size={20} /></button>
          <div><h1 className="text-2xl font-bold text-gray-900">Approval Request</h1><p className="text-gray-600">{approval.contract?.title}</p></div>
        </div>
        <div className="flex items-center gap-2">
          {approval.status === 'pending' && (
            <>
              <button onClick={handleApprove} disabled={submitting} className="inline-flex items-center gap-2 px-4 py-2 bg-green-100 text-green-700 rounded-lg hover:bg-green-200 disabled:opacity-50"><CheckCircle size={20} />Approve</button>
              <button onClick={handleRequestRevision} disabled={submitting} className="inline-flex items-center gap-2 px-4 py-2 bg-yellow-100 text-yellow-700 rounded-lg hover:bg-yellow-200 disabled:opacity-50"><RotateCcw size={20} />Request Revision</button>
              <button onClick={handleReject} disabled={submitting} className="inline-flex items-center gap-2 px-4 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 disabled:opacity-50"><XCircle size={20} />Reject</button>
            </>
          )}
          <button onClick={handleDelete} disabled={submitting} className="inline-flex items-center gap-2 px-4 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 disabled:opacity-50"><Trash2 size={20} />Delete</button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Status</h2>
            <div className="flex items-center gap-4">
              <div className={`p-4 rounded-full ${approval.status === 'approved' ? 'bg-green-100' : approval.status === 'rejected' ? 'bg-red-100' : 'bg-yellow-100'}`}>
                {approval.status === 'approved' ? <CheckCircle className="text-green-600" size={32} /> : approval.status === 'rejected' ? <XCircle className="text-red-600" size={32} /> : <Clock className="text-yellow-600" size={32} />}
              </div>
              <div>
                <span className={`px-3 py-1 text-sm font-medium rounded-full ${approval.status === 'approved' ? 'bg-green-100 text-green-700' : approval.status === 'rejected' ? 'bg-red-100 text-red-700' : approval.status === 'revision_requested' ? 'bg-orange-100 text-orange-700' : 'bg-yellow-100 text-yellow-700'}`}>{approval.status.replace('_', ' ').toUpperCase()}</span>
                {approval.approvedAt && <p className="text-gray-500 mt-2">Decided on {new Date(approval.approvedAt).toLocaleString()}</p>}
              </div>
            </div>
          </div>

          {approval.comments && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Comments</h2>
              <p className="text-gray-600">{approval.comments}</p>
            </div>
          )}

          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Contract</h2>
            <div onClick={() => navigate(`/contracts/${approval.contract?.id}`)} className="p-4 bg-gray-50 rounded-lg cursor-pointer hover:bg-gray-100">
              <h3 className="font-medium text-gray-900">{approval.contract?.title}</h3>
              <p className="text-sm text-gray-500 mt-1">{approval.contract?.contractType}</p>
              {approval.contract?.value && <p className="text-sm font-medium text-gray-700 mt-2">${approval.contract.value.toLocaleString()}</p>}
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Approver</h2>
            <div className="space-y-4">
              <div className="flex justify-between"><span className="text-gray-600">Name</span><span className="font-medium">{approval.approverName}</span></div>
              <div className="flex justify-between"><span className="text-gray-600">Role</span><span className="font-medium">{approval.approverRole}</span></div>
              {approval.dueDate && <div className="flex justify-between"><span className="text-gray-600">Due Date</span><span className="font-medium">{new Date(approval.dueDate).toLocaleDateString()}</span></div>}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
