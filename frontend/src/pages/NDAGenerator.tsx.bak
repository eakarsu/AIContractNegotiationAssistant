import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Search, Trash2, Lock, Beaker } from 'lucide-react';
import { getNDADocuments, generateNDA, deleteNDADocument } from '../services/api';
import { useToast } from '../hooks/useToast';
import { useEscapeKey } from '../hooks/useEscapeKey';
import CardGridSkeleton from '../components/skeletons/CardGridSkeleton';
import EmptyState from '../components/EmptyState';
import Pagination from '../components/Pagination';

const ITEMS_PER_PAGE = 15;

export default function NDAGenerator() {
  const navigate = useNavigate();
  const toast = useToast();
  const [ndas, setNdas] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [page, setPage] = useState(1);
  const [formData, setFormData] = useState({
    title: '',
    disclosingParty: '',
    receivingParty: '',
    purpose: '',
    duration: '2 years',
    jurisdiction: 'United States'
  });

  useEscapeKey(() => setShowModal(false), showModal);

  useEffect(() => { loadData(); }, []);

  useEffect(() => { setPage(1); }, [searchTerm]);

  const loadData = async () => {
    try {
      const res = await getNDADocuments();
      setNdas(res.data);
    } catch (error) {
      console.error('Failed to load:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleGenerate = async () => {
    if (!formData.disclosingParty || !formData.receivingParty) return;
    setGenerating(true);
    setSubmitting(true);
    try {
      await generateNDA(formData);
      toast.success('NDA generated successfully!');
      setShowModal(false);
      setFormData({ title: '', disclosingParty: '', receivingParty: '', purpose: '', duration: '2 years', jurisdiction: 'United States' });
      loadData();
    } catch (error) {
      console.error('Failed to generate:', error);
      toast.error('Failed to generate NDA. Please try again.');
    } finally {
      setGenerating(false);
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: number, e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm('Delete this NDA?')) {
      try {
        await deleteNDADocument(id);
        toast.success('NDA deleted successfully.');
        loadData();
      } catch (error) {
        console.error('Failed to delete:', error);
        toast.error('Failed to delete NDA.');
      }
    }
  };

  const filtered = useMemo(() =>
    ndas.filter(n =>
      n.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      n.disclosingParty?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      n.receivingParty?.toLowerCase().includes(searchTerm.toLowerCase())
    ), [ndas, searchTerm]);

  const totalPages = Math.ceil(filtered.length / ITEMS_PER_PAGE);
  const paginated = filtered.slice((page - 1) * ITEMS_PER_PAGE, page * ITEMS_PER_PAGE);

  if (loading) return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">AI NDA Generator</h1>
          <p className="text-gray-600">Generate professional Non-Disclosure Agreements</p>
        </div>
      </div>
      <CardGridSkeleton count={6} />
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">AI NDA Generator</h1>
          <p className="text-gray-600">Generate professional Non-Disclosure Agreements</p>
        </div>
        <button onClick={() => setShowModal(true)} className="inline-flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700">
          <Plus size={20} />Generate NDA
        </button>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
        <input type="text" placeholder="Search NDAs..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg" />
      </div>

      {filtered.length === 0 ? (
        <EmptyState
          icon={Lock}
          title="No NDA documents found"
          description={searchTerm ? `No results matching "${searchTerm}"` : 'Generate professional NDAs with AI assistance'}
          actionLabel={searchTerm ? undefined : 'Generate NDA'}
          onAction={searchTerm ? undefined : () => setShowModal(true)}
        />
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {paginated.map((n) => (
              <div key={n.id} onClick={() => navigate(`/ai-tools/nda-generator/${n.id}`)} className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 cursor-pointer hover:shadow-md hover:border-primary-200 transition">
                <div className="flex items-start justify-between mb-3">
                  <div className="p-2 bg-teal-100 rounded-lg"><Lock className="text-teal-600" size={20} /></div>
                  <div className="flex items-center gap-2">
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${n.status === 'final' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
                      {n.status}
                    </span>
                    <button onClick={(e) => handleDelete(n.id, e)} className="p-1 text-gray-400 hover:text-red-500 rounded"><Trash2 size={16} /></button>
                  </div>
                </div>
                <h3 className="font-semibold text-gray-900 mb-2">{n.title}</h3>
                <div className="space-y-1 text-sm text-gray-600">
                  <p><span className="font-medium">Disclosing:</span> {n.disclosingParty}</p>
                  <p><span className="font-medium">Receiving:</span> {n.receivingParty}</p>
                </div>
                <div className="flex items-center gap-2 mt-3">
                  <span className="px-2 py-0.5 text-xs bg-gray-100 text-gray-600 rounded">{n.duration}</span>
                  <span className="px-2 py-0.5 text-xs bg-gray-100 text-gray-600 rounded">{n.jurisdiction}</span>
                </div>
                <p className="text-xs text-gray-400 mt-2">{new Date(n.createdAt).toLocaleDateString()}</p>
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
          <div className="bg-white rounded-xl shadow-xl w-full max-w-lg m-4 max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-100">
              <h2 className="text-xl font-bold text-gray-900">Generate NDA</h2>
            </div>
            <div className="p-6 space-y-4">
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
                <div className="flex items-center gap-2 mb-2">
                  <Beaker size={16} className="text-gray-500" />
                  <span className="text-sm font-medium text-gray-700">Load Sample Data</span>
                </div>
                <div className="flex flex-wrap gap-2">
                  <button type="button" onClick={() => setFormData({ title: 'Tech Startup Partnership NDA', disclosingParty: 'Acme Technologies Inc.', receivingParty: 'Beta Innovations LLC', purpose: 'Exploring potential technology partnership for AI-powered analytics platform integration and joint product development', duration: '3 years', jurisdiction: 'Delaware' })} className="px-3 py-1.5 text-xs bg-teal-100 text-teal-700 rounded-lg hover:bg-teal-200 transition">
                    Tech Partnership
                  </button>
                  <button type="button" onClick={() => setFormData({ title: 'M&A Due Diligence NDA', disclosingParty: 'GlobalCorp Industries', receivingParty: 'Apex Capital Partners', purpose: 'Due diligence review in connection with potential acquisition of GlobalCorp Industries, including access to financial records, customer data, and proprietary technology', duration: '5 years', jurisdiction: 'New York' })} className="px-3 py-1.5 text-xs bg-teal-100 text-teal-700 rounded-lg hover:bg-teal-200 transition">
                    M&A Due Diligence
                  </button>
                  <button type="button" onClick={() => setFormData({ title: 'Freelancer Confidentiality NDA', disclosingParty: 'Creative Agency Co.', receivingParty: 'John Smith (Independent Contractor)', purpose: 'Freelance design work requiring access to unreleased product designs, client lists, and marketing strategies', duration: '2 years', jurisdiction: 'California' })} className="px-3 py-1.5 text-xs bg-teal-100 text-teal-700 rounded-lg hover:bg-teal-200 transition">
                    Freelancer NDA
                  </button>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Title (optional)</label>
                <input type="text" value={formData.title} onChange={(e) => setFormData({...formData, title: e.target.value})} placeholder="e.g., Business Partnership NDA" className="w-full px-4 py-2 border border-gray-300 rounded-lg" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Disclosing Party *</label>
                  <input type="text" value={formData.disclosingParty} onChange={(e) => setFormData({...formData, disclosingParty: e.target.value})} placeholder="Company/Person name" className="w-full px-4 py-2 border border-gray-300 rounded-lg" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Receiving Party *</label>
                  <input type="text" value={formData.receivingParty} onChange={(e) => setFormData({...formData, receivingParty: e.target.value})} placeholder="Company/Person name" className="w-full px-4 py-2 border border-gray-300 rounded-lg" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Purpose</label>
                <input type="text" value={formData.purpose} onChange={(e) => setFormData({...formData, purpose: e.target.value})} placeholder="e.g., Business discussions and potential collaboration" className="w-full px-4 py-2 border border-gray-300 rounded-lg" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Duration</label>
                  <select value={formData.duration} onChange={(e) => setFormData({...formData, duration: e.target.value})} className="w-full px-4 py-2 border border-gray-300 rounded-lg">
                    <option value="1 year">1 year</option>
                    <option value="2 years">2 years</option>
                    <option value="3 years">3 years</option>
                    <option value="5 years">5 years</option>
                    <option value="Perpetual">Perpetual</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Jurisdiction</label>
                  <select value={formData.jurisdiction} onChange={(e) => setFormData({...formData, jurisdiction: e.target.value})} className="w-full px-4 py-2 border border-gray-300 rounded-lg">
                    <option value="United States">United States</option>
                    <option value="Delaware">Delaware</option>
                    <option value="New York">New York</option>
                    <option value="California">California</option>
                    <option value="United Kingdom">United Kingdom</option>
                    <option value="European Union">European Union</option>
                  </select>
                </div>
              </div>
              <div className="bg-teal-50 border border-teal-200 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <Lock className="text-teal-600 flex-shrink-0" size={20} />
                  <p className="text-sm text-teal-700">Our AI will generate a comprehensive NDA document tailored to your specifications.</p>
                </div>
              </div>
              <div className="flex justify-end gap-3">
                <button onClick={() => setShowModal(false)} className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg">Cancel</button>
                <button onClick={handleGenerate} disabled={!formData.disclosingParty || !formData.receivingParty || generating || submitting} className="px-4 py-2 bg-primary-600 text-white rounded-lg disabled:opacity-50">
                  {generating ? 'Generating...' : 'Generate NDA'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
