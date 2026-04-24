export interface User {
  id: number;
  email: string;
  name: string;
  role: string;
}

export interface Party {
  id: number;
  name: string;
  type: string;
  email?: string;
  phone?: string;
  address?: string;
  industry?: string;
  riskRating?: string;
  notes?: string;
  _count?: { contracts: number; negotiations: number };
}

export interface Contract {
  id: number;
  title: string;
  description?: string;
  content: string;
  status: string;
  contractType: string;
  value?: number;
  currency: string;
  startDate?: string;
  endDate?: string;
  riskLevel?: string;
  riskScore?: number;
  party?: Party;
  user?: User;
  clauses?: ContractClause[];
  negotiations?: Negotiation[];
  riskAnalyses?: RiskAnalysis[];
  complianceChecks?: ComplianceCheck[];
  redlines?: Redline[];
  approvals?: Approval[];
  deadlines?: Deadline[];
}

export interface Clause {
  id: number;
  title: string;
  content: string;
  category: string;
  riskLevel?: string;
  isStandard: boolean;
  language: string;
  jurisdiction?: string;
  contracts?: ContractClause[];
}

export interface ContractClause {
  id: number;
  contractId: number;
  clauseId: number;
  position: number;
  customContent?: string;
  clause: Clause;
  contract?: Contract;
}

export interface Template {
  id: number;
  name: string;
  description?: string;
  content: string;
  category: string;
  industry?: string;
  jurisdiction?: string;
  isActive: boolean;
  version: string;
}

export interface Negotiation {
  id: number;
  contractId: number;
  partyId?: number;
  status: string;
  round: number;
  proposedChanges?: string;
  counterProposal?: string;
  notes?: string;
  priority: string;
  dueDate?: string;
  contract?: Contract;
  party?: Party;
  user?: User;
}

export interface RiskAnalysis {
  id: number;
  contractId: number;
  overallScore: number;
  category: string;
  findings: string;
  recommendations?: string;
  financialRisk?: number;
  legalRisk?: number;
  operationalRisk?: number;
  reputationalRisk?: number;
  aiAnalysis?: string;
  contract?: Contract;
}

export interface ComplianceCheck {
  id: number;
  contractId: number;
  regulation: string;
  status: string;
  findings?: string;
  requirements?: string;
  aiAnalysis?: string;
  checkedAt?: string;
  contract?: Contract;
}

export interface Redline {
  id: number;
  contractId: number;
  originalText: string;
  proposedText: string;
  section?: string;
  status: string;
  author?: string;
  reason?: string;
  contract?: Contract;
}

export interface Approval {
  id: number;
  contractId: number;
  userId?: number;
  approverName: string;
  approverRole: string;
  status: string;
  comments?: string;
  approvedAt?: string;
  dueDate?: string;
  contract?: Contract;
  user?: User;
}

export interface Deadline {
  id: number;
  contractId: number;
  title: string;
  description?: string;
  dueDate: string;
  reminderDate?: string;
  status: string;
  priority: string;
  contract?: Contract;
}

export interface ChatMessage {
  id?: number;
  sessionId: string;
  role: 'user' | 'assistant';
  content: string;
  context?: string;
  createdAt?: string;
}

export interface Analytics {
  id: number;
  metricName: string;
  metricValue: number;
  category: string;
  period: string;
  details?: string;
  recordedAt: string;
}

export interface DashboardStats {
  totalContracts: number;
  activeNegotiations: number;
  pendingApprovals: number;
  upcomingDeadlines: number;
  highRiskContracts: number;
  totalParties: number;
}
