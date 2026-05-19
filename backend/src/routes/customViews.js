/**
 * Custom Views endpoints for AIContractNegotiationAssistant.
 *  1. GET  /clause-diff         Returns two clause versions for split diff
 *  2. GET  /negotiation-timeline Returns chronological contract revisions
 *  3. GET  /contracts-list      Lightweight list for PDF picker
 *  4. POST /redline-pdf         Stream PDF redline with track-changes annotations
 *  5. GET  /clause-library      List standard clauses
 *  6. POST /clause-library      Create standard clause
 *  7. PUT  /clause-library/:id  Update clause
 *  8. DELETE /clause-library/:id Delete clause
 *
 * Although there are sub-endpoints, the mount point exposes four primary
 * resource groups: clause-diff, negotiation-timeline, redline-pdf, clause-library.
 */

const express = require('express');
const PDFDocument = require('pdfkit');
const router = express.Router();

// ----------------------------------------------------------------------------
// In-memory clause library (seeded). Persists across requests within a process.
// ----------------------------------------------------------------------------
let clauseLibrary = [
  {
    id: 1,
    category: 'Confidentiality',
    text: 'Each party shall hold in strict confidence all proprietary information disclosed by the other party for a period of five (5) years from the date of disclosure.',
    risk_score: 2,
  },
  {
    id: 2,
    category: 'Indemnification',
    text: 'The Supplier shall indemnify and hold harmless the Buyer from any third-party claims arising out of the Supplier\'s negligence or willful misconduct.',
    risk_score: 7,
  },
  {
    id: 3,
    category: 'Limitation of Liability',
    text: 'In no event shall either party\'s aggregate liability exceed the total fees paid under this Agreement during the twelve (12) months preceding the claim.',
    risk_score: 5,
  },
  {
    id: 4,
    category: 'Termination',
    text: 'Either party may terminate this Agreement for convenience upon thirty (30) days written notice to the other party.',
    risk_score: 3,
  },
  {
    id: 5,
    category: 'Governing Law',
    text: 'This Agreement shall be governed by and construed under the laws of the State of Delaware, without regard to its conflict-of-laws principles.',
    risk_score: 1,
  },
  {
    id: 6,
    category: 'Payment Terms',
    text: 'Customer shall pay all invoices within thirty (30) days of receipt. Late payments accrue interest at 1.5% per month.',
    risk_score: 4,
  },
  {
    id: 7,
    category: 'Intellectual Property',
    text: 'All pre-existing intellectual property remains the exclusive property of the disclosing party. Work product created under this Agreement is owned by the Customer.',
    risk_score: 6,
  },
  {
    id: 8,
    category: 'Force Majeure',
    text: 'Neither party shall be liable for any failure or delay in performance caused by events beyond its reasonable control, including acts of God, war, terrorism, or pandemic.',
    risk_score: 2,
  },
];
let clauseNextId = clauseLibrary.length + 1;

// ----------------------------------------------------------------------------
// Sample clause diff data
// ----------------------------------------------------------------------------
const clauseDiffSample = {
  clause_title: 'Limitation of Liability',
  original: [
    { line: 1, text: 'In no event shall either party be liable for indirect, incidental,' },
    { line: 2, text: 'special, or consequential damages arising out of this Agreement.' },
    { line: 3, text: 'Total aggregate liability shall not exceed the fees paid in the' },
    { line: 4, text: 'twelve (12) months preceding the claim.' },
    { line: 5, text: 'This limitation applies regardless of the form of action.' },
  ],
  counterparty: [
    { line: 1, text: 'In no event shall either party be liable for indirect, incidental,' },
    { line: 2, text: 'special, consequential, or punitive damages arising out of this Agreement.' },
    { line: 3, text: 'Total aggregate liability shall not exceed three (3) times the fees paid in the' },
    { line: 4, text: 'twenty-four (24) months preceding the claim.' },
    { line: 5, text: 'This limitation shall not apply to breaches of confidentiality or IP indemnification.' },
  ],
  changes: [
    { line: 2, type: 'modified', summary: 'Added "punitive" damages exclusion' },
    { line: 3, type: 'modified', summary: 'Liability cap raised from 1x to 3x fees' },
    { line: 4, type: 'modified', summary: 'Lookback period extended from 12 to 24 months' },
    { line: 5, type: 'modified', summary: 'Carve-outs added for confidentiality and IP' },
  ],
};

// 1. Clause Diff Viewer
router.get('/clause-diff', (req, res) => {
  res.json(clauseDiffSample);
});

// 2. Negotiation Timeline
router.get('/negotiation-timeline', (req, res) => {
  const revisions = [
    { id: 1, version: 'v0.1 Draft',       date: '2026-01-08', day: 0,   author: 'Internal Counsel', changes: 12, status: 'draft' },
    { id: 2, version: 'v0.2 Internal',    date: '2026-01-15', day: 7,   author: 'Internal Counsel', changes: 8,  status: 'internal_review' },
    { id: 3, version: 'v1.0 Sent',        date: '2026-01-22', day: 14,  author: 'Internal Counsel', changes: 0,  status: 'sent' },
    { id: 4, version: 'v1.1 Markup',      date: '2026-02-03', day: 26,  author: 'Counterparty',     changes: 24, status: 'received' },
    { id: 5, version: 'v1.2 Response',    date: '2026-02-10', day: 33,  author: 'Internal Counsel', changes: 15, status: 'counter' },
    { id: 6, version: 'v1.3 Markup 2',    date: '2026-02-20', day: 43,  author: 'Counterparty',     changes: 9,  status: 'received' },
    { id: 7, version: 'v1.4 Near-Final',  date: '2026-03-01', day: 52,  author: 'Internal Counsel', changes: 4,  status: 'counter' },
    { id: 8, version: 'v2.0 Executed',    date: '2026-03-08', day: 59,  author: 'Both Parties',     changes: 0,  status: 'executed' },
  ];
  res.json({ contract: 'Master Services Agreement - Acme Corp', revisions });
});

// 3. Contracts list (for PDF picker)
router.get('/contracts-list', (req, res) => {
  res.json([
    { id: 'msa-001', title: 'Master Services Agreement - Acme Corp', value: 250000, status: 'in_negotiation' },
    { id: 'nda-014', title: 'Mutual NDA - Globex Inc',                value: 0,      status: 'executed' },
    { id: 'lic-009', title: 'Software License - Initech',             value: 84000,  status: 'in_negotiation' },
    { id: 'sla-022', title: 'SLA Amendment - Umbrella Co',            value: 36000,  status: 'draft' },
    { id: 'epa-031', title: 'Enterprise Purchase Agreement - Stark',  value: 1250000, status: 'in_negotiation' },
  ]);
});

// 4. Redline PDF Export
router.post('/redline-pdf', (req, res) => {
  const { contract_id, contract_title } = req.body || {};

  const doc = new PDFDocument({ size: 'LETTER', margin: 56 });
  const fname = `redline_${(contract_id || 'contract')}.pdf`;
  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `attachment; filename="${fname}"`);
  doc.pipe(res);

  // Header
  doc.fontSize(20).fillColor('#111827').text('Redline Contract Export', { align: 'left' });
  doc.moveDown(0.25);
  doc.fontSize(11).fillColor('#6B7280').text(`Contract: ${contract_title || contract_id || 'Untitled'}`);
  doc.fontSize(10).fillColor('#9CA3AF').text(`Generated: ${new Date().toISOString()}`);
  doc.moveDown(1);
  doc.moveTo(56, doc.y).lineTo(556, doc.y).strokeColor('#E5E7EB').stroke();
  doc.moveDown(1);

  // Section: Track-changes annotations
  doc.fontSize(14).fillColor('#111827').text('Track Changes', { underline: true });
  doc.moveDown(0.5);

  const changes = [
    { clause: 'Limitation of Liability', op: 'modified',
      before: 'liability shall not exceed the fees paid in the twelve (12) months preceding the claim.',
      after:  'liability shall not exceed three (3) times the fees paid in the twenty-four (24) months preceding the claim.' },
    { clause: 'Indemnification', op: 'added',
      before: '',
      after:  'Supplier shall additionally indemnify Buyer for any data-breach related claims regardless of cause.' },
    { clause: 'Auto-Renewal', op: 'deleted',
      before: 'This Agreement shall automatically renew for successive one-year terms unless either party provides ninety (90) days notice.',
      after:  '' },
    { clause: 'Governing Law', op: 'modified',
      before: 'Laws of the State of Delaware.',
      after:  'Laws of the State of New York.' },
  ];

  changes.forEach((c, idx) => {
    doc.fontSize(12).fillColor('#1F2937').text(`${idx + 1}. ${c.clause}  [${c.op.toUpperCase()}]`);
    doc.moveDown(0.2);
    if (c.before) {
      doc.fontSize(10).fillColor('#DC2626').text(`- ${c.before}`, { indent: 18 });
    }
    if (c.after) {
      doc.fontSize(10).fillColor('#16A34A').text(`+ ${c.after}`, { indent: 18 });
    }
    doc.moveDown(0.6);
  });

  doc.moveDown(1);
  doc.moveTo(56, doc.y).lineTo(556, doc.y).strokeColor('#E5E7EB').stroke();
  doc.moveDown(0.5);
  doc.fontSize(9).fillColor('#9CA3AF').text(
    'Legend: red strikethrough = removed text, green = inserted text. ' +
    'This document was generated by ContractAI for internal review only.',
    { align: 'center' }
  );

  doc.end();
});

// 5-8. Clause Library CRUD
router.get('/clause-library', (req, res) => {
  res.json(clauseLibrary);
});

router.post('/clause-library', (req, res) => {
  const { category, text, risk_score } = req.body || {};
  if (!category || !text) {
    return res.status(400).json({ error: 'category and text are required' });
  }
  const item = {
    id: clauseNextId++,
    category,
    text,
    risk_score: typeof risk_score === 'number' ? risk_score : Number(risk_score) || 0,
  };
  clauseLibrary.push(item);
  res.status(201).json(item);
});

router.put('/clause-library/:id', (req, res) => {
  const id = Number(req.params.id);
  const idx = clauseLibrary.findIndex((c) => c.id === id);
  if (idx === -1) return res.status(404).json({ error: 'Not found' });
  const { category, text, risk_score } = req.body || {};
  clauseLibrary[idx] = {
    ...clauseLibrary[idx],
    ...(category !== undefined ? { category } : {}),
    ...(text !== undefined ? { text } : {}),
    ...(risk_score !== undefined ? { risk_score: Number(risk_score) } : {}),
  };
  res.json(clauseLibrary[idx]);
});

router.delete('/clause-library/:id', (req, res) => {
  const id = Number(req.params.id);
  const before = clauseLibrary.length;
  clauseLibrary = clauseLibrary.filter((c) => c.id !== id);
  if (clauseLibrary.length === before) return res.status(404).json({ error: 'Not found' });
  res.json({ ok: true });
});

module.exports = router;
