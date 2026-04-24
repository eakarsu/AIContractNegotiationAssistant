import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Search, FileText, DollarSign } from 'lucide-react';
import { getContracts, createContract, getParties, exportContractsCSV, downloadBlob, bulkDeleteContracts } from '../services/api';
import { useToast } from '../hooks/useToast';
import { useEscapeKey } from '../hooks/useEscapeKey';
import { useConfirm } from '../hooks/useConfirm';
import { useBulkSelect } from '../hooks/useBulkSelect';
import TableSkeleton from '../components/skeletons/TableSkeleton';
import EmptyState from '../components/EmptyState';
import Pagination from '../components/Pagination';
import ExportButton from '../components/ExportButton';
import BulkActionBar from '../components/BulkActionBar';
import SortableHeader from '../components/SortableHeader';

export default function Contracts() {
  const navigate = useNavigate();
  const toast = useToast();
  const confirm = useConfirm();

  const [contracts, setContracts] = useState<any[]>([]);
  const [parties, setParties] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [page, setPage] = useState(1);
  const [sortBy, setSortBy] = useState('createdAt');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');
  const [newContract, setNewContract] = useState({
    title: '',
    description: '',
    content: '',
    contractType: 'Service Agreement',
    value: '',
    currency: 'USD',
    partyId: '',
    startDate: '',
    endDate: ''
  });

  const itemsPerPage = 15;

  useEscapeKey(() => setShowModal(false), showModal);

  useEffect(() => {
    loadData();
  }, []);

  // Reset page to 1 when search or filter changes
  useEffect(() => {
    setPage(1);
  }, [searchTerm, statusFilter]);

  const loadData = async () => {
    try {
      const [contractsRes, partiesRes] = await Promise.all([
        getContracts(),
        getParties()
      ]);
      setContracts(contractsRes.data);
      setParties(partiesRes.data);
    } catch (error) {
      console.error('Failed to load contracts:', error);
      toast.error('Failed to load contracts');
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (submitting) return;
    setSubmitting(true);
    try {
      await createContract({
        ...newContract,
        value: newContract.value ? parseFloat(newContract.value) : null,
        partyId: newContract.partyId ? parseInt(newContract.partyId) : null,
        startDate: newContract.startDate ? new Date(newContract.startDate) : null,
        endDate: newContract.endDate ? new Date(newContract.endDate) : null
      });
      toast.success('Contract created');
      setShowModal(false);
      setNewContract({
        title: '',
        description: '',
        content: '',
        contractType: 'Service Agreement',
        value: '',
        currency: 'USD',
        partyId: '',
        startDate: '',
        endDate: ''
      });
      loadData();
    } catch (error) {
      console.error('Failed to create contract:', error);
      toast.error('Failed to create contract');
    } finally {
      setSubmitting(false);
    }
  };

  const handleExportCSV = async () => {
    try {
      const res = await exportContractsCSV();
      downloadBlob(res.data, 'contracts.csv');
      toast.success('CSV exported');
    } catch {
      toast.error('Export failed');
    }
  };

  const filteredContracts = useMemo(() => {
    const filtered = contracts.filter(contract => {
      const matchesSearch = contract.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        contract.contractType.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesStatus = !statusFilter || contract.status === statusFilter;
      return matchesSearch && matchesStatus;
    });

    // Sort
    filtered.sort((a, b) => {
      let aVal = a[sortBy];
      let bVal = b[sortBy];

      // Handle nulls
      if (aVal == null && bVal == null) return 0;
      if (aVal == null) return 1;
      if (bVal == null) return -1;

      // String comparison
      if (typeof aVal === 'string') {
        aVal = aVal.toLowerCase();
        bVal = (bVal as string).toLowerCase();
      }

      if (aVal < bVal) return sortDir === 'asc' ? -1 : 1;
      if (aVal > bVal) return sortDir === 'asc' ? 1 : -1;
      return 0;
    });

    return filtered;
  }, [contracts, searchTerm, statusFilter, sortBy, sortDir]);

  const paginatedContracts = useMemo(() => {
    return filteredContracts.slice((page - 1) * itemsPerPage, page * itemsPerPage);
  }, [filteredContracts, page]);

  const { selectedIds, toggle, toggleAll, clear, isSelected, allSelected, selectedCount } = useBulkSelect(paginatedContracts);

  const handleBulkDelete = async () => {
    const ok = await confirm({
      title: 'Delete contracts',
      message: `Are you sure you want to delete ${selectedCount} contract${selectedCount > 1 ? 's' : ''}? This action cannot be undone.`,
      confirmLabel: 'Delete',
      variant: 'danger'
    });
    if (!ok) return;
    try {
      await bulkDeleteContracts(Array.from(selectedIds));
      toast.success(`${selectedCount} contract${selectedCount > 1 ? 's' : ''} deleted`);
      clear();
      loadData();
    } catch {
      toast.error('Failed to delete contracts');
    }
  };

  const handleSort = (field: string, dir: 'asc' | 'desc') => {
    setSortBy(field);
    setSortDir(dir);
  };

  const contractTypes = ['Service Agreement', 'Software License', 'NDA', 'Employment', 'Partnership', 'Consulting', 'Vendor', 'Financial', 'Lease', 'Other'];
  const statuses = ['draft', 'active', 'under_review', 'negotiation', 'approved', 'rejected', 'expired'];

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Contracts</h1>
            <p className="text-gray-600">Manage your contract portfolio</p>
          </div>
        </div>
        <TableSkeleton rows={8} cols={6} />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Contracts</h1>
          <p className="text-gray-600">Manage your contract portfolio</p>
        </div>
        <div className="flex items-center gap-3">
          <ExportButton onExportCSV={handleExportCSV} />
          <button
            onClick={() => setShowModal(true)}
            className="inline-flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition"
          >
            <Plus size={20} />
            New Contract
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
          <input
            type="text"
            placeholder="Search contracts..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
        >
          <option value="">All Statuses</option>
          {statuses.map(status => (
            <option key={status} value={status}>{status.replace('_', ' ')}</option>
          ))}
        </select>
      </div>

      {/* Contracts list */}
      {filteredContracts.length === 0 ? (
        <EmptyState
          icon={FileText}
          title="No contracts found"
          description="Try adjusting your search or filters"
          actionLabel="New Contract"
          onAction={() => setShowModal(true)}
        />
      ) : (
        <>
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-100">
                  <tr>
                    <th className="px-6 py-3 text-left">
                      <input
                        type="checkbox"
                        checked={allSelected}
                        onChange={toggleAll}
                        className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                      />
                    </th>
                    <SortableHeader label="Contract" field="title" currentSort={sortBy} currentDir={sortDir} onSort={handleSort} />
                    <SortableHeader label="Type" field="contractType" currentSort={sortBy} currentDir={sortDir} onSort={handleSort} />
                    <SortableHeader label="Party" field="party" currentSort={sortBy} currentDir={sortDir} onSort={handleSort} />
                    <SortableHeader label="Value" field="value" currentSort={sortBy} currentDir={sortDir} onSort={handleSort} />
                    <SortableHeader label="Status" field="status" currentSort={sortBy} currentDir={sortDir} onSort={handleSort} />
                    <SortableHeader label="Risk" field="riskLevel" currentSort={sortBy} currentDir={sortDir} onSort={handleSort} />
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {paginatedContracts.map((contract) => (
                    <tr
                      key={contract.id}
                      className="hover:bg-gray-50 cursor-pointer transition"
                    >
                      <td className="px-6 py-4" onClick={(e) => e.stopPropagation()}>
                        <input
                          type="checkbox"
                          checked={isSelected(contract.id)}
                          onChange={() => toggle(contract.id)}
                          className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                        />
                      </td>
                      <td className="px-6 py-4" onClick={() => navigate(`/contracts/${contract.id}`)}>
                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-blue-100 rounded-lg">
                            <FileText className="text-blue-600" size={20} />
                          </div>
                          <div>
                            <div className="font-medium text-gray-900">{contract.title}</div>
                            <div className="text-sm text-gray-500">{contract.description?.substring(0, 50)}...</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600" onClick={() => navigate(`/contracts/${contract.id}`)}>{contract.contractType}</td>
                      <td className="px-6 py-4 text-sm text-gray-600" onClick={() => navigate(`/contracts/${contract.id}`)}>{contract.party?.name || '-'}</td>
                      <td className="px-6 py-4" onClick={() => navigate(`/contracts/${contract.id}`)}>
                        {contract.value ? (
                          <div className="flex items-center gap-1 text-sm text-gray-900">
                            <DollarSign size={14} />
                            {contract.value.toLocaleString()}
                          </div>
                        ) : '-'}
                      </td>
                      <td className="px-6 py-4" onClick={() => navigate(`/contracts/${contract.id}`)}>
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                          contract.status === 'active' ? 'bg-green-100 text-green-700' :
                          contract.status === 'draft' ? 'bg-gray-100 text-gray-700' :
                          contract.status === 'negotiation' ? 'bg-yellow-100 text-yellow-700' :
                          contract.status === 'under_review' ? 'bg-blue-100 text-blue-700' :
                          contract.status === 'approved' ? 'bg-emerald-100 text-emerald-700' :
                          contract.status === 'rejected' ? 'bg-red-100 text-red-700' :
                          'bg-gray-100 text-gray-700'
                        }`}>
                          {contract.status?.replace('_', ' ')}
                        </span>
                      </td>
                      <td className="px-6 py-4" onClick={() => navigate(`/contracts/${contract.id}`)}>
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                          contract.riskLevel === 'high' ? 'bg-red-100 text-red-700' :
                          contract.riskLevel === 'medium' ? 'bg-yellow-100 text-yellow-700' :
                          contract.riskLevel === 'low' ? 'bg-green-100 text-green-700' :
                          'bg-gray-100 text-gray-700'
                        }`}>
                          {contract.riskLevel || 'Not analyzed'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <Pagination
            page={page}
            totalPages={Math.ceil(filteredContracts.length / itemsPerPage)}
            total={filteredContracts.length}
            limit={itemsPerPage}
            onPageChange={setPage}
          />
        </>
      )}

      {/* Bulk Action Bar */}
      <BulkActionBar
        selectedCount={selectedCount}
        onDelete={handleBulkDelete}
        onClear={clear}
      />

      {/* New Contract Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto m-4">
            <div className="p-6 border-b border-gray-100">
              <h2 className="text-xl font-bold text-gray-900">New Contract</h2>
            </div>
            <form onSubmit={handleCreate} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
                  <input
                    type="text"
                    value={newContract.title}
                    onChange={(e) => setNewContract({ ...newContract, title: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Contract Type</label>
                  <select
                    value={newContract.contractType}
                    onChange={(e) => setNewContract({ ...newContract, contractType: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                  >
                    {contractTypes.map(type => (
                      <option key={type} value={type}>{type}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Party</label>
                  <select
                    value={newContract.partyId}
                    onChange={(e) => setNewContract({ ...newContract, partyId: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                  >
                    <option value="">Select party...</option>
                    {parties.map(party => (
                      <option key={party.id} value={party.id}>{party.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Value</label>
                  <input
                    type="number"
                    value={newContract.value}
                    onChange={(e) => setNewContract({ ...newContract, value: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                    placeholder="0.00"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Currency</label>
                  <select
                    value={newContract.currency}
                    onChange={(e) => setNewContract({ ...newContract, currency: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                  >
                    <option value="USD">USD</option>
                    <option value="EUR">EUR</option>
                    <option value="GBP">GBP</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
                  <input
                    type="date"
                    value={newContract.startDate}
                    onChange={(e) => setNewContract({ ...newContract, startDate: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
                  <input
                    type="date"
                    value={newContract.endDate}
                    onChange={(e) => setNewContract({ ...newContract, endDate: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                  />
                </div>
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                  <textarea
                    value={newContract.description}
                    onChange={(e) => setNewContract({ ...newContract, description: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                    rows={2}
                  />
                </div>
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Content</label>
                  <textarea
                    value={newContract.content}
                    onChange={(e) => setNewContract({ ...newContract, content: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                    rows={6}
                    required
                  />
                </div>
              </div>
              <div className="flex justify-end gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {submitting ? 'Creating...' : 'Create Contract'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
