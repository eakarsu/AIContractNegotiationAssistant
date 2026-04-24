import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Lock, FileText, Edit, Trash2, Save, Copy, Check, Printer, Shield, Lightbulb } from 'lucide-react';
import { getNDADocument, updateNDADocument, deleteNDADocument } from '../services/api';
import { useToast } from '../hooks/useToast';
import { useConfirm } from '../hooks/useConfirm';
import { useEscapeKey } from '../hooks/useEscapeKey';
import DetailSkeleton from '../components/skeletons/DetailSkeleton';

export default function NDAGeneratorDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const toast = useToast();
  const confirm = useConfirm();
  const [nda, setNda] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [editData, setEditData] = useState({ title: '', content: '', status: '' });
  const [copied, setCopied] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const cancelEditing = useCallback(() => {
    setEditing(false);
    if (nda) {
      setEditData({ title: nda.title, content: nda.content, status: nda.status });
    }
  }, [nda]);

  useEscapeKey(cancelEditing, editing);

  useEffect(() => { loadData(); }, [id]);

  const loadData = async () => {
    try {
      const res = await getNDADocument(parseInt(id!));
      setNda(res.data);
      setEditData({ title: res.data.title, content: res.data.content, status: res.data.status });
    } catch (error) {
      toast.error('Failed to load NDA document');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (submitting) return;
    setSubmitting(true);
    try {
      await updateNDADocument(parseInt(id!), editData);
      setEditing(false);
      toast.success('NDA document updated successfully');
      loadData();
    } catch (error) {
      toast.error('Failed to update NDA document');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    const confirmed = await confirm({
      title: 'Delete NDA',
      message: 'Are you sure you want to delete this NDA? This action cannot be undone.',
      confirmLabel: 'Delete',
      variant: 'danger',
    });
    if (!confirmed) return;
    if (submitting) return;
    setSubmitting(true);
    try {
      await deleteNDADocument(parseInt(id!));
      toast.success('NDA document deleted');
      navigate('/ai-tools/nda-generator');
    } catch (error) {
      toast.error('Failed to delete NDA document');
      setSubmitting(false);
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(nda.content);
    setCopied(true);
    toast.success('Copied to clipboard');
    setTimeout(() => setCopied(false), 2000);
  };

  const handlePrint = () => {
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(`
        <html>
          <head><title>${nda.title}</title>
            <style>body { font-family: 'Times New Roman', serif; padding: 40px; line-height: 1.6; } h1 { text-align: center; }</style>
          </head>
          <body>
            <h1>${nda.title}</h1>
            <pre style="white-space: pre-wrap; font-family: inherit;">${nda.content}</pre>
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
  if (!nda) return <div className="text-center py-12"><p>NDA not found</p></div>;

  const aiAnalysis = parseJSON(nda.aiAnalysis) || {};
  const sections = Array.isArray(aiAnalysis.sections) ? aiAnalysis.sections : [];
  const keyProvisions = Array.isArray(aiAnalysis.keyProvisions) ? aiAnalysis.keyProvisions : [];
  const enforceabilityNotes = aiAnalysis.enforceabilityNotes || '';
  const summary = aiAnalysis.summary || '';
  const confidentialInfo = nda.confidentialInfo || aiAnalysis.confidentialInfo || '';
  const exclusions = nda.exclusions || aiAnalysis.exclusions || '';
  const obligations = nda.obligations || aiAnalysis.obligations || '';
  const content = nda.content || aiAnalysis.content || '';

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <button onClick={() => navigate('/ai-tools/nda-generator')} className="flex items-center gap-2 text-gray-600 hover:text-gray-900">
          <ArrowLeft size={20} />Back to NDA Generator
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
            <div className="p-3 bg-teal-100 rounded-xl"><Lock className="text-teal-600" size={28} /></div>
            <div>
              {editing ? (
                <input type="text" value={editData.title} onChange={(e) => setEditData({...editData, title: e.target.value})} className="text-2xl font-bold text-gray-900 border-b border-gray-300" />
              ) : (
                <h1 className="text-2xl font-bold text-gray-900">{nda.title}</h1>
              )}
              <p className="text-gray-500">{new Date(nda.createdAt).toLocaleString()}</p>
            </div>
          </div>
          {editing ? (
            <select value={editData.status} onChange={(e) => setEditData({...editData, status: e.target.value})} className="px-3 py-1.5 border border-gray-300 rounded-lg">
              <option value="draft">Draft</option>
              <option value="final">Final</option>
            </select>
          ) : (
            <span className={`px-3 py-1.5 text-sm font-medium rounded-full ${nda.status === 'final' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
              {nda.status?.toUpperCase()}
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
          <div className="mb-8 bg-teal-50 border border-teal-200 rounded-xl p-5">
            <h3 className="font-semibold text-teal-900 mb-2">Executive Summary</h3>
            <p className="text-teal-800 leading-relaxed">{renderText(summary)}</p>
          </div>
        )}

        {/* Party Information */}
        <div className="grid grid-cols-2 gap-6 mb-8">
          <div className="bg-gray-50 rounded-xl p-4 border border-gray-200">
            <h3 className="font-semibold text-gray-900 mb-2">Disclosing Party</h3>
            <p className="text-gray-700">{nda.disclosingParty}</p>
          </div>
          <div className="bg-gray-50 rounded-xl p-4 border border-gray-200">
            <h3 className="font-semibold text-gray-900 mb-2">Receiving Party</h3>
            <p className="text-gray-700">{nda.receivingParty}</p>
          </div>
        </div>

        {/* NDA Details */}
        <div className="grid grid-cols-3 gap-4 mb-8">
          <div className="bg-teal-50 rounded-lg p-4 border border-teal-200">
            <p className="text-sm text-teal-600 mb-1">Purpose</p>
            <p className="font-medium text-teal-900">{nda.purpose || 'Business discussions'}</p>
          </div>
          <div className="bg-teal-50 rounded-lg p-4 border border-teal-200">
            <p className="text-sm text-teal-600 mb-1">Duration</p>
            <p className="font-medium text-teal-900">{nda.duration}</p>
          </div>
          <div className="bg-teal-50 rounded-lg p-4 border border-teal-200">
            <p className="text-sm text-teal-600 mb-1">Jurisdiction</p>
            <p className="font-medium text-teal-900">{nda.jurisdiction}</p>
          </div>
        </div>

        {/* Sections */}
        {sections.length > 0 && (
          <div className="mb-8">
            <h3 className="font-semibold text-gray-900 mb-3">Document Sections</h3>
            <div className="flex flex-wrap gap-2">
              {sections.map((section: any, idx: number) => (
                <span key={idx} className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm">{typeof section === 'string' ? section : renderText(section)}</span>
              ))}
            </div>
          </div>
        )}

        {/* Key Sections */}
        {confidentialInfo && (
          <div className="mb-6">
            <h3 className="font-semibold text-gray-900 mb-2">Confidential Information</h3>
            <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
              <p className="text-gray-700 whitespace-pre-wrap">{renderText(confidentialInfo)}</p>
            </div>
          </div>
        )}

        {exclusions && (
          <div className="mb-6">
            <h3 className="font-semibold text-gray-900 mb-2">Exclusions</h3>
            <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
              <p className="text-gray-700 whitespace-pre-wrap">{renderText(exclusions)}</p>
            </div>
          </div>
        )}

        {obligations && (
          <div className="mb-6">
            <h3 className="font-semibold text-gray-900 mb-2">Obligations</h3>
            <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
              <p className="text-gray-700 whitespace-pre-wrap">{renderText(obligations)}</p>
            </div>
          </div>
        )}

        {/* Key Provisions */}
        {keyProvisions.length > 0 && (
          <div className="mb-8">
            <h2 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
              <Lightbulb className="text-teal-500" size={20} />Key Provisions
            </h2>
            <div className="space-y-3">
              {keyProvisions.map((p: any, idx: number) => (
                <div key={idx} className="bg-teal-50 border border-teal-200 rounded-lg p-4">
                  <h4 className="font-medium text-teal-900 mb-1">{p.provision || `Provision ${idx + 1}`}</h4>
                  {p.description && <p className="text-teal-800 text-sm">{p.description}</p>}
                  {p.importance && <p className="text-teal-600 text-sm mt-1"><strong>Why it matters:</strong> {p.importance}</p>}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Enforceability Notes */}
        {enforceabilityNotes && (
          <div className="mb-8">
            <h2 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
              <Shield className="text-blue-500" size={20} />Enforceability Notes
            </h2>
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-6">
              <p className="text-blue-800 leading-relaxed">{renderText(enforceabilityNotes)}</p>
            </div>
          </div>
        )}

        {/* Full Document */}
        <div className="mb-8">
          <h2 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
            <FileText className="text-gray-500" size={20} />Full NDA Document
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
        {nda.aiAnalysis && (
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
