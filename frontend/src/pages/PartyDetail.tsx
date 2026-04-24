import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Building, Edit, Trash2, Mail, Phone, MapPin } from 'lucide-react';
import { getParty, updateParty, deleteParty } from '../services/api';
import { useToast } from '../hooks/useToast';
import { useConfirm } from '../hooks/useConfirm';
import { useEscapeKey } from '../hooks/useEscapeKey';
import DetailSkeleton from '../components/skeletons/DetailSkeleton';

export default function PartyDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const toast = useToast();
  const confirm = useConfirm();
  const [party, setParty] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [editData, setEditData] = useState<any>({});
  const [submitting, setSubmitting] = useState(false);

  useEscapeKey(() => setEditing(false), editing);

  useEffect(() => { loadParty(); }, [id]);

  const loadParty = async () => {
    try {
      const response = await getParty(parseInt(id!));
      setParty(response.data);
      setEditData(response.data);
    } catch (error) {
      toast.error('Failed to load party');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdate = async () => {
    setSubmitting(true);
    try {
      await updateParty(parseInt(id!), editData);
      toast.success('Party updated');
      setEditing(false);
      loadParty();
    } catch (error) {
      toast.error('Failed to update party');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    const ok = await confirm({
      title: 'Delete party',
      message: 'Are you sure you want to delete this party? This action cannot be undone.',
      confirmLabel: 'Delete',
      variant: 'danger',
    });
    if (!ok) return;
    try {
      await deleteParty(parseInt(id!));
      toast.success('Party deleted');
      navigate('/parties');
    } catch (error) {
      toast.error('Failed to delete party');
    }
  };

  if (loading) return <DetailSkeleton />;
  if (!party) return <div className="text-center py-12 text-gray-500">Party not found</div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button onClick={() => navigate('/parties')} className="p-2 hover:bg-gray-100 rounded-lg"><ArrowLeft size={20} /></button>
          <div><h1 className="text-2xl font-bold text-gray-900">{party.name}</h1><p className="text-gray-600">{party.type} • {party.industry}</p></div>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => setEditing(!editing)} className="inline-flex items-center gap-2 px-4 py-2 bg-primary-100 text-primary-700 rounded-lg hover:bg-primary-200"><Edit size={20} />Edit</button>
          <button onClick={handleDelete} className="inline-flex items-center gap-2 px-4 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200"><Trash2 size={20} />Delete</button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          {editing ? (
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2"><label className="block text-sm font-medium text-gray-700 mb-1">Name</label><input type="text" value={editData.name} onChange={(e) => setEditData({ ...editData, name: e.target.value })} className="w-full px-4 py-2 border border-gray-300 rounded-lg" /></div>
                <div><label className="block text-sm font-medium text-gray-700 mb-1">Email</label><input type="email" value={editData.email || ''} onChange={(e) => setEditData({ ...editData, email: e.target.value })} className="w-full px-4 py-2 border border-gray-300 rounded-lg" /></div>
                <div><label className="block text-sm font-medium text-gray-700 mb-1">Phone</label><input type="text" value={editData.phone || ''} onChange={(e) => setEditData({ ...editData, phone: e.target.value })} className="w-full px-4 py-2 border border-gray-300 rounded-lg" /></div>
                <div className="col-span-2"><label className="block text-sm font-medium text-gray-700 mb-1">Address</label><input type="text" value={editData.address || ''} onChange={(e) => setEditData({ ...editData, address: e.target.value })} className="w-full px-4 py-2 border border-gray-300 rounded-lg" /></div>
                <div className="col-span-2"><label className="block text-sm font-medium text-gray-700 mb-1">Notes</label><textarea value={editData.notes || ''} onChange={(e) => setEditData({ ...editData, notes: e.target.value })} className="w-full px-4 py-2 border border-gray-300 rounded-lg" rows={4} /></div>
              </div>
              <div className="flex justify-end gap-3">
                <button onClick={() => setEditing(false)} className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg" disabled={submitting}>Cancel</button>
                <button onClick={handleUpdate} className="px-4 py-2 bg-primary-600 text-white rounded-lg disabled:opacity-50" disabled={submitting}>{submitting ? 'Saving...' : 'Save'}</button>
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Contact Information</h2>
              <div className="space-y-4">
                {party.email && <div className="flex items-center gap-3"><Mail className="text-gray-400" size={20} /><span>{party.email}</span></div>}
                {party.phone && <div className="flex items-center gap-3"><Phone className="text-gray-400" size={20} /><span>{party.phone}</span></div>}
                {party.address && <div className="flex items-center gap-3"><MapPin className="text-gray-400" size={20} /><span>{party.address}</span></div>}
                {party.notes && <div className="mt-4"><h3 className="font-medium text-gray-900 mb-2">Notes</h3><p className="text-gray-600">{party.notes}</p></div>}
              </div>
            </div>
          )}

          {party.contracts?.length > 0 && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Contracts</h2>
              <div className="space-y-3">
                {party.contracts.map((contract: any) => (
                  <div key={contract.id} onClick={() => navigate(`/contracts/${contract.id}`)} className="p-3 bg-gray-50 rounded-lg cursor-pointer hover:bg-gray-100 flex items-center justify-between">
                    <div><span className="font-medium text-gray-900">{contract.title}</span><span className="text-sm text-gray-500 ml-2">{contract.value ? `$${contract.value.toLocaleString()}` : ''}</span></div>
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${contract.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'}`}>{contract.status}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="space-y-6">
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Details</h2>
            <div className="space-y-4">
              <div className="flex justify-between"><span className="text-gray-600">Type</span><span className="font-medium capitalize">{party.type}</span></div>
              <div className="flex justify-between"><span className="text-gray-600">Industry</span><span className="font-medium">{party.industry || 'Not specified'}</span></div>
              <div className="flex justify-between"><span className="text-gray-600">Risk Rating</span><span className={`px-2 py-1 text-xs font-medium rounded-full ${party.riskRating === 'high' ? 'bg-red-100 text-red-700' : party.riskRating === 'medium' ? 'bg-yellow-100 text-yellow-700' : 'bg-green-100 text-green-700'}`}>{party.riskRating}</span></div>
              <div className="flex justify-between"><span className="text-gray-600">Contracts</span><span className="font-medium">{party.contracts?.length || 0}</span></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
