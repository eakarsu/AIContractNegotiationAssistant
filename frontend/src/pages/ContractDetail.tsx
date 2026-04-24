import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft, Edit, Trash2, Clock, MessageSquare, DollarSign, Calendar,
  Building, CheckCircle, Sparkles
} from 'lucide-react';
import { getContract, updateContract, deleteContract, analyzeContractRisk, suggestRedline } from '../services/api';
import { RiskAnalysisDisplay } from '../components/RiskDisplay';
import { useToast } from '../hooks/useToast';
import { useConfirm } from '../hooks/useConfirm';
import { useEscapeKey } from '../hooks/useEscapeKey';
import DetailSkeleton from '../components/skeletons/DetailSkeleton';

export default function ContractDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const toast = useToast();
  const confirm = useConfirm();
  const [contract, setContract] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [editData, setEditData] = useState<any>({});
  const [analyzing, setAnalyzing] = useState(false);
  const [suggestingRedlines, setSuggestingRedlines] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEscapeKey(() => setEditing(false), editing);

  useEffect(() => { loadContract(); }, [id]);

  const loadContract = async () => {
    try {
      const response = await getContract(parseInt(id!));
      setContract(response.data);
      setEditData(response.data);
    } catch (error) {
      toast.error('Failed to load contract');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdate = async () => {
    if (submitting) return;
    setSubmitting(true);
    try {
      await updateContract(parseInt(id!), editData);
      setEditing(false);
      await loadContract();
      toast.success('Contract updated');
    } catch (error) {
      toast.error('Failed to update contract');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    const ok = await confirm({
      title: 'Delete Contract',
      message: 'This will permanently delete this contract. This action cannot be undone.',
      variant: 'danger',
      confirmLabel: 'Delete',
    });
    if (!ok) return;

    if (submitting) return;
    setSubmitting(true);
    try {
      await deleteContract(parseInt(id!));
      toast.success('Contract deleted');
      navigate('/contracts');
    } catch (error) {
      toast.error('Failed to delete contract');
    } finally {
      setSubmitting(false);
    }
  };

  const handleAnalyzeRisk = async () => {
    setAnalyzing(true);
    try {
      await analyzeContractRisk(parseInt(id!));
      await loadContract();
      toast.success('Risk analysis completed');
    } catch (error: any) {
      toast.error('Failed to analyze: ' + (error.response?.data?.error || error.message));
    } finally {
      setAnalyzing(false);
    }
  };

  const handleSuggestRedlines = async () => {
    setSuggestingRedlines(true);
    try {
      const result = await suggestRedline(parseInt(id!), {});
      const count = result.data?.redlines?.length || 1;
      toast.success(`Redline suggestions generated`);
    } catch (error: any) {
      toast.error('Failed to generate suggestions: ' + (error.response?.data?.error || error.message));
    } finally {
      setSuggestingRedlines(false);
    }
  };

  if (loading) {
    return <DetailSkeleton />;
  }

  if (!contract) {
    return <div className="text-center py-12 text-gray-500">Contract not found</div>;
  }

  const latestRisk = contract.riskAnalyses?.[0];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button onClick={() => navigate('/contracts')} className="p-2 hover:bg-gray-100 rounded-lg transition">
            <ArrowLeft size={20} />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{contract.title}</h1>
            <p className="text-gray-600">{contract.contractType}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={handleSuggestRedlines} disabled={suggestingRedlines}
            className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-orange-500 to-red-500 text-white rounded-lg hover:from-orange-600 hover:to-red-600 transition disabled:opacity-50 shadow-md">
            <Sparkles size={20} className={suggestingRedlines ? 'animate-spin' : ''} />
            {suggestingRedlines ? 'Suggesting...' : 'AI Redlines'}
          </button>
          <button onClick={handleAnalyzeRisk} disabled={analyzing}
            className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-500 to-indigo-600 text-white rounded-lg hover:from-purple-600 hover:to-indigo-700 transition disabled:opacity-50 shadow-md">
            <Sparkles size={20} className={analyzing ? 'animate-spin' : ''} />
            {analyzing ? 'Analyzing...' : 'AI Risk Analysis'}
          </button>
          <button onClick={() => setEditing(!editing)}
            className="inline-flex items-center gap-2 px-4 py-2 bg-primary-100 text-primary-700 rounded-lg hover:bg-primary-200 transition">
            <Edit size={20} />Edit
          </button>
          <button onClick={handleDelete} disabled={submitting}
            className="inline-flex items-center gap-2 px-4 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition disabled:opacity-50">
            <Trash2 size={20} />Delete
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Contract details */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Contract Details</h2>
            {editing ? (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
                  <input type="text" value={editData.title}
                    onChange={(e) => setEditData({ ...editData, title: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                  <textarea value={editData.description || ''}
                    onChange={(e) => setEditData({ ...editData, description: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg" rows={3} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Content</label>
                  <textarea value={editData.content}
                    onChange={(e) => setEditData({ ...editData, content: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg font-mono text-sm" rows={15} />
                </div>
                <div className="flex justify-end gap-3">
                  <button onClick={() => setEditing(false)}
                    className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200">Cancel</button>
                  <button onClick={handleUpdate} disabled={submitting}
                    className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50">
                    {submitting ? 'Saving...' : 'Save'}
                  </button>
                </div>
              </div>
            ) : (
              <div>
                <p className="text-gray-600 mb-4">{contract.description}</p>
                <div className="bg-gray-50 rounded-lg p-4 font-mono text-sm whitespace-pre-wrap max-h-96 overflow-y-auto">
                  {contract.content}
                </div>
              </div>
            )}
          </div>

          {/* Clauses */}
          {contract.clauses?.length > 0 && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Clauses</h2>
              <div className="space-y-3">
                {contract.clauses.map((cc: any) => (
                  <div key={cc.id} className="p-3 bg-gray-50 rounded-lg">
                    <h3 className="font-medium text-gray-900">{cc.clause.title}</h3>
                    <p className="text-sm text-gray-600 mt-1">{cc.clause.category}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Risk Analysis - Using new component */}
          {latestRisk && <RiskAnalysisDisplay risk={latestRisk} />}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Status */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Status</h2>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-gray-600">Status</span>
                <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                  contract.status === 'active' ? 'bg-green-100 text-green-700' :
                  contract.status === 'draft' ? 'bg-gray-100 text-gray-700' : 'bg-blue-100 text-blue-700'
                }`}>{contract.status}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-600">Risk Level</span>
                <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                  contract.riskLevel === 'high' ? 'bg-red-100 text-red-700' :
                  contract.riskLevel === 'medium' ? 'bg-yellow-100 text-yellow-700' :
                  contract.riskLevel === 'low' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'
                }`}>{contract.riskLevel || 'Not analyzed'}</span>
              </div>
            </div>
          </div>

          {/* Financial */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Financial</h2>
            <div className="flex items-center gap-3">
              <DollarSign className="text-gray-400" size={20} />
              <div>
                <div className="text-sm text-gray-500">Value</div>
                <div className="font-medium">
                  {contract.value ? `${contract.currency} ${contract.value.toLocaleString()}` : 'Not specified'}
                </div>
              </div>
            </div>
          </div>

          {/* Dates */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Dates</h2>
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <Calendar className="text-gray-400" size={20} />
                <div>
                  <div className="text-sm text-gray-500">Start Date</div>
                  <div className="font-medium">
                    {contract.startDate ? new Date(contract.startDate).toLocaleDateString() : 'Not set'}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Calendar className="text-gray-400" size={20} />
                <div>
                  <div className="text-sm text-gray-500">End Date</div>
                  <div className="font-medium">
                    {contract.endDate ? new Date(contract.endDate).toLocaleDateString() : 'Not set'}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Party */}
          {contract.party && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Counterparty</h2>
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <Building className="text-blue-600" size={20} />
                </div>
                <div>
                  <div className="font-medium text-gray-900">{contract.party.name}</div>
                  <div className="text-sm text-gray-500">{contract.party.type}</div>
                </div>
              </div>
            </div>
          )}

          {/* Quick actions */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h2>
            <div className="space-y-2">
              <button onClick={() => navigate(`/negotiations?contractId=${contract.id}`)}
                className="w-full flex items-center gap-2 px-4 py-2 text-left text-gray-700 hover:bg-gray-50 rounded-lg">
                <MessageSquare size={18} />View Negotiations
              </button>
              <button onClick={() => navigate(`/approvals?contractId=${contract.id}`)}
                className="w-full flex items-center gap-2 px-4 py-2 text-left text-gray-700 hover:bg-gray-50 rounded-lg">
                <CheckCircle size={18} />View Approvals
              </button>
              <button onClick={() => navigate(`/deadlines?contractId=${contract.id}`)}
                className="w-full flex items-center gap-2 px-4 py-2 text-left text-gray-700 hover:bg-gray-50 rounded-lg">
                <Clock size={18} />View Deadlines
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
