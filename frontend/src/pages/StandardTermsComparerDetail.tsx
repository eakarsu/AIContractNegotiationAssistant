import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, GitCompareArrows, AlertTriangle, CheckCircle, Edit, Trash2, Save, Shield, Lightbulb } from 'lucide-react';
import { getStandardTermComparison, updateStandardTermComparison, deleteStandardTermComparison } from '../services/api';
import { useToast } from '../hooks/useToast';
import { useConfirm } from '../hooks/useConfirm';
import { useEscapeKey } from '../hooks/useEscapeKey';
import DetailSkeleton from '../components/skeletons/DetailSkeleton';

export default function StandardTermsComparerDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const toast = useToast();
  const confirm = useConfirm();
  const [comparison, setComparison] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [editData, setEditData] = useState({ title: '' });
  const [submitting, setSubmitting] = useState(false);

  const cancelEditing = useCallback(() => setEditing(false), []);
  useEscapeKey(cancelEditing, editing);

  useEffect(() => { loadData(); }, [id]);

  const loadData = async () => {
    try {
      const res = await getStandardTermComparison(parseInt(id!));
      setComparison(res.data);
      setEditData({ title: res.data.title });
    } catch {
      toast.error('Failed to load comparison.');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (submitting) return;
    setSubmitting(true);
    try {
      await updateStandardTermComparison(parseInt(id!), editData);
      setEditing(false);
      toast.success('Comparison updated successfully.');
      loadData();
    } catch {
      toast.error('Failed to update comparison.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    const confirmed = await confirm({
      title: 'Delete Comparison',
      message: 'Are you sure you want to delete this comparison? This action cannot be undone.',
      confirmLabel: 'Delete',
      variant: 'danger',
    });
    if (!confirmed) return;
    if (submitting) return;
    setSubmitting(true);
    try {
      await deleteStandardTermComparison(parseInt(id!));
      toast.success('Comparison deleted.');
      navigate('/ai-tools/standard-terms-comparer');
    } catch {
      toast.error('Failed to delete comparison.');
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
  if (!comparison) return <div className="text-center py-12"><p>Comparison not found</p></div>;

  const deviations = parseJSON(comparison.deviations) || [];
  const recommendations = parseJSON(comparison.recommendations) || [];
  const aiAnalysis = parseJSON(comparison.aiAnalysis) || {};

  const allDeviations = Array.isArray(deviations) && deviations.length > 0 ? deviations : (Array.isArray(aiAnalysis.deviations) ? aiAnalysis.deviations : []);
  const allRecommendations = Array.isArray(recommendations) && recommendations.length > 0 ? recommendations : (Array.isArray(aiAnalysis.recommendations) ? aiAnalysis.recommendations : []);
  const riskAssessment = comparison.riskAssessment || aiAnalysis.riskAssessment || '';
  const summary = aiAnalysis.summary || '';
  const positiveDeviations = Array.isArray(aiAnalysis.positiveDeviations) ? aiAnalysis.positiveDeviations : [];
  const negotiationLeverage = aiAnalysis.negotiationLeverage || '';

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <button onClick={() => navigate('/ai-tools/standard-terms-comparer')} className="flex items-center gap-2 text-gray-600 hover:text-gray-900">
          <ArrowLeft size={20} />Back to Standard Terms Comparer
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
            <div className="p-3 bg-blue-100 rounded-xl"><GitCompareArrows className="text-blue-600" size={28} /></div>
            <div>
              {editing ? (
                <div className="flex items-center gap-2">
                  <input type="text" value={editData.title} onChange={(e) => setEditData({...editData, title: e.target.value})} className="text-2xl font-bold text-gray-900 border-b border-gray-300" />
                  <button onClick={handleSave} disabled={submitting} className="p-2 bg-primary-600 text-white rounded-lg disabled:opacity-50">
                    <Save size={18} />
                  </button>
                </div>
              ) : (
                <h1 className="text-2xl font-bold text-gray-900">{comparison.title}</h1>
              )}
              <p className="text-gray-500">{new Date(comparison.createdAt).toLocaleString()}</p>
            </div>
          </div>
          <span className={`px-3 py-1.5 text-sm font-medium rounded-full ${comparison.complianceScore >= 80 ? 'bg-green-100 text-green-700' : comparison.complianceScore >= 50 ? 'bg-yellow-100 text-yellow-700' : 'bg-red-100 text-red-700'}`}>
            {comparison.complianceScore}% Compliance
          </span>
        </div>

        {/* Summary */}
        {summary && (
          <div className="mb-8 bg-blue-50 border border-blue-200 rounded-xl p-5">
            <h3 className="font-semibold text-blue-900 mb-2">Executive Summary</h3>
            <p className="text-blue-800 leading-relaxed">{renderText(summary)}</p>
          </div>
        )}

        {/* Compliance Score */}
        <div className="mb-8">
          <h2 className="text-lg font-semibold text-gray-900 mb-3">Compliance Score</h2>
          <div className="bg-gray-50 rounded-xl p-6">
            <div className="flex items-center gap-4">
              <div className="flex-1">
                <div className="h-4 bg-gray-200 rounded-full overflow-hidden">
                  <div className={`h-full rounded-full ${comparison.complianceScore >= 80 ? 'bg-green-500' : comparison.complianceScore >= 50 ? 'bg-yellow-500' : 'bg-red-500'}`} style={{ width: `${comparison.complianceScore}%` }}></div>
                </div>
              </div>
              <span className="text-3xl font-bold text-gray-900">{comparison.complianceScore}%</span>
            </div>
          </div>
        </div>

        {/* Side by Side Comparison */}
        <div className="mb-8 grid grid-cols-2 gap-4">
          <div>
            <h2 className="text-lg font-semibold text-gray-900 mb-3">Your Contract Terms</h2>
            <div className="bg-gray-50 rounded-xl p-4 h-64 overflow-y-auto">
              <p className="text-sm text-gray-700 whitespace-pre-wrap">{comparison.contractTerms}</p>
            </div>
          </div>
          <div>
            <h2 className="text-lg font-semibold text-gray-900 mb-3">Standard Terms</h2>
            <div className="bg-gray-50 rounded-xl p-4 h-64 overflow-y-auto">
              <p className="text-sm text-gray-700 whitespace-pre-wrap">{comparison.standardTerms}</p>
            </div>
          </div>
        </div>

        {/* Deviations */}
        {allDeviations.length > 0 && (
          <div className="mb-8">
            <h2 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
              <AlertTriangle className="text-amber-500" size={20} />Deviations Found ({allDeviations.length})
            </h2>
            <div className="space-y-3">
              {allDeviations.map((d: any, idx: number) => (
                <div key={idx} className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                  <div className="flex items-start justify-between mb-2">
                    <h4 className="font-medium text-amber-900">{d.term || `Deviation ${idx + 1}`}</h4>
                    <div className="flex items-center gap-2">
                      {d.direction && (
                        <span className={`px-2 py-0.5 text-xs font-medium rounded ${d.direction === 'favorable' ? 'bg-green-100 text-green-700' : d.direction === 'unfavorable' ? 'bg-red-100 text-red-700' : 'bg-gray-100 text-gray-700'}`}>
                          {d.direction}
                        </span>
                      )}
                      <span className={`px-2 py-0.5 text-xs font-medium rounded ${d.severity === 'critical' ? 'bg-red-200 text-red-800' : d.severity === 'major' || d.severity === 'high' ? 'bg-red-100 text-red-700' : d.severity === 'medium' ? 'bg-yellow-100 text-yellow-700' : 'bg-green-100 text-green-700'}`}>
                        {d.severity || 'medium'}
                      </span>
                    </div>
                  </div>
                  {d.contractVersion && <p className="text-sm text-amber-800 mb-1"><strong>Your version:</strong> {d.contractVersion}</p>}
                  {d.standardVersion && <p className="text-sm text-amber-800 mb-1"><strong>Standard:</strong> {d.standardVersion}</p>}
                  {d.impact && <p className="text-sm text-amber-700 mt-2">{renderText(d.impact)}</p>}
                  {d.suggestedFix && (
                    <div className="mt-2 bg-white rounded p-2 border border-amber-200">
                      <p className="text-xs text-amber-600 font-medium">Suggested fix:</p>
                      <p className="text-sm text-amber-800">{d.suggestedFix}</p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Positive Deviations */}
        {positiveDeviations.length > 0 && (
          <div className="mb-8">
            <h2 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
              <CheckCircle className="text-green-500" size={20} />Favorable Terms
            </h2>
            <div className="bg-green-50 border border-green-200 rounded-xl p-4">
              <ul className="space-y-2">
                {positiveDeviations.map((p: any, idx: number) => (
                  <li key={idx} className="flex items-start gap-2 text-green-800">
                    <CheckCircle size={16} className="flex-shrink-0 mt-0.5" />
                    <span>{typeof p === 'string' ? p : renderText(p)}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        )}

        {/* Risk Assessment */}
        {riskAssessment && (
          <div className="mb-8">
            <h2 className="text-lg font-semibold text-gray-900 mb-3">Risk Assessment</h2>
            <div className="bg-red-50 border border-red-200 rounded-xl p-6">
              <p className="text-red-800 whitespace-pre-wrap">{renderText(riskAssessment)}</p>
            </div>
          </div>
        )}

        {/* Negotiation Leverage */}
        {negotiationLeverage && (
          <div className="mb-8">
            <h2 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
              <Lightbulb className="text-indigo-500" size={20} />Negotiation Leverage
            </h2>
            <div className="bg-indigo-50 border border-indigo-200 rounded-xl p-6">
              <p className="text-indigo-800 leading-relaxed">{renderText(negotiationLeverage)}</p>
            </div>
          </div>
        )}

        {/* Recommendations */}
        {allRecommendations.length > 0 && (
          <div className="mb-8">
            <h2 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
              <CheckCircle className="text-green-500" size={20} />Recommendations ({allRecommendations.length})
            </h2>
            <div className="space-y-3">
              {allRecommendations.map((r: any, idx: number) => (
                <div key={idx} className="bg-green-50 border border-green-200 rounded-lg p-4 flex items-start gap-3">
                  <span className="bg-green-200 text-green-800 rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold flex-shrink-0">{idx + 1}</span>
                  <div className="flex-1">
                    {typeof r === 'string' ? (
                      <p className="text-green-800">{r}</p>
                    ) : (
                      <>
                        <div className="flex items-center gap-2 mb-1">
                          <p className="text-green-900 font-medium">{r.action || r.recommendation || renderText(r)}</p>
                          {r.priority && (
                            <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${r.priority === 'high' ? 'bg-red-100 text-red-700' : r.priority === 'medium' ? 'bg-yellow-100 text-yellow-700' : 'bg-green-100 text-green-700'}`}>
                              {r.priority}
                            </span>
                          )}
                        </div>
                        {r.rationale && <p className="text-green-700 text-sm">{r.rationale}</p>}
                      </>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Raw AI Analysis */}
        {comparison.aiAnalysis && (
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
