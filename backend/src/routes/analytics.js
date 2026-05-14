const express = require('express');
const { PrismaClient } = require('@prisma/client');

const router = express.Router();
const prisma = new PrismaClient();

// Get all analytics
router.get('/', async (req, res) => {
  try {
    const { category, period } = req.query;
    const where = {};
    if (category) where.category = category;
    if (period) where.period = period;

    const analytics = await prisma.analytics.findMany({
      where,
      orderBy: { recordedAt: 'desc' }
    });
    res.json(analytics);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get single analytics record
router.get('/:id', async (req, res) => {
  try {
    const record = await prisma.analytics.findUnique({
      where: { id: parseInt(req.params.id) }
    });
    if (!record) {
      return res.status(404).json({ error: 'Analytics record not found' });
    }
    res.json(record);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create analytics record
router.post('/', async (req, res) => {
  try {
    const record = await prisma.analytics.create({
      data: req.body
    });
    res.status(201).json(record);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Update analytics record
router.put('/:id', async (req, res) => {
  try {
    const record = await prisma.analytics.update({
      where: { id: parseInt(req.params.id) },
      data: req.body
    });
    res.json(record);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Delete analytics record
router.delete('/:id', async (req, res) => {
  try {
    await prisma.analytics.delete({
      where: { id: parseInt(req.params.id) }
    });
    res.json({ message: 'Analytics record deleted successfully' });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Get dashboard analytics
router.get('/dashboard/summary', async (req, res) => {
  try {
    // Contract statistics
    const contractsByStatus = await prisma.contract.groupBy({
      by: ['status'],
      _count: { id: true }
    });

    const contractsByType = await prisma.contract.groupBy({
      by: ['contractType'],
      _count: { id: true }
    });

    const contractsByRisk = await prisma.contract.groupBy({
      by: ['riskLevel'],
      _count: { id: true }
    });

    // Total contract value
    const totalValue = await prisma.contract.aggregate({
      _sum: { value: true }
    });

    // Negotiation statistics
    const negotiationsByStatus = await prisma.negotiation.groupBy({
      by: ['status'],
      _count: { id: true }
    });

    // Approval statistics
    const approvalsByStatus = await prisma.approval.groupBy({
      by: ['status'],
      _count: { id: true }
    });

    // Recent activity
    const recentContracts = await prisma.contract.findMany({
      take: 5,
      orderBy: { createdAt: 'desc' },
      select: { id: true, title: true, status: true, createdAt: true }
    });

    // Deadline statistics
    const upcomingDeadlines = await prisma.deadline.count({
      where: {
        status: 'pending',
        dueDate: { gte: new Date() }
      }
    });

    const overdueDeadlines = await prisma.deadline.count({
      where: {
        status: 'pending',
        dueDate: { lt: new Date() }
      }
    });

    res.json({
      contracts: {
        byStatus: contractsByStatus,
        byType: contractsByType,
        byRisk: contractsByRisk,
        totalValue: totalValue._sum.value || 0
      },
      negotiations: {
        byStatus: negotiationsByStatus
      },
      approvals: {
        byStatus: approvalsByStatus
      },
      deadlines: {
        upcoming: upcomingDeadlines,
        overdue: overdueDeadlines
      },
      recentContracts
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get monthly trends
router.get('/trends/monthly', async (req, res) => {
  try {
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

    const contracts = await prisma.contract.findMany({
      where: { createdAt: { gte: sixMonthsAgo } },
      select: { createdAt: true, value: true, status: true }
    });

    const monthlyData = {};
    contracts.forEach(c => {
      const month = c.createdAt.toISOString().substring(0, 7);
      if (!monthlyData[month]) {
        monthlyData[month] = { count: 0, value: 0 };
      }
      monthlyData[month].count++;
      monthlyData[month].value += c.value || 0;
    });

    res.json(monthlyData);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/analytics/negotiation-trends — Win rate by contract type, avg concession value, time-to-close
router.get('/negotiation-trends', async (req, res) => {
  try {
    const { period } = req.query; // 'month', 'quarter', 'year'
    const periodDays = period === 'year' ? 365 : period === 'quarter' ? 90 : 30;
    const since = new Date();
    since.setDate(since.getDate() - periodDays);

    // Win rate by contract type (closed/executed contracts vs total)
    const allByType = await prisma.contract.groupBy({
      by: ['contractType'],
      where: { createdAt: { gte: since } },
      _count: { id: true }
    });

    const wonByType = await prisma.contract.groupBy({
      by: ['contractType'],
      where: { createdAt: { gte: since }, status: { in: ['executed', 'signed', 'closed'] } },
      _count: { id: true }
    });

    const wonMap = {};
    wonByType.forEach(r => { wonMap[r.contractType] = r._count.id; });

    const winRateByType = allByType.map(r => ({
      contractType: r.contractType,
      total: r._count.id,
      won: wonMap[r.contractType] || 0,
      winRate: r._count.id > 0 ? Math.round(((wonMap[r.contractType] || 0) / r._count.id) * 100) : 0
    }));

    // Average negotiation rounds (proxy for time-to-close)
    const negotiations = await prisma.negotiation.findMany({
      where: { createdAt: { gte: since } },
      select: { round: true, status: true, createdAt: true, updatedAt: true }
    });

    const completedNegotiations = negotiations.filter(n => n.status === 'completed' || n.status === 'closed');
    const avgRounds = completedNegotiations.length > 0
      ? Math.round(completedNegotiations.reduce((sum, n) => sum + (n.round || 1), 0) / completedNegotiations.length * 10) / 10
      : 0;

    // Average time-to-close in days
    const avgTimeToClose = completedNegotiations.length > 0
      ? Math.round(completedNegotiations.reduce((sum, n) => {
          const diff = new Date(n.updatedAt) - new Date(n.createdAt);
          return sum + diff / (1000 * 60 * 60 * 24);
        }, 0) / completedNegotiations.length)
      : 0;

    // Contracts by value range (proxy for concession analysis)
    const contractValues = await prisma.contract.findMany({
      where: { createdAt: { gte: since }, value: { not: null } },
      select: { value: true, contractType: true }
    });

    const avgValueByType = {};
    contractValues.forEach(c => {
      if (!avgValueByType[c.contractType]) avgValueByType[c.contractType] = { sum: 0, count: 0 };
      avgValueByType[c.contractType].sum += c.value || 0;
      avgValueByType[c.contractType].count++;
    });

    const avgConcessionValueByType = Object.entries(avgValueByType).map(([type, data]) => ({
      contractType: type,
      avgContractValue: data.count > 0 ? Math.round(data.sum / data.count) : 0,
      sampleSize: data.count
    }));

    res.json({
      period: `Last ${periodDays} days`,
      winRateByContractType: winRateByType,
      negotiationEfficiency: {
        avgRoundsToClose: avgRounds,
        avgDaysToClose: avgTimeToClose,
        completedNegotiations: completedNegotiations.length
      },
      avgContractValueByType: avgConcessionValueByType
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/analytics/risk-distribution — Contracts by risk level
router.get('/risk-distribution', async (req, res) => {
  try {
    const { period } = req.query;
    const periodDays = period === 'year' ? 365 : period === 'quarter' ? 90 : 30;
    const since = new Date();
    since.setDate(since.getDate() - periodDays);

    const riskByLevel = await prisma.contract.groupBy({
      by: ['riskLevel'],
      where: { createdAt: { gte: since } },
      _count: { id: true },
      _sum: { value: true }
    });

    const riskByTypeAndLevel = await prisma.contract.groupBy({
      by: ['contractType', 'riskLevel'],
      where: { createdAt: { gte: since } },
      _count: { id: true }
    });

    const totalContracts = riskByLevel.reduce((sum, r) => sum + r._count.id, 0);

    const distribution = riskByLevel.map(r => ({
      riskLevel: r.riskLevel || 'unassessed',
      count: r._count.id,
      percentage: totalContracts > 0 ? Math.round((r._count.id / totalContracts) * 100) : 0,
      totalValue: r._sum.value || 0
    })).sort((a, b) => {
      const order = { high: 0, medium: 1, low: 2, unassessed: 3 };
      return (order[a.riskLevel] ?? 4) - (order[b.riskLevel] ?? 4);
    });

    // Group by contract type and risk
    const byTypeAndRisk = {};
    riskByTypeAndLevel.forEach(r => {
      const type = r.contractType || 'unknown';
      if (!byTypeAndRisk[type]) byTypeAndRisk[type] = {};
      byTypeAndRisk[type][r.riskLevel || 'unassessed'] = r._count.id;
    });

    // High-risk contracts for immediate attention
    const highRiskContracts = await prisma.contract.findMany({
      where: { riskLevel: 'high', createdAt: { gte: since } },
      select: { id: true, title: true, contractType: true, status: true, value: true, createdAt: true },
      orderBy: { createdAt: 'desc' },
      take: 10
    });

    res.json({
      period: `Last ${periodDays} days`,
      totalContracts,
      distribution,
      byContractTypeAndRisk: byTypeAndRisk,
      highRiskContractsRequiringAttention: highRiskContracts
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
