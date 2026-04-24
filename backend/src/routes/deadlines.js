const express = require('express');
const { PrismaClient } = require('@prisma/client');

const router = express.Router();
const prisma = new PrismaClient();

// Get all deadlines
router.get('/', async (req, res) => {
  try {
    const { status, priority } = req.query;
    const where = {};
    if (status) where.status = status;
    if (priority) where.priority = priority;

    const deadlines = await prisma.deadline.findMany({
      where,
      include: {
        contract: { select: { id: true, title: true, status: true } }
      },
      orderBy: { dueDate: 'asc' }
    });
    res.json(deadlines);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get upcoming deadlines
router.get('/upcoming', async (req, res) => {
  try {
    const now = new Date();
    const nextWeek = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

    const deadlines = await prisma.deadline.findMany({
      where: {
        status: 'pending',
        dueDate: {
          gte: now,
          lte: nextWeek
        }
      },
      include: {
        contract: { select: { id: true, title: true, status: true } }
      },
      orderBy: { dueDate: 'asc' }
    });
    res.json(deadlines);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get overdue deadlines
router.get('/overdue', async (req, res) => {
  try {
    const deadlines = await prisma.deadline.findMany({
      where: {
        status: 'pending',
        dueDate: { lt: new Date() }
      },
      include: {
        contract: { select: { id: true, title: true, status: true } }
      },
      orderBy: { dueDate: 'asc' }
    });
    res.json(deadlines);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get single deadline
router.get('/:id', async (req, res) => {
  try {
    const deadline = await prisma.deadline.findUnique({
      where: { id: parseInt(req.params.id) },
      include: {
        contract: {
          include: {
            party: true
          }
        }
      }
    });
    if (!deadline) {
      return res.status(404).json({ error: 'Deadline not found' });
    }
    res.json(deadline);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create deadline
router.post('/', async (req, res) => {
  try {
    const deadline = await prisma.deadline.create({
      data: {
        ...req.body,
        dueDate: new Date(req.body.dueDate),
        reminderDate: req.body.reminderDate ? new Date(req.body.reminderDate) : null
      },
      include: { contract: { select: { id: true, title: true } } }
    });
    res.status(201).json(deadline);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Update deadline
router.put('/:id', async (req, res) => {
  try {
    const updateData = { ...req.body };
    if (req.body.dueDate) updateData.dueDate = new Date(req.body.dueDate);
    if (req.body.reminderDate) updateData.reminderDate = new Date(req.body.reminderDate);

    const deadline = await prisma.deadline.update({
      where: { id: parseInt(req.params.id) },
      data: updateData
    });
    res.json(deadline);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Delete deadline
router.delete('/:id', async (req, res) => {
  try {
    await prisma.deadline.delete({
      where: { id: parseInt(req.params.id) }
    });
    res.json({ message: 'Deadline deleted successfully' });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Complete deadline
router.post('/:id/complete', async (req, res) => {
  try {
    const deadline = await prisma.deadline.update({
      where: { id: parseInt(req.params.id) },
      data: { status: 'completed' }
    });
    res.json(deadline);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

module.exports = router;
