import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Building, Home, AlertTriangle, CheckCircle, Edit, Trash2, Save, DollarSign, Calendar, User, Shield, Lightbulb } from 'lucide-react';
import { getLeaseAnalysis, updateLeaseAnalysis, deleteLeaseAnalysis } from '../services/api';
import { useToast } from '../hooks/useToast';
import { useConfirm } from '../hooks/useConfirm';
import { useEscapeKey } from '../hooks/useEscapeKey';
import DetailSkeleton from '../components/skeletons/DetailSkeleton';

export default function LeaseAnalyzerDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const toast = useToast();
  const confirm = useConfirm();
  const [analysis, setAnalysis] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [editData, setEditData] = useState({ title: '' });
  const [submitting, setSubmitting] = useState(false);

  const cancelEditing = useCallback(() => {
    setEditing(false);
    if (analysis) {
      setEditData({ title: analysis.title });
    }
  }, [analysis]);

  useEscapeKey(cancelEditing, editing);

  useEffect(() => { loadData(); }, [id]);

  const loadData = async () => {
    try {
      const res = await getLeaseAnalysis(parseInt(id!));
      setAnalysis(res.data);
      setEditData({ title: res.data.title });
    } catch (error) {
      toast.error('Failed to load lease analysis');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (submitting) return;
    setSubmitting(true);
    try {
      await updateLeaseAnalysis(parseInt(id!), editData);
      setEditing(false);
      toast.success('Lease analysis updated successfully');
      loadData();
    } catch (error) {
      toast.error('Failed to update lease analysis');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    const confirmed = await confirm({
      title: 'Delete Analysis',
      message: 'Are you sure you want to delete this lease analysis? This action cannot be undone.',
      confirmLabel: 'Delete',
      variant: 'danger',
    });
    if (!confirmed) return;
    if (submitting) return;
    setSubmitting(true);
    try {
      await deleteLeaseAnalysis(parseInt(id!));
      toast.success('Lease analysis deleted');
      navigate('/ai-tools/lease-analyzer');
    } catch (error) {
      toast.error('Failed to delete lease analysis');
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
  if (!analysis) return <div className="text-center py-12"><p>Analysis not found</p></div>;

  const keyTerms = parseJSON(analysis.keyTerms) || [];
  const risks = parseJSON(analysis.risks) || [];
  const recommendations = parseJSON(analysis.recommendations) || [];
  const aiAnalysis = parseJSON(analysis.aiAnalysis) || {};

  const allKeyTerms = Array.isArray(keyTerms) && keyTerms.length > 0 ? keyTerms : (Array.isArray(aiAnalysis.keyTerms) ? aiAnalysis.keyTerms : []);
  const allRisks = Array.isArray(risks) && risks.length > 0 ? risks : (Array.isArray(aiAnalysis.risks) ? aiAnalysis.risks : []);
  const allRecommendations = Array.isArray(recommendations) && recommendations.length > 0 ? recommendations : (Array.isArray(aiAnalysis.recommendations) ? aiAnalysis.recommendations : []);
  const redFlags = Array.isArray(aiAnalysis.redFlags) ? aiAnalysis.redFlags : [];
  const positiveTerms = Array.isArray(aiAnalysis.positiveTerms) ? aiAnalysis.positiveTerms : [];
  const hiddenCosts = Array.isArray(aiAnalysis.hiddenCosts) ? aiAnalysis.hiddenCosts : [];
  const negotiationPoints = Array.isArray(aiAnalysis.negotiationPoints) ? aiAnalysis.negotiationPoints : [];
  const summary = aiAnalysis.summary || '';

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <button onClick={() => navigate('/ai-tools/lease-analyzer')} className="flex items-center gap-2 text-gray-600 hover:text-gray-900">
          <ArrowLeft size={20} />Back to Lease Analyzer
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
            <div className="p-3 bg-orange-100 rounded-xl"><Building className="text-orange-600" size={28} /></div>
            <div>
              {editing ? (
                <div className="flex items-center gap-2">
                  <input type="text" value={editData.title} onChange={(e) => setEditData({...editData, title: e.target.value})} className="text-2xl font-bold text-gray-900 border-b border-gray-300" />
                  <button onClick={handleSave} disabled={submitting} className="p-2 bg-primary-600 text-white rounded-lg disabled:opacity-50"><Save size={18} /></button>
                </div>
              ) : (
                <h1 className="text-2xl font-bold text-gray-900">{analysis.title}</h1>
              )}
              <p className="text-gray-500">{analysis.propertyAddress || 'Property address not specified'}</p>
            </div>
          </div>
          <div className="text-right">
            <div className={`px-4 py-2 rounded-full text-lg font-bold ${analysis.score >= 70 ? 'bg-green-100 text-green-700' : analysis.score >= 40 ? 'bg-yellow-100 text-yellow-700' : 'bg-red-100 text-red-700'}`}>
              Score: {analysis.score}/100
            </div>
            <p className="text-sm text-gray-500 mt-1">Tenant Favorability</p>
          </div>
        </div>

        {/* Summary */}
        {summary && (
          <div className="mb-8 bg-orange-50 border border-orange-200 rounded-xl p-5">
            <h3 className="font-semibold text-orange-900 mb-2">Overall Assessment</h3>
            <p className="text-orange-800 leading-relaxed">{renderText(summary)}</p>
          </div>
        )}

        {/* Property & Lease Info */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
            <div className="flex items-center gap-2 text-gray-500 mb-1">
              <Home size={16} />
              <span className="text-sm">Property Type</span>
            </div>
            <p className="font-medium text-gray-900">{analysis.propertyType || 'Not specified'}</p>
          </div>
          <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
            <div className="flex items-center gap-2 text-gray-500 mb-1">
              <DollarSign size={16} />
              <span className="text-sm">Monthly Rent</span>
            </div>
            <p className="font-medium text-gray-900">{analysis.monthlyRent ? `$${analysis.monthlyRent}` : 'Not specified'}</p>
          </div>
          <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
            <div className="flex items-center gap-2 text-gray-500 mb-1">
              <DollarSign size={16} />
              <span className="text-sm">Security Deposit</span>
            </div>
            <p className="font-medium text-gray-900">{analysis.securityDeposit ? `$${analysis.securityDeposit}` : 'Not specified'}</p>
          </div>
          <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
            <div className="flex items-center gap-2 text-gray-500 mb-1">
              <Calendar size={16} />
              <span className="text-sm">Lease Term</span>
            </div>
            <p className="font-medium text-gray-900">{analysis.leaseTerm || 'Not specified'}</p>
          </div>
        </div>

        {/* Parties */}
        {(analysis.landlord || analysis.tenant) && (
          <div className="grid grid-cols-2 gap-4 mb-8">
            {analysis.landlord && (
              <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
                <div className="flex items-center gap-2 text-blue-600 mb-1">
                  <User size={16} />
                  <span className="text-sm font-medium">Landlord</span>
                </div>
                <p className="text-blue-900">{analysis.landlord}</p>
              </div>
            )}
            {analysis.tenant && (
              <div className="bg-green-50 rounded-lg p-4 border border-green-200">
                <div className="flex items-center gap-2 text-green-600 mb-1">
                  <User size={16} />
                  <span className="text-sm font-medium">Tenant</span>
                </div>
                <p className="text-green-900">{analysis.tenant}</p>
              </div>
            )}
          </div>
        )}

        {/* Score Bar */}
        <div className="mb-8">
          <h2 className="text-lg font-semibold text-gray-900 mb-3">Tenant Favorability Score</h2>
          <div className="bg-gray-50 rounded-xl p-6">
            <div className="flex items-center gap-4">
              <div className="flex-1">
                <div className="h-4 bg-gray-200 rounded-full overflow-hidden">
                  <div className={`h-full rounded-full ${analysis.score >= 70 ? 'bg-green-500' : analysis.score >= 40 ? 'bg-yellow-500' : 'bg-red-500'}`} style={{ width: `${analysis.score}%` }}></div>
                </div>
              </div>
              <span className="text-3xl font-bold text-gray-900">{analysis.score}/100</span>
            </div>
          </div>
        </div>

        {/* Key Terms */}
        {allKeyTerms.length > 0 && (
          <div className="mb-8">
            <h2 className="text-lg font-semibold text-gray-900 mb-3">Key Lease Terms ({allKeyTerms.length})</h2>
            <div className="space-y-3">
              {allKeyTerms.map((term: any, idx: number) => (
                <div key={idx} className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h4 className="font-medium text-gray-900">{term.term || `Term ${idx + 1}`}</h4>
                      {term.value && <p className="text-gray-700 mt-1">{renderText(term.value)}</p>}
                      {term.marketComparison && <p className="text-sm text-blue-700 mt-1"><strong>Market comparison:</strong> {term.marketComparison}</p>}
                    </div>
                    {term.assessment && (
                      <span className={`px-2 py-1 text-xs font-medium rounded ml-2 ${term.assessment === 'favorable' ? 'bg-green-100 text-green-700' : term.assessment === 'unfavorable' || term.assessment === 'concerning' ? 'bg-red-100 text-red-700' : 'bg-yellow-100 text-yellow-700'}`}>
                        {term.assessment}
                      </span>
                    )}
                  </div>
                  {term.concern && <p className="text-sm text-amber-700 mt-2">{renderText(term.concern)}</p>}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Red Flags */}
        {redFlags.length > 0 && (
          <div className="mb-8">
            <h2 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
              <AlertTriangle className="text-red-500" size={20} />Red Flags ({redFlags.length})
            </h2>
            <div className="space-y-3">
              {redFlags.map((flag: any, idx: number) => (
                <div key={idx} className="bg-red-50 border-l-4 border-red-500 rounded-r-lg p-4">
                  {typeof flag === 'string' ? (
                    <p className="text-red-800">{flag}</p>
                  ) : (
                    <>
                      <h4 className="font-medium text-red-900 mb-1">{flag.flag || `Red Flag ${idx + 1}`}</h4>
                      {flag.clause && <p className="text-sm text-red-700 mb-1"><strong>Clause:</strong> {flag.clause}</p>}
                      {flag.reason && <p className="text-sm text-red-800">{flag.reason}</p>}
                      {flag.legalNote && <p className="text-sm text-red-600 mt-1 italic">{flag.legalNote}</p>}
                    </>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Risks */}
        {allRisks.length > 0 && (
          <div className="mb-8">
            <h2 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
              <AlertTriangle className="text-amber-500" size={20} />Identified Risks ({allRisks.length})
            </h2>
            <div className="space-y-3">
              {allRisks.map((risk: any, idx: number) => (
                <div key={idx} className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                  <div className="flex items-start justify-between mb-1">
                    <h4 className="font-medium text-amber-900">{risk.risk || `Risk ${idx + 1}`}</h4>
                    {risk.severity && (
                      <span className={`px-2 py-0.5 text-xs font-medium rounded ${risk.severity === 'critical' || risk.severity === 'high' ? 'bg-red-200 text-red-800' : risk.severity === 'medium' ? 'bg-yellow-200 text-yellow-800' : 'bg-green-200 text-green-800'}`}>
                        {risk.severity}
                      </span>
                    )}
                  </div>
                  {risk.clause && <p className="text-sm text-amber-700 mb-1"><strong>Clause:</strong> {risk.clause}</p>}
                  {risk.explanation && <p className="text-amber-800 text-sm">{renderText(risk.explanation)}</p>}
                  {risk.financialImpact && <p className="text-sm text-red-700 mt-1"><strong>Financial impact:</strong> {risk.financialImpact}</p>}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Hidden Costs */}
        {hiddenCosts.length > 0 && (
          <div className="mb-8">
            <h2 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
              <DollarSign className="text-red-500" size={20} />Hidden Costs
            </h2>
            <div className="bg-red-50 border border-red-200 rounded-xl p-4">
              <ul className="space-y-2">
                {hiddenCosts.map((cost: any, idx: number) => (
                  <li key={idx} className="flex items-start gap-2 text-red-800">
                    <DollarSign size={16} className="flex-shrink-0 mt-0.5" />
                    <span>{typeof cost === 'string' ? cost : renderText(cost)}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        )}

        {/* Positive Terms */}
        {positiveTerms.length > 0 && (
          <div className="mb-8">
            <h2 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
              <CheckCircle className="text-green-500" size={20} />Tenant-Favorable Terms
            </h2>
            <div className="bg-green-50 border border-green-200 rounded-xl p-4">
              <ul className="space-y-2">
                {positiveTerms.map((term: any, idx: number) => (
                  <li key={idx} className="flex items-start gap-2 text-green-800">
                    <CheckCircle size={16} className="flex-shrink-0 mt-0.5" />
                    <span>{typeof term === 'string' ? term : renderText(term)}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        )}

        {/* Recommendations */}
        {allRecommendations.length > 0 && (
          <div className="mb-8">
            <h2 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
              <Lightbulb className="text-blue-500" size={20} />Recommendations ({allRecommendations.length})
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
                            <p className="text-blue-900 font-medium">{r.recommendation || renderText(r)}</p>
                            {r.priority && (
                              <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${r.priority === 'high' ? 'bg-red-100 text-red-700' : r.priority === 'medium' ? 'bg-yellow-100 text-yellow-700' : 'bg-green-100 text-green-700'}`}>
                                {r.priority}
                              </span>
                            )}
                          </div>
                          {r.suggestedLanguage && <p className="text-blue-700 text-sm mt-1"><strong>Suggested language:</strong> {r.suggestedLanguage}</p>}
                        </>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Negotiation Points */}
        {negotiationPoints.length > 0 && (
          <div className="mb-8">
            <h2 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
              <Lightbulb className="text-indigo-500" size={20} />Top Negotiation Points
            </h2>
            <div className="bg-indigo-50 border border-indigo-200 rounded-xl p-4">
              <ol className="space-y-2 list-decimal list-inside">
                {negotiationPoints.map((point: any, idx: number) => (
                  <li key={idx} className="text-indigo-800 font-medium">
                    {typeof point === 'string' ? point : renderText(point)}
                  </li>
                ))}
              </ol>
            </div>
          </div>
        )}

        {/* Raw AI Analysis */}
        {analysis.aiAnalysis && (
          <div className="border-t border-gray-200 pt-6">
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
