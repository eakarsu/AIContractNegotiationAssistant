import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Search, Highlighter, AlertTriangle, Trash2, Beaker } from 'lucide-react';
import { getRiskClauseHighlights, analyzeRiskClause, deleteRiskClauseHighlight } from '../services/api';
import { useToast } from '../hooks/useToast';
import { useEscapeKey } from '../hooks/useEscapeKey';
import CardGridSkeleton from '../components/skeletons/CardGridSkeleton';
import EmptyState from '../components/EmptyState';
import Pagination from '../components/Pagination';

const PAGE_SIZE = 15;

export default function RiskClauseHighlighter() {
  const navigate = useNavigate();
  const toast = useToast();
  const [highlights, setHighlights] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState({ title: '', content: '' });
  const [page, setPage] = useState(1);

  const closeModal = useCallback(() => setShowModal(false), []);
  useEscapeKey(closeModal, showModal);

  useEffect(() => { loadData(); }, []);

  useEffect(() => { setPage(1); }, [searchTerm]);

  const loadData = async () => {
    try {
      const res = await getRiskClauseHighlights();
      setHighlights(res.data);
    } catch (error) {
      console.error('Failed to load data:', error);
      toast.error('Failed to load risk analyses');
    } finally {
      setLoading(false);
    }
  };

  const handleAnalyze = async () => {
    if (!formData.content) return;
    setAnalyzing(true);
    setSubmitting(true);
    try {
      await analyzeRiskClause(formData);
      setShowModal(false);
      setFormData({ title: '', content: '' });
      toast.success('Risk analysis completed successfully');
      loadData();
    } catch (error) {
      console.error('Failed to analyze:', error);
      toast.error('Failed to analyze clause for risks');
    } finally {
      setAnalyzing(false);
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: number, e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm('Are you sure you want to delete this analysis?')) {
      try {
        await deleteRiskClauseHighlight(id);
        toast.success('Analysis deleted');
        loadData();
      } catch (error) {
        console.error('Failed to delete:', error);
        toast.error('Failed to delete analysis');
      }
    }
  };

  const filteredHighlights = highlights.filter(h =>
    h.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    h.content?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalPages = Math.ceil(filteredHighlights.length / PAGE_SIZE);
  const paginatedHighlights = filteredHighlights.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  if (loading) return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">AI Risk Clause Highlighter</h1>
          <p className="text-gray-600">Identify and highlight risky clauses in your contracts</p>
        </div>
      </div>
      <CardGridSkeleton count={6} />
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">AI Risk Clause Highlighter</h1>
          <p className="text-gray-600">Identify and highlight risky clauses in your contracts</p>
        </div>
        <button onClick={() => setShowModal(true)} className="inline-flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700">
          <Plus size={20} />New Analysis
        </button>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
        <input type="text" placeholder="Search analyses..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg" />
      </div>

      {filteredHighlights.length === 0 ? (
        <EmptyState
          icon={Highlighter}
          title="No risk analyses found"
          description="Start by analyzing a contract clause for risks"
          actionLabel="New Analysis"
          onAction={() => setShowModal(true)}
        />
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {paginatedHighlights.map((h) => (
              <div key={h.id} onClick={() => navigate(`/ai-tools/risk-clause-highlighter/${h.id}`)} className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 cursor-pointer hover:shadow-md hover:border-primary-200 transition">
                <div className="flex items-start justify-between mb-3">
                  <div className="p-2 bg-amber-100 rounded-lg"><Highlighter className="text-amber-600" size={20} /></div>
                  <div className="flex items-center gap-2">
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${h.riskLevel === 'high' ? 'bg-red-100 text-red-700' : h.riskLevel === 'medium' ? 'bg-yellow-100 text-yellow-700' : 'bg-green-100 text-green-700'}`}>{h.riskLevel}</span>
                    <button onClick={(e) => handleDelete(h.id, e)} className="p-1 text-gray-400 hover:text-red-500 rounded"><Trash2 size={16} /></button>
                  </div>
                </div>
                <h3 className="font-semibold text-gray-900 mb-1">{h.title}</h3>
                <div className="flex items-center gap-2 mt-3">
                  <div className="flex-1 bg-gray-200 rounded-full h-2">
                    <div className={`h-2 rounded-full ${h.riskScore >= 70 ? 'bg-red-500' : h.riskScore >= 40 ? 'bg-yellow-500' : 'bg-green-500'}`} style={{ width: `${h.riskScore}%` }}></div>
                  </div>
                  <span className="text-sm font-medium text-gray-700">{h.riskScore}/100</span>
                </div>
                <p className="text-sm text-gray-600 mt-3 line-clamp-2">{h.content?.substring(0, 100)}...</p>
                <p className="text-xs text-gray-400 mt-2">{new Date(h.createdAt).toLocaleDateString()}</p>
              </div>
            ))}
          </div>

          <Pagination
            page={page}
            totalPages={totalPages}
            total={filteredHighlights.length}
            limit={PAGE_SIZE}
            onPageChange={setPage}
          />
        </>
      )}

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl m-4 max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-100">
              <h2 className="text-xl font-bold text-gray-900">Analyze Clause for Risks</h2>
            </div>
            <div className="p-6 space-y-4">
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
                <div className="flex items-center gap-2 mb-2">
                  <Beaker size={16} className="text-gray-500" />
                  <span className="text-sm font-medium text-gray-700">Load Sample Data</span>
                </div>
                <div className="flex flex-wrap gap-2">
                  <button type="button" onClick={() => setFormData({ title: 'Indemnification Clause Review', content: 'The Contractor shall indemnify, defend, and hold harmless the Company, its officers, directors, employees, agents, and affiliates from and against any and all claims, damages, losses, costs, and expenses (including reasonable attorneys\' fees) arising out of or relating to (a) any breach of this Agreement by the Contractor, (b) any negligent or wrongful act or omission of the Contractor, or (c) any claim that the deliverables infringe upon any intellectual property rights of any third party. This indemnification obligation shall survive the termination or expiration of this Agreement indefinitely and shall apply regardless of whether the Company was negligent or at fault.' })} className="px-3 py-1.5 text-xs bg-amber-100 text-amber-700 rounded-lg hover:bg-amber-200 transition">
                    Indemnification Clause
                  </button>
                  <button type="button" onClick={() => setFormData({ title: 'Non-Compete Agreement Review', content: 'Upon termination of employment for any reason, Employee agrees not to directly or indirectly engage in, own, manage, operate, consult for, or be employed by any business that competes with the Company anywhere in the world for a period of five (5) years following the date of termination. Employee further agrees not to solicit any clients, customers, or employees of the Company during this period. Any violation of this covenant shall entitle the Company to injunctive relief and liquidated damages equal to two (2) years of Employee\'s base salary. Employee acknowledges that these restrictions are reasonable and necessary to protect the Company\'s legitimate business interests.' })} className="px-3 py-1.5 text-xs bg-amber-100 text-amber-700 rounded-lg hover:bg-amber-200 transition">
                    Non-Compete Clause
                  </button>
                  <button type="button" onClick={() => setFormData({ title: 'Limitation of Liability Review', content: 'IN NO EVENT SHALL THE PROVIDER BE LIABLE FOR ANY INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES, INCLUDING BUT NOT LIMITED TO LOSS OF PROFITS, DATA, OR BUSINESS OPPORTUNITIES, REGARDLESS OF WHETHER SUCH DAMAGES WERE FORESEEABLE OR WHETHER THE PROVIDER WAS ADVISED OF THE POSSIBILITY OF SUCH DAMAGES. THE PROVIDER\'S TOTAL AGGREGATE LIABILITY ARISING OUT OF OR RELATED TO THIS AGREEMENT SHALL NOT EXCEED THE FEES PAID BY THE CUSTOMER IN THE TWELVE (12) MONTHS PRECEDING THE EVENT GIVING RISE TO THE CLAIM. THIS LIMITATION SHALL APPLY NOTWITHSTANDING THE FAILURE OF THE ESSENTIAL PURPOSE OF ANY LIMITED REMEDY PROVIDED HEREIN.' })} className="px-3 py-1.5 text-xs bg-amber-100 text-amber-700 rounded-lg hover:bg-amber-200 transition">
                    Liability Limitation
                  </button>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Title (optional)</label>
                <input type="text" value={formData.title} onChange={(e) => setFormData({...formData, title: e.target.value})} placeholder="e.g., Indemnification Clause Review" className="w-full px-4 py-2 border border-gray-300 rounded-lg" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Contract Clause / Text *</label>
                <textarea value={formData.content} onChange={(e) => setFormData({...formData, content: e.target.value})} placeholder="Paste the contract clause or text you want to analyze for risks..." rows={10} className="w-full px-4 py-2 border border-gray-300 rounded-lg" />
              </div>
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <AlertTriangle className="text-amber-600 flex-shrink-0" size={20} />
                  <div>
                    <p className="font-medium text-amber-800">AI Analysis</p>
                    <p className="text-sm text-amber-700">Our AI will identify risky language, potential issues, and provide suggestions for improvement.</p>
                  </div>
                </div>
              </div>
              <div className="flex justify-end gap-3">
                <button onClick={() => setShowModal(false)} className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200">Cancel</button>
                <button onClick={handleAnalyze} disabled={!formData.content || analyzing || submitting} className="px-4 py-2 bg-primary-600 text-white rounded-lg disabled:opacity-50 hover:bg-primary-700">
                  {analyzing ? 'Analyzing...' : 'Analyze Risks'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
