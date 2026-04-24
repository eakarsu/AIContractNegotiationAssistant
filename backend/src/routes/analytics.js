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

module.exports = router;
