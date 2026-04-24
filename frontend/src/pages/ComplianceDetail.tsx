import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Shield, Trash2, CheckCircle, XCircle, AlertTriangle } from 'lucide-react';
import { getComplianceCheck, deleteComplianceCheck } from '../services/api';
import { useToast } from '../hooks/useToast';
import { useConfirm } from '../hooks/useConfirm';
import { useEscapeKey } from '../hooks/useEscapeKey';
import DetailSkeleton from '../components/skeletons/DetailSkeleton';

export default function ComplianceDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const toast = useToast();
  const confirm = useConfirm();
  const [check, setCheck] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEscapeKey(() => setEditing(false), editing);

  useEffect(() => { loadCheck(); }, [id]);

  const loadCheck = async () => {
    try {
      const response = await getComplianceCheck(parseInt(id!));
      setCheck(response.data);
    } catch (error) {
      console.error('Failed to load compliance check:', error);
      toast.error('Failed to load compliance check');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    const confirmed = await confirm({
      title: 'Delete Compliance Check',
      message: 'Are you sure you want to delete this compliance check? This action cannot be undone.',
      confirmLabel: 'Delete',
      cancelLabel: 'Cancel',
      variant: 'danger',
    });
    if (!confirmed) return;

    setSubmitting(true);
    try {
      await deleteComplianceCheck(parseInt(id!));
      toast.success('Compliance check deleted successfully');
      navigate('/compliance');
    } catch (error) {
      console.error('Failed to delete:', error);
      toast.error('Failed to delete compliance check');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <DetailSkeleton />;
  if (!check) return <div className="text-center py-12 text-gray-500">Compliance check not found</div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button onClick={() => navigate('/compliance')} className="p-2 hover:bg-gray-100 rounded-lg"><ArrowLeft size={20} /></button>
          <div><h1 className="text-2xl font-bold text-gray-900">{check.regulation} Compliance</h1><p className="text-gray-600">{check.contract?.title}</p></div>
        </div>
        <button onClick={handleDelete} disabled={submitting} className="inline-flex items-center gap-2 px-4 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 disabled:opacity-50"><Trash2 size={20} />{submitting ? 'Deleting...' : 'Delete'}</button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Compliance Status</h2>
            <div className="flex items-center gap-4">
              <div className={`p-4 rounded-full ${check.status === 'compliant' ? 'bg-green-100' : check.status === 'partially_compliant' ? 'bg-yellow-100' : 'bg-red-100'}`}>
                {check.status === 'compliant' ? <CheckCircle className="text-green-600" size={32} /> : check.status === 'non_compliant' ? <XCircle className="text-red-600" size={32} /> : <AlertTriangle className="text-yellow-600" size={32} />}
              </div>
              <div>
                <span className={`px-3 py-1 text-sm font-medium rounded-full ${check.status === 'compliant' ? 'bg-green-100 text-green-700' : check.status === 'partially_compliant' ? 'bg-yellow-100 text-yellow-700' : 'bg-red-100 text-red-700'}`}>{check.status.replace('_', ' ').toUpperCase()}</span>
                <p className="text-gray-500 mt-2">Checked on {check.checkedAt ? new Date(check.checkedAt).toLocaleString() : 'Not yet checked'}</p>
              </div>
            </div>
          </div>

          {check.findings && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Findings</h2>
              <p className="text-gray-600 whitespace-pre-wrap">{check.findings}</p>
            </div>
          )}

          {check.requirements && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Requirements</h2>
              <p className="text-gray-600 whitespace-pre-wrap">{check.requirements}</p>
            </div>
          )}
        </div>

        <div className="space-y-6">
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Details</h2>
            <div className="space-y-4">
              <div className="flex justify-between"><span className="text-gray-600">Regulation</span><span className="font-medium">{check.regulation}</span></div>
              <div className="flex justify-between"><span className="text-gray-600">Status</span><span className={`px-2 py-1 text-xs font-medium rounded-full ${check.status === 'compliant' ? 'bg-green-100 text-green-700' : check.status === 'partially_compliant' ? 'bg-yellow-100 text-yellow-700' : 'bg-red-100 text-red-700'}`}>{check.status}</span></div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Contract</h2>
            <div onClick={() => navigate(`/contracts/${check.contract?.id}`)} className="p-3 bg-gray-50 rounded-lg cursor-pointer hover:bg-gray-100">
              <p className="font-medium text-gray-900">{check.contract?.title}</p>
              <p className="text-sm text-gray-500">{check.contract?.contractType}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
