const express = require('express');
const { PrismaClient } = require('@prisma/client');
const PDFDocument = require('pdfkit');

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

// GET /api/exports/contract-summary/:id — PDF contract summary
router.get('/contract-summary/:id', async (req, res) => {
  try {
    const contract = await prisma.contract.findUnique({
      where: { id: parseInt(req.params.id) },
      include: {
        party: true,
        user: { select: { id: true, name: true, email: true } },
        clauses: { include: { clause: true } },
        negotiations: { orderBy: { createdAt: 'desc' }, take: 5 },
        riskAnalyses: { orderBy: { createdAt: 'desc' }, take: 1 },
        approvals: { orderBy: { createdAt: 'desc' }, take: 5 },
        deadlines: { orderBy: { dueDate: 'asc' }, take: 10 }
      }
    });

    if (!contract) {
      return res.status(404).json({ error: 'Contract not found' });
    }

    const doc = new PDFDocument({ margin: 50, size: 'LETTER' });

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=contract-summary-${contract.id}.pdf`);
    doc.pipe(res);

    // Header
    doc.fontSize(20).font('Helvetica-Bold').text('CONTRACT SUMMARY REPORT', { align: 'center' });
    doc.moveDown(0.5);
    doc.fontSize(10).font('Helvetica').fillColor('#666666')
       .text(`Generated on ${new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}`, { align: 'center' });
    doc.fillColor('#000000');
    doc.moveDown(1);

    // Divider
    doc.moveTo(50, doc.y).lineTo(560, doc.y).stroke('#cccccc');
    doc.moveDown(1);

    // Contract Overview
    doc.fontSize(14).font('Helvetica-Bold').text('CONTRACT OVERVIEW');
    doc.moveDown(0.5);
    doc.fontSize(10).font('Helvetica');

    const details = [
      ['Contract ID', `#${contract.id}`],
      ['Title', contract.title],
      ['Contract Type', contract.contractType || 'N/A'],
      ['Status', (contract.status || 'N/A').toUpperCase()],
      ['Party', contract.party?.name || 'N/A'],
      ['Contract Value', contract.value ? `${contract.currency || 'USD'} ${contract.value.toLocaleString()}` : 'Not specified'],
      ['Risk Level', contract.riskLevel || 'Not assessed'],
      ['Created By', contract.user?.name || 'N/A'],
      ['Created Date', contract.createdAt ? new Date(contract.createdAt).toLocaleDateString() : 'N/A'],
      ['Last Updated', contract.updatedAt ? new Date(contract.updatedAt).toLocaleDateString() : 'N/A']
    ];

    details.forEach(([label, value]) => {
      doc.font('Helvetica-Bold').text(`${label}: `, { continued: true });
      doc.font('Helvetica').text(value || 'N/A');
    });

    doc.moveDown(1);

    // Clauses Section
    if (contract.clauses && contract.clauses.length > 0) {
      doc.moveTo(50, doc.y).lineTo(560, doc.y).stroke('#cccccc');
      doc.moveDown(0.5);
      doc.fontSize(14).font('Helvetica-Bold').text('CONTRACT CLAUSES');
      doc.moveDown(0.5);
      doc.fontSize(10);

      contract.clauses.forEach((cc, idx) => {
        const clause = cc.clause;
        doc.font('Helvetica-Bold').text(`${idx + 1}. ${clause.title || 'Untitled Clause'}`);
        if (clause.category) {
          doc.font('Helvetica').fillColor('#555555').text(`   Category: ${clause.category} | Risk: ${clause.riskLevel || 'N/A'}`);
          doc.fillColor('#000000');
        }
        if (clause.content) {
          doc.font('Helvetica').text(`   ${clause.content.substring(0, 300)}${clause.content.length > 300 ? '...' : ''}`, {
            width: 460, indent: 10
          });
        }
        doc.moveDown(0.5);
      });
    }

    // Negotiations
    if (contract.negotiations && contract.negotiations.length > 0) {
      doc.moveDown(0.5);
      doc.moveTo(50, doc.y).lineTo(560, doc.y).stroke('#cccccc');
      doc.moveDown(0.5);
      doc.fontSize(14).font('Helvetica-Bold').text('RECENT NEGOTIATIONS');
      doc.moveDown(0.5);
      doc.fontSize(10);

      contract.negotiations.forEach(neg => {
        doc.font('Helvetica-Bold').text(`Round ${neg.round || 'N/A'}`, { continued: true });
        doc.font('Helvetica').text(` — Status: ${neg.status || 'N/A'} | Date: ${neg.createdAt ? new Date(neg.createdAt).toLocaleDateString() : 'N/A'}`);
        if (neg.notes) {
          doc.text(`   Notes: ${neg.notes.substring(0, 200)}`, { indent: 10 });
        }
        doc.moveDown(0.3);
      });
    }

    // Deadlines
    if (contract.deadlines && contract.deadlines.length > 0) {
      doc.moveDown(0.5);
      doc.moveTo(50, doc.y).lineTo(560, doc.y).stroke('#cccccc');
      doc.moveDown(0.5);
      doc.fontSize(14).font('Helvetica-Bold').text('UPCOMING DEADLINES');
      doc.moveDown(0.5);
      doc.fontSize(10);

      contract.deadlines.forEach(dl => {
        const dueDate = dl.dueDate ? new Date(dl.dueDate).toLocaleDateString() : 'N/A';
        const isOverdue = dl.dueDate && new Date(dl.dueDate) < new Date() && dl.status === 'pending';
        doc.font('Helvetica-Bold').text(dl.title || 'Untitled', { continued: true });
        doc.font('Helvetica').fillColor(isOverdue ? '#cc0000' : '#000000')
           .text(` — Due: ${dueDate} | Priority: ${dl.priority || 'N/A'} | Status: ${dl.status || 'N/A'}`);
        doc.fillColor('#000000');
        doc.moveDown(0.3);
      });
    }

    // Latest Risk Analysis
    if (contract.riskAnalyses && contract.riskAnalyses.length > 0) {
      const latest = contract.riskAnalyses[0];
      doc.moveDown(0.5);
      doc.moveTo(50, doc.y).lineTo(560, doc.y).stroke('#cccccc');
      doc.moveDown(0.5);
      doc.fontSize(14).font('Helvetica-Bold').text('RISK ANALYSIS (LATEST)');
      doc.moveDown(0.5);
      doc.fontSize(10).font('Helvetica');
      if (latest.summary) {
        doc.text(latest.summary.substring(0, 800) + (latest.summary.length > 800 ? '...' : ''));
      }
    }

    // Footer
    doc.moveDown(2);
    doc.moveTo(50, doc.y).lineTo(560, doc.y).stroke('#cccccc');
    doc.moveDown(0.5);
    doc.fontSize(8).font('Helvetica').fillColor('#888888')
       .text('CONFIDENTIAL — This document is intended for internal use only. Contract Negotiation Assistant', { align: 'center' });

    doc.end();
  } catch (error) {
    if (!res.headersSent) {
      res.status(500).json({ error: error.message });
    }
  }
});

module.exports = router;
