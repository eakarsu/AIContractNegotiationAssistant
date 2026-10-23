import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Search, Trash2, Globe, Beaker } from 'lucide-react';
import { getTermsOfServiceDocs, generateTermsOfService, deleteTermsOfServiceDoc } from '../services/api';
import { useToast } from '../hooks/useToast';
import { useEscapeKey } from '../hooks/useEscapeKey';
import CardGridSkeleton from '../components/skeletons/CardGridSkeleton';
import EmptyState from '../components/EmptyState';
import Pagination from '../components/Pagination';

const ITEMS_PER_PAGE = 15;

export default function TermsOfServiceBuilder() {
  const navigate = useNavigate();
  const toast = useToast();
  const [terms, setTerms] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [page, setPage] = useState(1);
  const [formData, setFormData] = useState({
    title: '',
    companyName: '',
    serviceType: '',
    website: ''
  });

  useEscapeKey(() => setShowModal(false), showModal);

  useEffect(() => { loadData(); }, []);

  useEffect(() => { setPage(1); }, [searchTerm]);

  const loadData = async () => {
    try {
      const res = await getTermsOfServiceDocs();
      setTerms(res.data);
    } catch (error) {
      console.error('Failed to load:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleGenerate = async () => {
    if (!formData.companyName) return;
    setGenerating(true);
    setSubmitting(true);
    try {
      await generateTermsOfService(formData);
      toast.success('Terms of Service generated successfully!');
      setShowModal(false);
      setFormData({ title: '', companyName: '', serviceType: '', website: '' });
      loadData();
    } catch (error) {
      console.error('Failed to generate:', error);
      toast.error('Failed to generate Terms of Service. Please try again.');
    } finally {
      setGenerating(false);
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: number, e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm('Delete this Terms of Service?')) {
      try {
        await deleteTermsOfServiceDoc(id);
        toast.success('Terms of Service deleted successfully.');
        loadData();
      } catch (error) {
        console.error('Failed to delete:', error);
        toast.error('Failed to delete Terms of Service.');
      }
    }
  };

  const filtered = useMemo(() =>
    terms.filter(t =>
      t.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.companyName?.toLowerCase().includes(searchTerm.toLowerCase())
    ), [terms, searchTerm]);

  const totalPages = Math.ceil(filtered.length / ITEMS_PER_PAGE);
  const paginated = filtered.slice((page - 1) * ITEMS_PER_PAGE, page * ITEMS_PER_PAGE);

  if (loading) return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">AI Terms of Service Builder</h1>
          <p className="text-gray-600">Generate professional Terms of Service documents</p>
        </div>
      </div>
      <CardGridSkeleton count={6} />
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">AI Terms of Service Builder</h1>
          <p className="text-gray-600">Generate professional Terms of Service documents</p>
        </div>
        <button onClick={() => setShowModal(true)} className="inline-flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700">
          <Plus size={20} />Build ToS
        </button>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
        <input type="text" placeholder="Search Terms of Service..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg" />
      </div>

      {filtered.length === 0 ? (
        <EmptyState
          icon={Globe}
          title="No Terms of Service documents found"
          description={searchTerm ? `No results matching "${searchTerm}"` : 'Generate professional ToS documents with AI assistance'}
          actionLabel={searchTerm ? undefined : 'Build ToS'}
          onAction={searchTerm ? undefined : () => setShowModal(true)}
        />
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {paginated.map((t) => (
              <div key={t.id} onClick={() => navigate(`/ai-tools/terms-of-service-builder/${t.id}`)} className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 cursor-pointer hover:shadow-md hover:border-primary-200 transition">
                <div className="flex items-start justify-between mb-3">
                  <div className="p-2 bg-cyan-100 rounded-lg"><Globe className="text-cyan-600" size={20} /></div>
                  <div className="flex items-center gap-2">
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${t.status === 'final' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
                      {t.status}
                    </span>
                    <button onClick={(e) => handleDelete(t.id, e)} className="p-1 text-gray-400 hover:text-red-500 rounded"><Trash2 size={16} /></button>
                  </div>
                </div>
                <h3 className="font-semibold text-gray-900 mb-2">{t.title}</h3>
                <div className="space-y-1 text-sm text-gray-600">
                  <p><span className="font-medium">Company:</span> {t.companyName}</p>
                  {t.serviceType && <p><span className="font-medium">Service:</span> {t.serviceType}</p>}
                </div>
                {t.website && (
                  <div className="mt-2">
                    <span className="px-2 py-0.5 text-xs bg-gray-100 text-gray-600 rounded">{t.website}</span>
                  </div>
                )}
                <p className="text-xs text-gray-400 mt-2">{new Date(t.createdAt).toLocaleDateString()}</p>
              </div>
            ))}
          </div>

          <Pagination
            page={page}
            totalPages={totalPages}
            total={filtered.length}
            limit={ITEMS_PER_PAGE}
            onPageChange={setPage}
          />
        </>
      )}

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-lg m-4">
            <div className="p-6 border-b border-gray-100">
              <h2 className="text-xl font-bold text-gray-900">Build Terms of Service</h2>
            </div>
            <div className="p-6 space-y-4">
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
                <div className="flex items-center gap-2 mb-2">
                  <Beaker size={16} className="text-gray-500" />
                  <span className="text-sm font-medium text-gray-700">Load Sample Data</span>
                </div>
                <div className="flex flex-wrap gap-2">
                  <button type="button" onClick={() => setFormData({ title: 'CloudSync Pro - Terms of Service', companyName: 'CloudSync Pro Inc.', serviceType: 'SaaS Platform', website: 'https://cloudsyncpro.com' })} className="px-3 py-1.5 text-xs bg-cyan-100 text-cyan-700 rounded-lg hover:bg-cyan-200 transition">
                    SaaS Platform
                  </button>
                  <button type="button" onClick={() => setFormData({ title: 'ShopNest - Terms of Service', companyName: 'ShopNest Marketplace LLC', serviceType: 'Online Marketplace', website: 'https://shopnest.com' })} className="px-3 py-1.5 text-xs bg-cyan-100 text-cyan-700 rounded-lg hover:bg-cyan-200 transition">
                    E-Commerce Marketplace
                  </button>
                  <button type="button" onClick={() => setFormData({ title: 'FitTrack - Terms of Service', companyName: 'FitTrack Health Technologies', serviceType: 'Mobile App', website: 'https://fittrackapp.io' })} className="px-3 py-1.5 text-xs bg-cyan-100 text-cyan-700 rounded-lg hover:bg-cyan-200 transition">
                    Mobile Health App
                  </button>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Title (optional)</label>
                <input type="text" value={formData.title} onChange={(e) => setFormData({...formData, title: e.target.value})} placeholder="e.g., Website Terms of Service" className="w-full px-4 py-2 border border-gray-300 rounded-lg" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Company Name *</label>
                <input type="text" value={formData.companyName} onChange={(e) => setFormData({...formData, companyName: e.target.value})} placeholder="Your company name" className="w-full px-4 py-2 border border-gray-300 rounded-lg" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Service Type</label>
                <select value={formData.serviceType} onChange={(e) => setFormData({...formData, serviceType: e.target.value})} className="w-full px-4 py-2 border border-gray-300 rounded-lg">
                  <option value="">Select service type...</option>
                  <option value="SaaS Platform">SaaS Platform</option>
                  <option value="E-commerce">E-commerce</option>
                  <option value="Mobile App">Mobile App</option>
                  <option value="Online Marketplace">Online Marketplace</option>
                  <option value="Social Network">Social Network</option>
                  <option value="Content Platform">Content Platform</option>
                  <option value="API Service">API Service</option>
                  <option value="Consulting Service">Consulting Service</option>
                  <option value="Other">Other</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Website (optional)</label>
                <input type="text" value={formData.website} onChange={(e) => setFormData({...formData, website: e.target.value})} placeholder="https://example.com" className="w-full px-4 py-2 border border-gray-300 rounded-lg" />
              </div>
              <div className="bg-cyan-50 border border-cyan-200 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <Globe className="text-cyan-600 flex-shrink-0" size={20} />
                  <p className="text-sm text-cyan-700">Our AI will generate comprehensive Terms of Service tailored to your business type and requirements.</p>
                </div>
              </div>
              <div className="flex justify-end gap-3">
                <button onClick={() => setShowModal(false)} className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg">Cancel</button>
                <button onClick={handleGenerate} disabled={!formData.companyName || generating || submitting} className="px-4 py-2 bg-primary-600 text-white rounded-lg disabled:opacity-50">
                  {generating ? 'Generating...' : 'Generate ToS'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
