const express = require('express');
const { PrismaClient } = require('@prisma/client');

const router = express.Router();
const prisma = new PrismaClient();

// Get all parties (with pagination)
router.get('/', async (req, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit) || 20));
    const skip = (page - 1) * limit;
    const { type, search } = req.query;

    const where = {};
    if (type) where.type = type;
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } }
      ];
    }

    const [parties, total] = await Promise.all([
      prisma.party.findMany({
        where,
        include: { _count: { select: { contracts: true, negotiations: true } } },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit
      }),
      prisma.party.count({ where })
    ]);

    res.json({
      data: parties,
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

// Get single party
router.get('/:id', async (req, res) => {
  try {
    const party = await prisma.party.findUnique({
      where: { id: parseInt(req.params.id) },
      include: {
        contracts: { select: { id: true, title: true, status: true, value: true } },
        negotiations: { select: { id: true, status: true, round: true } }
      }
    });
    if (!party) {
      return res.status(404).json({ error: 'Party not found' });
    }
    res.json(party);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create party
router.post('/', async (req, res) => {
  try {
    const party = await prisma.party.create({
      data: req.body
    });
    res.status(201).json(party);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Update party
router.put('/:id', async (req, res) => {
  try {
    const party = await prisma.party.update({
      where: { id: parseInt(req.params.id) },
      data: req.body
    });
    res.json(party);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Delete party
router.delete('/:id', async (req, res) => {
  try {
    await prisma.party.delete({
      where: { id: parseInt(req.params.id) }
    });
    res.json({ message: 'Party deleted successfully' });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

module.exports = router;
