import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, TrendingUp, Trash2, Edit } from 'lucide-react';
import { getAnalyticsRecord, deleteAnalytics, updateAnalytics } from '../services/api';
import { useToast } from '../hooks/useToast';
import { useConfirm } from '../hooks/useConfirm';
import { useEscapeKey } from '../hooks/useEscapeKey';
import DetailSkeleton from '../components/skeletons/DetailSkeleton';

export default function AnalyticsDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const toast = useToast();
  const confirm = useConfirm();
  const [metric, setMetric] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [editData, setEditData] = useState<any>({});

  useEscapeKey(() => setEditing(false), editing);

  useEffect(() => { loadMetric(); }, [id]);

  const loadMetric = async () => {
    try {
      const response = await getAnalyticsRecord(parseInt(id!));
      setMetric(response.data);
      setEditData(response.data);
    } catch (error) {
      console.error('Failed to load metric:', error);
      toast.error('Failed to load metric');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    const confirmed = await confirm({
      title: 'Delete Metric',
      message: 'Are you sure you want to delete this metric? This action cannot be undone.',
      confirmLabel: 'Delete',
      variant: 'danger',
    });
    if (confirmed) {
      try {
        await deleteAnalytics(parseInt(id!));
        toast.success('Metric deleted successfully');
        navigate('/analytics');
      } catch (error) {
        console.error('Failed to delete:', error);
        toast.error('Failed to delete metric');
      }
    }
  };

  const handleUpdate = async () => {
    setSubmitting(true);
    try {
      await updateAnalytics(parseInt(id!), editData);
      setEditing(false);
      toast.success('Metric updated successfully');
      loadMetric();
    } catch (error) {
      console.error('Failed to update:', error);
      toast.error('Failed to update metric');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <DetailSkeleton />;
  if (!metric) return <div className="text-center py-12 text-gray-500">Metric not found</div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button onClick={() => navigate('/analytics')} className="p-2 hover:bg-gray-100 rounded-lg"><ArrowLeft size={20} /></button>
          <div><h1 className="text-2xl font-bold text-gray-900">{metric.metricName}</h1><p className="text-gray-600">{metric.category} • {metric.period}</p></div>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => setEditing(!editing)} className="inline-flex items-center gap-2 px-4 py-2 bg-primary-100 text-primary-700 rounded-lg hover:bg-primary-200"><Edit size={20} />Edit</button>
          <button onClick={handleDelete} className="inline-flex items-center gap-2 px-4 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200"><Trash2 size={20} />Delete</button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          {editing ? (
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 space-y-4">
              <div><label className="block text-sm font-medium text-gray-700 mb-1">Metric Name</label><input type="text" value={editData.metricName} onChange={(e) => setEditData({ ...editData, metricName: e.target.value })} className="w-full px-4 py-2 border border-gray-300 rounded-lg" /></div>
              <div className="grid grid-cols-2 gap-4">
                <div><label className="block text-sm font-medium text-gray-700 mb-1">Value</label><input type="number" value={editData.metricValue} onChange={(e) => setEditData({ ...editData, metricValue: parseFloat(e.target.value) })} className="w-full px-4 py-2 border border-gray-300 rounded-lg" /></div>
                <div><label className="block text-sm font-medium text-gray-700 mb-1">Category</label><select value={editData.category} onChange={(e) => setEditData({ ...editData, category: e.target.value })} className="w-full px-4 py-2 border border-gray-300 rounded-lg"><option value="contracts">Contracts</option><option value="financial">Financial</option><option value="negotiations">Negotiations</option><option value="risk">Risk</option><option value="compliance">Compliance</option></select></div>
              </div>
              <div><label className="block text-sm font-medium text-gray-700 mb-1">Period</label><input type="text" value={editData.period} onChange={(e) => setEditData({ ...editData, period: e.target.value })} className="w-full px-4 py-2 border border-gray-300 rounded-lg" /></div>
              <div><label className="block text-sm font-medium text-gray-700 mb-1">Details</label><textarea value={editData.details || ''} onChange={(e) => setEditData({ ...editData, details: e.target.value })} className="w-full px-4 py-2 border border-gray-300 rounded-lg" rows={3} /></div>
              <div className="flex justify-end gap-3">
                <button onClick={() => setEditing(false)} className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg" disabled={submitting}>Cancel</button>
                <button onClick={handleUpdate} className="px-4 py-2 bg-primary-600 text-white rounded-lg disabled:opacity-50" disabled={submitting}>{submitting ? 'Saving...' : 'Save'}</button>
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Metric Value</h2>
              <div className="flex items-center gap-4">
                <div className="p-4 bg-emerald-100 rounded-xl"><TrendingUp className="text-emerald-600" size={32} /></div>
                <div className="text-4xl font-bold text-gray-900">{typeof metric.metricValue === 'number' && metric.metricValue > 1000 ? `$${metric.metricValue.toLocaleString()}` : metric.metricValue}</div>
              </div>
              {metric.details && (
                <div className="mt-6">
                  <h3 className="font-medium text-gray-900 mb-2">Details</h3>
                  <p className="text-gray-600">{metric.details}</p>
                </div>
              )}
            </div>
          )}
        </div>

        <div className="space-y-6">
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Information</h2>
            <div className="space-y-4">
              <div className="flex justify-between"><span className="text-gray-600">Category</span><span className="px-2 py-1 text-xs font-medium bg-gray-100 text-gray-700 rounded-full">{metric.category}</span></div>
              <div className="flex justify-between"><span className="text-gray-600">Period</span><span className="font-medium">{metric.period}</span></div>
              <div className="flex justify-between"><span className="text-gray-600">Recorded</span><span className="font-medium">{new Date(metric.recordedAt).toLocaleDateString()}</span></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
