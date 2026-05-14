import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import Login from './pages/Login';
import Register from './pages/Register';
import ForgotPassword from './pages/ForgotPassword';
import Dashboard from './pages/Dashboard';
import Contracts from './pages/Contracts';
import ContractDetail from './pages/ContractDetail';
import Clauses from './pages/Clauses';
import ClauseDetail from './pages/ClauseDetail';
import Parties from './pages/Parties';
import PartyDetail from './pages/PartyDetail';
import Templates from './pages/Templates';
import TemplateDetail from './pages/TemplateDetail';
import Negotiations from './pages/Negotiations';
import NegotiationDetail from './pages/NegotiationDetail';
import RiskAnalysis from './pages/RiskAnalysis';
import RiskDetail from './pages/RiskDetail';
import Compliance from './pages/Compliance';
import ComplianceDetail from './pages/ComplianceDetail';
import Redlines from './pages/Redlines';
import RedlineDetail from './pages/RedlineDetail';
import Approvals from './pages/Approvals';
import ApprovalDetail from './pages/ApprovalDetail';
import Deadlines from './pages/Deadlines';
import DeadlineDetail from './pages/DeadlineDetail';
import AIChat from './pages/AIChat';
import Analytics from './pages/Analytics';
import AnalyticsDetail from './pages/AnalyticsDetail';
import Profile from './pages/Profile';
import Layout from './components/Layout';
import ErrorBoundary from './components/ErrorBoundary';

// New AI Tools Pages
import RiskClauseHighlighter from './pages/RiskClauseHighlighter';
import RiskClauseHighlighterDetail from './pages/RiskClauseHighlighterDetail';
import StandardTermsComparer from './pages/StandardTermsComparer';
import StandardTermsComparerDetail from './pages/StandardTermsComparerDetail';
import PlainLanguageTranslator from './pages/PlainLanguageTranslator';
import PlainLanguageTranslatorDetail from './pages/PlainLanguageTranslatorDetail';
import PrecedentFinder from './pages/PrecedentFinder';
import PrecedentFinderDetail from './pages/PrecedentFinderDetail';
import NDAGenerator from './pages/NDAGenerator';
import NDAGeneratorDetail from './pages/NDAGeneratorDetail';
import TermsOfServiceBuilder from './pages/TermsOfServiceBuilder';
import TermsOfServiceBuilderDetail from './pages/TermsOfServiceBuilderDetail';
import LeaseAnalyzer from './pages/LeaseAnalyzer';
import LeaseAnalyzerDetail from './pages/LeaseAnalyzerDetail';
import ComplianceAuditAgents from './pages/ComplianceAuditAgents';
import AICustomTools from './pages/AICustomTools';
import HighlightRisksStateless from './pages/HighlightRisksStateless';
import StandardTermsCompareStateless from './pages/StandardTermsCompareStateless';
import RankRiskClausesStateless from './pages/RankRiskClausesStateless';
import SuggestRedlineCounterStateless from './pages/SuggestRedlineCounterStateless';
import ChatAboutContractStateless from './pages/ChatAboutContractStateless';

import api from './services/api';

// // === Batch 02 Gaps & Frontend Mounts ===
import CfAgenticNegotiationModeling from './pages/CfAgenticNegotiationModeling';
import CfRegulatoryChangeAlerting from './pages/CfRegulatoryChangeAlerting';
import CfBenchmarkingAgainstMarket from './pages/CfBenchmarkingAgainstMarket';
import CfNegotiationPlaybookGeneration from './pages/CfNegotiationPlaybookGeneration';
import CfPrecedentAnalysisAtScale from './pages/CfPrecedentAnalysisAtScale';
import GapAllSpecializedAnalyzersLeaseanalyzerPlainlanguagetransla from './pages/GapAllSpecializedAnalyzersLeaseanalyzerPlainlanguagetransla';
import GapNoGitStyleVersionControlOrTrackChangesUiIntegration from './pages/GapNoGitStyleVersionControlOrTrackChangesUiIntegration';
import GapNoESignatureWorkflowIntegrationDocusignHellosign from './pages/GapNoESignatureWorkflowIntegrationDocusignHellosign';
import GapNoIntegrationWithLegalResearchApisWestlawLexisnexis from './pages/GapNoIntegrationWithLegalResearchApisWestlawLexisnexis';
import GapNoDealRoomDataRoomManagementForDueDiligence from './pages/GapNoDealRoomDataRoomManagementForDueDiligence';

type AuthView = 'login' | 'register' | 'forgot-password';

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [authView, setAuthView] = useState<AuthView>('login');

  useEffect(() => {
    const token = localStorage.getItem('token');
    const savedUser = localStorage.getItem('user');
    if (token && savedUser) {
      setIsAuthenticated(true);
      setUser(JSON.parse(savedUser));
      api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    }
  }, []);

  const handleLogin = (userData: any, token: string) => {
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(userData));
    api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    setIsAuthenticated(true);
    setUser(userData);
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    delete api.defaults.headers.common['Authorization'];
    setIsAuthenticated(false);
    setUser(null);
    setAuthView('login');
  };

  if (!isAuthenticated) {
    if (authView === 'register') {
      return <Register onRegister={handleLogin} onSwitchToLogin={() => setAuthView('login')} />;
    }
    if (authView === 'forgot-password') {
      return <ForgotPassword onBack={() => setAuthView('login')} />;
    }
    return (
      <Login
        onLogin={handleLogin}
        onSwitchToRegister={() => setAuthView('register')}
        onForgotPassword={() => setAuthView('forgot-password')}
      />
    );
  }

  return (
    <BrowserRouter>
      <ErrorBoundary>
        <Layout user={user} onLogout={handleLogout}>
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/contracts" element={<Contracts />} />
            <Route path="/contracts/:id" element={<ContractDetail />} />
            <Route path="/clauses" element={<Clauses />} />
            <Route path="/clauses/:id" element={<ClauseDetail />} />
            <Route path="/parties" element={<Parties />} />
            <Route path="/parties/:id" element={<PartyDetail />} />
            <Route path="/templates" element={<Templates />} />
            <Route path="/templates/:id" element={<TemplateDetail />} />
            <Route path="/negotiations" element={<Negotiations />} />
            <Route path="/negotiations/:id" element={<NegotiationDetail />} />
            <Route path="/risks" element={<RiskAnalysis />} />
            <Route path="/risks/:id" element={<RiskDetail />} />
            <Route path="/compliance" element={<Compliance />} />
            <Route path="/compliance/:id" element={<ComplianceDetail />} />
            <Route path="/redlines" element={<Redlines />} />
            <Route path="/redlines/:id" element={<RedlineDetail />} />
            <Route path="/approvals" element={<Approvals />} />
            <Route path="/approvals/:id" element={<ApprovalDetail />} />
            <Route path="/deadlines" element={<Deadlines />} />
            <Route path="/deadlines/:id" element={<DeadlineDetail />} />
            <Route path="/chat" element={<AIChat />} />
            <Route path="/analytics" element={<Analytics />} />
            <Route path="/analytics/:id" element={<AnalyticsDetail />} />
            <Route path="/profile" element={<Profile />} />

            {/* New AI Tools Routes */}
            <Route path="/ai-tools/risk-clause-highlighter" element={<RiskClauseHighlighter />} />
            <Route path="/ai-tools/risk-clause-highlighter/:id" element={<RiskClauseHighlighterDetail />} />
            <Route path="/ai-tools/standard-terms-comparer" element={<StandardTermsComparer />} />
            <Route path="/ai-tools/standard-terms-comparer/:id" element={<StandardTermsComparerDetail />} />
            <Route path="/ai-tools/plain-language-translator" element={<PlainLanguageTranslator />} />
            <Route path="/ai-tools/plain-language-translator/:id" element={<PlainLanguageTranslatorDetail />} />
            <Route path="/ai-tools/precedent-finder" element={<PrecedentFinder />} />
            <Route path="/ai-tools/precedent-finder/:id" element={<PrecedentFinderDetail />} />
            <Route path="/ai-tools/nda-generator" element={<NDAGenerator />} />
            <Route path="/ai-tools/nda-generator/:id" element={<NDAGeneratorDetail />} />
            <Route path="/ai-tools/terms-of-service-builder" element={<TermsOfServiceBuilder />} />
            <Route path="/ai-tools/terms-of-service-builder/:id" element={<TermsOfServiceBuilderDetail />} />
            <Route path="/ai-tools/lease-analyzer" element={<LeaseAnalyzer />} />
            <Route path="/ai-tools/lease-analyzer/:id" element={<LeaseAnalyzerDetail />} />
            <Route path="/ai-tools/compliance-audit-agents" element={<ComplianceAuditAgents />} />
            <Route path="/ai-tools/custom" element={<AICustomTools />} />
            <Route path="/ai-tools/highlight-risks" element={<HighlightRisksStateless />} />
            <Route path="/ai-tools/standard-terms-compare" element={<StandardTermsCompareStateless />} />
            <Route path="/ai-tools/rank-risk-clauses" element={<RankRiskClausesStateless />} />
            <Route path="/ai-tools/suggest-redline-counter" element={<SuggestRedlineCounterStateless />} />
            <Route path="/ai-tools/chat-about-contract" element={<ChatAboutContractStateless />} />

            <Route path="*" element={<Navigate to="/" />} />
          
        {/* // === Batch 02 Gaps & Frontend Mounts === */}
        <Route path="/cf/agentic-negotiation-modeling" element={<CfAgenticNegotiationModeling />} />
        <Route path="/cf/regulatory-change-alerting" element={<CfRegulatoryChangeAlerting />} />
        <Route path="/cf/benchmarking-against-market" element={<CfBenchmarkingAgainstMarket />} />
        <Route path="/cf/negotiation-playbook-generation" element={<CfNegotiationPlaybookGeneration />} />
        <Route path="/cf/precedent-analysis-at-scale" element={<CfPrecedentAnalysisAtScale />} />
        <Route path="/gap/all-specialized-analyzers-leaseanalyzer-plainlanguagetransla" element={<GapAllSpecializedAnalyzersLeaseanalyzerPlainlanguagetransla />} />
        <Route path="/gap/no-git-style-version-control-or-track-changes-ui-integration" element={<GapNoGitStyleVersionControlOrTrackChangesUiIntegration />} />
        <Route path="/gap/no-e-signature-workflow-integration-docusign-hellosign" element={<GapNoESignatureWorkflowIntegrationDocusignHellosign />} />
        <Route path="/gap/no-integration-with-legal-research-apis-westlaw-lexisnexis" element={<GapNoIntegrationWithLegalResearchApisWestlawLexisnexis />} />
        <Route path="/gap/no-deal-room-data-room-management-for-due-diligence" element={<GapNoDealRoomDataRoomManagementForDueDiligence />} />
      </Routes>
        </Layout>
      </ErrorBoundary>
    </BrowserRouter>
  );
}

export default App;
