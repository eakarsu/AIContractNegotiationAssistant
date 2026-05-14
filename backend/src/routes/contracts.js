const express = require('express');
const { PrismaClient } = require('@prisma/client');

const router = express.Router();
const prisma = new PrismaClient();

// Get all contracts (with pagination)
router.get('/', async (req, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit) || 20));
    const skip = (page - 1) * limit;
    const { status, contractType, riskLevel, search } = req.query;

    const where = {};
    if (status) where.status = status;
    if (contractType) where.contractType = contractType;
    if (riskLevel) where.riskLevel = riskLevel;
    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { content: { contains: search, mode: 'insensitive' } }
      ];
    }

    const [contracts, total] = await Promise.all([
      prisma.contract.findMany({
        where,
        include: {
          party: true,
          user: { select: { id: true, name: true, email: true } }
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit
      }),
      prisma.contract.count({ where })
    ]);

    res.json({
      data: contracts,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
        hasNextPage: page * limit < total,
        hasPrevPage: page > 1
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get single contract
router.get('/:id', async (req, res) => {
  try {
    const contract = await prisma.contract.findUnique({
      where: { id: parseInt(req.params.id) },
      include: {
        party: true,
        user: { select: { id: true, name: true, email: true } },
        clauses: { include: { clause: true } },
        negotiations: true,
        riskAnalyses: { orderBy: { createdAt: 'desc' } },
        complianceChecks: true,
        redlines: true,
        approvals: true,
        deadlines: true
      }
    });
    if (!contract) {
      return res.status(404).json({ error: 'Contract not found' });
    }
    res.json(contract);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create contract
router.post('/', async (req, res) => {
  try {
    const contract = await prisma.contract.create({
      data: req.body,
      include: { party: true }
    });
    res.status(201).json(contract);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Update contract
router.put('/:id', async (req, res) => {
  try {
    const contract = await prisma.contract.update({
      where: { id: parseInt(req.params.id) },
      data: req.body,
      include: { party: true }
    });
    res.json(contract);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Delete contract
router.delete('/:id', async (req, res) => {
  try {
    await prisma.contract.delete({
      where: { id: parseInt(req.params.id) }
    });
    res.json({ message: 'Contract deleted successfully' });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Add clause to contract
router.post('/:id/clauses', async (req, res) => {
  try {
    const { clauseId, position, customContent } = req.body;
    const contractClause = await prisma.contractClause.create({
      data: {
        contractId: parseInt(req.params.id),
        clauseId: parseInt(clauseId),
        position: position || 0,
        customContent
      },
      include: { clause: true }
    });
    res.status(201).json(contractClause);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

module.exports = router;
