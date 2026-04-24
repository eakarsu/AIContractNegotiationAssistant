import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Search, GitCompareArrows, Trash2, Scale, Beaker } from 'lucide-react';
import { getStandardTermComparisons, compareStandardTerms, deleteStandardTermComparison } from '../services/api';
import { useToast } from '../hooks/useToast';
import { useEscapeKey } from '../hooks/useEscapeKey';
import CardGridSkeleton from '../components/skeletons/CardGridSkeleton';
import EmptyState from '../components/EmptyState';
import Pagination from '../components/Pagination';

const PAGE_SIZE = 15;

export default function StandardTermsComparer() {
  const navigate = useNavigate();
  const toast = useToast();
  const [comparisons, setComparisons] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState({ title: '', contractTerms: '', standardTerms: '' });
  const [page, setPage] = useState(1);

  const closeModal = useCallback(() => setShowModal(false), []);
  useEscapeKey(closeModal, showModal);

  useEffect(() => { loadData(); }, []);

  useEffect(() => { setPage(1); }, [searchTerm]);

  const loadData = async () => {
    try {
      const res = await getStandardTermComparisons();
      setComparisons(res.data);
    } catch (error) {
      console.error('Failed to load:', error);
      toast.error('Failed to load comparisons');
    } finally {
      setLoading(false);
    }
  };

  const handleCompare = async () => {
    if (!formData.contractTerms || !formData.standardTerms) return;
    setAnalyzing(true);
    setSubmitting(true);
    try {
      await compareStandardTerms(formData);
      setShowModal(false);
      setFormData({ title: '', contractTerms: '', standardTerms: '' });
      toast.success('Comparison completed successfully');
      loadData();
    } catch (error) {
      console.error('Failed to compare:', error);
      toast.error('Failed to compare terms');
    } finally {
      setAnalyzing(false);
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: number, e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm('Delete this comparison?')) {
      try {
        await deleteStandardTermComparison(id);
        toast.success('Comparison deleted');
        loadData();
      } catch (error) {
        console.error('Failed to delete:', error);
        toast.error('Failed to delete comparison');
      }
    }
  };

  const filtered = comparisons.filter(c =>
    c.title?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  const paginatedComparisons = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  if (loading) return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">AI Standard Terms Comparer</h1>
          <p className="text-gray-600">Compare contract terms against industry standards</p>
        </div>
      </div>
      <CardGridSkeleton count={6} />
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">AI Standard Terms Comparer</h1>
          <p className="text-gray-600">Compare contract terms against industry standards</p>
        </div>
        <button onClick={() => setShowModal(true)} className="inline-flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700">
          <Plus size={20} />New Comparison
        </button>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
        <input type="text" placeholder="Search comparisons..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg" />
      </div>

      {filtered.length === 0 ? (
        <EmptyState
          icon={GitCompareArrows}
          title="No comparisons found"
          description="Compare your contract terms against industry standards"
          actionLabel="New Comparison"
          onAction={() => setShowModal(true)}
        />
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {paginatedComparisons.map((c) => (
              <div key={c.id} onClick={() => navigate(`/ai-tools/standard-terms-comparer/${c.id}`)} className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 cursor-pointer hover:shadow-md hover:border-primary-200 transition">
                <div className="flex items-start justify-between mb-3">
                  <div className="p-2 bg-blue-100 rounded-lg"><GitCompareArrows className="text-blue-600" size={20} /></div>
                  <div className="flex items-center gap-2">
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${c.complianceScore >= 80 ? 'bg-green-100 text-green-700' : c.complianceScore >= 50 ? 'bg-yellow-100 text-yellow-700' : 'bg-red-100 text-red-700'}`}>
                      {c.complianceScore}% Match
                    </span>
                    <button onClick={(e) => handleDelete(c.id, e)} className="p-1 text-gray-400 hover:text-red-500 rounded"><Trash2 size={16} /></button>
                  </div>
                </div>
                <h3 className="font-semibold text-gray-900 mb-1">{c.title}</h3>
                <div className="flex items-center gap-2 mt-3">
                  <div className="flex-1 bg-gray-200 rounded-full h-2">
                    <div className={`h-2 rounded-full ${c.complianceScore >= 80 ? 'bg-green-500' : c.complianceScore >= 50 ? 'bg-yellow-500' : 'bg-red-500'}`} style={{ width: `${c.complianceScore}%` }}></div>
                  </div>
                </div>
                <p className="text-sm text-gray-600 mt-3 line-clamp-2">{c.riskAssessment?.substring(0, 100) || 'No assessment yet'}...</p>
                <p className="text-xs text-gray-400 mt-2">{new Date(c.createdAt).toLocaleDateString()}</p>
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
          <div className="bg-white rounded-xl shadow-xl w-full max-w-3xl m-4 max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-100">
              <h2 className="text-xl font-bold text-gray-900">Compare Terms</h2>
            </div>
            <div className="p-6 space-y-4">
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
                <div className="flex items-center gap-2 mb-2">
                  <Beaker size={16} className="text-gray-500" />
                  <span className="text-sm font-medium text-gray-700">Load Sample Data</span>
                </div>
                <div className="flex flex-wrap gap-2">
                  <button type="button" onClick={() => setFormData({ title: 'SaaS Agreement - Payment Terms', contractTerms: 'Payment Terms: All fees are due within 15 days of invoice date. Late payments accrue interest at 2.5% per month. Provider may suspend services after 10 days of non-payment without prior notice. Customer is responsible for all collection costs including attorney fees. Provider reserves the right to increase fees at any time with 15 days written notice. All fees are non-refundable under any circumstances, including service outages or early termination.', standardTerms: 'Payment Terms (Industry Standard): All fees are due within 30 days of invoice date (Net 30). Late payments accrue interest at 1.5% per month or the maximum rate permitted by law, whichever is lower. Provider may suspend services after 30 days of non-payment with 10 days prior written notice. Each party bears its own collection costs unless a court orders otherwise. Provider may increase fees annually with 60 days written notice, not to exceed 5% per year. Prepaid fees are refundable on a pro-rata basis for unused service periods upon termination.' })} className="px-3 py-1.5 text-xs bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition">
                    SaaS Payment Terms
                  </button>
                  <button type="button" onClick={() => setFormData({ title: 'Employment Agreement - Termination', contractTerms: 'Termination: The Company may terminate Employee\'s employment at any time, for any reason or no reason, with or without cause, effective immediately upon verbal or written notice. Upon termination, Employee forfeits all unvested stock options, accrued bonuses, and unused vacation days. Employee must return all company property within 24 hours. No severance will be provided. Employee\'s health benefits terminate on the last day of employment.', standardTerms: 'Termination (Industry Standard): Either party may terminate employment with 30 days written notice. In case of termination without cause, Employee shall receive severance equal to 2 weeks pay per year of service (minimum 4 weeks). Upon termination, unvested stock options continue to vest for 90 days. Accrued bonuses are paid pro-rata and unused vacation days are paid out at the current daily rate. Employee must return company property within 7 business days. Health benefits continue through the end of the month following termination, with COBRA options thereafter.' })} className="px-3 py-1.5 text-xs bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition">
                    Employment Termination
                  </button>
                  <button type="button" onClick={() => setFormData({ title: 'Vendor Agreement - Data Security', contractTerms: 'Data Security: Vendor shall use commercially reasonable efforts to protect Customer data. Vendor is not liable for any data breaches caused by third-party attacks or system vulnerabilities. Customer acknowledges that no system is 100% secure and waives all claims related to data security incidents. Vendor may share anonymized customer data with partners and affiliates for marketing purposes. In the event of a breach, Vendor will notify Customer within 90 days.', standardTerms: 'Data Security (Industry Standard): Vendor shall implement and maintain industry-standard security measures including encryption at rest and in transit (AES-256, TLS 1.2+), regular penetration testing, SOC 2 Type II compliance, and access controls. Vendor assumes full liability for data breaches resulting from its negligence or failure to maintain security standards. Customer data remains Customer\'s property and shall not be shared, sold, or used for any purpose other than service delivery without explicit written consent. In the event of a breach, Vendor must notify Customer within 72 hours and provide a detailed incident report within 30 days. Vendor shall maintain cyber liability insurance of at least $5M.' })} className="px-3 py-1.5 text-xs bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition">
                    Vendor Data Security
                  </button>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Title (optional)</label>
                <input type="text" value={formData.title} onChange={(e) => setFormData({...formData, title: e.target.value})} placeholder="e.g., Service Agreement vs Industry Standard" className="w-full px-4 py-2 border border-gray-300 rounded-lg" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Your Contract Terms *</label>
                  <textarea value={formData.contractTerms} onChange={(e) => setFormData({...formData, contractTerms: e.target.value})} placeholder="Paste your contract terms here..." rows={10} className="w-full px-4 py-2 border border-gray-300 rounded-lg" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Standard/Industry Terms *</label>
                  <textarea value={formData.standardTerms} onChange={(e) => setFormData({...formData, standardTerms: e.target.value})} placeholder="Paste standard terms to compare against..." rows={10} className="w-full px-4 py-2 border border-gray-300 rounded-lg" />
                </div>
              </div>
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <Scale className="text-blue-600 flex-shrink-0" size={20} />
                  <p className="text-sm text-blue-700">Our AI will identify deviations from standard terms and assess their impact on your position.</p>
                </div>
              </div>
              <div className="flex justify-end gap-3">
                <button onClick={() => setShowModal(false)} className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg">Cancel</button>
                <button onClick={handleCompare} disabled={!formData.contractTerms || !formData.standardTerms || analyzing || submitting} className="px-4 py-2 bg-primary-600 text-white rounded-lg disabled:opacity-50">
                  {analyzing ? 'Comparing...' : 'Compare Terms'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
