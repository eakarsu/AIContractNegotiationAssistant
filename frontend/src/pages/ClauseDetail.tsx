import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Scale, Edit, Trash2 } from 'lucide-react';
import { getClause, updateClause, deleteClause } from '../services/api';
import { useToast } from '../hooks/useToast';
import { useConfirm } from '../hooks/useConfirm';
import { useEscapeKey } from '../hooks/useEscapeKey';
import DetailSkeleton from '../components/skeletons/DetailSkeleton';

export default function ClauseDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const toast = useToast();
  const confirm = useConfirm();
  const [clause, setClause] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [editData, setEditData] = useState<any>({});
  const [submitting, setSubmitting] = useState(false);

  useEscapeKey(() => setEditing(false), editing);

  useEffect(() => {
    loadClause();
  }, [id]);

  const loadClause = async () => {
    try {
      const response = await getClause(parseInt(id!));
      setClause(response.data);
      setEditData(response.data);
    } catch (error) {
      console.error('Failed to load clause:', error);
      toast.error('Failed to load clause');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdate = async () => {
    setSubmitting(true);
    try {
      await updateClause(parseInt(id!), editData);
      setEditing(false);
      toast.success('Clause updated');
      loadClause();
    } catch (error) {
      console.error('Failed to update clause:', error);
      toast.error('Failed to update clause');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    const ok = await confirm({
      title: 'Delete clause',
      message: 'Are you sure you want to delete this clause? This action cannot be undone.',
      confirmLabel: 'Delete',
      variant: 'danger',
    });
    if (!ok) return;
    try {
      await deleteClause(parseInt(id!));
      toast.success('Clause deleted');
      navigate('/clauses');
    } catch (error) {
      console.error('Failed to delete clause:', error);
      toast.error('Failed to delete clause');
    }
  };

  if (loading) {
    return <DetailSkeleton />;
  }

  if (!clause) {
    return <div className="text-center py-12 text-gray-500">Clause not found</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button onClick={() => navigate('/clauses')} className="p-2 hover:bg-gray-100 rounded-lg"><ArrowLeft size={20} /></button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{clause.title}</h1>
            <p className="text-gray-600">{clause.category}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => setEditing(!editing)} className="inline-flex items-center gap-2 px-4 py-2 bg-primary-100 text-primary-700 rounded-lg hover:bg-primary-200"><Edit size={20} />Edit</button>
          <button onClick={handleDelete} className="inline-flex items-center gap-2 px-4 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200"><Trash2 size={20} />Delete</button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Clause Content</h2>
            {editing ? (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
                  <input type="text" value={editData.title} onChange={(e) => setEditData({ ...editData, title: e.target.value })} className="w-full px-4 py-2 border border-gray-300 rounded-lg" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Content</label>
                  <textarea value={editData.content} onChange={(e) => setEditData({ ...editData, content: e.target.value })} className="w-full px-4 py-2 border border-gray-300 rounded-lg font-mono text-sm" rows={15} />
                </div>
                <div className="flex justify-end gap-3">
                  <button onClick={() => setEditing(false)} className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg">Cancel</button>
                  <button
                    onClick={handleUpdate}
                    disabled={submitting}
                    className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {submitting ? 'Saving...' : 'Save'}
                  </button>
                </div>
              </div>
            ) : (
              <div className="bg-gray-50 rounded-lg p-4 font-mono text-sm whitespace-pre-wrap">{clause.content}</div>
            )}
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Details</h2>
            <div className="space-y-4">
              <div className="flex justify-between"><span className="text-gray-600">Category</span><span className="font-medium">{clause.category}</span></div>
              <div className="flex justify-between"><span className="text-gray-600">Risk Level</span><span className={`px-2 py-1 text-xs font-medium rounded-full ${clause.riskLevel === 'high' ? 'bg-red-100 text-red-700' : clause.riskLevel === 'medium' ? 'bg-yellow-100 text-yellow-700' : 'bg-green-100 text-green-700'}`}>{clause.riskLevel}</span></div>
              <div className="flex justify-between"><span className="text-gray-600">Standard</span><span className="font-medium">{clause.isStandard ? 'Yes' : 'No'}</span></div>
              <div className="flex justify-between"><span className="text-gray-600">Jurisdiction</span><span className="font-medium">{clause.jurisdiction}</span></div>
            </div>
          </div>

          {clause.contracts?.length > 0 && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Used In Contracts</h2>
              <div className="space-y-2">
                {clause.contracts.map((cc: any) => (
                  <div key={cc.id} onClick={() => navigate(`/contracts/${cc.contract.id}`)} className="p-3 bg-gray-50 rounded-lg cursor-pointer hover:bg-gray-100">
                    <span className="font-medium text-gray-900">{cc.contract.title}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
