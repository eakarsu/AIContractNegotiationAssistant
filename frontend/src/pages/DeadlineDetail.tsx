import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Trash2, CheckCircle, Edit } from 'lucide-react';
import { getDeadline, deleteDeadline, completeDeadline, updateDeadline } from '../services/api';
import { useToast } from '../hooks/useToast';
import { useConfirm } from '../hooks/useConfirm';
import { useEscapeKey } from '../hooks/useEscapeKey';
import DetailSkeleton from '../components/skeletons/DetailSkeleton';

export default function DeadlineDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const toast = useToast();
  const confirm = useConfirm();
  const [deadline, setDeadline] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [editData, setEditData] = useState<any>({});
  const [submitting, setSubmitting] = useState(false);

  useEscapeKey(() => setEditing(false), editing);

  useEffect(() => { loadDeadline(); }, [id]);

  const loadDeadline = async () => {
    try {
      const response = await getDeadline(parseInt(id!));
      setDeadline(response.data);
      setEditData(response.data);
    } catch (error) {
      console.error('Failed to load deadline:', error);
      toast.error('Failed to load deadline');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    const confirmed = await confirm({
      title: 'Delete Deadline',
      message: 'Are you sure you want to delete this deadline? This action cannot be undone.',
      confirmLabel: 'Delete',
      variant: 'danger',
    });
    if (!confirmed) return;

    setSubmitting(true);
    try {
      await deleteDeadline(parseInt(id!));
      toast.success('Deadline deleted successfully');
      navigate('/deadlines');
    } catch (error) {
      console.error('Failed to delete:', error);
      toast.error('Failed to delete deadline');
    } finally {
      setSubmitting(false);
    }
  };

  const handleComplete = async () => {
    setSubmitting(true);
    try {
      await completeDeadline(parseInt(id!));
      toast.success('Deadline marked as complete');
      loadDeadline();
    } catch (error) {
      console.error('Failed to complete:', error);
      toast.error('Failed to complete deadline');
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpdate = async () => {
    setSubmitting(true);
    try {
      await updateDeadline(parseInt(id!), editData);
      setEditing(false);
      toast.success('Deadline updated successfully');
      loadDeadline();
    } catch (error) {
      console.error('Failed to update:', error);
      toast.error('Failed to update deadline');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <DetailSkeleton />;
  if (!deadline) return <div className="text-center py-12 text-gray-500">Deadline not found</div>;

  const isOverdue = new Date(deadline.dueDate) < new Date() && deadline.status !== 'completed';

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button onClick={() => navigate('/deadlines')} className="p-2 hover:bg-gray-100 rounded-lg"><ArrowLeft size={20} /></button>
          <div><h1 className="text-2xl font-bold text-gray-900">{deadline.title}</h1><p className="text-gray-600">{deadline.contract?.title}</p></div>
        </div>
        <div className="flex items-center gap-2">
          {deadline.status === 'pending' && (
            <button onClick={handleComplete} disabled={submitting} className="inline-flex items-center gap-2 px-4 py-2 bg-green-100 text-green-700 rounded-lg hover:bg-green-200 disabled:opacity-50">
              <CheckCircle size={20} />Complete
            </button>
          )}
          <button onClick={() => setEditing(!editing)} className="inline-flex items-center gap-2 px-4 py-2 bg-primary-100 text-primary-700 rounded-lg hover:bg-primary-200"><Edit size={20} />Edit</button>
          <button onClick={handleDelete} disabled={submitting} className="inline-flex items-center gap-2 px-4 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 disabled:opacity-50"><Trash2 size={20} />Delete</button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          {editing ? (
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 space-y-4">
              <div><label className="block text-sm font-medium text-gray-700 mb-1">Title</label><input type="text" value={editData.title} onChange={(e) => setEditData({ ...editData, title: e.target.value })} className="w-full px-4 py-2 border border-gray-300 rounded-lg" /></div>
              <div><label className="block text-sm font-medium text-gray-700 mb-1">Description</label><textarea value={editData.description || ''} onChange={(e) => setEditData({ ...editData, description: e.target.value })} className="w-full px-4 py-2 border border-gray-300 rounded-lg" rows={3} /></div>
              <div className="grid grid-cols-2 gap-4">
                <div><label className="block text-sm font-medium text-gray-700 mb-1">Due Date</label><input type="date" value={editData.dueDate?.split('T')[0]} onChange={(e) => setEditData({ ...editData, dueDate: e.target.value })} className="w-full px-4 py-2 border border-gray-300 rounded-lg" /></div>
                <div><label className="block text-sm font-medium text-gray-700 mb-1">Priority</label><select value={editData.priority} onChange={(e) => setEditData({ ...editData, priority: e.target.value })} className="w-full px-4 py-2 border border-gray-300 rounded-lg"><option value="low">Low</option><option value="medium">Medium</option><option value="high">High</option></select></div>
              </div>
              <div className="flex justify-end gap-3">
                <button onClick={() => setEditing(false)} className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg">Cancel</button>
                <button onClick={handleUpdate} disabled={submitting} className="px-4 py-2 bg-primary-600 text-white rounded-lg disabled:opacity-50">
                  {submitting ? 'Saving...' : 'Save'}
                </button>
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Details</h2>
              {deadline.description && <p className="text-gray-600 mb-4">{deadline.description}</p>}
              <div className="p-4 rounded-lg bg-gray-50">
                <div className={`text-3xl font-bold ${isOverdue ? 'text-red-600' : deadline.status === 'completed' ? 'text-green-600' : 'text-gray-900'}`}>{new Date(deadline.dueDate).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</div>
                {isOverdue && <p className="text-red-600 mt-2">This deadline is overdue!</p>}
              </div>
            </div>
          )}

          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Contract</h2>
            <div onClick={() => navigate(`/contracts/${deadline.contract?.id}`)} className="p-4 bg-gray-50 rounded-lg cursor-pointer hover:bg-gray-100">
              <h3 className="font-medium text-gray-900">{deadline.contract?.title}</h3>
              {deadline.contract?.party && <p className="text-sm text-gray-500 mt-1">{deadline.contract.party.name}</p>}
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Status</h2>
            <div className="space-y-4">
              <div className="flex justify-between"><span className="text-gray-600">Status</span><span className={`px-2 py-1 text-xs font-medium rounded-full ${deadline.status === 'completed' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>{deadline.status}</span></div>
              <div className="flex justify-between"><span className="text-gray-600">Priority</span><span className={`px-2 py-1 text-xs font-medium rounded-full ${deadline.priority === 'high' ? 'bg-red-100 text-red-700' : deadline.priority === 'medium' ? 'bg-yellow-100 text-yellow-700' : 'bg-green-100 text-green-700'}`}>{deadline.priority}</span></div>
              <div className="flex justify-between"><span className="text-gray-600">Due Date</span><span className="font-medium">{new Date(deadline.dueDate).toLocaleDateString()}</span></div>
              {deadline.reminderDate && <div className="flex justify-between"><span className="text-gray-600">Reminder</span><span className="font-medium">{new Date(deadline.reminderDate).toLocaleDateString()}</span></div>}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
