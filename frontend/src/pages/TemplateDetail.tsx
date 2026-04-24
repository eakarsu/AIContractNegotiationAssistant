import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, LayoutTemplate, Edit, Trash2, Copy } from 'lucide-react';
import { getTemplate, updateTemplate, deleteTemplate, cloneTemplate } from '../services/api';
import { useToast } from '../hooks/useToast';
import { useConfirm } from '../hooks/useConfirm';
import { useEscapeKey } from '../hooks/useEscapeKey';
import DetailSkeleton from '../components/skeletons/DetailSkeleton';

export default function TemplateDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const toast = useToast();
  const confirm = useConfirm();
  const [template, setTemplate] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [editData, setEditData] = useState<any>({});
  const [submitting, setSubmitting] = useState(false);

  useEscapeKey(() => setEditing(false), editing);

  useEffect(() => { loadTemplate(); }, [id]);

  const loadTemplate = async () => {
    try {
      const response = await getTemplate(parseInt(id!));
      setTemplate(response.data);
      setEditData(response.data);
    } catch (error) {
      toast.error('Failed to load template');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdate = async () => {
    setSubmitting(true);
    try {
      await updateTemplate(parseInt(id!), editData);
      toast.success('Template updated');
      setEditing(false);
      loadTemplate();
    } catch (error) {
      toast.error('Failed to update template');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    const confirmed = await confirm({
      title: 'Delete Template',
      message: 'Are you sure you want to delete this template? This action cannot be undone.',
      confirmLabel: 'Delete',
      cancelLabel: 'Cancel',
      variant: 'danger',
    });
    if (!confirmed) return;
    try {
      await deleteTemplate(parseInt(id!));
      toast.success('Template deleted');
      navigate('/templates');
    } catch (error) {
      toast.error('Failed to delete template');
    }
  };

  const handleUseTemplate = async () => {
    try {
      const response = await cloneTemplate(parseInt(id!), {});
      toast.success('Contract created from template');
      navigate(`/contracts/${response.data.id}`);
    } catch (error) {
      toast.error('Failed to create contract from template');
    }
  };

  if (loading) return <DetailSkeleton />;
  if (!template) return <div className="text-center py-12 text-gray-500">Template not found</div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button onClick={() => navigate('/templates')} className="p-2 hover:bg-gray-100 rounded-lg"><ArrowLeft size={20} /></button>
          <div><h1 className="text-2xl font-bold text-gray-900">{template.name}</h1><p className="text-gray-600">{template.category}</p></div>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={handleUseTemplate} className="inline-flex items-center gap-2 px-4 py-2 bg-green-100 text-green-700 rounded-lg hover:bg-green-200"><Copy size={20} />Use Template</button>
          <button onClick={() => setEditing(!editing)} className="inline-flex items-center gap-2 px-4 py-2 bg-primary-100 text-primary-700 rounded-lg hover:bg-primary-200"><Edit size={20} />Edit</button>
          <button onClick={handleDelete} className="inline-flex items-center gap-2 px-4 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200"><Trash2 size={20} />Delete</button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Template Content</h2>
            {editing ? (
              <div className="space-y-4">
                <div><label className="block text-sm font-medium text-gray-700 mb-1">Name</label><input type="text" value={editData.name} onChange={(e) => setEditData({ ...editData, name: e.target.value })} className="w-full px-4 py-2 border border-gray-300 rounded-lg" /></div>
                <div><label className="block text-sm font-medium text-gray-700 mb-1">Description</label><textarea value={editData.description || ''} onChange={(e) => setEditData({ ...editData, description: e.target.value })} className="w-full px-4 py-2 border border-gray-300 rounded-lg" rows={2} /></div>
                <div><label className="block text-sm font-medium text-gray-700 mb-1">Content</label><textarea value={editData.content} onChange={(e) => setEditData({ ...editData, content: e.target.value })} className="w-full px-4 py-2 border border-gray-300 rounded-lg font-mono text-sm" rows={20} /></div>
                <div className="flex justify-end gap-3">
                  <button onClick={() => setEditing(false)} className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg" disabled={submitting}>Cancel</button>
                  <button onClick={handleUpdate} className="px-4 py-2 bg-primary-600 text-white rounded-lg disabled:opacity-50" disabled={submitting}>{submitting ? 'Saving...' : 'Save'}</button>
                </div>
              </div>
            ) : (
              <div>
                {template.description && <p className="text-gray-600 mb-4">{template.description}</p>}
                <div className="bg-gray-50 rounded-lg p-4 font-mono text-sm whitespace-pre-wrap">{template.content}</div>
              </div>
            )}
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Details</h2>
            <div className="space-y-4">
              <div className="flex justify-between"><span className="text-gray-600">Category</span><span className="font-medium">{template.category}</span></div>
              <div className="flex justify-between"><span className="text-gray-600">Industry</span><span className="font-medium">{template.industry || 'General'}</span></div>
              <div className="flex justify-between"><span className="text-gray-600">Jurisdiction</span><span className="font-medium">{template.jurisdiction}</span></div>
              <div className="flex justify-between"><span className="text-gray-600">Version</span><span className="font-medium">{template.version}</span></div>
              <div className="flex justify-between"><span className="text-gray-600">Status</span><span className={`px-2 py-1 text-xs font-medium rounded-full ${template.isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'}`}>{template.isActive ? 'Active' : 'Inactive'}</span></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
