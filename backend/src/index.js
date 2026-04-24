require('dotenv').config({ path: '../.env' });
const express = require('express');
const cors = require('cors');
const { PrismaClient } = require('@prisma/client');

const authMiddleware = require('./middleware/auth');
const sanitize = require('./middleware/sanitize');

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

// Middleware
app.use(cors());
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

// New AI Tools Routes
app.use('/api/ai/risk-clause-highlighter', authMiddleware, riskClauseHighlighterRoutes);
app.use('/api/ai/standard-terms-comparer', authMiddleware, standardTermsComparerRoutes);
app.use('/api/ai/plain-language-translator', authMiddleware, plainLanguageTranslatorRoutes);
app.use('/api/ai/precedent-finder', authMiddleware, precedentFinderRoutes);
app.use('/api/ai/nda-generator', authMiddleware, ndaGeneratorRoutes);
app.use('/api/ai/terms-of-service-builder', authMiddleware, termsOfServiceBuilderRoutes);
app.use('/api/ai/lease-analyzer', authMiddleware, leaseAnalyzerRoutes);
app.use('/api/ai/compliance-audit-agents', authMiddleware, require('./routes/complianceAuditAgents'));

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

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`API available at http://localhost:${PORT}/api`);
});

module.exports = { app, prisma };
