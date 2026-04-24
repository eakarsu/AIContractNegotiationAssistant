import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Search, Scale, Trash2, BookMarked, Beaker } from 'lucide-react';
import { getPrecedentSearches, searchPrecedents, deletePrecedentSearch } from '../services/api';
import { useToast } from '../hooks/useToast';
import { useEscapeKey } from '../hooks/useEscapeKey';
import CardGridSkeleton from '../components/skeletons/CardGridSkeleton';
import EmptyState from '../components/EmptyState';
import Pagination from '../components/Pagination';

const PAGE_SIZE = 15;

export default function PrecedentFinder() {
  const navigate = useNavigate();
  const toast = useToast();
  const [searches, setSearches] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState({ query: '', clauseType: '', jurisdiction: '' });
  const [page, setPage] = useState(1);

  const closeModal = useCallback(() => setShowModal(false), []);
  useEscapeKey(closeModal, showModal);

  useEffect(() => { loadData(); }, []);

  useEffect(() => { setPage(1); }, [searchTerm]);

  const loadData = async () => {
    try {
      const res = await getPrecedentSearches();
      setSearches(res.data);
    } catch (error) {
      console.error('Failed to load:', error);
      toast.error('Failed to load precedent searches');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async () => {
    if (!formData.query) return;
    setProcessing(true);
    setSubmitting(true);
    try {
      await searchPrecedents(formData);
      setShowModal(false);
      setFormData({ query: '', clauseType: '', jurisdiction: '' });
      toast.success('Precedent search completed successfully');
      loadData();
    } catch (error) {
      console.error('Failed to search:', error);
      toast.error('Failed to search for precedents');
    } finally {
      setProcessing(false);
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: number, e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm('Delete this search?')) {
      try {
        await deletePrecedentSearch(id);
        toast.success('Precedent search deleted');
        loadData();
      } catch (error) {
        console.error('Failed to delete:', error);
        toast.error('Failed to delete precedent search');
      }
    }
  };

  const filtered = searches.filter(s =>
    s.query?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  const paginatedSearches = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  if (loading) return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">AI Precedent Finder</h1>
          <p className="text-gray-600">Find relevant legal precedents and standard clause language</p>
        </div>
      </div>
      <CardGridSkeleton count={6} />
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">AI Precedent Finder</h1>
          <p className="text-gray-600">Find relevant legal precedents and standard clause language</p>
        </div>
        <button onClick={() => setShowModal(true)} className="inline-flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700">
          <Plus size={20} />New Search
        </button>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
        <input type="text" placeholder="Filter searches..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg" />
      </div>

      {filtered.length === 0 ? (
        <EmptyState
          icon={BookMarked}
          title="No precedent searches found"
          description="Search for legal precedents and standard clause language"
          actionLabel="New Search"
          onAction={() => setShowModal(true)}
        />
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {paginatedSearches.map((s) => (
              <div key={s.id} onClick={() => navigate(`/ai-tools/precedent-finder/${s.id}`)} className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 cursor-pointer hover:shadow-md hover:border-primary-200 transition">
                <div className="flex items-start justify-between mb-3">
                  <div className="p-2 bg-indigo-100 rounded-lg"><Scale className="text-indigo-600" size={20} /></div>
                  <div className="flex items-center gap-2">
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${s.relevanceScore >= 70 ? 'bg-green-100 text-green-700' : s.relevanceScore >= 40 ? 'bg-yellow-100 text-yellow-700' : 'bg-red-100 text-red-700'}`}>
                      {s.relevanceScore}% Relevant
                    </span>
                    <button onClick={(e) => handleDelete(s.id, e)} className="p-1 text-gray-400 hover:text-red-500 rounded"><Trash2 size={16} /></button>
                  </div>
                </div>
                <h3 className="font-semibold text-gray-900 mb-1 line-clamp-2">{s.query}</h3>
                <div className="flex items-center gap-2 mt-2">
                  {s.clauseType && <span className="px-2 py-0.5 text-xs bg-gray-100 text-gray-600 rounded">{s.clauseType}</span>}
                  {s.jurisdiction && <span className="px-2 py-0.5 text-xs bg-gray-100 text-gray-600 rounded">{s.jurisdiction}</span>}
                </div>
                <p className="text-xs text-gray-400 mt-3">{new Date(s.createdAt).toLocaleDateString()}</p>
              </div>
            ))}
          </div>

          <Pagination
            page={page}
            totalPages={totalPages}
            total={filtered.length}
            limit={PAGE_SIZE}
            onPageChange={setPage}
          />
        </>
      )}

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-lg m-4">
            <div className="p-6 border-b border-gray-100">
              <h2 className="text-xl font-bold text-gray-900">Search for Precedents</h2>
            </div>
            <div className="p-6 space-y-4">
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
                <div className="flex items-center gap-2 mb-2">
                  <Beaker size={16} className="text-gray-500" />
                  <span className="text-sm font-medium text-gray-700">Load Sample Data</span>
                </div>
                <div className="flex flex-wrap gap-2">
                  <button type="button" onClick={() => setFormData({ query: 'Enforceability of non-compete clauses in employment agreements, including reasonable scope, duration, and geographic limitations', clauseType: 'Confidentiality', jurisdiction: 'California' })} className="px-3 py-1.5 text-xs bg-indigo-100 text-indigo-700 rounded-lg hover:bg-indigo-200 transition">
                    Non-Compete Enforceability
                  </button>
                  <button type="button" onClick={() => setFormData({ query: 'Limitation of liability caps in SaaS and software licensing agreements, including exclusion of consequential damages and liability floor provisions', clauseType: 'Limitation of Liability', jurisdiction: 'Delaware' })} className="px-3 py-1.5 text-xs bg-indigo-100 text-indigo-700 rounded-lg hover:bg-indigo-200 transition">
                    SaaS Liability Caps
                  </button>
                  <button type="button" onClick={() => setFormData({ query: 'Force majeure clauses and their application to pandemic-related business disruptions, supply chain failures, and government-mandated shutdowns', clauseType: 'Force Majeure', jurisdiction: 'New York' })} className="px-3 py-1.5 text-xs bg-indigo-100 text-indigo-700 rounded-lg hover:bg-indigo-200 transition">
                    Force Majeure & Pandemics
                  </button>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Search Query *</label>
                <input type="text" value={formData.query} onChange={(e) => setFormData({...formData, query: e.target.value})} placeholder="e.g., limitation of liability in software contracts" className="w-full px-4 py-2 border border-gray-300 rounded-lg" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Clause Type (optional)</label>
                  <select value={formData.clauseType} onChange={(e) => setFormData({...formData, clauseType: e.target.value})} className="w-full px-4 py-2 border border-gray-300 rounded-lg">
                    <option value="">Any type</option>
                    <option value="Indemnification">Indemnification</option>
                    <option value="Limitation of Liability">Limitation of Liability</option>
                    <option value="Confidentiality">Confidentiality</option>
                    <option value="Termination">Termination</option>
                    <option value="Force Majeure">Force Majeure</option>
                    <option value="IP Rights">IP Rights</option>
                    <option value="Warranty">Warranty</option>
                    <option value="Dispute Resolution">Dispute Resolution</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Jurisdiction (optional)</label>
                  <select value={formData.jurisdiction} onChange={(e) => setFormData({...formData, jurisdiction: e.target.value})} className="w-full px-4 py-2 border border-gray-300 rounded-lg">
                    <option value="">Any jurisdiction</option>
                    <option value="United States">United States</option>
                    <option value="Delaware">Delaware</option>
                    <option value="New York">New York</option>
                    <option value="California">California</option>
                    <option value="European Union">European Union</option>
                    <option value="United Kingdom">United Kingdom</option>
                  </select>
                </div>
              </div>
              <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <Scale className="text-indigo-600 flex-shrink-0" size={20} />
                  <p className="text-sm text-indigo-700">Our AI will find relevant precedents, case law, and standard clause language for your query.</p>
                </div>
              </div>
              <div className="flex justify-end gap-3">
                <button onClick={() => setShowModal(false)} className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg">Cancel</button>
                <button onClick={handleSearch} disabled={!formData.query || processing || submitting} className="px-4 py-2 bg-primary-600 text-white rounded-lg disabled:opacity-50">
                  {processing ? 'Searching...' : 'Search'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
