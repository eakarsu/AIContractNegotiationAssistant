import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Highlighter, AlertTriangle, CheckCircle, Lightbulb, Edit, Trash2, Save, Shield } from 'lucide-react';
import { getRiskClauseHighlight, updateRiskClauseHighlight, deleteRiskClauseHighlight } from '../services/api';
import { useToast } from '../hooks/useToast';
import { useConfirm } from '../hooks/useConfirm';
import { useEscapeKey } from '../hooks/useEscapeKey';
import DetailSkeleton from '../components/skeletons/DetailSkeleton';

export default function RiskClauseHighlighterDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const toast = useToast();
  const confirm = useConfirm();
  const [highlight, setHighlight] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [editData, setEditData] = useState({ title: '', content: '' });
  const [submitting, setSubmitting] = useState(false);

  const cancelEditing = useCallback(() => setEditing(false), []);
  useEscapeKey(cancelEditing, editing);

  useEffect(() => { loadData(); }, [id]);

  const loadData = async () => {
    try {
      const res = await getRiskClauseHighlight(parseInt(id!));
      setHighlight(res.data);
      setEditData({ title: res.data.title, content: res.data.content });
    } catch {
      toast.error('Failed to load risk clause analysis.');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (submitting) return;
    setSubmitting(true);
    try {
      await updateRiskClauseHighlight(parseInt(id!), editData);
      setEditing(false);
      toast.success('Analysis updated successfully.');
      loadData();
    } catch {
      toast.error('Failed to update analysis.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    const confirmed = await confirm({
      title: 'Delete Analysis',
      message: 'Are you sure you want to delete this analysis? This action cannot be undone.',
      confirmLabel: 'Delete',
      variant: 'danger',
    });
    if (!confirmed) return;
    if (submitting) return;
    setSubmitting(true);
    try {
      await deleteRiskClauseHighlight(parseInt(id!));
      toast.success('Analysis deleted.');
      navigate('/ai-tools/risk-clause-highlighter');
    } catch {
      toast.error('Failed to delete analysis.');
    } finally {
      setSubmitting(false);
    }
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
  if (!highlight) return <div className="text-center py-12"><p>Analysis not found</p></div>;

  const highlightedTexts = parseJSON(highlight.highlightedText) || [];
  const suggestions = parseJSON(highlight.suggestions) || [];
  const aiAnalysis = parseJSON(highlight.aiAnalysis) || {};

  // Fallback to aiAnalysis data
  const allHighlights = Array.isArray(highlightedTexts) && highlightedTexts.length > 0 ? highlightedTexts : (Array.isArray(aiAnalysis.highlightedText) ? aiAnalysis.highlightedText : []);
  const allSuggestions = Array.isArray(suggestions) && suggestions.length > 0 ? suggestions : (Array.isArray(aiAnalysis.suggestions) ? aiAnalysis.suggestions : []);
  const explanation = highlight.explanation || aiAnalysis.explanation || '';
  const summary = aiAnalysis.summary || '';
  const missingProtections = Array.isArray(aiAnalysis.missingProtections) ? aiAnalysis.missingProtections : [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <button onClick={() => navigate('/ai-tools/risk-clause-highlighter')} className="flex items-center gap-2 text-gray-600 hover:text-gray-900">
          <ArrowLeft size={20} />Back to Risk Clause Highlighter
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

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <div className="flex items-start justify-between mb-6">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-amber-100 rounded-xl"><Highlighter className="text-amber-600" size={28} /></div>
            <div>
              {editing ? (
                <input type="text" value={editData.title} onChange={(e) => setEditData({...editData, title: e.target.value})} className="text-2xl font-bold text-gray-900 border-b border-gray-300 focus:border-primary-500 outline-none" />
              ) : (
                <h1 className="text-2xl font-bold text-gray-900">{highlight.title}</h1>
              )}
              <p className="text-gray-500">{new Date(highlight.createdAt).toLocaleString()}</p>
            </div>
          </div>
          <span className={`px-3 py-1.5 text-sm font-medium rounded-full ${highlight.riskLevel === 'high' ? 'bg-red-100 text-red-700' : highlight.riskLevel === 'medium' ? 'bg-yellow-100 text-yellow-700' : 'bg-green-100 text-green-700'}`}>
            {highlight.riskLevel?.toUpperCase()} RISK
          </span>
        </div>

        {editing && (
          <div className="mb-6">
            <button onClick={handleSave} disabled={submitting} className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50">
              <Save size={18} />{submitting ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        )}

        {/* Summary */}
        {summary && (
          <div className="mb-8 bg-blue-50 border border-blue-200 rounded-xl p-5">
            <h3 className="font-semibold text-blue-900 mb-2">Executive Summary</h3>
            <p className="text-blue-800 leading-relaxed">{renderText(summary)}</p>
          </div>
        )}

        {/* Risk Score */}
        <div className="mb-8">
          <h2 className="text-lg font-semibold text-gray-900 mb-3">Risk Score</h2>
          <div className="bg-gray-50 rounded-xl p-6">
            <div className="flex items-center gap-4">
              <div className="flex-1">
                <div className="h-4 bg-gray-200 rounded-full overflow-hidden">
                  <div className={`h-full rounded-full transition-all ${highlight.riskScore >= 70 ? 'bg-red-500' : highlight.riskScore >= 40 ? 'bg-yellow-500' : 'bg-green-500'}`} style={{ width: `${highlight.riskScore}%` }}></div>
                </div>
              </div>
              <span className="text-3xl font-bold text-gray-900">{highlight.riskScore}/100</span>
            </div>
          </div>
        </div>

        {/* Original Content */}
        <div className="mb-8">
          <h2 className="text-lg font-semibold text-gray-900 mb-3">Original Text</h2>
          <div className="bg-gray-50 rounded-xl p-6">
            {editing ? (
              <textarea value={editData.content} onChange={(e) => setEditData({...editData, content: e.target.value})} rows={6} className="w-full px-4 py-2 border border-gray-300 rounded-lg" />
            ) : (
              <p className="text-gray-700 whitespace-pre-wrap">{highlight.content}</p>
            )}
          </div>
        </div>

        {/* Highlighted Risks */}
        {allHighlights.length > 0 && (
          <div className="mb-8">
            <h2 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
              <AlertTriangle className="text-red-500" size={20} />Risky Text Identified ({allHighlights.length})
            </h2>
            <div className="space-y-3">
              {allHighlights.map((text: any, idx: number) => (
                <div key={idx} className="bg-red-50 border-l-4 border-red-500 rounded-r-lg p-4">
                  <p className="text-red-800 font-medium">{typeof text === 'string' ? text : text.text || renderText(text)}</p>
                  {text.riskType && <p className="text-red-600 text-sm mt-1">Type: {text.riskType}</p>}
                  {text.severity && (
                    <span className={`inline-block mt-2 px-2 py-0.5 text-xs font-medium rounded ${text.severity === 'high' ? 'bg-red-200 text-red-800' : text.severity === 'medium' ? 'bg-yellow-200 text-yellow-800' : 'bg-green-200 text-green-800'}`}>
                      {text.severity}
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Explanation */}
        {explanation && (
          <div className="mb-8">
            <h2 className="text-lg font-semibold text-gray-900 mb-3">Risk Explanation</h2>
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-6">
              <p className="text-amber-800 whitespace-pre-wrap">{renderText(explanation)}</p>
            </div>
          </div>
        )}

        {/* Missing Protections */}
        {missingProtections.length > 0 && (
          <div className="mb-8">
            <h2 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
              <Shield className="text-orange-500" size={20} />Missing Protections
            </h2>
            <div className="bg-orange-50 border border-orange-200 rounded-xl p-4">
              <ul className="space-y-2">
                {missingProtections.map((p: any, idx: number) => (
                  <li key={idx} className="flex items-start gap-2 text-orange-800">
                    <AlertTriangle size={16} className="flex-shrink-0 mt-0.5" />
                    <span>{typeof p === 'string' ? p : renderText(p)}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        )}

        {/* Suggestions */}
        {allSuggestions.length > 0 && (
          <div className="mb-8">
            <h2 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
              <Lightbulb className="text-green-500" size={20} />Suggestions ({allSuggestions.length})
            </h2>
            <div className="space-y-3">
              {allSuggestions.map((s: any, idx: number) => (
                <div key={idx} className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <div className="flex items-start gap-3">
                    <CheckCircle className="text-green-600 flex-shrink-0 mt-0.5" size={18} />
                    <div className="flex-1">
                      {typeof s === 'string' ? (
                        <p className="text-green-800">{s}</p>
                      ) : (
                        <>
                          {s.issue && <p className="text-green-900 font-medium mb-1">{s.issue}</p>}
                          {s.currentText && <p className="text-red-700 text-sm mb-1"><strong>Current:</strong> {s.currentText}</p>}
                          {s.suggestedText && <p className="text-green-700 text-sm mb-1"><strong>Suggested:</strong> {s.suggestedText}</p>}
                          {s.rationale && <p className="text-green-600 text-sm">{s.rationale}</p>}
                          {s.suggestion && <p className="text-green-800">{s.suggestion}</p>}
                        </>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Raw AI Analysis */}
        {highlight.aiAnalysis && (
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
