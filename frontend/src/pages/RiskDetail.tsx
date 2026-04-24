import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Trash2 } from 'lucide-react';
import { getRisk, deleteRisk } from '../services/api';
import { RiskAnalysisDisplay } from '../components/RiskDisplay';
import { useToast } from '../hooks/useToast';
import { useConfirm } from '../hooks/useConfirm';
import DetailSkeleton from '../components/skeletons/DetailSkeleton';

export default function RiskDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const toast = useToast();
  const confirm = useConfirm();
  const [risk, setRisk] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => { loadRisk(); }, [id]);

  const loadRisk = async () => {
    try {
      const response = await getRisk(parseInt(id!));
      setRisk(response.data);
    } catch (error) {
      console.error('Failed to load risk:', error);
      toast.error('Failed to load risk analysis');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    const confirmed = await confirm({
      title: 'Delete Risk Analysis',
      message: 'Are you sure you want to delete this risk analysis? This action cannot be undone.',
      confirmLabel: 'Delete',
      cancelLabel: 'Cancel',
    });

    if (confirmed) {
      setSubmitting(true);
      try {
        await deleteRisk(parseInt(id!));
        toast.success('Risk analysis deleted successfully');
        navigate('/risks');
      } catch (error) {
        console.error('Failed to delete risk:', error);
        toast.error('Failed to delete risk analysis');
      } finally {
        setSubmitting(false);
      }
    }
  };

  if (loading) {
    return <DetailSkeleton />;
  }

  if (!risk) return <div className="text-center py-12 text-gray-500">Risk analysis not found</div>;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button onClick={() => navigate('/risks')} className="p-2 hover:bg-gray-100 rounded-lg transition">
            <ArrowLeft size={20} />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Risk Analysis</h1>
            <p className="text-gray-600">{risk.contract?.title}</p>
          </div>
        </div>
        <button onClick={handleDelete} disabled={submitting}
          className="inline-flex items-center gap-2 px-4 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition disabled:opacity-50">
          <Trash2 size={20} />{submitting ? 'Deleting...' : 'Delete'}
        </button>
      </div>

      {/* Risk Display Component */}
      <RiskAnalysisDisplay risk={risk} />
    </div>
  );
}
