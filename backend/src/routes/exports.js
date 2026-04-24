const express = require('express');
const { PrismaClient } = require('@prisma/client');

const router = express.Router();
const prisma = new PrismaClient();

function toCsv(data, columns) {
  const header = columns.map(c => c.label).join(',');
  const rows = data.map(row =>
    columns.map(c => {
      let val = c.accessor(row);
      if (val === null || val === undefined) val = '';
      val = String(val).replace(/"/g, '""');
      if (val.includes(',') || val.includes('"') || val.includes('\n')) val = `"${val}"`;
      return val;
    }).join(',')
  );
  return [header, ...rows].join('\n');
}

// Contracts CSV
router.get('/contracts', async (req, res) => {
  try {
    const data = await prisma.contract.findMany({ include: { party: true }, orderBy: { createdAt: 'desc' } });
    const csv = toCsv(data, [
      { label: 'ID', accessor: r => r.id },
      { label: 'Title', accessor: r => r.title },
      { label: 'Type', accessor: r => r.contractType },
      { label: 'Status', accessor: r => r.status },
      { label: 'Party', accessor: r => r.party?.name },
      { label: 'Value', accessor: r => r.value },
      { label: 'Risk Level', accessor: r => r.riskLevel },
      { label: 'Created', accessor: r => r.createdAt?.toISOString()?.split('T')[0] },
    ]);
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename=contracts.csv');
    res.send(csv);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Clauses CSV
router.get('/clauses', async (req, res) => {
  try {
    const data = await prisma.clause.findMany({ orderBy: { createdAt: 'desc' } });
    const csv = toCsv(data, [
      { label: 'ID', accessor: r => r.id },
      { label: 'Title', accessor: r => r.title },
      { label: 'Category', accessor: r => r.category },
      { label: 'Type', accessor: r => r.type },
      { label: 'Risk Level', accessor: r => r.riskLevel },
      { label: 'Created', accessor: r => r.createdAt?.toISOString()?.split('T')[0] },
    ]);
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename=clauses.csv');
    res.send(csv);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Parties CSV
router.get('/parties', async (req, res) => {
  try {
    const data = await prisma.party.findMany({ orderBy: { createdAt: 'desc' } });
    const csv = toCsv(data, [
      { label: 'ID', accessor: r => r.id },
      { label: 'Name', accessor: r => r.name },
      { label: 'Type', accessor: r => r.type },
      { label: 'Email', accessor: r => r.email },
      { label: 'Phone', accessor: r => r.phone },
      { label: 'Created', accessor: r => r.createdAt?.toISOString()?.split('T')[0] },
    ]);
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename=parties.csv');
    res.send(csv);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Negotiations CSV
router.get('/negotiations', async (req, res) => {
  try {
    const data = await prisma.negotiation.findMany({ include: { contract: true }, orderBy: { createdAt: 'desc' } });
    const csv = toCsv(data, [
      { label: 'ID', accessor: r => r.id },
      { label: 'Contract', accessor: r => r.contract?.title },
      { label: 'Round', accessor: r => r.round },
      { label: 'Status', accessor: r => r.status },
      { label: 'Created', accessor: r => r.createdAt?.toISOString()?.split('T')[0] },
    ]);
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename=negotiations.csv');
    res.send(csv);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Deadlines CSV
router.get('/deadlines', async (req, res) => {
  try {
    const data = await prisma.deadline.findMany({ include: { contract: true }, orderBy: { dueDate: 'asc' } });
    const csv = toCsv(data, [
      { label: 'ID', accessor: r => r.id },
      { label: 'Title', accessor: r => r.title },
      { label: 'Contract', accessor: r => r.contract?.title },
      { label: 'Due Date', accessor: r => r.dueDate?.toISOString()?.split('T')[0] },
      { label: 'Priority', accessor: r => r.priority },
      { label: 'Status', accessor: r => r.status },
    ]);
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename=deadlines.csv');
    res.send(csv);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
