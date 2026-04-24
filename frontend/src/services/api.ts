import axios from 'axios';

const API_BASE_URL = '/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// 401 interceptor - clear token and redirect to login
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401 && !error.config.url?.includes('/auth/')) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.reload();
    }
    return Promise.reject(error);
  }
);

// Auth
export const login = (email: string, password: string) =>
  api.post('/auth/login', { email, password });

export const register = (data: any) =>
  api.post('/auth/register', data);

export const updateProfile = (data: any) =>
  api.put('/auth/profile', data);

export const changePassword = (data: any) =>
  api.put('/auth/change-password', data);

export const forgotPassword = (email: string) =>
  api.post('/auth/forgot-password', { email });

export const resetPassword = (token: string, newPassword: string) =>
  api.post('/auth/reset-password', { token, newPassword });

// Dashboard
export const getDashboardStats = () => api.get('/dashboard/stats');

// Contracts
export const getContracts = (params?: any) => api.get('/contracts', { params });
export const getContract = (id: number) => api.get(`/contracts/${id}`);
export const createContract = (data: any) => api.post('/contracts', data);
export const updateContract = (id: number, data: any) => api.put(`/contracts/${id}`, data);
export const deleteContract = (id: number) => api.delete(`/contracts/${id}`);
export const bulkDeleteContracts = (ids: number[]) => api.post('/contracts/bulk-delete', { ids });

// Clauses
export const getClauses = (params?: any) => api.get('/clauses', { params });
export const getClause = (id: number) => api.get(`/clauses/${id}`);
export const createClause = (data: any) => api.post('/clauses', data);
export const updateClause = (id: number, data: any) => api.put(`/clauses/${id}`, data);
export const deleteClause = (id: number) => api.delete(`/clauses/${id}`);
export const bulkDeleteClauses = (ids: number[]) => api.post('/clauses/bulk-delete', { ids });

// Parties
export const getParties = (params?: any) => api.get('/parties', { params });
export const getParty = (id: number) => api.get(`/parties/${id}`);
export const createParty = (data: any) => api.post('/parties', data);
export const updateParty = (id: number, data: any) => api.put(`/parties/${id}`, data);
export const deleteParty = (id: number) => api.delete(`/parties/${id}`);
export const bulkDeleteParties = (ids: number[]) => api.post('/parties/bulk-delete', { ids });

// Templates
export const getTemplates = (params?: any) => api.get('/templates', { params });
export const getTemplate = (id: number) => api.get(`/templates/${id}`);
export const createTemplate = (data: any) => api.post('/templates', data);
export const updateTemplate = (id: number, data: any) => api.put(`/templates/${id}`, data);
export const deleteTemplate = (id: number) => api.delete(`/templates/${id}`);
export const cloneTemplate = (id: number, data: any) => api.post(`/templates/${id}/clone`, data);
export const bulkDeleteTemplates = (ids: number[]) => api.post('/templates/bulk-delete', { ids });

// Negotiations
export const getNegotiations = (params?: any) => api.get('/negotiations', { params });
export const getNegotiation = (id: number) => api.get(`/negotiations/${id}`);
export const createNegotiation = (data: any) => api.post('/negotiations', data);
export const updateNegotiation = (id: number, data: any) => api.put(`/negotiations/${id}`, data);
export const deleteNegotiation = (id: number) => api.delete(`/negotiations/${id}`);
export const advanceNegotiation = (id: number, data: any) => api.post(`/negotiations/${id}/advance`, data);

// Risk Analysis
export const getRisks = (params?: any) => api.get('/risks', { params });
export const getRisk = (id: number) => api.get(`/risks/${id}`);
export const createRisk = (data: any) => api.post('/risks', data);
export const updateRisk = (id: number, data: any) => api.put(`/risks/${id}`, data);
export const deleteRisk = (id: number) => api.delete(`/risks/${id}`);
export const analyzeContractRisk = (contractId: number) => api.post(`/risks/analyze/${contractId}`);

// Compliance
export const getComplianceChecks = (params?: any) => api.get('/compliance', { params });
export const getComplianceCheck = (id: number) => api.get(`/compliance/${id}`);
export const createComplianceCheck = (data: any) => api.post('/compliance', data);
export const updateComplianceCheck = (id: number, data: any) => api.put(`/compliance/${id}`, data);
export const deleteComplianceCheck = (id: number) => api.delete(`/compliance/${id}`);
export const checkCompliance = (contractId: number, regulation: string) =>
  api.post(`/compliance/check/${contractId}`, { regulation });

// Redlines
export const getRedlines = (params?: any) => api.get('/redlines', { params });
export const getRedline = (id: number) => api.get(`/redlines/${id}`);
export const createRedline = (data: any) => api.post('/redlines', data);
export const updateRedline = (id: number, data: any) => api.put(`/redlines/${id}`, data);
export const deleteRedline = (id: number) => api.delete(`/redlines/${id}`);
export const acceptRedline = (id: number) => api.post(`/redlines/${id}/accept`);
export const rejectRedline = (id: number) => api.post(`/redlines/${id}/reject`);
export const suggestRedline = (contractId: number, data: any) => api.post(`/redlines/suggest/${contractId}`, data);

// Approvals
export const getApprovals = (params?: any) => api.get('/approvals', { params });
export const getApproval = (id: number) => api.get(`/approvals/${id}`);
export const createApproval = (data: any) => api.post('/approvals', data);
export const updateApproval = (id: number, data: any) => api.put(`/approvals/${id}`, data);
export const deleteApproval = (id: number) => api.delete(`/approvals/${id}`);
export const approveApproval = (id: number, comments?: string) => api.post(`/approvals/${id}/approve`, { comments });
export const rejectApproval = (id: number, reason: string) => api.post(`/approvals/${id}/reject`, { reason });
export const requestRevision = (id: number, comments: string) => api.post(`/approvals/${id}/revision`, { comments });

// Deadlines
export const getDeadlines = (params?: any) => api.get('/deadlines', { params });
export const getDeadline = (id: number) => api.get(`/deadlines/${id}`);
export const createDeadline = (data: any) => api.post('/deadlines', data);
export const updateDeadline = (id: number, data: any) => api.put(`/deadlines/${id}`, data);
export const deleteDeadline = (id: number) => api.delete(`/deadlines/${id}`);
export const completeDeadline = (id: number) => api.post(`/deadlines/${id}/complete`);
export const getUpcomingDeadlines = () => api.get('/deadlines/upcoming');
export const getOverdueDeadlines = () => api.get('/deadlines/overdue');

// Chat
export const sendChatMessage = (data: any) => api.post('/chat/message', data);
export const getChatHistory = (sessionId: string) => api.get(`/chat/history/${sessionId}`);
export const clearChatHistory = (sessionId: string) => api.delete(`/chat/history/${sessionId}`);
export const analyzeContract = (data: any) => api.post('/chat/analyze-contract', data);
export const generateClause = (data: any) => api.post('/chat/generate-clause', data);

// Analytics
export const getAnalytics = (params?: any) => api.get('/analytics', { params });
export const getAnalyticsRecord = (id: number) => api.get(`/analytics/${id}`);
export const createAnalytics = (data: any) => api.post('/analytics', data);
export const updateAnalytics = (id: number, data: any) => api.put(`/analytics/${id}`, data);
export const deleteAnalytics = (id: number) => api.delete(`/analytics/${id}`);
export const getDashboardAnalytics = () => api.get('/analytics/dashboard/summary');
export const getMonthlyTrends = () => api.get('/analytics/trends/monthly');

// Exports
export const exportContractsCSV = () => api.get('/exports/contracts', { responseType: 'blob' });
export const exportClausesCSV = () => api.get('/exports/clauses', { responseType: 'blob' });
export const exportPartiesCSV = () => api.get('/exports/parties', { responseType: 'blob' });
export const exportNegotiationsCSV = () => api.get('/exports/negotiations', { responseType: 'blob' });
export const exportDeadlinesCSV = () => api.get('/exports/deadlines', { responseType: 'blob' });

// AI Tools - Risk Clause Highlighter
export const getRiskClauseHighlights = () => api.get('/ai/risk-clause-highlighter');
export const getRiskClauseHighlight = (id: number) => api.get(`/ai/risk-clause-highlighter/${id}`);
export const createRiskClauseHighlight = (data: any) => api.post('/ai/risk-clause-highlighter', data);
export const updateRiskClauseHighlight = (id: number, data: any) => api.put(`/ai/risk-clause-highlighter/${id}`, data);
export const deleteRiskClauseHighlight = (id: number) => api.delete(`/ai/risk-clause-highlighter/${id}`);
export const analyzeRiskClause = (data: any) => api.post('/ai/risk-clause-highlighter/analyze', data);

// AI Tools - Standard Terms Comparer
export const getStandardTermComparisons = () => api.get('/ai/standard-terms-comparer');
export const getStandardTermComparison = (id: number) => api.get(`/ai/standard-terms-comparer/${id}`);
export const createStandardTermComparison = (data: any) => api.post('/ai/standard-terms-comparer', data);
export const updateStandardTermComparison = (id: number, data: any) => api.put(`/ai/standard-terms-comparer/${id}`, data);
export const deleteStandardTermComparison = (id: number) => api.delete(`/ai/standard-terms-comparer/${id}`);
export const compareStandardTerms = (data: any) => api.post('/ai/standard-terms-comparer/compare', data);

// AI Tools - Plain Language Translator
export const getPlainLanguageTranslations = () => api.get('/ai/plain-language-translator');
export const getPlainLanguageTranslation = (id: number) => api.get(`/ai/plain-language-translator/${id}`);
export const createPlainLanguageTranslation = (data: any) => api.post('/ai/plain-language-translator', data);
export const updatePlainLanguageTranslation = (id: number, data: any) => api.put(`/ai/plain-language-translator/${id}`, data);
export const deletePlainLanguageTranslation = (id: number) => api.delete(`/ai/plain-language-translator/${id}`);
export const translateToPlainLanguage = (data: any) => api.post('/ai/plain-language-translator/translate', data);

// AI Tools - Precedent Finder
export const getPrecedentSearches = () => api.get('/ai/precedent-finder');
export const getPrecedentSearch = (id: number) => api.get(`/ai/precedent-finder/${id}`);
export const createPrecedentSearch = (data: any) => api.post('/ai/precedent-finder', data);
export const updatePrecedentSearch = (id: number, data: any) => api.put(`/ai/precedent-finder/${id}`, data);
export const deletePrecedentSearch = (id: number) => api.delete(`/ai/precedent-finder/${id}`);
export const searchPrecedents = (data: any) => api.post('/ai/precedent-finder/search', data);

// AI Tools - NDA Generator
export const getNDADocuments = () => api.get('/ai/nda-generator');
export const getNDADocument = (id: number) => api.get(`/ai/nda-generator/${id}`);
export const createNDADocument = (data: any) => api.post('/ai/nda-generator', data);
export const updateNDADocument = (id: number, data: any) => api.put(`/ai/nda-generator/${id}`, data);
export const deleteNDADocument = (id: number) => api.delete(`/ai/nda-generator/${id}`);
export const generateNDA = (data: any) => api.post('/ai/nda-generator/generate', data);

// AI Tools - Terms of Service Builder
export const getTermsOfServiceDocs = () => api.get('/ai/terms-of-service-builder');
export const getTermsOfServiceDoc = (id: number) => api.get(`/ai/terms-of-service-builder/${id}`);
export const createTermsOfServiceDoc = (data: any) => api.post('/ai/terms-of-service-builder', data);
export const updateTermsOfServiceDoc = (id: number, data: any) => api.put(`/ai/terms-of-service-builder/${id}`, data);
export const deleteTermsOfServiceDoc = (id: number) => api.delete(`/ai/terms-of-service-builder/${id}`);
export const generateTermsOfService = (data: any) => api.post('/ai/terms-of-service-builder/generate', data);

// AI Tools - Lease Analyzer
export const getLeaseAnalyses = () => api.get('/ai/lease-analyzer');
export const getLeaseAnalysis = (id: number) => api.get(`/ai/lease-analyzer/${id}`);
export const createLeaseAnalysis = (data: any) => api.post('/ai/lease-analyzer', data);
export const updateLeaseAnalysis = (id: number, data: any) => api.put(`/ai/lease-analyzer/${id}`, data);
export const deleteLeaseAnalysis = (id: number) => api.delete(`/ai/lease-analyzer/${id}`);
export const analyzeLease = (data: any) => api.post('/ai/lease-analyzer/analyze', data);

// Helper to download blob as file
export function downloadBlob(blob: Blob, filename: string) {
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  window.URL.revokeObjectURL(url);
  document.body.removeChild(a);
}

export default api;
