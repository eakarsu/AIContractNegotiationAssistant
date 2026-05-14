const express = require('express');
const { PrismaClient } = require('@prisma/client');

const router = express.Router();
const prisma = new PrismaClient();

// Get all clauses (with pagination)
router.get('/', async (req, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit) || 20));
    const skip = (page - 1) * limit;
    const { category, riskLevel, search } = req.query;

    const where = {};
    if (category) where.category = category;
    if (riskLevel) where.riskLevel = riskLevel;
    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { content: { contains: search, mode: 'insensitive' } }
      ];
    }

    const [clauses, total] = await Promise.all([
      prisma.clause.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit
      }),
      prisma.clause.count({ where })
    ]);

    res.json({
      data: clauses,
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

// Get single clause
router.get('/:id', async (req, res) => {
  try {
    const clause = await prisma.clause.findUnique({
      where: { id: parseInt(req.params.id) },
      include: {
        contracts: {
          include: {
            contract: { select: { id: true, title: true } }
          }
        }
      }
    });
    if (!clause) {
      return res.status(404).json({ error: 'Clause not found' });
    }
    res.json(clause);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create clause
router.post('/', async (req, res) => {
  try {
    const clause = await prisma.clause.create({
      data: req.body
    });
    res.status(201).json(clause);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Update clause
router.put('/:id', async (req, res) => {
  try {
    const clause = await prisma.clause.update({
      where: { id: parseInt(req.params.id) },
      data: req.body
    });
    res.json(clause);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Delete clause
router.delete('/:id', async (req, res) => {
  try {
    await prisma.clause.delete({
      where: { id: parseInt(req.params.id) }
    });
    res.json({ message: 'Clause deleted successfully' });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Get clause categories
router.get('/meta/categories', async (req, res) => {
  try {
    const categories = await prisma.clause.findMany({
      select: { category: true },
      distinct: ['category']
    });
    res.json(categories.map(c => c.category));
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
