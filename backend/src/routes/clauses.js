const express = require('express');
const { PrismaClient } = require('@prisma/client');

const router = express.Router();
const prisma = new PrismaClient();

// Get all clauses
router.get('/', async (req, res) => {
  try {
    const { category, riskLevel } = req.query;
    const where = {};
    if (category) where.category = category;
    if (riskLevel) where.riskLevel = riskLevel;

    const clauses = await prisma.clause.findMany({
      where,
      orderBy: { createdAt: 'desc' }
    });
    res.json(clauses);
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
