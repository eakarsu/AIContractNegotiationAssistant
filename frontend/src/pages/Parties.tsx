import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Search, Users, Building, Mail } from 'lucide-react';
import { getParties, createParty, deleteParty, exportPartiesCSV, downloadBlob } from '../services/api';
import { useToast } from '../hooks/useToast';
import { useEscapeKey } from '../hooks/useEscapeKey';
import { useConfirm } from '../hooks/useConfirm';
import { useBulkSelect } from '../hooks/useBulkSelect';
import CardGridSkeleton from '../components/skeletons/CardGridSkeleton';
import EmptyState from '../components/EmptyState';
import Pagination from '../components/Pagination';
import ExportButton from '../components/ExportButton';
import BulkActionBar from '../components/BulkActionBar';

const PER_PAGE = 15;

export default function Parties() {
  const navigate = useNavigate();
  const toast = useToast();
  const confirm = useConfirm();
  const [parties, setParties] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [page, setPage] = useState(1);
  const [newParty, setNewParty] = useState({ name: '', type: 'corporation', email: '', phone: '', address: '', industry: '', riskRating: 'low', notes: '' });

  useEscapeKey(() => setShowModal(false), showModal);

  useEffect(() => { loadParties(); }, []);

  const loadParties = async () => {
    try {
      const response = await getParties();
      setParties(response.data);
    } catch (error) {
      toast.error('Failed to load parties');
    } finally {
      setLoading(false);
    }
  };

  const filteredParties = useMemo(
    () =>
      parties.filter(
        (party) =>
          party.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          party.industry?.toLowerCase().includes(searchTerm.toLowerCase())
      ),
    [parties, searchTerm]
  );

  // Reset page when filter changes
  useEffect(() => { setPage(1); }, [searchTerm]);

  const totalPages = Math.ceil(filteredParties.length / PER_PAGE);
  const paginatedParties = filteredParties.slice((page - 1) * PER_PAGE, page * PER_PAGE);

  const bulk = useBulkSelect(filteredParties);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await createParty(newParty);
      toast.success('Party created');
      setShowModal(false);
      setNewParty({ name: '', type: 'corporation', email: '', phone: '', address: '', industry: '', riskRating: 'low', notes: '' });
      loadParties();
    } catch (error) {
      toast.error('Failed to create party');
    } finally {
      setSubmitting(false);
    }
  };

  const handleBulkDelete = async () => {
    const ok = await confirm({
      title: 'Delete selected parties',
      message: `Are you sure you want to delete ${bulk.selectedCount} selected parties? This action cannot be undone.`,
      confirmLabel: 'Delete',
      variant: 'danger',
    });
    if (!ok) return;
    try {
      await Promise.all(Array.from(bulk.selectedIds).map((id) => deleteParty(id)));
      toast.success(`${bulk.selectedCount} parties deleted`);
      bulk.clear();
      loadParties();
    } catch (error) {
      toast.error('Failed to delete some parties');
    }
  };

  const handleExportCSV = async () => {
    try {
      const response = await exportPartiesCSV();
      downloadBlob(response.data, 'parties.csv');
      toast.success('CSV exported');
    } catch (error) {
      toast.error('Failed to export CSV');
    }
  };

  if (loading) return <CardGridSkeleton count={6} />;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div><h1 className="text-2xl font-bold text-gray-900">Parties</h1><p className="text-gray-600">Contract counterparties and partners</p></div>
        <div className="flex items-center gap-2">
          <ExportButton onExportCSV={handleExportCSV} />
          <button onClick={() => setShowModal(true)} className="inline-flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"><Plus size={20} />New Party</button>
        </div>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
        <input type="text" placeholder="Search parties..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500" />
      </div>

      {filteredParties.length === 0 ? (
        <EmptyState
          icon={Users}
          title="No parties found"
          description={searchTerm ? 'Try a different search term.' : 'Create your first party to get started.'}
          actionLabel={!searchTerm ? 'New Party' : undefined}
          onAction={!searchTerm ? () => setShowModal(true) : undefined}
        />
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {paginatedParties.map((party) => (
              <div key={party.id} className="relative bg-white rounded-xl shadow-sm border border-gray-100 p-4 cursor-pointer hover:shadow-md hover:border-primary-200 transition">
                {/* Bulk select checkbox */}
                <div className="absolute top-3 left-3 z-10" onClick={(e) => e.stopPropagation()}>
                  <input
                    type="checkbox"
                    checked={bulk.isSelected(party.id)}
                    onChange={() => bulk.toggle(party.id)}
                    className="h-4 w-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                  />
                </div>
                <div onClick={() => navigate(`/parties/${party.id}`)} className="pl-5">
                  <div className="flex items-start gap-3">
                    <div className="p-2 bg-green-100 rounded-lg"><Building className="text-green-600" size={20} /></div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-900">{party.name}</h3>
                      <p className="text-sm text-gray-500">{party.type} • {party.industry}</p>
                      {party.email && <div className="flex items-center gap-1 mt-2 text-sm text-gray-600"><Mail size={14} />{party.email}</div>}
                      <div className="flex items-center justify-between mt-3">
                        <span className="text-xs text-gray-500">{party._count?.contracts || 0} contracts</span>
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${party.riskRating === 'high' ? 'bg-red-100 text-red-700' : party.riskRating === 'medium' ? 'bg-yellow-100 text-yellow-700' : 'bg-green-100 text-green-700'}`}>{party.riskRating}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <Pagination
            page={page}
            totalPages={totalPages}
            total={filteredParties.length}
            limit={PER_PAGE}
            onPageChange={setPage}
          />
        </>
      )}

      <BulkActionBar
        selectedCount={bulk.selectedCount}
        onDelete={handleBulkDelete}
        onClear={bulk.clear}
      />

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto m-4">
            <div className="p-6 border-b border-gray-100"><h2 className="text-xl font-bold text-gray-900">New Party</h2></div>
            <form onSubmit={handleCreate} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2"><label className="block text-sm font-medium text-gray-700 mb-1">Name</label><input type="text" value={newParty.name} onChange={(e) => setNewParty({ ...newParty, name: e.target.value })} className="w-full px-4 py-2 border border-gray-300 rounded-lg" required /></div>
                <div><label className="block text-sm font-medium text-gray-700 mb-1">Type</label><select value={newParty.type} onChange={(e) => setNewParty({ ...newParty, type: e.target.value })} className="w-full px-4 py-2 border border-gray-300 rounded-lg"><option value="corporation">Corporation</option><option value="llc">LLC</option><option value="llp">LLP</option><option value="partnership">Partnership</option><option value="individual">Individual</option></select></div>
                <div><label className="block text-sm font-medium text-gray-700 mb-1">Industry</label><input type="text" value={newParty.industry} onChange={(e) => setNewParty({ ...newParty, industry: e.target.value })} className="w-full px-4 py-2 border border-gray-300 rounded-lg" /></div>
                <div><label className="block text-sm font-medium text-gray-700 mb-1">Email</label><input type="email" value={newParty.email} onChange={(e) => setNewParty({ ...newParty, email: e.target.value })} className="w-full px-4 py-2 border border-gray-300 rounded-lg" /></div>
                <div><label className="block text-sm font-medium text-gray-700 mb-1">Phone</label><input type="text" value={newParty.phone} onChange={(e) => setNewParty({ ...newParty, phone: e.target.value })} className="w-full px-4 py-2 border border-gray-300 rounded-lg" /></div>
                <div><label className="block text-sm font-medium text-gray-700 mb-1">Risk Rating</label><select value={newParty.riskRating} onChange={(e) => setNewParty({ ...newParty, riskRating: e.target.value })} className="w-full px-4 py-2 border border-gray-300 rounded-lg"><option value="low">Low</option><option value="medium">Medium</option><option value="high">High</option></select></div>
                <div className="col-span-2"><label className="block text-sm font-medium text-gray-700 mb-1">Address</label><input type="text" value={newParty.address} onChange={(e) => setNewParty({ ...newParty, address: e.target.value })} className="w-full px-4 py-2 border border-gray-300 rounded-lg" /></div>
                <div className="col-span-2"><label className="block text-sm font-medium text-gray-700 mb-1">Notes</label><textarea value={newParty.notes} onChange={(e) => setNewParty({ ...newParty, notes: e.target.value })} className="w-full px-4 py-2 border border-gray-300 rounded-lg" rows={3} /></div>
              </div>
              <div className="flex justify-end gap-3 pt-4">
                <button type="button" onClick={() => setShowModal(false)} className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg" disabled={submitting}>Cancel</button>
                <button type="submit" className="px-4 py-2 bg-primary-600 text-white rounded-lg disabled:opacity-50" disabled={submitting}>{submitting ? 'Creating...' : 'Create Party'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
