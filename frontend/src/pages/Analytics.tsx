import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { BarChart3, TrendingUp, DollarSign, FileText, AlertTriangle, CheckCircle, Clock, Users, Plus, Search } from 'lucide-react';
import { getAnalytics, getDashboardAnalytics, createAnalytics } from '../services/api';
import { useToast } from '../hooks/useToast';
import { useEscapeKey } from '../hooks/useEscapeKey';
import CardGridSkeleton from '../components/skeletons/CardGridSkeleton';
import EmptyState from '../components/EmptyState';
import Pagination from '../components/Pagination';

const ITEMS_PER_PAGE = 15;

export default function Analytics() {
  const navigate = useNavigate();
  const toast = useToast();
  const [analytics, setAnalytics] = useState<any[]>([]);
  const [dashboardData, setDashboardData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [page, setPage] = useState(1);
  const [newMetric, setNewMetric] = useState({ metricName: '', metricValue: '', category: 'contracts', period: '2024-Q1', details: '' });

  useEscapeKey(() => setShowModal(false), showModal);

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    try {
      const [analyticsRes, dashboardRes] = await Promise.all([getAnalytics(), getDashboardAnalytics()]);
      setAnalytics(analyticsRes.data);
      setDashboardData(dashboardRes.data);
    } catch (error) {
      console.error('Failed to load data:', error);
      toast.error('Failed to load analytics data');
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await createAnalytics({ ...newMetric, metricValue: parseFloat(newMetric.metricValue) });
      setShowModal(false);
      setNewMetric({ metricName: '', metricValue: '', category: 'contracts', period: '2024-Q1', details: '' });
      toast.success('Metric created successfully');
      loadData();
    } catch (error) {
      console.error('Failed to create metric:', error);
      toast.error('Failed to create metric');
    } finally {
      setSubmitting(false);
    }
  };

  const filteredAnalytics = analytics.filter(a =>
    a.metricName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    a.category.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalPages = Math.ceil(filteredAnalytics.length / ITEMS_PER_PAGE);
  const paginatedAnalytics = filteredAnalytics.slice((page - 1) * ITEMS_PER_PAGE, page * ITEMS_PER_PAGE);

  // Reset to page 1 when search changes
  useEffect(() => { setPage(1); }, [searchTerm]);

  const summaryCards = [
    { title: 'Total Contracts', value: dashboardData?.contracts?.byStatus?.reduce((sum: number, s: any) => sum + s._count.id, 0) || 0, icon: FileText, color: 'bg-blue-500' },
    { title: 'Contract Value', value: `$${((dashboardData?.contracts?.totalValue || 0) / 1000000).toFixed(1)}M`, icon: DollarSign, color: 'bg-green-500' },
    { title: 'High Risk', value: dashboardData?.contracts?.byRisk?.find((r: any) => r.riskLevel === 'high')?._count?.id || 0, icon: AlertTriangle, color: 'bg-red-500' },
    { title: 'Pending Approvals', value: dashboardData?.approvals?.byStatus?.find((s: any) => s.status === 'pending')?._count?.id || 0, icon: CheckCircle, color: 'bg-yellow-500' },
    { title: 'Overdue Deadlines', value: dashboardData?.deadlines?.overdue || 0, icon: Clock, color: 'bg-orange-500' },
    { title: 'Active Negotiations', value: dashboardData?.negotiations?.byStatus?.find((s: any) => s.status === 'in_progress')?._count?.id || 0, icon: Users, color: 'bg-purple-500' },
  ];

  if (loading) return <CardGridSkeleton count={6} />;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div><h1 className="text-2xl font-bold text-gray-900">Analytics</h1><p className="text-gray-600">Contract performance metrics and insights</p></div>
        <button onClick={() => setShowModal(true)} className="inline-flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"><Plus size={20} />Add Metric</button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {summaryCards.map((card, i) => (
          <div key={i} className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
            <div className={`w-10 h-10 ${card.color} rounded-lg flex items-center justify-center mb-3`}><card.icon className="text-white" size={20} /></div>
            <div className="text-2xl font-bold text-gray-900">{card.value}</div>
            <div className="text-sm text-gray-500">{card.title}</div>
          </div>
        ))}
      </div>

      {dashboardData?.contracts?.byStatus && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Contracts by Status</h2>
            <div className="space-y-3">
              {dashboardData.contracts.byStatus.map((s: any) => (
                <div key={s.status} className="flex items-center justify-between">
                  <span className="text-gray-600 capitalize">{s.status?.replace('_', ' ')}</span>
                  <div className="flex items-center gap-3">
                    <div className="w-32 bg-gray-200 rounded-full h-2"><div className="bg-primary-500 h-2 rounded-full" style={{ width: `${Math.min((s._count.id / 5) * 100, 100)}%` }}></div></div>
                    <span className="font-medium w-8 text-right">{s._count.id}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Contracts by Risk Level</h2>
            <div className="space-y-3">
              {dashboardData.contracts.byRisk?.filter((r: any) => r.riskLevel).map((r: any) => (
                <div key={r.riskLevel} className="flex items-center justify-between">
                  <span className={`px-2 py-1 text-xs font-medium rounded-full ${r.riskLevel === 'high' ? 'bg-red-100 text-red-700' : r.riskLevel === 'medium' ? 'bg-yellow-100 text-yellow-700' : 'bg-green-100 text-green-700'}`}>{r.riskLevel}</span>
                  <div className="flex items-center gap-3">
                    <div className="w-32 bg-gray-200 rounded-full h-2"><div className={`h-2 rounded-full ${r.riskLevel === 'high' ? 'bg-red-500' : r.riskLevel === 'medium' ? 'bg-yellow-500' : 'bg-green-500'}`} style={{ width: `${Math.min((r._count.id / 5) * 100, 100)}%` }}></div></div>
                    <span className="font-medium w-8 text-right">{r._count.id}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      <div className="bg-white rounded-xl shadow-sm border border-gray-100">
        <div className="p-4 border-b border-gray-100">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900">All Metrics</h2>
            <div className="relative w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
              <input type="text" placeholder="Search metrics..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-lg text-sm" />
            </div>
          </div>
        </div>
        {filteredAnalytics.length === 0 ? (
          <EmptyState icon={BarChart3} title="No metrics found" description="Try adjusting your search or add a new metric." />
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-100">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Metric</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Value</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Category</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Period</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Details</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {paginatedAnalytics.map((metric) => (
                    <tr key={metric.id} onClick={() => navigate(`/analytics/${metric.id}`)} className="hover:bg-gray-50 cursor-pointer">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-emerald-100 rounded-lg"><TrendingUp className="text-emerald-600" size={18} /></div>
                          <span className="font-medium text-gray-900">{metric.metricName}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm font-medium text-gray-900">{typeof metric.metricValue === 'number' && metric.metricValue > 1000 ? `$${metric.metricValue.toLocaleString()}` : metric.metricValue}</td>
                      <td className="px-6 py-4"><span className="px-2 py-1 text-xs font-medium bg-gray-100 text-gray-700 rounded-full">{metric.category}</span></td>
                      <td className="px-6 py-4 text-sm text-gray-600">{metric.period}</td>
                      <td className="px-6 py-4 text-sm text-gray-600 truncate max-w-xs">{metric.details}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="p-4">
              <Pagination
                page={page}
                totalPages={totalPages}
                total={filteredAnalytics.length}
                limit={ITEMS_PER_PAGE}
                onPageChange={setPage}
              />
            </div>
          </>
        )}
      </div>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md m-4">
            <div className="p-6 border-b border-gray-100"><h2 className="text-xl font-bold text-gray-900">Add Metric</h2></div>
            <form onSubmit={handleCreate} className="p-6 space-y-4">
              <div><label className="block text-sm font-medium text-gray-700 mb-1">Metric Name</label><input type="text" value={newMetric.metricName} onChange={(e) => setNewMetric({ ...newMetric, metricName: e.target.value })} className="w-full px-4 py-2 border border-gray-300 rounded-lg" required /></div>
              <div className="grid grid-cols-2 gap-4">
                <div><label className="block text-sm font-medium text-gray-700 mb-1">Value</label><input type="number" value={newMetric.metricValue} onChange={(e) => setNewMetric({ ...newMetric, metricValue: e.target.value })} className="w-full px-4 py-2 border border-gray-300 rounded-lg" required /></div>
                <div><label className="block text-sm font-medium text-gray-700 mb-1">Category</label><select value={newMetric.category} onChange={(e) => setNewMetric({ ...newMetric, category: e.target.value })} className="w-full px-4 py-2 border border-gray-300 rounded-lg"><option value="contracts">Contracts</option><option value="financial">Financial</option><option value="negotiations">Negotiations</option><option value="risk">Risk</option><option value="compliance">Compliance</option></select></div>
              </div>
              <div><label className="block text-sm font-medium text-gray-700 mb-1">Period</label><input type="text" value={newMetric.period} onChange={(e) => setNewMetric({ ...newMetric, period: e.target.value })} className="w-full px-4 py-2 border border-gray-300 rounded-lg" placeholder="e.g., 2024-Q1" /></div>
              <div><label className="block text-sm font-medium text-gray-700 mb-1">Details</label><textarea value={newMetric.details} onChange={(e) => setNewMetric({ ...newMetric, details: e.target.value })} className="w-full px-4 py-2 border border-gray-300 rounded-lg" rows={2} /></div>
              <div className="flex justify-end gap-3">
                <button type="button" onClick={() => setShowModal(false)} className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg" disabled={submitting}>Cancel</button>
                <button type="submit" className="px-4 py-2 bg-primary-600 text-white rounded-lg disabled:opacity-50" disabled={submitting}>{submitting ? 'Adding...' : 'Add Metric'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
