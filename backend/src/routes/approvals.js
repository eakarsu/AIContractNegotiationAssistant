const express = require('express');
const { PrismaClient } = require('@prisma/client');

const router = express.Router();
const prisma = new PrismaClient();

// Get all approvals
router.get('/', async (req, res) => {
  try {
    const { status } = req.query;
    const where = {};
    if (status) where.status = status;

    const approvals = await prisma.approval.findMany({
      where,
      include: {
        contract: { select: { id: true, title: true, status: true, value: true } },
        user: { select: { id: true, name: true, email: true } }
      },
      orderBy: { createdAt: 'desc' }
    });
    res.json(approvals);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get single approval
router.get('/:id', async (req, res) => {
  try {
    const approval = await prisma.approval.findUnique({
      where: { id: parseInt(req.params.id) },
      include: {
        contract: {
          include: {
            party: true,
            clauses: { include: { clause: true } },
            riskAnalyses: { take: 1, orderBy: { createdAt: 'desc' } }
          }
        },
        user: { select: { id: true, name: true, email: true, role: true } }
      }
    });
    if (!approval) {
      return res.status(404).json({ error: 'Approval not found' });
    }
    res.json(approval);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create approval
router.post('/', async (req, res) => {
  try {
    const approval = await prisma.approval.create({
      data: req.body,
      include: {
        contract: { select: { id: true, title: true } },
        user: { select: { id: true, name: true } }
      }
    });
    res.status(201).json(approval);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Update approval
router.put('/:id', async (req, res) => {
  try {
    const approval = await prisma.approval.update({
      where: { id: parseInt(req.params.id) },
      data: req.body
    });
    res.json(approval);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Delete approval
router.delete('/:id', async (req, res) => {
  try {
    await prisma.approval.delete({
      where: { id: parseInt(req.params.id) }
    });
    res.json({ message: 'Approval deleted successfully' });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Approve
router.post('/:id/approve', async (req, res) => {
  try {
    const approval = await prisma.approval.update({
      where: { id: parseInt(req.params.id) },
      data: {
        status: 'approved',
        approvedAt: new Date(),
        comments: req.body.comments
      },
      include: { contract: true }
    });

    // Check if all approvals for this contract are approved
    const pendingApprovals = await prisma.approval.count({
      where: {
        contractId: approval.contractId,
        status: 'pending'
      }
    });

    if (pendingApprovals === 0) {
      await prisma.contract.update({
        where: { id: approval.contractId },
        data: { status: 'approved' }
      });
    }

    res.json(approval);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Reject
router.post('/:id/reject', async (req, res) => {
  try {
    const approval = await prisma.approval.update({
      where: { id: parseInt(req.params.id) },
      data: {
        status: 'rejected',
        approvedAt: new Date(),
        comments: req.body.comments || req.body.reason
      },
      include: { contract: true }
    });

    // Update contract status to rejected
    await prisma.contract.update({
      where: { id: approval.contractId },
      data: { status: 'rejected' }
    });

    res.json(approval);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Request revision
router.post('/:id/revision', async (req, res) => {
  try {
    const approval = await prisma.approval.update({
      where: { id: parseInt(req.params.id) },
      data: {
        status: 'revision_requested',
        comments: req.body.comments
      }
    });

    await prisma.contract.update({
      where: { id: approval.contractId },
      data: { status: 'revision_requested' }
    });

    res.json(approval);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

module.exports = router;
