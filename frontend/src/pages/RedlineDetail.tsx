import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, GitCompare, Trash2, Check, X, Loader2 } from 'lucide-react';
import { getRedline, deleteRedline, acceptRedline, rejectRedline } from '../services/api';
import { useToast } from '../hooks/useToast';
import { useConfirm } from '../hooks/useConfirm';
import DetailSkeleton from '../components/skeletons/DetailSkeleton';

export default function RedlineDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const toast = useToast();
  const confirm = useConfirm();
  const [redline, setRedline] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => { loadRedline(); }, [id]);

  const loadRedline = async () => {
    try {
      const response = await getRedline(parseInt(id!));
      setRedline(response.data);
    } catch (error) {
      toast.error('Failed to load redline');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    const confirmed = await confirm({
      title: 'Delete Redline',
      message: 'Are you sure you want to delete this redline? This action cannot be undone.',
      confirmLabel: 'Delete',
      variant: 'danger',
    });
    if (!confirmed) return;
    setSubmitting(true);
    try {
      await deleteRedline(parseInt(id!));
      toast.success('Redline deleted');
      navigate('/redlines');
    } catch (error) {
      toast.error('Failed to delete redline');
    } finally {
      setSubmitting(false);
    }
  };

  const handleAccept = async () => {
    const confirmed = await confirm({
      title: 'Accept Redline',
      message: 'Are you sure you want to accept this redline change?',
      confirmLabel: 'Accept',
    });
    if (!confirmed) return;
    setSubmitting(true);
    try {
      await acceptRedline(parseInt(id!));
      toast.success('Redline accepted');
      loadRedline();
    } catch (error) {
      toast.error('Failed to accept redline');
    } finally {
      setSubmitting(false);
    }
  };

  const handleReject = async () => {
    const confirmed = await confirm({
      title: 'Reject Redline',
      message: 'Are you sure you want to reject this redline change?',
      confirmLabel: 'Reject',
      variant: 'danger',
    });
    if (!confirmed) return;
    setSubmitting(true);
    try {
      await rejectRedline(parseInt(id!));
      toast.success('Redline rejected');
      loadRedline();
    } catch (error) {
      toast.error('Failed to reject redline');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <DetailSkeleton />;
  if (!redline) return <div className="text-center py-12 text-gray-500">Redline not found</div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button onClick={() => navigate('/redlines')} className="p-2 hover:bg-gray-100 rounded-lg"><ArrowLeft size={20} /></button>
          <div><h1 className="text-2xl font-bold text-gray-900">Redline Detail</h1><p className="text-gray-600">{redline.contract?.title} - {redline.section || 'General'}</p></div>
        </div>
        <div className="flex items-center gap-2">
          {redline.status === 'pending' && (
            <>
              <button onClick={handleAccept} disabled={submitting} className="inline-flex items-center gap-2 px-4 py-2 bg-green-100 text-green-700 rounded-lg hover:bg-green-200 disabled:opacity-50">
                {submitting ? <Loader2 size={20} className="animate-spin" /> : <Check size={20} />}Accept
              </button>
              <button onClick={handleReject} disabled={submitting} className="inline-flex items-center gap-2 px-4 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 disabled:opacity-50">
                {submitting ? <Loader2 size={20} className="animate-spin" /> : <X size={20} />}Reject
              </button>
            </>
          )}
          <button onClick={handleDelete} disabled={submitting} className="inline-flex items-center gap-2 px-4 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 disabled:opacity-50">
            {submitting ? <Loader2 size={20} className="animate-spin" /> : <Trash2 size={20} />}Delete
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Original Text</h2>
            <div className="bg-red-50 rounded-lg p-4 border-l-4 border-red-400">
              <p className="text-gray-700 whitespace-pre-wrap">{redline.originalText}</p>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Proposed Text</h2>
            <div className="bg-green-50 rounded-lg p-4 border-l-4 border-green-400">
              <p className="text-gray-700 whitespace-pre-wrap">{redline.proposedText}</p>
            </div>
          </div>

          {redline.reason && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Reason for Change</h2>
              <p className="text-gray-600">{redline.reason}</p>
            </div>
          )}
        </div>

        <div className="space-y-6">
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Details</h2>
            <div className="space-y-4">
              <div className="flex justify-between"><span className="text-gray-600">Status</span><span className={`px-2 py-1 text-xs font-medium rounded-full ${redline.status === 'accepted' ? 'bg-green-100 text-green-700' : redline.status === 'rejected' ? 'bg-red-100 text-red-700' : 'bg-yellow-100 text-yellow-700'}`}>{redline.status}</span></div>
              <div className="flex justify-between"><span className="text-gray-600">Section</span><span className="font-medium">{redline.section || 'General'}</span></div>
              <div className="flex justify-between"><span className="text-gray-600">Author</span><span className="font-medium">{redline.author || 'Unknown'}</span></div>
              <div className="flex justify-between"><span className="text-gray-600">Created</span><span className="font-medium">{new Date(redline.createdAt).toLocaleDateString()}</span></div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Contract</h2>
            <div onClick={() => navigate(`/contracts/${redline.contract?.id}`)} className="p-3 bg-gray-50 rounded-lg cursor-pointer hover:bg-gray-100">
              <p className="font-medium text-gray-900">{redline.contract?.title}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
