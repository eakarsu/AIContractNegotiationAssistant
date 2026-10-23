import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Search, LayoutTemplate, Copy } from 'lucide-react';
import { getTemplates, createTemplate, cloneTemplate } from '../services/api';
import { useToast } from '../hooks/useToast';
import { useEscapeKey } from '../hooks/useEscapeKey';
import CardGridSkeleton from '../components/skeletons/CardGridSkeleton';
import EmptyState from '../components/EmptyState';
import Pagination from '../components/Pagination';

const PAGE_SIZE = 15;

export default function Templates() {
  const navigate = useNavigate();
  const toast = useToast();
  const [templates, setTemplates] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [page, setPage] = useState(1);
  const [newTemplate, setNewTemplate] = useState({ name: '', description: '', content: '', category: 'Service Agreement', industry: '', jurisdiction: 'United States', version: '1.0' });

  useEscapeKey(() => setShowModal(false), showModal);

  useEffect(() => { loadTemplates(); }, []);

  useEffect(() => { setPage(1); }, [searchTerm]);

  const loadTemplates = async () => {
    try {
      const response = await getTemplates();
      setTemplates(response.data);
    } catch (error) {
      toast.error('Failed to load templates');
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await createTemplate(newTemplate);
      toast.success('Template created');
      setShowModal(false);
      setNewTemplate({ name: '', description: '', content: '', category: 'Service Agreement', industry: '', jurisdiction: 'United States', version: '1.0' });
      loadTemplates();
    } catch (error) {
      toast.error('Failed to create template');
    } finally {
      setSubmitting(false);
    }
  };

  const handleClone = async (id: number, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      const response = await cloneTemplate(id, {});
      toast.success('Template cloned');
      navigate(`/contracts/${response.data.id}`);
    } catch (error) {
      toast.error('Failed to clone template');
    }
  };

  const filteredTemplates = useMemo(() =>
    templates.filter(template =>
      template.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      template.category.toLowerCase().includes(searchTerm.toLowerCase())
    ), [templates, searchTerm]);

  const totalPages = Math.ceil(filteredTemplates.length / PAGE_SIZE);
  const paginatedTemplates = filteredTemplates.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  if (loading) return <CardGridSkeleton count={6} />;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div><h1 className="text-2xl font-bold text-gray-900">Templates</h1><p className="text-gray-600">Contract templates for quick creation</p></div>
        <button onClick={() => setShowModal(true)} className="inline-flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"><Plus size={20} />New Template</button>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
        <input type="text" placeholder="Search templates..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500" />
      </div>

      {filteredTemplates.length === 0 ? (
        <EmptyState
          icon={LayoutTemplate}
          title="No templates found"
          description={searchTerm ? 'Try adjusting your search terms' : 'Create your first template to get started'}
          actionLabel={searchTerm ? undefined : 'New Template'}
          onAction={searchTerm ? undefined : () => setShowModal(true)}
        />
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {paginatedTemplates.map((template) => (
              <div key={template.id} onClick={() => navigate(`/templates/${template.id}`)} className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 cursor-pointer hover:shadow-md hover:border-primary-200 transition">
                <div className="flex items-start justify-between mb-3">
                  <div className="p-2 bg-yellow-100 rounded-lg"><LayoutTemplate className="text-yellow-600" size={20} /></div>
                  <button onClick={(e) => handleClone(template.id, e)} className="p-2 text-gray-400 hover:text-primary-600 hover:bg-primary-50 rounded-lg" title="Use as contract"><Copy size={18} /></button>
                </div>
                <h3 className="font-semibold text-gray-900 mb-1">{template.name}</h3>
                <p className="text-sm text-gray-500 mb-2">{template.category}</p>
                <p className="text-sm text-gray-600 line-clamp-2">{template.description}</p>
                <div className="flex items-center justify-between mt-3">
                  <span className="text-xs text-gray-500">{template.jurisdiction}</span>
                  <span className="text-xs text-gray-500">v{template.version}</span>
                </div>
              </div>
            ))}
          </div>

          <Pagination
            page={page}
            totalPages={totalPages}
            total={filteredTemplates.length}
            limit={PAGE_SIZE}
            onPageChange={setPage}
          />
        </>
      )}

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto m-4">
            <div className="p-6 border-b border-gray-100"><h2 className="text-xl font-bold text-gray-900">New Template</h2></div>
            <form onSubmit={handleCreate} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2"><label className="block text-sm font-medium text-gray-700 mb-1">Name</label><input type="text" value={newTemplate.name} onChange={(e) => setNewTemplate({ ...newTemplate, name: e.target.value })} className="w-full px-4 py-2 border border-gray-300 rounded-lg" required /></div>
                <div><label className="block text-sm font-medium text-gray-700 mb-1">Category</label><select value={newTemplate.category} onChange={(e) => setNewTemplate({ ...newTemplate, category: e.target.value })} className="w-full px-4 py-2 border border-gray-300 rounded-lg"><option>Service Agreement</option><option>NDA</option><option>Software License</option><option>Employment</option><option>Partnership</option><option>Consulting</option><option>Vendor</option></select></div>
                <div><label className="block text-sm font-medium text-gray-700 mb-1">Industry</label><input type="text" value={newTemplate.industry} onChange={(e) => setNewTemplate({ ...newTemplate, industry: e.target.value })} className="w-full px-4 py-2 border border-gray-300 rounded-lg" /></div>
                <div><label className="block text-sm font-medium text-gray-700 mb-1">Jurisdiction</label><input type="text" value={newTemplate.jurisdiction} onChange={(e) => setNewTemplate({ ...newTemplate, jurisdiction: e.target.value })} className="w-full px-4 py-2 border border-gray-300 rounded-lg" /></div>
                <div><label className="block text-sm font-medium text-gray-700 mb-1">Version</label><input type="text" value={newTemplate.version} onChange={(e) => setNewTemplate({ ...newTemplate, version: e.target.value })} className="w-full px-4 py-2 border border-gray-300 rounded-lg" /></div>
                <div className="col-span-2"><label className="block text-sm font-medium text-gray-700 mb-1">Description</label><textarea value={newTemplate.description} onChange={(e) => setNewTemplate({ ...newTemplate, description: e.target.value })} className="w-full px-4 py-2 border border-gray-300 rounded-lg" rows={2} /></div>
                <div className="col-span-2"><label className="block text-sm font-medium text-gray-700 mb-1">Content</label><textarea value={newTemplate.content} onChange={(e) => setNewTemplate({ ...newTemplate, content: e.target.value })} className="w-full px-4 py-2 border border-gray-300 rounded-lg font-mono text-sm" rows={10} required /></div>
              </div>
              <div className="flex justify-end gap-3 pt-4">
                <button type="button" onClick={() => setShowModal(false)} className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg" disabled={submitting}>Cancel</button>
                <button type="submit" className="px-4 py-2 bg-primary-600 text-white rounded-lg disabled:opacity-50" disabled={submitting}>{submitting ? 'Creating...' : 'Create Template'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
