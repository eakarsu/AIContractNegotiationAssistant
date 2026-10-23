import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Search, Shield, CheckCircle, XCircle, AlertTriangle } from 'lucide-react';
import { getComplianceChecks, checkCompliance, getContracts } from '../services/api';
import { useToast } from '../hooks/useToast';
import { useEscapeKey } from '../hooks/useEscapeKey';
import TableSkeleton from '../components/skeletons/TableSkeleton';
import EmptyState from '../components/EmptyState';
import Pagination from '../components/Pagination';

const ITEMS_PER_PAGE = 15;

export default function Compliance() {
  const navigate = useNavigate();
  const toast = useToast();
  const [checks, setChecks] = useState<any[]>([]);
  const [contracts, setContracts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [newCheck, setNewCheck] = useState({ contractId: '', regulation: '' });
  const [checking, setChecking] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [page, setPage] = useState(1);

  useEscapeKey(() => setShowModal(false), showModal);

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    try {
      const [checksRes, contractsRes] = await Promise.all([getComplianceChecks(), getContracts()]);
      setChecks(checksRes.data);
      setContracts(contractsRes.data);
    } catch (error) {
      console.error('Failed to load data:', error);
      toast.error('Failed to load compliance data');
    } finally {
      setLoading(false);
    }
  };

  const handleCheck = async (e: React.FormEvent) => {
    e.preventDefault();
    setChecking(true);
    setSubmitting(true);
    try {
      await checkCompliance(parseInt(newCheck.contractId), newCheck.regulation);
      setShowModal(false);
      setNewCheck({ contractId: '', regulation: '' });
      toast.success('Compliance check completed successfully');
      loadData();
    } catch (error) {
      console.error('Failed to check compliance:', error);
      toast.error('Failed to run compliance check');
    } finally {
      setChecking(false);
      setSubmitting(false);
    }
  };

  const filteredChecks = useMemo(() =>
    checks.filter(check =>
      check.contract?.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      check.regulation.toLowerCase().includes(searchTerm.toLowerCase())
    ), [checks, searchTerm]);

  // Reset page when filter changes
  useEffect(() => { setPage(1); }, [searchTerm]);

  const totalPages = Math.ceil(filteredChecks.length / ITEMS_PER_PAGE);
  const paginatedChecks = filteredChecks.slice((page - 1) * ITEMS_PER_PAGE, page * ITEMS_PER_PAGE);

  const regulations = ['GDPR', 'HIPAA', 'SOC 2', 'PCI DSS', 'FDA 21 CFR Part 11', 'NIST Cybersecurity Framework', 'ISO 27001', 'CCPA'];

  if (loading) return <TableSkeleton rows={8} cols={4} />;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div><h1 className="text-2xl font-bold text-gray-900">Compliance</h1><p className="text-gray-600">Regulatory compliance checks</p></div>
        <button onClick={() => setShowModal(true)} className="inline-flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"><Plus size={20} />New Check</button>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
        <input type="text" placeholder="Search compliance checks..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg" />
      </div>

      {filteredChecks.length === 0 ? (
        <EmptyState
          icon={Shield}
          title="No compliance checks found"
          description={searchTerm ? 'Try adjusting your search terms' : 'Run your first compliance check to get started'}
          actionLabel={!searchTerm ? 'New Check' : undefined}
          onAction={!searchTerm ? () => setShowModal(true) : undefined}
        />
      ) : (
        <>
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Contract</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Regulation</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Checked</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {paginatedChecks.map((check) => (
                  <tr key={check.id} onClick={() => navigate(`/compliance/${check.id}`)} className="hover:bg-gray-50 cursor-pointer">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-indigo-100 rounded-lg"><Shield className="text-indigo-600" size={20} /></div>
                        <span className="font-medium text-gray-900">{check.contract?.title}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">{check.regulation}</td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-full ${check.status === 'compliant' ? 'bg-green-100 text-green-700' : check.status === 'partially_compliant' ? 'bg-yellow-100 text-yellow-700' : check.status === 'non_compliant' ? 'bg-red-100 text-red-700' : 'bg-gray-100 text-gray-700'}`}>
                        {check.status === 'compliant' ? <CheckCircle size={14} /> : check.status === 'non_compliant' ? <XCircle size={14} /> : <AlertTriangle size={14} />}
                        {check.status.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">{check.checkedAt ? new Date(check.checkedAt).toLocaleDateString() : '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <Pagination
            page={page}
            totalPages={totalPages}
            total={filteredChecks.length}
            limit={ITEMS_PER_PAGE}
            onPageChange={setPage}
          />
        </>
      )}

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md m-4">
            <div className="p-6 border-b border-gray-100"><h2 className="text-xl font-bold text-gray-900">AI Compliance Check</h2></div>
            <form onSubmit={handleCheck} className="p-6 space-y-4">
              <div><label className="block text-sm font-medium text-gray-700 mb-1">Contract</label><select value={newCheck.contractId} onChange={(e) => setNewCheck({ ...newCheck, contractId: e.target.value })} className="w-full px-4 py-2 border border-gray-300 rounded-lg" required><option value="">Select contract...</option>{contracts.map(c => <option key={c.id} value={c.id}>{c.title}</option>)}</select></div>
              <div><label className="block text-sm font-medium text-gray-700 mb-1">Regulation</label><select value={newCheck.regulation} onChange={(e) => setNewCheck({ ...newCheck, regulation: e.target.value })} className="w-full px-4 py-2 border border-gray-300 rounded-lg" required><option value="">Select regulation...</option>{regulations.map(r => <option key={r} value={r}>{r}</option>)}</select></div>
              <div className="flex justify-end gap-3"><button type="button" onClick={() => setShowModal(false)} className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg">Cancel</button><button type="submit" disabled={checking || submitting} className="px-4 py-2 bg-primary-600 text-white rounded-lg disabled:opacity-50">{checking ? 'Checking...' : 'Check Compliance'}</button></div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
