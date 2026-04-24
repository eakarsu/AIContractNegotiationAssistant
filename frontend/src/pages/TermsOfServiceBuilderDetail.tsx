import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Globe, FileText, Edit, Trash2, Save, Copy, Check, Printer, Shield, AlertTriangle, CheckCircle } from 'lucide-react';
import { getTermsOfServiceDoc, updateTermsOfServiceDoc, deleteTermsOfServiceDoc } from '../services/api';
import { useToast } from '../hooks/useToast';
import { useConfirm } from '../hooks/useConfirm';
import { useEscapeKey } from '../hooks/useEscapeKey';
import DetailSkeleton from '../components/skeletons/DetailSkeleton';

export default function TermsOfServiceBuilderDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const toast = useToast();
  const confirm = useConfirm();
  const [tos, setTos] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [editData, setEditData] = useState({ title: '', content: '', status: '' });
  const [copied, setCopied] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const cancelEditing = useCallback(() => {
    setEditing(false);
    if (tos) {
      setEditData({ title: tos.title, content: tos.content, status: tos.status });
    }
  }, [tos]);

  useEscapeKey(cancelEditing, editing);

  useEffect(() => { loadData(); }, [id]);

  const loadData = async () => {
    try {
      const res = await getTermsOfServiceDoc(parseInt(id!));
      setTos(res.data);
      setEditData({ title: res.data.title, content: res.data.content, status: res.data.status });
    } catch (error) {
      toast.error('Failed to load Terms of Service document');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (submitting) return;
    setSubmitting(true);
    try {
      await updateTermsOfServiceDoc(parseInt(id!), editData);
      setEditing(false);
      toast.success('Terms of Service updated successfully');
      loadData();
    } catch (error) {
      toast.error('Failed to update Terms of Service');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    const confirmed = await confirm({
      title: 'Delete Terms of Service',
      message: 'Are you sure you want to delete this Terms of Service? This action cannot be undone.',
      confirmLabel: 'Delete',
      variant: 'danger',
    });
    if (!confirmed) return;
    if (submitting) return;
    setSubmitting(true);
    try {
      await deleteTermsOfServiceDoc(parseInt(id!));
      toast.success('Terms of Service deleted');
      navigate('/ai-tools/terms-of-service-builder');
    } catch (error) {
      toast.error('Failed to delete Terms of Service');
      setSubmitting(false);
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(tos.content);
    setCopied(true);
    toast.success('Copied to clipboard');
    setTimeout(() => setCopied(false), 2000);
  };

  const handlePrint = () => {
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(`
        <html>
          <head><title>${tos.title}</title>
            <style>body { font-family: Arial, sans-serif; padding: 40px; line-height: 1.6; } h1 { text-align: center; }</style>
          </head>
          <body>
            <h1>${tos.title}</h1>
            <pre style="white-space: pre-wrap; font-family: inherit;">${tos.content}</pre>
          </body>
        </html>
      `);
      printWindow.document.close();
      printWindow.print();
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
  if (!tos) return <div className="text-center py-12"><p>Terms of Service not found</p></div>;

  const aiAnalysis = parseJSON(tos.aiAnalysis) || {};
  const sections = parseJSON(tos.sections) || [];
  const allSections = Array.isArray(sections) && sections.length > 0 ? sections : (Array.isArray(aiAnalysis.sections) ? aiAnalysis.sections : []);
  const userRights = tos.userRights || aiAnalysis.userRights || '';
  const userObligations = aiAnalysis.userObligations || '';
  const limitations = tos.limitations || aiAnalysis.limitations || '';
  const disputeResolution = tos.disputeResolution || aiAnalysis.disputeResolution || '';
  const dataPrivacy = aiAnalysis.dataPrivacy || '';
  const complianceNotes = Array.isArray(aiAnalysis.complianceNotes) ? aiAnalysis.complianceNotes : [];
  const summary = aiAnalysis.summary || '';
  const content = tos.content || aiAnalysis.content || '';

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <button onClick={() => navigate('/ai-tools/terms-of-service-builder')} className="flex items-center gap-2 text-gray-600 hover:text-gray-900">
          <ArrowLeft size={20} />Back to Terms of Service Builder
        </button>
        <div className="flex items-center gap-2">
          <button onClick={handleCopy} className="flex items-center gap-2 px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200">
            {copied ? <Check size={18} className="text-green-500" /> : <Copy size={18} />}
            {copied ? 'Copied!' : 'Copy'}
          </button>
          <button onClick={handlePrint} className="flex items-center gap-2 px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200">
            <Printer size={18} />Print
          </button>
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
            <div className="p-3 bg-cyan-100 rounded-xl"><Globe className="text-cyan-600" size={28} /></div>
            <div>
              {editing ? (
                <input type="text" value={editData.title} onChange={(e) => setEditData({...editData, title: e.target.value})} className="text-2xl font-bold text-gray-900 border-b border-gray-300" />
              ) : (
                <h1 className="text-2xl font-bold text-gray-900">{tos.title}</h1>
              )}
              <p className="text-gray-500">{new Date(tos.createdAt).toLocaleString()}</p>
            </div>
          </div>
          {editing ? (
            <select value={editData.status} onChange={(e) => setEditData({...editData, status: e.target.value})} className="px-3 py-1.5 border border-gray-300 rounded-lg">
              <option value="draft">Draft</option>
              <option value="final">Final</option>
            </select>
          ) : (
            <span className={`px-3 py-1.5 text-sm font-medium rounded-full ${tos.status === 'final' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
              {tos.status?.toUpperCase()}
            </span>
          )}
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
          <div className="mb-8 bg-cyan-50 border border-cyan-200 rounded-xl p-5">
            <h3 className="font-semibold text-cyan-900 mb-2">Executive Summary</h3>
            <p className="text-cyan-800 leading-relaxed">{renderText(summary)}</p>
          </div>
        )}

        {/* Company Information */}
        <div className="grid grid-cols-3 gap-4 mb-8">
          <div className="bg-cyan-50 rounded-lg p-4 border border-cyan-200">
            <p className="text-sm text-cyan-600 mb-1">Company Name</p>
            <p className="font-medium text-cyan-900">{tos.companyName}</p>
          </div>
          <div className="bg-cyan-50 rounded-lg p-4 border border-cyan-200">
            <p className="text-sm text-cyan-600 mb-1">Service Type</p>
            <p className="font-medium text-cyan-900">{tos.serviceType || 'Not specified'}</p>
          </div>
          <div className="bg-cyan-50 rounded-lg p-4 border border-cyan-200">
            <p className="text-sm text-cyan-600 mb-1">Website</p>
            <p className="font-medium text-cyan-900">{tos.website || 'Not specified'}</p>
          </div>
        </div>

        {/* Sections */}
        {allSections.length > 0 && (
          <div className="mb-8">
            <h3 className="font-semibold text-gray-900 mb-3">Document Sections ({allSections.length})</h3>
            <div className="flex flex-wrap gap-2">
              {allSections.map((section: any, idx: number) => (
                <span key={idx} className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm">{typeof section === 'string' ? section : renderText(section)}</span>
              ))}
            </div>
          </div>
        )}

        {/* Key Sections */}
        {userRights && (
          <div className="mb-6">
            <h3 className="font-semibold text-gray-900 mb-2 flex items-center gap-2">
              <CheckCircle className="text-green-500" size={18} />User Rights
            </h3>
            <div className="bg-green-50 rounded-lg p-4 border border-green-200">
              <p className="text-green-800 whitespace-pre-wrap">{renderText(userRights)}</p>
            </div>
          </div>
        )}

        {userObligations && (
          <div className="mb-6">
            <h3 className="font-semibold text-gray-900 mb-2">User Obligations</h3>
            <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
              <p className="text-blue-800 whitespace-pre-wrap">{renderText(userObligations)}</p>
            </div>
          </div>
        )}

        {limitations && (
          <div className="mb-6">
            <h3 className="font-semibold text-gray-900 mb-2 flex items-center gap-2">
              <AlertTriangle className="text-amber-500" size={18} />Limitations
            </h3>
            <div className="bg-amber-50 rounded-lg p-4 border border-amber-200">
              <p className="text-amber-800 whitespace-pre-wrap">{renderText(limitations)}</p>
            </div>
          </div>
        )}

        {disputeResolution && (
          <div className="mb-6">
            <h3 className="font-semibold text-gray-900 mb-2">Dispute Resolution</h3>
            <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
              <p className="text-blue-800 whitespace-pre-wrap">{renderText(disputeResolution)}</p>
            </div>
          </div>
        )}

        {dataPrivacy && (
          <div className="mb-6">
            <h3 className="font-semibold text-gray-900 mb-2 flex items-center gap-2">
              <Shield className="text-purple-500" size={18} />Data Privacy
            </h3>
            <div className="bg-purple-50 rounded-lg p-4 border border-purple-200">
              <p className="text-purple-800 whitespace-pre-wrap">{renderText(dataPrivacy)}</p>
            </div>
          </div>
        )}

        {/* Compliance Notes */}
        {complianceNotes.length > 0 && (
          <div className="mb-8">
            <h3 className="font-semibold text-gray-900 mb-3">Compliance Notes</h3>
            <div className="space-y-3">
              {complianceNotes.map((note: any, idx: number) => (
                <div key={idx} className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                  <h4 className="font-medium text-gray-900 mb-1">{note.regulation || `Note ${idx + 1}`}</h4>
                  {note.status && <p className="text-sm text-gray-700 mb-1"><strong>Status:</strong> {note.status}</p>}
                  {note.recommendation && <p className="text-sm text-blue-700">{note.recommendation}</p>}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Full Document */}
        <div className="mb-8">
          <h2 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
            <FileText className="text-gray-500" size={20} />Full Terms of Service
          </h2>
          {editing ? (
            <textarea value={editData.content} onChange={(e) => setEditData({...editData, content: e.target.value})} rows={25} className="w-full px-4 py-3 border border-gray-300 rounded-xl font-mono text-sm" />
          ) : (
            <div className="bg-gray-50 rounded-xl p-6 border border-gray-200 max-h-[600px] overflow-y-auto">
              <pre className="text-gray-800 whitespace-pre-wrap font-sans text-sm leading-relaxed">{content}</pre>
            </div>
          )}
        </div>

        {/* Raw AI Analysis */}
        {tos.aiAnalysis && (
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
