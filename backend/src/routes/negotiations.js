const express = require('express');
const { PrismaClient } = require('@prisma/client');

const router = express.Router();
const prisma = new PrismaClient();

// Get all negotiations
router.get('/', async (req, res) => {
  try {
    const { status, priority } = req.query;
    const where = {};
    if (status) where.status = status;
    if (priority) where.priority = priority;

    const negotiations = await prisma.negotiation.findMany({
      where,
      include: {
        contract: { select: { id: true, title: true, status: true } },
        party: { select: { id: true, name: true, type: true } },
        user: { select: { id: true, name: true } }
      },
      orderBy: { createdAt: 'desc' }
    });
    res.json(negotiations);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get single negotiation
router.get('/:id', async (req, res) => {
  try {
    const negotiation = await prisma.negotiation.findUnique({
      where: { id: parseInt(req.params.id) },
      include: {
        contract: {
          include: {
            party: true,
            clauses: { include: { clause: true } }
          }
        },
        party: true,
        user: { select: { id: true, name: true, email: true } }
      }
    });
    if (!negotiation) {
      return res.status(404).json({ error: 'Negotiation not found' });
    }
    res.json(negotiation);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create negotiation
router.post('/', async (req, res) => {
  try {
    const negotiation = await prisma.negotiation.create({
      data: req.body,
      include: {
        contract: { select: { id: true, title: true } },
        party: { select: { id: true, name: true } }
      }
    });
    res.status(201).json(negotiation);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Update negotiation
router.put('/:id', async (req, res) => {
  try {
    const negotiation = await prisma.negotiation.update({
      where: { id: parseInt(req.params.id) },
      data: req.body,
      include: {
        contract: { select: { id: true, title: true } },
        party: { select: { id: true, name: true } }
      }
    });
    res.json(negotiation);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Delete negotiation
router.delete('/:id', async (req, res) => {
  try {
    await prisma.negotiation.delete({
      where: { id: parseInt(req.params.id) }
    });
    res.json({ message: 'Negotiation deleted successfully' });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Advance negotiation round
router.post('/:id/advance', async (req, res) => {
  try {
    const negotiation = await prisma.negotiation.update({
      where: { id: parseInt(req.params.id) },
      data: {
        round: { increment: 1 },
        proposedChanges: req.body.proposedChanges,
        counterProposal: req.body.counterProposal,
        notes: req.body.notes
      }
    });
    res.json(negotiation);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

module.exports = router;
