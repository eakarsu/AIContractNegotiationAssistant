import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Search, GitCompare, Check, X, Sparkles, Loader2 } from 'lucide-react';
import { getRedlines, createRedline, getContracts, acceptRedline, rejectRedline, suggestRedline } from '../services/api';
import { useToast } from '../hooks/useToast';
import { useEscapeKey } from '../hooks/useEscapeKey';
import TableSkeleton from '../components/skeletons/TableSkeleton';
import EmptyState from '../components/EmptyState';
import Pagination from '../components/Pagination';

const PER_PAGE = 15;

export default function Redlines() {
  const navigate = useNavigate();
  const toast = useToast();
  const [redlines, setRedlines] = useState<any[]>([]);
  const [contracts, setContracts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [newRedline, setNewRedline] = useState({ contractId: '', originalText: '', proposedText: '', section: '', reason: '', author: '' });
  const [showAIModal, setShowAIModal] = useState(false);
  const [aiContractId, setAiContractId] = useState('');
  const [aiSection, setAiSection] = useState('');
  const [aiSuggesting, setAiSuggesting] = useState(false);
  const [aiResult, setAiResult] = useState<any>(null);
  const [page, setPage] = useState(1);

  const closeCreateModal = useCallback(() => setShowModal(false), []);
  const closeAIModal = useCallback(() => {
    setShowAIModal(false);
    setAiContractId('');
    setAiSection('');
  }, []);

  useEscapeKey(closeCreateModal, showModal);
  useEscapeKey(closeAIModal, showAIModal && !showModal);

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    try {
      const [redlinesRes, contractsRes] = await Promise.all([getRedlines(), getContracts()]);
      setRedlines(redlinesRes.data);
      setContracts(contractsRes.data);
    } catch (error) {
      toast.error('Failed to load redlines data');
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await createRedline({ ...newRedline, contractId: parseInt(newRedline.contractId) });
      setShowModal(false);
      setNewRedline({ contractId: '', originalText: '', proposedText: '', section: '', reason: '', author: '' });
      toast.success('Redline created successfully');
      loadData();
    } catch (error) {
      toast.error('Failed to create redline');
    } finally {
      setSubmitting(false);
    }
  };

  const handleAccept = async (id: number, e: React.MouseEvent) => {
    e.stopPropagation();
    setSubmitting(true);
    try {
      await acceptRedline(id);
      toast.success('Redline accepted');
      loadData();
    } catch (error) {
      toast.error('Failed to accept redline');
    } finally {
      setSubmitting(false);
    }
  };

  const handleReject = async (id: number, e: React.MouseEvent) => {
    e.stopPropagation();
    setSubmitting(true);
    try {
      await rejectRedline(id);
      toast.success('Redline rejected');
      loadData();
    } catch (error) {
      toast.error('Failed to reject redline');
    } finally {
      setSubmitting(false);
    }
  };

  const handleAISuggest = async () => {
    if (!aiContractId) return;
    setAiSuggesting(true);
    setAiResult(null);
    try {
      const res = await suggestRedline(parseInt(aiContractId), { section: aiSection || undefined });
      setAiResult(res.data);
      setShowAIModal(false);
      setAiContractId('');
      setAiSection('');
      toast.success('AI redline suggestions generated');
      loadData();
    } catch (error: any) {
      toast.error('AI suggestion failed: ' + (error.response?.data?.error || error.message));
    } finally {
      setAiSuggesting(false);
    }
  };

  const filteredRedlines = redlines.filter(redline =>
    redline.contract?.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    redline.section?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Reset page when search term changes
  useEffect(() => {
    setPage(1);
  }, [searchTerm]);

  const totalPages = Math.ceil(filteredRedlines.length / PER_PAGE);
  const paginatedRedlines = filteredRedlines.slice((page - 1) * PER_PAGE, page * PER_PAGE);

  if (loading) return <TableSkeleton rows={8} cols={4} />;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div><h1 className="text-2xl font-bold text-gray-900">Redlining</h1><p className="text-gray-600">Track contract changes and revisions</p></div>
        <div className="flex items-center gap-2">
          <button onClick={() => setShowAIModal(true)} className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-500 to-indigo-600 text-white rounded-lg hover:from-purple-600 hover:to-indigo-700 shadow-md">
            <Sparkles size={20} />AI Suggest Redlines
          </button>
          <button onClick={() => setShowModal(true)} className="inline-flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"><Plus size={20} />New Redline</button>
        </div>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
        <input type="text" placeholder="Search redlines..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg" />
      </div>

      {filteredRedlines.length === 0 ? (
        <EmptyState
          icon={GitCompare}
          title="No redlines found"
          description={searchTerm ? 'Try adjusting your search terms' : 'Create your first redline to get started'}
          actionLabel={searchTerm ? undefined : 'New Redline'}
          onAction={searchTerm ? undefined : () => setShowModal(true)}
        />
      ) : (
        <>
          <div className="space-y-4">
            {paginatedRedlines.map((redline) => (
              <div key={redline.id} onClick={() => navigate(`/redlines/${redline.id}`)} className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 cursor-pointer hover:shadow-md transition">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-orange-100 rounded-lg"><GitCompare className="text-orange-600" size={20} /></div>
                    <div>
                      <h3 className="font-medium text-gray-900">{redline.contract?.title}</h3>
                      <p className="text-sm text-gray-500">{redline.section || 'General'} • {redline.author}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${redline.status === 'accepted' ? 'bg-green-100 text-green-700' : redline.status === 'rejected' ? 'bg-red-100 text-red-700' : 'bg-yellow-100 text-yellow-700'}`}>{redline.status}</span>
                    {redline.status === 'pending' && (
                      <>
                        <button onClick={(e) => handleAccept(redline.id, e)} disabled={submitting} className="p-1 text-green-600 hover:bg-green-100 rounded disabled:opacity-50"><Check size={18} /></button>
                        <button onClick={(e) => handleReject(redline.id, e)} disabled={submitting} className="p-1 text-red-600 hover:bg-red-100 rounded disabled:opacity-50"><X size={18} /></button>
                      </>
                    )}
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4 mt-3">
                  <div className="bg-red-50 rounded-lg p-3"><p className="text-xs text-red-600 font-medium mb-1">Original</p><p className="text-sm text-red-800 line-clamp-2">{redline.originalText.substring(0, 100)}...</p></div>
                  <div className="bg-green-50 rounded-lg p-3"><p className="text-xs text-green-600 font-medium mb-1">Proposed</p><p className="text-sm text-green-800 line-clamp-2">{redline.proposedText.substring(0, 100)}...</p></div>
                </div>
                {redline.reason && <p className="text-sm text-gray-600 mt-3"><span className="font-medium">Reason:</span> {redline.reason}</p>}
              </div>
            ))}
          </div>

          <Pagination
            page={page}
            totalPages={totalPages}
            total={filteredRedlines.length}
            limit={PER_PAGE}
            onPageChange={setPage}
          />
        </>
      )}

      {/* AI Result Banner */}
      {aiResult && (
        <div className="bg-gradient-to-r from-purple-50 to-indigo-50 border border-purple-200 rounded-xl p-5">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold text-purple-900 flex items-center gap-2">
              <Sparkles size={18} className="text-purple-500" />
              AI Generated {aiResult.redlines?.length || 0} Redline Suggestions
            </h3>
            <button onClick={() => setAiResult(null)} className="text-purple-400 hover:text-purple-600"><X size={18} /></button>
          </div>
          {aiResult.aiAnalysis?.overallAssessment && (
            <p className="text-purple-800 text-sm mb-3">{aiResult.aiAnalysis.overallAssessment}</p>
          )}
          {aiResult.aiAnalysis?.priorityActions?.length > 0 && (
            <div className="space-y-1">
              <p className="text-sm font-medium text-purple-900">Priority Actions:</p>
              {aiResult.aiAnalysis.priorityActions.map((action: string, idx: number) => (
                <p key={idx} className="text-sm text-purple-700 flex items-start gap-2">
                  <span className="bg-purple-200 text-purple-800 rounded-full w-5 h-5 flex items-center justify-center text-xs font-bold flex-shrink-0">{idx + 1}</span>
                  {action}
                </p>
              ))}
            </div>
          )}
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto m-4">
            <div className="p-6 border-b border-gray-100"><h2 className="text-xl font-bold text-gray-900">New Redline</h2></div>
            <form onSubmit={handleCreate} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2"><label className="block text-sm font-medium text-gray-700 mb-1">Contract</label><select value={newRedline.contractId} onChange={(e) => setNewRedline({ ...newRedline, contractId: e.target.value })} className="w-full px-4 py-2 border border-gray-300 rounded-lg" required><option value="">Select contract...</option>{contracts.map(c => <option key={c.id} value={c.id}>{c.title}</option>)}</select></div>
                <div><label className="block text-sm font-medium text-gray-700 mb-1">Section</label><input type="text" value={newRedline.section} onChange={(e) => setNewRedline({ ...newRedline, section: e.target.value })} className="w-full px-4 py-2 border border-gray-300 rounded-lg" /></div>
                <div><label className="block text-sm font-medium text-gray-700 mb-1">Author</label><input type="text" value={newRedline.author} onChange={(e) => setNewRedline({ ...newRedline, author: e.target.value })} className="w-full px-4 py-2 border border-gray-300 rounded-lg" /></div>
                <div className="col-span-2"><label className="block text-sm font-medium text-gray-700 mb-1">Original Text</label><textarea value={newRedline.originalText} onChange={(e) => setNewRedline({ ...newRedline, originalText: e.target.value })} className="w-full px-4 py-2 border border-gray-300 rounded-lg" rows={3} required /></div>
                <div className="col-span-2"><label className="block text-sm font-medium text-gray-700 mb-1">Proposed Text</label><textarea value={newRedline.proposedText} onChange={(e) => setNewRedline({ ...newRedline, proposedText: e.target.value })} className="w-full px-4 py-2 border border-gray-300 rounded-lg" rows={3} required /></div>
                <div className="col-span-2"><label className="block text-sm font-medium text-gray-700 mb-1">Reason</label><textarea value={newRedline.reason} onChange={(e) => setNewRedline({ ...newRedline, reason: e.target.value })} className="w-full px-4 py-2 border border-gray-300 rounded-lg" rows={2} /></div>
              </div>
              <div className="flex justify-end gap-3">
                <button type="button" onClick={() => setShowModal(false)} className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg">Cancel</button>
                <button type="submit" disabled={submitting} className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50 flex items-center gap-2">
                  {submitting ? <><Loader2 size={18} className="animate-spin" />Creating...</> : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* AI Suggest Modal */}
      {showAIModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-lg m-4">
            <div className="p-6 border-b border-gray-100">
              <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                <Sparkles className="text-purple-500" size={24} />AI Redline Suggestions
              </h2>
              <p className="text-sm text-gray-500 mt-1">Select a contract and our AI will analyze it and suggest redline improvements</p>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Contract *</label>
                <select value={aiContractId} onChange={(e) => setAiContractId(e.target.value)} className="w-full px-4 py-2 border border-gray-300 rounded-lg" required>
                  <option value="">Select contract to analyze...</option>
                  {contracts.map(c => <option key={c.id} value={c.id}>{c.title}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Section Focus (optional)</label>
                <input type="text" value={aiSection} onChange={(e) => setAiSection(e.target.value)} placeholder="e.g., Indemnification, Termination, Liability..." className="w-full px-4 py-2 border border-gray-300 rounded-lg" />
                <p className="text-xs text-gray-400 mt-1">Leave blank to analyze the entire contract</p>
              </div>
              <div className="bg-purple-50 border border-purple-200 rounded-lg p-3">
                <p className="text-sm text-purple-800">AI will generate 3-6 redline suggestions covering risk mitigation, clarity improvements, compliance gaps, and fairness issues.</p>
              </div>
              <div className="flex justify-end gap-3">
                <button type="button" onClick={closeAIModal} className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200">Cancel</button>
                <button onClick={handleAISuggest} disabled={!aiContractId || aiSuggesting} className="px-4 py-2 bg-gradient-to-r from-purple-500 to-indigo-600 text-white rounded-lg hover:from-purple-600 hover:to-indigo-700 disabled:opacity-50 flex items-center gap-2">
                  {aiSuggesting ? <><Loader2 size={18} className="animate-spin" />Analyzing...</> : <><Sparkles size={18} />Generate Suggestions</>}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
