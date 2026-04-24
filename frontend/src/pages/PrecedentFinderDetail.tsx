import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Scale, BookMarked, Edit, Trash2, Save, Copy, Check, AlertTriangle, Lightbulb, FileText, Globe, Shield } from 'lucide-react';
import { getPrecedentSearch, updatePrecedentSearch, deletePrecedentSearch } from '../services/api';
import { useToast } from '../hooks/useToast';
import { useConfirm } from '../hooks/useConfirm';
import { useEscapeKey } from '../hooks/useEscapeKey';
import DetailSkeleton from '../components/skeletons/DetailSkeleton';

export default function PrecedentFinderDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const toast = useToast();
  const confirm = useConfirm();
  const [search, setSearch] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [editData, setEditData] = useState({ query: '' });
  const [copied, setCopied] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const cancelEditing = useCallback(() => setEditing(false), []);
  useEscapeKey(cancelEditing, editing);

  useEffect(() => { loadData(); }, [id]);

  const loadData = async () => {
    try {
      const res = await getPrecedentSearch(parseInt(id!));
      setSearch(res.data);
      setEditData({ query: res.data.query });
    } catch {
      toast.error('Failed to load precedent search.');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (submitting) return;
    setSubmitting(true);
    try {
      await updatePrecedentSearch(parseInt(id!), editData);
      setEditing(false);
      toast.success('Search updated successfully.');
      loadData();
    } catch {
      toast.error('Failed to update search.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    const confirmed = await confirm({
      title: 'Delete Search',
      message: 'Are you sure you want to delete this search? This action cannot be undone.',
      confirmLabel: 'Delete',
      variant: 'danger',
    });
    if (!confirmed) return;
    if (submitting) return;
    setSubmitting(true);
    try {
      await deletePrecedentSearch(parseInt(id!));
      toast.success('Search deleted.');
      navigate('/ai-tools/precedent-finder');
    } catch {
      toast.error('Failed to delete search.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleCopy = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopied(key);
    toast.success('Copied to clipboard.');
    setTimeout(() => setCopied(null), 2000);
  };

  const parseJSON = (str: any) => {
    if (!str) return null;
    if (typeof str === 'object') return str;
    try { return JSON.parse(str); } catch { return null; }
  };

  const renderText = (val: any): string => {
    if (!val) return '';
    if (typeof val === 'string') return val;
    return JSON.stringify(val, null, 2);
  };

  if (loading) return <DetailSkeleton />;
  if (!search) return <div className="text-center py-12"><p>Search not found</p></div>;

  const precedents = parseJSON(search.precedents) || [];
  const citations = parseJSON(search.citations) || [];
  const aiAnalysis = parseJSON(search.aiAnalysis) || {};

  // Merge: use top-level parsed fields + aiAnalysis for full coverage
  const allPrecedents = Array.isArray(precedents) && precedents.length > 0 ? precedents : (Array.isArray(aiAnalysis.precedents) ? aiAnalysis.precedents : []);
  const allCitations = Array.isArray(citations) && citations.length > 0 ? citations : (Array.isArray(aiAnalysis.citations) ? aiAnalysis.citations : []);
  const allRecommendations = Array.isArray(aiAnalysis.recommendations) ? aiAnalysis.recommendations : [];
  const standardLanguage = aiAnalysis.standardLanguage || aiAnalysis.standard_language || '';
  const alternativeLanguage = aiAnalysis.alternativeLanguage || aiAnalysis.alternative_language || '';
  const legalLandscape = aiAnalysis.legalLandscape || aiAnalysis.legal_landscape || '';
  const riskFactors = Array.isArray(aiAnalysis.riskFactors) ? aiAnalysis.riskFactors : (Array.isArray(aiAnalysis.risk_factors) ? aiAnalysis.risk_factors : []);
  const summary = aiAnalysis.summary || '';

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <button onClick={() => navigate('/ai-tools/precedent-finder')} className="flex items-center gap-2 text-gray-600 hover:text-gray-900">
          <ArrowLeft size={20} />Back to Precedent Finder
        </button>
        <div className="flex items-center gap-2">
          <button onClick={() => setEditing(!editing)} className="flex items-center gap-2 px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200">
            <Edit size={18} />{editing ? 'Cancel' : 'Edit'}
          </button>
          <button onClick={handleDelete} disabled={submitting} className="flex items-center gap-2 px-4 py-2 text-red-700 bg-red-100 rounded-lg hover:bg-red-200 disabled:opacity-50">
            <Trash2 size={18} />Delete
          </button>
        </div>
      </div>

      {/* Header */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <div className="flex items-start justify-between mb-6">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-indigo-100 rounded-xl"><Scale className="text-indigo-600" size={28} /></div>
            <div>
              {editing ? (
                <div className="flex items-center gap-2">
                  <input type="text" value={editData.query} onChange={(e) => setEditData({...editData, query: e.target.value})} className="text-xl font-bold text-gray-900 border-b border-gray-300 w-full" />
                  <button onClick={handleSave} disabled={submitting} className="p-2 bg-primary-600 text-white rounded-lg disabled:opacity-50">
                    <Save size={18} />
                  </button>
                </div>
              ) : (
                <h1 className="text-xl font-bold text-gray-900">{search.query}</h1>
              )}
              <div className="flex items-center gap-2 mt-1">
                {search.clauseType && <span className="px-2 py-0.5 text-xs bg-gray-100 text-gray-600 rounded">{search.clauseType}</span>}
                {search.jurisdiction && <span className="px-2 py-0.5 text-xs bg-gray-100 text-gray-600 rounded">{search.jurisdiction}</span>}
                <span className="text-gray-400 text-sm">{new Date(search.createdAt).toLocaleString()}</span>
              </div>
            </div>
          </div>
          <span className={`px-3 py-1.5 text-sm font-medium rounded-full ${search.relevanceScore >= 70 ? 'bg-green-100 text-green-700' : search.relevanceScore >= 40 ? 'bg-yellow-100 text-yellow-700' : 'bg-red-100 text-red-700'}`}>
            {search.relevanceScore}% Relevance
          </span>
        </div>

        {/* Summary */}
        {summary && (
          <div className="bg-indigo-50 border border-indigo-200 rounded-xl p-5 mb-6">
            <h3 className="font-semibold text-indigo-900 mb-2 flex items-center gap-2">
              <FileText size={18} />Executive Summary
            </h3>
            <p className="text-indigo-800 leading-relaxed">{renderText(summary)}</p>
          </div>
        )}

        {/* Precedents Found */}
        {allPrecedents.length > 0 && (
          <div className="mb-8">
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <BookMarked className="text-indigo-500" size={20} />Precedents Found ({allPrecedents.length})
            </h2>
            <div className="space-y-4">
              {allPrecedents.map((p: any, idx: number) => (
                <div key={idx} className="bg-gray-50 rounded-xl p-5 border border-gray-200">
                  <div className="flex items-start justify-between mb-2">
                    <h4 className="font-semibold text-gray-900 text-lg">{p.title || `Precedent ${idx + 1}`}</h4>
                    <div className="flex items-center gap-2">
                      {p.year && <span className="text-sm text-gray-500 bg-white px-2 py-0.5 rounded">{p.year}</span>}
                      {p.impact && (
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${p.impact === 'supporting' ? 'bg-green-100 text-green-700' : p.impact === 'cautionary' ? 'bg-red-100 text-red-700' : 'bg-yellow-100 text-yellow-700'}`}>
                          {p.impact}
                        </span>
                      )}
                    </div>
                  </div>
                  {(p.citation || p.source) && <p className="text-sm text-indigo-600 font-mono mb-2">{p.citation || p.source}</p>}
                  {p.court && <p className="text-sm text-gray-500 mb-2">Court: {p.court}</p>}
                  {p.summary && <p className="text-gray-700 mb-3">{renderText(p.summary)}</p>}
                  {p.keyHolding && (
                    <div className="bg-white rounded-lg p-3 border border-gray-200 mb-2">
                      <p className="text-sm font-medium text-gray-600 mb-1">Key Holding:</p>
                      <p className="text-gray-800">{renderText(p.keyHolding)}</p>
                    </div>
                  )}
                  {p.relevance && (
                    <div className="bg-white rounded-lg p-3 border border-gray-200">
                      <p className="text-sm font-medium text-gray-600 mb-1">Relevance to Query:</p>
                      <p className="text-gray-700">{renderText(p.relevance)}</p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Legal Landscape */}
        {legalLandscape && (
          <div className="mb-8">
            <h2 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
              <Globe className="text-blue-500" size={20} />Legal Landscape
            </h2>
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-5">
              <p className="text-blue-800 leading-relaxed">{renderText(legalLandscape)}</p>
            </div>
          </div>
        )}

        {/* Standard Language */}
        {standardLanguage && (
          <div className="mb-8">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                <FileText className="text-green-500" size={20} />Suggested Standard Language
              </h2>
              <button onClick={() => handleCopy(renderText(standardLanguage), 'std')} className="flex items-center gap-1 px-3 py-1 text-sm text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200">
                {copied === 'std' ? <Check size={16} className="text-green-500" /> : <Copy size={16} />}
                {copied === 'std' ? 'Copied!' : 'Copy'}
              </button>
            </div>
            <div className="bg-green-50 border border-green-200 rounded-xl p-6">
              <p className="text-green-800 whitespace-pre-wrap font-mono text-sm">{renderText(standardLanguage)}</p>
            </div>
          </div>
        )}

        {/* Alternative Language */}
        {alternativeLanguage && (
          <div className="mb-8">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                <FileText className="text-emerald-500" size={20} />Alternative Language
              </h2>
              <button onClick={() => handleCopy(renderText(alternativeLanguage), 'alt')} className="flex items-center gap-1 px-3 py-1 text-sm text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200">
                {copied === 'alt' ? <Check size={16} className="text-green-500" /> : <Copy size={16} />}
                {copied === 'alt' ? 'Copied!' : 'Copy'}
              </button>
            </div>
            <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-6">
              <p className="text-emerald-800 whitespace-pre-wrap font-mono text-sm">{renderText(alternativeLanguage)}</p>
            </div>
          </div>
        )}

        {/* Legal Citations */}
        {allCitations.length > 0 && (
          <div className="mb-8">
            <h2 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
              <BookMarked className="text-purple-500" size={20} />Legal Citations ({allCitations.length})
            </h2>
            <div className="bg-gray-50 rounded-xl p-4 border border-gray-200">
              <ul className="space-y-2">
                {allCitations.map((c: any, idx: number) => (
                  <li key={idx} className="flex items-start gap-2 text-gray-700">
                    <span className="text-indigo-500 font-bold mt-1">•</span>
                    <span className="font-mono text-sm">{typeof c === 'string' ? c : c.citation || c.title || renderText(c)}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        )}

        {/* Risk Factors */}
        {riskFactors.length > 0 && (
          <div className="mb-8">
            <h2 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
              <AlertTriangle className="text-amber-500" size={20} />Risk Factors
            </h2>
            <div className="space-y-2">
              {riskFactors.map((r: any, idx: number) => (
                <div key={idx} className="bg-amber-50 border border-amber-200 rounded-lg p-3 flex items-start gap-3">
                  <AlertTriangle className="text-amber-600 flex-shrink-0 mt-0.5" size={16} />
                  <p className="text-amber-800">{typeof r === 'string' ? r : renderText(r)}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Drafting Recommendations */}
        {allRecommendations.length > 0 && (
          <div className="mb-8">
            <h2 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
              <Lightbulb className="text-blue-500" size={20} />Drafting Recommendations
            </h2>
            <div className="space-y-3">
              {allRecommendations.map((r: any, idx: number) => (
                <div key={idx} className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <div className="flex items-start gap-3">
                    <span className="bg-blue-200 text-blue-800 rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold flex-shrink-0">{idx + 1}</span>
                    <div className="flex-1">
                      {typeof r === 'string' ? (
                        <p className="text-blue-800">{r}</p>
                      ) : (
                        <>
                          <div className="flex items-center gap-2 mb-1">
                            <p className="text-blue-900 font-medium">{r.recommendation || r.action || renderText(r)}</p>
                            {r.priority && (
                              <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${r.priority === 'high' ? 'bg-red-100 text-red-700' : r.priority === 'medium' ? 'bg-yellow-100 text-yellow-700' : 'bg-green-100 text-green-700'}`}>
                                {r.priority}
                              </span>
                            )}
                          </div>
                          {r.basis && <p className="text-blue-700 text-sm mt-1">Basis: {r.basis}</p>}
                          {r.rationale && <p className="text-blue-700 text-sm mt-1">{r.rationale}</p>}
                        </>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Raw AI Analysis - always show if we have data */}
        {search.aiAnalysis && (
          <div className="mt-8 border-t border-gray-200 pt-6">
            <details className="group">
              <summary className="flex items-center gap-2 cursor-pointer text-gray-600 hover:text-gray-900">
                <Shield size={18} />
                <span className="font-medium">Raw AI Analysis Data</span>
                <span className="text-xs text-gray-400 ml-2">(click to expand)</span>
              </summary>
              <div className="mt-3 bg-gray-50 rounded-xl p-4 border border-gray-200 overflow-x-auto">
                <pre className="text-xs text-gray-700 whitespace-pre-wrap font-mono">{JSON.stringify(aiAnalysis, null, 2)}</pre>
              </div>
            </details>
          </div>
        )}
      </div>
    </div>
  );
}
