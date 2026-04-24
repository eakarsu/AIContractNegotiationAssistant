import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Languages, BookOpen, Edit, Trash2, Save, Copy, Check, Shield, AlertTriangle, Lightbulb } from 'lucide-react';
import { getPlainLanguageTranslation, updatePlainLanguageTranslation, deletePlainLanguageTranslation } from '../services/api';
import { useToast } from '../hooks/useToast';
import { useConfirm } from '../hooks/useConfirm';
import { useEscapeKey } from '../hooks/useEscapeKey';
import DetailSkeleton from '../components/skeletons/DetailSkeleton';

export default function PlainLanguageTranslatorDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const toast = useToast();
  const confirm = useConfirm();
  const [translation, setTranslation] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [editData, setEditData] = useState({ title: '' });
  const [copied, setCopied] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const cancelEditing = useCallback(() => setEditing(false), []);
  useEscapeKey(cancelEditing, editing);

  useEffect(() => { loadData(); }, [id]);

  const loadData = async () => {
    try {
      const res = await getPlainLanguageTranslation(parseInt(id!));
      setTranslation(res.data);
      setEditData({ title: res.data.title });
    } catch {
      toast.error('Failed to load translation.');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (submitting) return;
    setSubmitting(true);
    try {
      await updatePlainLanguageTranslation(parseInt(id!), editData);
      setEditing(false);
      toast.success('Translation updated successfully.');
      loadData();
    } catch {
      toast.error('Failed to update translation.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    const confirmed = await confirm({
      title: 'Delete Translation',
      message: 'Are you sure you want to delete this translation? This action cannot be undone.',
      confirmLabel: 'Delete',
      variant: 'danger',
    });
    if (!confirmed) return;
    if (submitting) return;
    setSubmitting(true);
    try {
      await deletePlainLanguageTranslation(parseInt(id!));
      toast.success('Translation deleted.');
      navigate('/ai-tools/plain-language-translator');
    } catch {
      toast.error('Failed to delete translation.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(translation.translatedText);
    setCopied(true);
    toast.success('Copied to clipboard.');
    setTimeout(() => setCopied(false), 2000);
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
  if (!translation) return <div className="text-center py-12"><p>Translation not found</p></div>;

  const keyTerms = parseJSON(translation.keyTerms) || [];
  const aiAnalysis = parseJSON(translation.aiAnalysis) || {};

  const allKeyTerms = Array.isArray(keyTerms) && keyTerms.length > 0 ? keyTerms : (Array.isArray(aiAnalysis.keyTerms) ? aiAnalysis.keyTerms : []);
  const summary = translation.summary || aiAnalysis.summary || '';
  const readingLevel = aiAnalysis.readingLevel || '';
  const translatedReadingLevel = aiAnalysis.translatedReadingLevel || '';
  const hiddenImplications = Array.isArray(aiAnalysis.hiddenImplications) ? aiAnalysis.hiddenImplications : [];
  const actionItems = Array.isArray(aiAnalysis.actionItems) ? aiAnalysis.actionItems : [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <button onClick={() => navigate('/ai-tools/plain-language-translator')} className="flex items-center gap-2 text-gray-600 hover:text-gray-900">
          <ArrowLeft size={20} />Back to Plain Language Translator
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
            <div className="p-3 bg-purple-100 rounded-xl"><Languages className="text-purple-600" size={28} /></div>
            <div>
              {editing ? (
                <div className="flex items-center gap-2">
                  <input type="text" value={editData.title} onChange={(e) => setEditData({...editData, title: e.target.value})} className="text-2xl font-bold text-gray-900 border-b border-gray-300" />
                  <button onClick={handleSave} disabled={submitting} className="p-2 bg-primary-600 text-white rounded-lg disabled:opacity-50">
                    <Save size={18} />
                  </button>
                </div>
              ) : (
                <h1 className="text-2xl font-bold text-gray-900">{translation.title}</h1>
              )}
              <p className="text-gray-500">{new Date(translation.createdAt).toLocaleString()}</p>
            </div>
          </div>
          <span className={`px-3 py-1.5 text-sm font-medium rounded-full ${translation.complexityScore >= 70 ? 'bg-red-100 text-red-700' : translation.complexityScore >= 40 ? 'bg-yellow-100 text-yellow-700' : 'bg-green-100 text-green-700'}`}>
            Complexity: {translation.complexityScore}/100
          </span>
        </div>

        {/* Reading Level Badges */}
        {(readingLevel || translatedReadingLevel) && (
          <div className="flex items-center gap-4 mb-6">
            {readingLevel && (
              <div className="bg-red-50 border border-red-200 rounded-lg px-4 py-2">
                <p className="text-xs text-red-600">Original Reading Level</p>
                <p className="font-semibold text-red-800">{readingLevel}</p>
              </div>
            )}
            {translatedReadingLevel && (
              <div className="bg-green-50 border border-green-200 rounded-lg px-4 py-2">
                <p className="text-xs text-green-600">Translated Reading Level</p>
                <p className="font-semibold text-green-800">{translatedReadingLevel}</p>
              </div>
            )}
          </div>
        )}

        {/* Side by Side */}
        <div className="mb-8 grid grid-cols-2 gap-6">
          <div>
            <h2 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
              <BookOpen className="text-gray-500" size={20} />Original Legal Text
            </h2>
            <div className="bg-gray-50 rounded-xl p-6 min-h-[200px]">
              <p className="text-gray-700 whitespace-pre-wrap text-sm">{translation.originalText}</p>
            </div>
          </div>
          <div>
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                <Languages className="text-purple-500" size={20} />Plain Language Version
              </h2>
              <button onClick={handleCopy} className="flex items-center gap-1 px-3 py-1 text-sm text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200">
                {copied ? <Check size={16} className="text-green-500" /> : <Copy size={16} />}
                {copied ? 'Copied!' : 'Copy'}
              </button>
            </div>
            <div className="bg-purple-50 rounded-xl p-6 min-h-[200px] border border-purple-200">
              <p className="text-purple-900 whitespace-pre-wrap">{translation.translatedText}</p>
            </div>
          </div>
        </div>

        {/* Summary */}
        {summary && (
          <div className="mb-8">
            <h2 className="text-lg font-semibold text-gray-900 mb-3">Summary</h2>
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-6">
              <p className="text-blue-800 leading-relaxed">{renderText(summary)}</p>
            </div>
          </div>
        )}

        {/* Hidden Implications */}
        {hiddenImplications.length > 0 && (
          <div className="mb-8">
            <h2 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
              <AlertTriangle className="text-amber-500" size={20} />Hidden Implications
            </h2>
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
              <ul className="space-y-2">
                {hiddenImplications.map((item: any, idx: number) => (
                  <li key={idx} className="flex items-start gap-2 text-amber-800">
                    <AlertTriangle size={16} className="flex-shrink-0 mt-0.5" />
                    <span>{typeof item === 'string' ? item : renderText(item)}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        )}

        {/* Action Items */}
        {actionItems.length > 0 && (
          <div className="mb-8">
            <h2 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
              <Lightbulb className="text-blue-500" size={20} />Action Items
            </h2>
            <div className="space-y-2">
              {actionItems.map((item: any, idx: number) => (
                <div key={idx} className="bg-blue-50 border border-blue-200 rounded-lg p-3 flex items-start gap-3">
                  <span className="bg-blue-200 text-blue-800 rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold flex-shrink-0">{idx + 1}</span>
                  <p className="text-blue-800">{typeof item === 'string' ? item : renderText(item)}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Key Terms */}
        {allKeyTerms.length > 0 && (
          <div className="mb-8">
            <h2 className="text-lg font-semibold text-gray-900 mb-3">Key Terms Explained ({allKeyTerms.length})</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {allKeyTerms.map((term: any, idx: number) => (
                <div key={idx} className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                  <h4 className="font-semibold text-gray-900 mb-2">{term.term || `Term ${idx + 1}`}</h4>
                  {term.definition && <p className="text-sm text-gray-600 mb-1"><strong>Legal meaning:</strong> {term.definition}</p>}
                  {term.plainMeaning && <p className="text-sm text-purple-700 mb-1"><strong>In simple terms:</strong> {term.plainMeaning}</p>}
                  {term.whyItMatters && <p className="text-sm text-blue-700"><strong>Why it matters:</strong> {term.whyItMatters}</p>}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Raw AI Analysis */}
        {translation.aiAnalysis && (
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
