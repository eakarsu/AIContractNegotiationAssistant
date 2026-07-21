'use strict';
const express = require('express');
const { PrismaClient } = require('@prisma/client');
const workflow = require('../services/negotiationWorkflow');
const router = express.Router(); const prisma = new PrismaClient();
function actor(req) { return { id: Number(req.user.userId), tenantId: req.user.tenantId, role: req.user.role }; }
function requireRole(user, roles) { if (!roles.includes(user.role)) { const e = new Error(`requires role: ${roles.join(', ')}`); e.statusCode = 403; throw e; } }
async function appendEvent(tx, user, matterId, eventType, payload) {
  await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtext(${user.tenantId}))`;
  const previous = await tx.governedNegotiationEvent.findFirst({ where: { tenantId: user.tenantId }, orderBy: { id: 'desc' } });
  const value = { matterId, eventType, actorUserId: user.id, payload, occurredAt: new Date().toISOString() };
  await tx.governedNegotiationEvent.create({ data: { tenantId: user.tenantId, matterId, eventType, actorUserId: user.id,
    payload: value, previousHash: previous?.eventHash || null, eventHash: workflow.eventHash(previous?.eventHash || null, value) } });
}

router.post('/matters', async (req, res, next) => {
  try {
    const user = actor(req); requireRole(user, ['admin', 'negotiator']); const value = workflow.normalizeMatter(req.body);
    const matter = await prisma.$transaction(async (tx) => { const row = await tx.governedMatter.create({ data: { tenantId: user.tenantId,
      matterKey: value.matterKey, name: value.name, privilegeLabel: value.privilegeLabel, createdById: user.id } });
      await appendEvent(tx, user, row.id, 'matter.created', value); return row; });
    res.status(201).json(matter);
  } catch (error) { next(error); }
});

router.post('/matters/:id/playbooks', async (req, res, next) => {
  try {
    const user = actor(req); requireRole(user, ['legal_approver']); const value = workflow.normalizePlaybook(req.body); const matterId = Number(req.params.id);
    const playbook = await prisma.$transaction(async (tx) => {
      const matter = await tx.governedMatter.findFirst({ where: { id: matterId, tenantId: user.tenantId } }); if (!matter) return null;
      const row = await tx.governedPlaybook.create({ data: { tenantId: user.tenantId, matterId, name: value.name,
        version: value.version, jurisdiction: value.jurisdiction, contentHash: value.contentHash, approvedById: user.id } });
      await tx.governedPlaybookRule.createMany({ data: value.rules.map((rule) => ({ ...rule, tenantId: user.tenantId, playbookId: row.id })) });
      await appendEvent(tx, user, matterId, 'playbook.approved', { playbookId: row.id, name: row.name, version: row.version, contentHash: row.contentHash }); return row;
    });
    if (!playbook) return res.status(404).json({ error: 'matter_not_found' }); res.status(201).json(playbook);
  } catch (error) { next(error); }
});

router.post('/matters/:id/versions', async (req, res, next) => {
  try {
    const user = actor(req); requireRole(user, ['admin', 'negotiator']); const matterId = Number(req.params.id);
    const versionNumber = Number(req.body.versionNumber); const contentHash = workflow.digest(req.body.contentHash, 'contentHash');
    const sourceDocumentId = String(req.body.sourceDocumentId || '').trim();
    if (!Number.isInteger(versionNumber) || versionNumber < 1 || !sourceDocumentId) return res.status(422).json({ error: 'positive versionNumber and sourceDocumentId are required' });
    const version = await prisma.$transaction(async (tx) => {
      const matter = await tx.governedMatter.findFirst({ where: { id: matterId, tenantId: user.tenantId } }); if (!matter) return null;
      const row = await tx.governedContractVersion.create({ data: { tenantId: user.tenantId, matterId, versionNumber, contentHash, sourceDocumentId, createdById: user.id } });
      await appendEvent(tx, user, matterId, 'contract_version.recorded', { versionId: row.id, versionNumber, contentHash, sourceDocumentId }); return row;
    });
    if (!version) return res.status(404).json({ error: 'matter_not_found' }); res.status(201).json(version);
  } catch (error) { next(error); }
});

router.post('/redlines', async (req, res, next) => {
  try {
    const user = actor(req); requireRole(user, ['admin', 'negotiator']); const matterId = Number(req.body.matterId);
    const versionId = Number(req.body.contractVersionId); const ruleId = Number(req.body.playbookRuleId);
    const redline = await prisma.$transaction(async (tx) => {
      const matter = await tx.governedMatter.findFirst({ where: { id: matterId, tenantId: user.tenantId } });
      const version = await tx.governedContractVersion.findFirst({ where: { id: versionId, matterId, tenantId: user.tenantId } });
      const rule = await tx.governedPlaybookRule.findFirst({ where: { id: ruleId, tenantId: user.tenantId } });
      if (!matter || !version || !rule) return null;
      const playbook = await tx.governedPlaybook.findFirst({ where: { id: rule.playbookId, matterId, tenantId: user.tenantId } }); if (!playbook) return null;
      const value = workflow.normalizeRedline(req.body, rule);
      const row = await tx.governedRedline.create({ data: { tenantId: user.tenantId, matterId, contractVersionId: version.id,
        playbookRuleId: rule.id, sourceText: value.sourceText, proposedText: value.proposedText, rationale: value.rationale,
        tradeoffs: value.tradeoffs, citation: { ...value.citation, playbookVersion: playbook.version, playbookContentHash: playbook.contentHash,
          contractVersion: version.versionNumber, contractContentHash: version.contentHash }, policyResult: value.policyResult, createdById: user.id } });
      await appendEvent(tx, user, matterId, 'redline.proposed', { redlineId: row.id, citation: row.citation, policyResult: row.policyResult }); return row;
    });
    if (!redline) return res.status(404).json({ error: 'matter_version_or_rule_not_found' }); res.status(201).json(redline);
  } catch (error) { next(error); }
});

router.post('/redlines/:id/approvals', async (req, res, next) => {
  try {
    const user = actor(req); const gate = workflow.approvalGate(user.role); const decision = String(req.body.decision || '').toLowerCase();
    const rationale = String(req.body.rationale || '').trim(); if (!['approved', 'rejected'].includes(decision) || rationale.length < 10) return res.status(422).json({ error: 'decision must be approved/rejected and rationale must be 10+ characters' });
    const approval = await prisma.$transaction(async (tx) => {
      const redline = await tx.governedRedline.findFirst({ where: { id: Number(req.params.id), tenantId: user.tenantId } }); if (!redline) return null;
      if (redline.status !== 'pending') { const e = new Error('redline is no longer pending'); e.statusCode = 409; throw e; }
      if (redline.createdById === user.id) { const e = new Error('proposer cannot approve their own redline'); e.statusCode = 403; throw e; }
      const row = await tx.governedRedlineApproval.create({ data: { tenantId: user.tenantId, redlineId: redline.id, gate, decision, rationale, approverId: user.id } });
      const approvals = await tx.governedRedlineApproval.findMany({ where: { tenantId: user.tenantId, redlineId: redline.id } });
      let status = 'pending'; if (decision === 'rejected') status = 'rejected';
      else if (['legal', 'business'].every((requiredGate) => approvals.some((item) => item.gate === requiredGate && item.decision === 'approved'))) status = 'approved';
      await tx.governedRedline.update({ where: { id: redline.id }, data: { status } });
      await appendEvent(tx, user, redline.matterId, `redline.${gate}.${decision}`, { redlineId: redline.id, approvalId: row.id, rationale, resultingStatus: status }); return { ...row, resultingStatus: status };
    });
    if (!approval) return res.status(404).json({ error: 'redline_not_found' }); res.status(201).json(approval);
  } catch (error) { next(error); }
});

router.post('/evaluations', (req, res, next) => { try { requireRole(actor(req), ['admin', 'legal_approver']); res.json(workflow.evaluateCases(req.body.cases)); } catch (error) { next(error); } });
router.get('/matters/:id/evidence', async (req, res, next) => {
  try {
    const user = actor(req); const matterId = Number(req.params.id); const matter = await prisma.governedMatter.findFirst({ where: { id: matterId, tenantId: user.tenantId } });
    if (!matter) return res.status(404).json({ error: 'matter_not_found' });
    const [playbooks, versions, redlines, events] = await Promise.all([
      prisma.governedPlaybook.findMany({ where: { tenantId: user.tenantId, matterId }, orderBy: { id: 'asc' } }),
      prisma.governedContractVersion.findMany({ where: { tenantId: user.tenantId, matterId }, orderBy: { versionNumber: 'asc' } }),
      prisma.governedRedline.findMany({ where: { tenantId: user.tenantId, matterId }, orderBy: { id: 'asc' } }),
      prisma.governedNegotiationEvent.findMany({ where: { tenantId: user.tenantId, matterId }, orderBy: { id: 'asc' } }),
    ]);
    const ids = redlines.map((row) => row.id); const approvals = ids.length ? await prisma.governedRedlineApproval.findMany({ where: { tenantId: user.tenantId, redlineId: { in: ids } } }) : [];
    res.json({ matter, playbooks, versions, redlines, approvals, events, notice: 'Approval is internal authorization only; no external commitment or signature is performed.' });
  } catch (error) { next(error); }
});
router.use((error, req, res, next) => {
  if (res.headersSent) return next(error); if (error.code === 'P2002') return res.status(409).json({ error: 'duplicate_record' });
  console.error('[governed-negotiation]', error.message); res.status(error.statusCode || 500).json({ error: error.statusCode ? error.message : 'negotiation_workflow_failed' });
});
module.exports = router;
