import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  FileText,
  Users,
  MessageSquare,
  AlertTriangle,
  CheckCircle,
  Clock,
  TrendingUp,
  DollarSign,
  Shield,
  Scale,
  Highlighter,
  GitCompareArrows,
  Languages,
  BookMarked,
  Lock,
  Globe,
  Building,
  Sparkles
} from 'lucide-react';
import { getDashboardStats, getContracts, getDeadlines } from '../services/api';
import { useToast } from '../hooks/useToast';
import CardGridSkeleton from '../components/skeletons/CardGridSkeleton';

interface DashboardCard {
  title: string;
  value: number | string;
  icon: any;
  color: string;
  bgColor: string;
  path: string;
}

export default function Dashboard() {
  const navigate = useNavigate();
  const toast = useToast();
  const [stats, setStats] = useState<any>(null);
  const [recentContracts, setRecentContracts] = useState<any[]>([]);
  const [upcomingDeadlines, setUpcomingDeadlines] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      const [statsRes, contractsRes, deadlinesRes] = await Promise.all([
        getDashboardStats(),
        getContracts(),
        getDeadlines({ status: 'pending' })
      ]);
      setStats(statsRes.data);
      setRecentContracts(contractsRes.data.slice(0, 5));
      setUpcomingDeadlines(deadlinesRes.data.slice(0, 5));
    } catch (error) {
      console.error('Failed to load dashboard data:', error);
      toast.error('Failed to load dashboard stats. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const cards: DashboardCard[] = [
    {
      title: 'Total Contracts',
      value: stats?.totalContracts || 0,
      icon: FileText,
      color: 'text-blue-600',
      bgColor: 'bg-blue-100',
      path: '/contracts'
    },
    {
      title: 'Active Negotiations',
      value: stats?.activeNegotiations || 0,
      icon: MessageSquare,
      color: 'text-purple-600',
      bgColor: 'bg-purple-100',
      path: '/negotiations'
    },
    {
      title: 'Pending Approvals',
      value: stats?.pendingApprovals || 0,
      icon: CheckCircle,
      color: 'text-orange-600',
      bgColor: 'bg-orange-100',
      path: '/approvals'
    },
    {
      title: 'Upcoming Deadlines',
      value: stats?.upcomingDeadlines || 0,
      icon: Clock,
      color: 'text-green-600',
      bgColor: 'bg-green-100',
      path: '/deadlines'
    },
    {
      title: 'High Risk Contracts',
      value: stats?.highRiskContracts || 0,
      icon: AlertTriangle,
      color: 'text-red-600',
      bgColor: 'bg-red-100',
      path: '/risks'
    },
    {
      title: 'Total Parties',
      value: stats?.totalParties || 0,
      icon: Users,
      color: 'text-indigo-600',
      bgColor: 'bg-indigo-100',
      path: '/parties'
    }
  ];

  const featureCards = [
    { title: 'Contracts', description: 'Manage all your contracts', icon: FileText, path: '/contracts', color: 'bg-blue-500' },
    { title: 'Clause Library', description: 'Reusable contract clauses', icon: Scale, path: '/clauses', color: 'bg-purple-500' },
    { title: 'Parties', description: 'Contract counterparties', icon: Users, path: '/parties', color: 'bg-green-500' },
    { title: 'Templates', description: 'Contract templates', icon: FileText, path: '/templates', color: 'bg-yellow-500' },
    { title: 'Negotiations', description: 'Track negotiations', icon: MessageSquare, path: '/negotiations', color: 'bg-pink-500' },
    { title: 'Risk Analysis', description: 'AI-powered risk assessment', icon: AlertTriangle, path: '/risks', color: 'bg-red-500' },
    { title: 'Compliance', description: 'Regulatory compliance', icon: Shield, path: '/compliance', color: 'bg-indigo-500' },
    { title: 'Redlining', description: 'Track contract changes', icon: FileText, path: '/redlines', color: 'bg-orange-500' },
    { title: 'Approvals', description: 'Approval workflows', icon: CheckCircle, path: '/approvals', color: 'bg-teal-500' },
    { title: 'Deadlines', description: 'Contract deadlines', icon: Clock, path: '/deadlines', color: 'bg-cyan-500' },
    { title: 'AI Assistant', description: 'Contract negotiation AI', icon: MessageSquare, path: '/chat', color: 'bg-violet-500' },
    { title: 'Analytics', description: 'Contract analytics', icon: TrendingUp, path: '/analytics', color: 'bg-emerald-500' }
  ];

  const aiToolsCards = [
    { title: 'Risk Clause Highlighter', description: 'Identify risky clauses', icon: Highlighter, path: '/ai-tools/risk-clause-highlighter', color: 'bg-amber-500' },
    { title: 'Standard Terms Comparer', description: 'Compare against standards', icon: GitCompareArrows, path: '/ai-tools/standard-terms-comparer', color: 'bg-blue-600' },
    { title: 'Plain Language Translator', description: 'Simplify legal jargon', icon: Languages, path: '/ai-tools/plain-language-translator', color: 'bg-purple-600' },
    { title: 'Precedent Finder', description: 'Find legal precedents', icon: BookMarked, path: '/ai-tools/precedent-finder', color: 'bg-indigo-600' },
    { title: 'NDA Generator', description: 'Generate NDA documents', icon: Lock, path: '/ai-tools/nda-generator', color: 'bg-teal-600' },
    { title: 'ToS Builder', description: 'Build Terms of Service', icon: Globe, path: '/ai-tools/terms-of-service-builder', color: 'bg-cyan-600' },
    { title: 'Lease Analyzer', description: 'Analyze real estate leases', icon: Building, path: '/ai-tools/lease-analyzer', color: 'bg-orange-600' }
  ];

  if (loading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-600">Welcome to AI Contract Negotiation Assistant</p>
        </div>
        <CardGridSkeleton count={6} />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-600">Welcome to AI Contract Negotiation Assistant</p>
      </div>

      {/* Stats cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        {cards.map((card) => (
          <div
            key={card.title}
            onClick={() => navigate(card.path)}
            className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 cursor-pointer hover:shadow-md hover:border-primary-200 transition"
          >
            <div className="flex items-center justify-between mb-3">
              <div className={`p-2 rounded-lg ${card.bgColor}`}>
                <card.icon className={card.color} size={20} />
              </div>
            </div>
            <div className="text-2xl font-bold text-gray-900">{card.value}</div>
            <div className="text-sm text-gray-600">{card.title}</div>
          </div>
        ))}
      </div>

      {/* Feature cards */}
      <div>
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Features</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4">
          {featureCards.map((card) => (
            <div
              key={card.title}
              onClick={() => navigate(card.path)}
              className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 cursor-pointer hover:shadow-md hover:border-primary-200 transition group"
            >
              <div className={`w-10 h-10 rounded-lg ${card.color} flex items-center justify-center mb-3 group-hover:scale-110 transition`}>
                <card.icon className="text-white" size={20} />
              </div>
              <h3 className="font-semibold text-gray-900">{card.title}</h3>
              <p className="text-xs text-gray-500 mt-1">{card.description}</p>
            </div>
          ))}
        </div>
      </div>

      {/* AI Tools */}
      <div>
        <div className="flex items-center gap-2 mb-4">
          <Sparkles className="text-purple-600" size={20} />
          <h2 className="text-lg font-semibold text-gray-900">AI-Powered Tools</h2>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-7 gap-4">
          {aiToolsCards.map((card) => (
            <div
              key={card.title}
              onClick={() => navigate(card.path)}
              className="bg-gradient-to-br from-white to-purple-50 rounded-xl p-4 shadow-sm border border-purple-100 cursor-pointer hover:shadow-md hover:border-purple-300 transition group"
            >
              <div className={`w-10 h-10 rounded-lg ${card.color} flex items-center justify-center mb-3 group-hover:scale-110 transition`}>
                <card.icon className="text-white" size={20} />
              </div>
              <h3 className="font-semibold text-gray-900 text-sm">{card.title}</h3>
              <p className="text-xs text-gray-500 mt-1">{card.description}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Recent activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent contracts */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100">
          <div className="p-4 border-b border-gray-100 flex items-center justify-between">
            <h2 className="font-semibold text-gray-900">Recent Contracts</h2>
            <button
              onClick={() => navigate('/contracts')}
              className="text-sm text-primary-600 hover:text-primary-700"
            >
              View all
            </button>
          </div>
          <div className="divide-y divide-gray-100">
            {recentContracts.map((contract) => (
              <div
                key={contract.id}
                onClick={() => navigate(`/contracts/${contract.id}`)}
                className="p-4 hover:bg-gray-50 cursor-pointer transition"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-medium text-gray-900">{contract.title}</h3>
                    <p className="text-sm text-gray-500">{contract.contractType}</p>
                  </div>
                  <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                    contract.status === 'active' ? 'bg-green-100 text-green-700' :
                    contract.status === 'draft' ? 'bg-gray-100 text-gray-700' :
                    contract.status === 'negotiation' ? 'bg-yellow-100 text-yellow-700' :
                    'bg-blue-100 text-blue-700'
                  }`}>
                    {contract.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Upcoming deadlines */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100">
          <div className="p-4 border-b border-gray-100 flex items-center justify-between">
            <h2 className="font-semibold text-gray-900">Upcoming Deadlines</h2>
            <button
              onClick={() => navigate('/deadlines')}
              className="text-sm text-primary-600 hover:text-primary-700"
            >
              View all
            </button>
          </div>
          <div className="divide-y divide-gray-100">
            {upcomingDeadlines.map((deadline) => (
              <div
                key={deadline.id}
                onClick={() => navigate(`/deadlines/${deadline.id}`)}
                className="p-4 hover:bg-gray-50 cursor-pointer transition"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-medium text-gray-900">{deadline.title}</h3>
                    <p className="text-sm text-gray-500">
                      {new Date(deadline.dueDate).toLocaleDateString()}
                    </p>
                  </div>
                  <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                    deadline.priority === 'high' ? 'bg-red-100 text-red-700' :
                    deadline.priority === 'medium' ? 'bg-yellow-100 text-yellow-700' :
                    'bg-green-100 text-green-700'
                  }`}>
                    {deadline.priority}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
