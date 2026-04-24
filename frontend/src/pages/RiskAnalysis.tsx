import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Search, AlertTriangle, TrendingUp } from 'lucide-react';
import { getRisks, createRisk, getContracts, analyzeContractRisk } from '../services/api';
import { useToast } from '../hooks/useToast';
import { useEscapeKey } from '../hooks/useEscapeKey';
import CardGridSkeleton from '../components/skeletons/CardGridSkeleton';
import EmptyState from '../components/EmptyState';
import Pagination from '../components/Pagination';

const PAGE_SIZE = 15;

export default function RiskAnalysis() {
  const navigate = useNavigate();
  const toast = useToast();
  const [risks, setRisks] = useState<any[]>([]);
  const [contracts, setContracts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [selectedContract, setSelectedContract] = useState('');
  const [analyzing, setAnalyzing] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [page, setPage] = useState(1);

  useEscapeKey(() => setShowModal(false), showModal);

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    try {
      const [risksRes, contractsRes] = await Promise.all([getRisks(), getContracts()]);
      setRisks(risksRes.data);
      setContracts(contractsRes.data);
    } catch (error) {
      console.error('Failed to load data:', error);
      toast.error('Failed to load risk analyses');
    } finally {
      setLoading(false);
    }
  };

  const handleAnalyze = async () => {
    if (!selectedContract) return;
    setAnalyzing(true);
    setSubmitting(true);
    try {
      await analyzeContractRisk(parseInt(selectedContract));
      setShowModal(false);
      setSelectedContract('');
      toast.success('Risk analysis completed successfully');
      loadData();
    } catch (error) {
      console.error('Failed to analyze risk:', error);
      toast.error('Failed to analyze contract risk');
    } finally {
      setAnalyzing(false);
      setSubmitting(false);
    }
  };

  const filteredRisks = risks.filter(risk =>
    risk.contract?.title.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Reset to page 1 when search term changes
  useEffect(() => {
    setPage(1);
  }, [searchTerm]);

  const totalPages = Math.ceil(filteredRisks.length / PAGE_SIZE);
  const paginatedRisks = filteredRisks.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  if (loading) return <CardGridSkeleton count={6} />;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div><h1 className="text-2xl font-bold text-gray-900">Risk Analysis</h1><p className="text-gray-600">AI-powered contract risk assessment</p></div>
        <button onClick={() => setShowModal(true)} className="inline-flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"><Plus size={20} />Analyze Contract</button>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
        <input type="text" placeholder="Search risk analyses..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg" />
      </div>

      {filteredRisks.length === 0 ? (
        <EmptyState
          icon={AlertTriangle}
          title="No risk analyses found"
          description={searchTerm ? 'Try adjusting your search term' : 'Analyze a contract to get started'}
          actionLabel={!searchTerm ? 'Analyze Contract' : undefined}
          onAction={!searchTerm ? () => setShowModal(true) : undefined}
        />
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {paginatedRisks.map((risk) => (
              <div key={risk.id} onClick={() => navigate(`/risks/${risk.id}`)} className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 cursor-pointer hover:shadow-md hover:border-primary-200 transition">
                <div className="flex items-start justify-between mb-3">
                  <div className="p-2 bg-red-100 rounded-lg"><AlertTriangle className="text-red-600" size={20} /></div>
                  <span className={`px-2 py-1 text-xs font-medium rounded-full ${risk.category === 'high' ? 'bg-red-100 text-red-700' : risk.category === 'medium' ? 'bg-yellow-100 text-yellow-700' : 'bg-green-100 text-green-700'}`}>{risk.category}</span>
                </div>
                <h3 className="font-semibold text-gray-900 mb-1">{risk.contract?.title}</h3>
                <div className="flex items-center gap-2 mt-3">
                  <div className="flex-1 bg-gray-200 rounded-full h-2"><div className={`h-2 rounded-full ${risk.overallScore >= 70 ? 'bg-red-500' : risk.overallScore >= 40 ? 'bg-yellow-500' : 'bg-green-500'}`} style={{ width: `${risk.overallScore}%` }}></div></div>
                  <span className="text-sm font-medium text-gray-700">{risk.overallScore}/100</span>
                </div>
                <p className="text-sm text-gray-600 mt-3 line-clamp-2">{risk.findings?.substring(0, 100)}...</p>
              </div>
            ))}
          </div>

          <Pagination
            page={page}
            totalPages={totalPages}
            total={filteredRisks.length}
            limit={PAGE_SIZE}
            onPageChange={setPage}
          />
        </>
      )}

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md m-4">
            <div className="p-6 border-b border-gray-100"><h2 className="text-xl font-bold text-gray-900">AI Risk Analysis</h2></div>
            <div className="p-6 space-y-4">
              <div><label className="block text-sm font-medium text-gray-700 mb-1">Select Contract</label><select value={selectedContract} onChange={(e) => setSelectedContract(e.target.value)} className="w-full px-4 py-2 border border-gray-300 rounded-lg"><option value="">Select contract...</option>{contracts.map(c => <option key={c.id} value={c.id}>{c.title}</option>)}</select></div>
              <p className="text-sm text-gray-500">Our AI will analyze the contract for financial, legal, operational, and reputational risks.</p>
              <div className="flex justify-end gap-3"><button onClick={() => setShowModal(false)} className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg">Cancel</button><button onClick={handleAnalyze} disabled={!selectedContract || analyzing || submitting} className="px-4 py-2 bg-primary-600 text-white rounded-lg disabled:opacity-50">{analyzing ? 'Analyzing...' : 'Analyze'}</button></div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
