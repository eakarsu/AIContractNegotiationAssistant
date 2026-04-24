const express = require('express');
const { PrismaClient } = require('@prisma/client');

const router = express.Router();
const prisma = new PrismaClient();

// Get all parties
router.get('/', async (req, res) => {
  try {
    const parties = await prisma.party.findMany({
      include: {
        _count: { select: { contracts: true, negotiations: true } }
      },
      orderBy: { createdAt: 'desc' }
    });
    res.json(parties);
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
