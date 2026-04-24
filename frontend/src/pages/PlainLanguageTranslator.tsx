import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Search, Languages, Trash2, BookOpen, Beaker } from 'lucide-react';
import { getPlainLanguageTranslations, translateToPlainLanguage, deletePlainLanguageTranslation } from '../services/api';
import { useToast } from '../hooks/useToast';
import { useEscapeKey } from '../hooks/useEscapeKey';
import CardGridSkeleton from '../components/skeletons/CardGridSkeleton';
import EmptyState from '../components/EmptyState';
import Pagination from '../components/Pagination';

const PAGE_SIZE = 15;

export default function PlainLanguageTranslator() {
  const navigate = useNavigate();
  const toast = useToast();
  const [translations, setTranslations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState({ title: '', originalText: '' });
  const [page, setPage] = useState(1);

  const closeModal = useCallback(() => setShowModal(false), []);
  useEscapeKey(closeModal, showModal);

  useEffect(() => { loadData(); }, []);

  useEffect(() => { setPage(1); }, [searchTerm]);

  const loadData = async () => {
    try {
      const res = await getPlainLanguageTranslations();
      setTranslations(res.data);
    } catch (error) {
      console.error('Failed to load:', error);
      toast.error('Failed to load translations');
    } finally {
      setLoading(false);
    }
  };

  const handleTranslate = async () => {
    if (!formData.originalText) return;
    setProcessing(true);
    setSubmitting(true);
    try {
      await translateToPlainLanguage(formData);
      setShowModal(false);
      setFormData({ title: '', originalText: '' });
      toast.success('Translation completed successfully');
      loadData();
    } catch (error) {
      console.error('Failed to translate:', error);
      toast.error('Failed to translate text');
    } finally {
      setProcessing(false);
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: number, e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm('Delete this translation?')) {
      try {
        await deletePlainLanguageTranslation(id);
        toast.success('Translation deleted');
        loadData();
      } catch (error) {
        console.error('Failed to delete:', error);
        toast.error('Failed to delete translation');
      }
    }
  };

  const filtered = translations.filter(t =>
    t.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    t.originalText?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  const paginatedTranslations = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  if (loading) return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">AI Plain Language Translator</h1>
          <p className="text-gray-600">Convert legal jargon into easy-to-understand language</p>
        </div>
      </div>
      <CardGridSkeleton count={6} />
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">AI Plain Language Translator</h1>
          <p className="text-gray-600">Convert legal jargon into easy-to-understand language</p>
        </div>
        <button onClick={() => setShowModal(true)} className="inline-flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700">
          <Plus size={20} />New Translation
        </button>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
        <input type="text" placeholder="Search translations..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg" />
      </div>

      {filtered.length === 0 ? (
        <EmptyState
          icon={Languages}
          title="No translations found"
          description="Translate legal text into plain, simple language"
          actionLabel="New Translation"
          onAction={() => setShowModal(true)}
        />
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {paginatedTranslations.map((t) => (
              <div key={t.id} onClick={() => navigate(`/ai-tools/plain-language-translator/${t.id}`)} className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 cursor-pointer hover:shadow-md hover:border-primary-200 transition">
                <div className="flex items-start justify-between mb-3">
                  <div className="p-2 bg-purple-100 rounded-lg"><Languages className="text-purple-600" size={20} /></div>
                  <div className="flex items-center gap-2">
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${t.complexityScore >= 70 ? 'bg-red-100 text-red-700' : t.complexityScore >= 40 ? 'bg-yellow-100 text-yellow-700' : 'bg-green-100 text-green-700'}`}>
                      {t.complexityScore >= 70 ? 'Complex' : t.complexityScore >= 40 ? 'Moderate' : 'Simple'}
                    </span>
                    <button onClick={(e) => handleDelete(t.id, e)} className="p-1 text-gray-400 hover:text-red-500 rounded"><Trash2 size={16} /></button>
                  </div>
                </div>
                <h3 className="font-semibold text-gray-900 mb-1">{t.title}</h3>
                <p className="text-sm text-gray-600 mt-2 line-clamp-2">{t.translatedText?.substring(0, 100) || t.originalText?.substring(0, 100)}...</p>
                <p className="text-xs text-gray-400 mt-2">{new Date(t.createdAt).toLocaleDateString()}</p>
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
          <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl m-4 max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-100">
              <h2 className="text-xl font-bold text-gray-900">Translate to Plain Language</h2>
            </div>
            <div className="p-6 space-y-4">
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
                <div className="flex items-center gap-2 mb-2">
                  <Beaker size={16} className="text-gray-500" />
                  <span className="text-sm font-medium text-gray-700">Load Sample Data</span>
                </div>
                <div className="flex flex-wrap gap-2">
                  <button type="button" onClick={() => setFormData({ title: 'Force Majeure Clause', originalText: 'Notwithstanding anything to the contrary contained herein, neither Party shall be deemed to be in default of or to have breached any provision of this Agreement as a result of any delay, failure in performance, or interruption of service resulting directly or indirectly from acts of God, acts of civil or military authorities, civil disturbances, wars, strikes or other labor disputes, fires, transportation contingencies, interruptions in telecommunications or Internet services or network provider services, failures of equipment, software or other technical failures, epidemics, pandemics, quarantine restrictions, shortages of labor, materials or equipment, or other catastrophe or any other occurrences which are beyond such Party\'s reasonable control (each, a "Force Majeure Event"), and any such delays, failure or interruptions shall not be considered a breach of this Agreement and the time for performance of the obligations under this Agreement shall be extended for a period equal to the duration of such Force Majeure Event; provided that the affected Party provides prompt written notice thereof to the other Party.' })} className="px-3 py-1.5 text-xs bg-purple-100 text-purple-700 rounded-lg hover:bg-purple-200 transition">
                    Force Majeure Clause
                  </button>
                  <button type="button" onClick={() => setFormData({ title: 'Arbitration Agreement', originalText: 'Any dispute, claim, or controversy arising out of or relating to this Agreement or the breach, termination, enforcement, interpretation, or validity thereof, including the determination of the scope or applicability of this agreement to arbitrate, shall be determined by binding arbitration in New York, New York before one (1) arbitrator. The arbitration shall be administered by JAMS pursuant to its Comprehensive Arbitration Rules and Procedures and in accordance with the Expedited Procedures in those Rules. Judgment on the Award may be entered in any court having jurisdiction. This clause shall not preclude parties from seeking provisional remedies in aid of arbitration from a court of appropriate jurisdiction. THE PARTIES HEREBY WAIVE THEIR RIGHT TO A JURY TRIAL. The prevailing party in any arbitration shall be entitled to recover its reasonable attorneys\' fees and costs from the non-prevailing party. The arbitrator may not consolidate more than one person\'s claims and may not otherwise preside over any form of a representative or class proceeding.' })} className="px-3 py-1.5 text-xs bg-purple-100 text-purple-700 rounded-lg hover:bg-purple-200 transition">
                    Arbitration Agreement
                  </button>
                  <button type="button" onClick={() => setFormData({ title: 'Intellectual Property Assignment', originalText: 'Employee hereby irrevocably assigns, transfers, and conveys to the Company all right, title, and interest in and to any and all Inventions (as defined below) and all associated Intellectual Property Rights. "Inventions" means all ideas, concepts, discoveries, inventions, developments, improvements, trade secrets, original works of authorship, and other intellectual property, whether or not patentable or copyrightable, that Employee solely or jointly conceives, develops, reduces to practice, or creates during the period of employment, that (a) relate to the Company\'s current or anticipated business, research, or development, (b) result from any work performed for the Company, or (c) are developed using Company resources, time, or proprietary information. Employee shall promptly disclose all Inventions to the Company and shall execute all documents necessary to perfect the Company\'s rights therein, including patent applications and copyright registrations. Employee hereby appoints the Company as Employee\'s attorney-in-fact to execute such documents on Employee\'s behalf.' })} className="px-3 py-1.5 text-xs bg-purple-100 text-purple-700 rounded-lg hover:bg-purple-200 transition">
                    IP Assignment Clause
                  </button>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Title (optional)</label>
                <input type="text" value={formData.title} onChange={(e) => setFormData({...formData, title: e.target.value})} placeholder="e.g., Indemnification Clause Translation" className="w-full px-4 py-2 border border-gray-300 rounded-lg" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Legal Text to Translate *</label>
                <textarea value={formData.originalText} onChange={(e) => setFormData({...formData, originalText: e.target.value})} placeholder="Paste the legal text you want translated into plain language..." rows={10} className="w-full px-4 py-2 border border-gray-300 rounded-lg" />
              </div>
              <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <BookOpen className="text-purple-600 flex-shrink-0" size={20} />
                  <p className="text-sm text-purple-700">Our AI will translate complex legal language into simple, easy-to-understand terms while preserving the meaning.</p>
                </div>
              </div>
              <div className="flex justify-end gap-3">
                <button onClick={() => setShowModal(false)} className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg">Cancel</button>
                <button onClick={handleTranslate} disabled={!formData.originalText || processing || submitting} className="px-4 py-2 bg-primary-600 text-white rounded-lg disabled:opacity-50">
                  {processing ? 'Translating...' : 'Translate'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
