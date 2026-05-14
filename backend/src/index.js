require('dotenv').config({ path: '../.env' });
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const { PrismaClient } = require('@prisma/client');

const authMiddleware = require('./middleware/auth');
const sanitize = require('./middleware/sanitize');
const { aiRateLimiter } = require('./middleware/rateLimiter');

const authRoutes = require('./routes/auth');
const contractRoutes = require('./routes/contracts');
const clauseRoutes = require('./routes/clauses');
const partyRoutes = require('./routes/parties');
const templateRoutes = require('./routes/templates');
const negotiationRoutes = require('./routes/negotiations');
const riskRoutes = require('./routes/risks');
const complianceRoutes = require('./routes/compliance');
const redlineRoutes = require('./routes/redlines');
const approvalRoutes = require('./routes/approvals');
const deadlineRoutes = require('./routes/deadlines');
const chatRoutes = require('./routes/chat');
const analyticsRoutes = require('./routes/analytics');
const exportRoutes = require('./routes/exports');

// New endpoints
const aiNewRoutes = require('./routes/aiNew');
const documentRoutes = require('./routes/documents');

// New AI Tools Routes
const riskClauseHighlighterRoutes = require('./routes/riskClauseHighlighter');
const standardTermsComparerRoutes = require('./routes/standardTermsComparer');
const plainLanguageTranslatorRoutes = require('./routes/plainLanguageTranslator');
const precedentFinderRoutes = require('./routes/precedentFinder');
const ndaGeneratorRoutes = require('./routes/ndaGenerator');
const termsOfServiceBuilderRoutes = require('./routes/termsOfServiceBuilder');
const leaseAnalyzerRoutes = require('./routes/leaseAnalyzer');

const app = express();
const prisma = new PrismaClient();
const PORT = process.env.PORT || 5001;

// Middleware - security headers
app.use(helmet({
  contentSecurityPolicy: false,
  crossOriginResourcePolicy: { policy: 'cross-origin' }
}));

// Env-driven CORS
const corsOrigins = (process.env.CORS_ORIGINS || process.env.FRONTEND_URL || 'http://localhost:5173')
  .split(',').map(o => o.trim()).filter(Boolean);
app.use(cors({
  origin: (origin, cb) => {
    if (!origin) return cb(null, true);
    if (corsOrigins.includes('*') || corsOrigins.includes(origin)) return cb(null, true);
    return cb(new Error(`CORS blocked: ${origin}`));
  },
  credentials: true
}));

app.use(express.json({ limit: '50mb' }));
app.use(sanitize);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', message: 'Contract Negotiation API is running' });
});

// Auth routes (no auth middleware needed)
app.use('/api/auth', authRoutes);

// Protected routes
app.use('/api/contracts', authMiddleware, contractRoutes);
app.use('/api/clauses', authMiddleware, clauseRoutes);
app.use('/api/parties', authMiddleware, partyRoutes);
app.use('/api/templates', authMiddleware, templateRoutes);
app.use('/api/negotiations', authMiddleware, negotiationRoutes);
app.use('/api/risks', authMiddleware, riskRoutes);
app.use('/api/compliance', authMiddleware, complianceRoutes);
app.use('/api/redlines', authMiddleware, redlineRoutes);
app.use('/api/approvals', authMiddleware, approvalRoutes);
app.use('/api/deadlines', authMiddleware, deadlineRoutes);
app.use('/api/chat', authMiddleware, chatRoutes);
app.use('/api/analytics', authMiddleware, analyticsRoutes);
app.use('/api/exports', authMiddleware, exportRoutes);

// New AI Tools Routes (rate limited)
app.use('/api/ai/risk-clause-highlighter', authMiddleware, aiRateLimiter, riskClauseHighlighterRoutes);
app.use('/api/ai/standard-terms-comparer', authMiddleware, aiRateLimiter, standardTermsComparerRoutes);
app.use('/api/ai/plain-language-translator', authMiddleware, aiRateLimiter, plainLanguageTranslatorRoutes);
app.use('/api/ai/precedent-finder', authMiddleware, aiRateLimiter, precedentFinderRoutes);
app.use('/api/ai/nda-generator', authMiddleware, aiRateLimiter, ndaGeneratorRoutes);
app.use('/api/ai/terms-of-service-builder', authMiddleware, aiRateLimiter, termsOfServiceBuilderRoutes);
app.use('/api/ai/lease-analyzer', authMiddleware, aiRateLimiter, leaseAnalyzerRoutes);
app.use('/api/ai/compliance-audit-agents', authMiddleware, aiRateLimiter, require('./routes/complianceAuditAgents'));

// New AI endpoints
app.use('/api/ai', authMiddleware, aiNewRoutes);





app.use('/api/ai', require('./routes/precedentScale'));
app.use('/api/ai', require('./routes/playbookGenerate'));
app.use('/api/ai', require('./routes/marketBenchmark'));
app.use('/api/ai', require('./routes/regulatoryAlerts'));
app.use('/api/ai', require('./routes/agenticModeling'));
app.use('/api/documents', authMiddleware, documentRoutes);

// 8 new custom non-CRUD AI features (audit-driven)
app.use('/api/ai', authMiddleware, require('./routes/aiCustom'));

// Dashboard stats
app.get('/api/dashboard/stats', authMiddleware, async (req, res) => {
  try {
    const [
      totalContracts,
      activeNegotiations,
      pendingApprovals,
      upcomingDeadlines,
      highRiskContracts,
      totalParties
    ] = await Promise.all([
      prisma.contract.count(),
      prisma.negotiation.count({ where: { status: 'in_progress' } }),
      prisma.approval.count({ where: { status: 'pending' } }),
      prisma.deadline.count({
        where: {
          status: 'pending',
          dueDate: { gte: new Date() }
        }
      }),
      prisma.contract.count({ where: { riskLevel: 'high' } }),
      prisma.party.count()
    ]);

    res.json({
      totalContracts,
      activeNegotiations,
      pendingApprovals,
      upcomingDeadlines,
      highRiskContracts,
      totalParties
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Something went wrong!' });
});

// // === Batch 02 Gaps & Frontend Mounts ===
app.use('/api/gap-all-specialized-analyzers-leaseanalyzer-plainlanguagetransla', require('./routes/gap_all_specialized_analyzers_leaseanalyzer_plainlanguagetransla'));

// // === Batch 02 Gaps & Frontend Mounts ===
app.use('/api/gap-no-git-style-version-control-or-track-changes-ui-integration', require('./routes/gap_no_git_style_version_control_or_track_changes_ui_integration'));

// // === Batch 02 Gaps & Frontend Mounts ===
app.use('/api/gap-no-e-signature-workflow-integration-docusign-hellosign', require('./routes/gap_no_e_signature_workflow_integration_docusign_hellosign'));

// // === Batch 02 Gaps & Frontend Mounts ===
app.use('/api/gap-no-integration-with-legal-research-apis-westlaw-lexisnexis', require('./routes/gap_no_integration_with_legal_research_apis_westlaw_lexisnexis'));

// // === Batch 02 Gaps & Frontend Mounts ===
app.use('/api/gap-no-deal-room-data-room-management-for-due-diligence', require('./routes/gap_no_deal_room_data_room_management_for_due_diligence'));

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`API available at http://localhost:${PORT}/api`);
});

module.exports = { app, prisma };
