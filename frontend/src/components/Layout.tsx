import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  FileText,
  Users,
  LayoutTemplate,
  MessageSquare,
  AlertTriangle,
  Shield,
  GitCompare,
  CheckCircle,
  Clock,
  Bot,
  BarChart3,
  Home,
  Menu,
  X,
  LogOut,
  Scale,
  ChevronDown,
  ChevronRight,
  Highlighter,
  GitCompareArrows,
  Languages,
  BookMarked,
  Lock,
  Globe,
  Building,
  Sparkles,
  Settings
} from 'lucide-react';

interface LayoutProps {
  children: React.ReactNode;
  user: any;
  onLogout: () => void;
}

const mainMenuItems = [
  { path: '/', icon: Home, label: 'Dashboard' },
  { path: '/contracts', icon: FileText, label: 'Contracts' },
  { path: '/clauses', icon: Scale, label: 'Clause Library' },
  { path: '/parties', icon: Users, label: 'Parties' },
  { path: '/templates', icon: LayoutTemplate, label: 'Templates' },
  { path: '/negotiations', icon: MessageSquare, label: 'Negotiations' },
  { path: '/risks', icon: AlertTriangle, label: 'Risk Analysis' },
  { path: '/compliance', icon: Shield, label: 'Compliance' },
  { path: '/redlines', icon: GitCompare, label: 'Redlining' },
  { path: '/approvals', icon: CheckCircle, label: 'Approvals' },
  { path: '/deadlines', icon: Clock, label: 'Deadlines' },
  { path: '/chat', icon: Bot, label: 'AI Assistant' },
  { path: '/analytics', icon: BarChart3, label: 'Analytics' },
];

const aiToolsMenuItems = [
  { path: '/ai-tools/risk-clause-highlighter', icon: Highlighter, label: 'Risk Clause Highlighter' },
  { path: '/ai-tools/standard-terms-comparer', icon: GitCompareArrows, label: 'Standard Terms Comparer' },
  { path: '/ai-tools/plain-language-translator', icon: Languages, label: 'Plain Language Translator' },
  { path: '/ai-tools/precedent-finder', icon: BookMarked, label: 'Precedent Finder' },
  { path: '/ai-tools/nda-generator', icon: Lock, label: 'NDA Generator' },
  { path: '/ai-tools/terms-of-service-builder', icon: Globe, label: 'Terms of Service Builder' },
  { path: '/ai-tools/lease-analyzer', icon: Building, label: 'Lease Analyzer' },
  { path: '/ai-tools/compliance-audit-agents', icon: Shield, label: 'Compliance Audit Agents' },
];

export default function Layout({ children, user, onLogout }: LayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [aiToolsExpanded, setAiToolsExpanded] = useState(true);
  const location = useLocation();
  const navigate = useNavigate();

  const isAiToolsActive = location.pathname.startsWith('/ai-tools');

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Mobile menu button */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-50 bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between">
        <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)} className="p-2 rounded-lg hover:bg-gray-100">
          {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
        <div className="flex items-center gap-2">
          <Scale className="text-primary-600" size={24} />
          <span className="font-bold text-gray-900">ContractAI</span>
        </div>
        <div className="w-10" />
      </div>

      {/* Mobile sidebar overlay */}
      {mobileMenuOpen && (
        <div className="lg:hidden fixed inset-0 z-40 bg-black bg-opacity-50" onClick={() => setMobileMenuOpen(false)} />
      )}

      {/* Sidebar */}
      <aside className={`fixed top-0 left-0 z-40 h-screen transition-transform duration-300 ${
        mobileMenuOpen ? 'translate-x-0' : '-translate-x-full'
      } lg:translate-x-0 ${sidebarOpen ? 'w-64' : 'w-20'} bg-white border-r border-gray-200 overflow-hidden`}>
        <div className="h-full flex flex-col">
          {/* Logo */}
          <div className="p-4 border-b border-gray-200">
            <div className="flex items-center gap-3">
              <Scale className="text-primary-600 flex-shrink-0" size={32} />
              {sidebarOpen && (
                <div>
                  <h1 className="font-bold text-gray-900">ContractAI</h1>
                  <p className="text-xs text-gray-500">Negotiation Assistant</p>
                </div>
              )}
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 overflow-y-auto py-4 px-3">
            {/* Main Menu */}
            <ul className="space-y-1">
              {mainMenuItems.map((item) => {
                const isActive = location.pathname === item.path ||
                  (item.path !== '/' && location.pathname.startsWith(item.path));
                return (
                  <li key={item.path}>
                    <Link
                      to={item.path}
                      onClick={() => setMobileMenuOpen(false)}
                      className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors ${
                        isActive
                          ? 'bg-primary-50 text-primary-700'
                          : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                      }`}
                    >
                      <item.icon size={20} className="flex-shrink-0" />
                      {sidebarOpen && <span className="font-medium">{item.label}</span>}
                    </Link>
                  </li>
                );
              })}
            </ul>

            {/* AI Tools Section */}
            {sidebarOpen && (
              <div className="mt-6">
                <button
                  onClick={() => setAiToolsExpanded(!aiToolsExpanded)}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-lg transition-colors ${
                    isAiToolsActive ? 'bg-gradient-to-r from-purple-50 to-indigo-50 text-purple-700' : 'text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <Sparkles size={18} className={isAiToolsActive ? 'text-purple-600' : 'text-gray-500'} />
                    <span className="font-semibold text-sm">AI Tools</span>
                  </div>
                  {aiToolsExpanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                </button>

                {aiToolsExpanded && (
                  <ul className="mt-1 ml-2 space-y-0.5 border-l-2 border-gray-200 pl-2">
                    {aiToolsMenuItems.map((item) => {
                      const isActive = location.pathname.startsWith(item.path);
                      return (
                        <li key={item.path}>
                          <Link
                            to={item.path}
                            onClick={() => setMobileMenuOpen(false)}
                            className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-colors text-sm ${
                              isActive
                                ? 'bg-primary-50 text-primary-700'
                                : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                            }`}
                          >
                            <item.icon size={16} className="flex-shrink-0" />
                            <span className="font-medium truncate">{item.label}</span>
                          </Link>
                        </li>
                      );
                    })}
                  </ul>
                )}
              </div>
            )}

            {/* Collapsed AI Tools */}
            {!sidebarOpen && (
              <div className="mt-6 space-y-1">
                {aiToolsMenuItems.map((item) => {
                  const isActive = location.pathname.startsWith(item.path);
                  return (
                    <Link
                      key={item.path}
                      to={item.path}
                      className={`flex items-center justify-center p-2.5 rounded-lg transition-colors ${
                        isActive
                          ? 'bg-primary-50 text-primary-700'
                          : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                      }`}
                      title={item.label}
                    >
                      <item.icon size={20} />
                    </Link>
                  );
                })}
              </div>
            )}
          </nav>

          {/* User section */}
          <div className="p-4 border-t border-gray-200">
            <div className="flex items-center gap-3">
              <button
                onClick={() => navigate('/profile')}
                className="w-10 h-10 rounded-full bg-primary-100 flex items-center justify-center flex-shrink-0 hover:bg-primary-200 transition"
                title="Profile Settings"
              >
                <span className="text-primary-700 font-semibold">
                  {user?.name?.charAt(0) || 'U'}
                </span>
              </button>
              {sidebarOpen && (
                <div className="flex-1 min-w-0">
                  <button
                    onClick={() => navigate('/profile')}
                    className="font-medium text-gray-900 truncate block hover:text-primary-700 transition text-left"
                  >
                    {user?.name}
                  </button>
                  <p className="text-xs text-gray-500 truncate">{user?.role}</p>
                </div>
              )}
              {sidebarOpen ? (
                <button
                  onClick={onLogout}
                  className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-red-50 text-red-600 hover:bg-red-100 transition text-sm font-medium"
                  title="Logout"
                >
                  <LogOut size={16} />
                  Logout
                </button>
              ) : (
                <button
                  onClick={onLogout}
                  className="p-2 rounded-lg hover:bg-red-50 text-gray-500 hover:text-red-600 transition"
                  title="Logout"
                >
                  <LogOut size={20} />
                </button>
              )}
            </div>
          </div>

          {/* Collapse button - desktop only */}
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="hidden lg:flex absolute -right-3 top-20 w-6 h-6 bg-white border border-gray-200 rounded-full items-center justify-center shadow-sm hover:bg-gray-50"
          >
            <ChevronDown size={14} className={`transform ${sidebarOpen ? 'rotate-90' : '-rotate-90'}`} />
          </button>
        </div>
      </aside>

      {/* Main content */}
      <main className={`transition-all duration-300 ${sidebarOpen ? 'lg:ml-64' : 'lg:ml-20'} pt-16 lg:pt-0`}>
        <div className="p-6">
          {children}
        </div>
      </main>
    </div>
  );
}
