'use strict';
const crypto = require('node:crypto');

function fail(message) { const error = new Error(message); error.statusCode = 422; throw error; }
function required(value, field, max = 4000) {
  if (typeof value !== 'string' || !value.trim()) fail(`${field} is required`);
  if (value.trim().length > max) fail(`${field} exceeds ${max} characters`);
  return value.trim();
}
function sha256(value) { return crypto.createHash('sha256').update(value).digest('hex'); }
function digest(value, field) {
  const normalized = required(value, field, 64).toLowerCase();
  if (!/^[a-f0-9]{64}$/.test(normalized)) fail(`${field} must be a SHA-256 hex digest`);
  return normalized;
}
function canonical(value) {
  if (Array.isArray(value)) return `[${value.map(canonical).join(',')}]`;
  if (value && typeof value === 'object') return `{${Object.keys(value).sort().map((key) => `${JSON.stringify(key)}:${canonical(value[key])}`).join(',')}}`;
  return JSON.stringify(value);
}
function normalizeMatter(input = {}) {
  const label = required(input.privilegeLabel, 'privilegeLabel', 40);
  if (!['attorney_client', 'work_product', 'confidential'].includes(label)) fail('privilegeLabel is invalid');
  return { matterKey: required(input.matterKey, 'matterKey', 80), name: required(input.name, 'name', 255), privilegeLabel: label };
}
function normalizePlaybook(input = {}) {
  if (!Array.isArray(input.rules) || input.rules.length === 0) fail('rules must be a non-empty array');
  const rules = input.rules.map((row) => {
    const riskLevel = required(row.riskLevel, 'riskLevel', 20);
    if (!['low', 'medium', 'high', 'critical'].includes(riskLevel)) fail('riskLevel is invalid');
    return { ruleKey: required(row.ruleKey, 'ruleKey', 80), clauseType: required(row.clauseType, 'clauseType', 120),
      sourceClause: required(row.sourceClause, 'sourceClause'), preferredText: required(row.preferredText, 'preferredText'),
      fallbackText: row.fallbackText ? required(row.fallbackText, 'fallbackText') : null, riskLevel };
  });
  const result = { name: required(input.name, 'name', 160), version: required(input.version, 'version', 40),
    jurisdiction: required(input.jurisdiction, 'jurisdiction', 80), rules };
  return { ...result, contentHash: sha256(canonical(result)) };
}
function normalizeRedline(input = {}, rule) {
  const sourceText = required(input.sourceText, 'sourceText'); const proposedText = required(input.proposedText, 'proposedText');
  const sourceTextSha256 = digest(input.sourceTextSha256, 'sourceTextSha256');
  if (sourceTextSha256 !== sha256(sourceText)) fail('sourceTextSha256 does not match sourceText');
  const allowed = [rule.preferredText, rule.fallbackText].filter(Boolean);
  if (!allowed.includes(proposedText)) fail('proposedText is not an approved preferred or fallback playbook clause');
  return { sourceText, proposedText, rationale: required(input.rationale, 'rationale'), tradeoffs: required(input.tradeoffs, 'tradeoffs'),
    citation: { sourceDocumentId: required(input.sourceDocumentId, 'sourceDocumentId', 160), sourceTextSha256,
      playbookId: rule.playbookId, playbookRuleId: rule.id, ruleKey: rule.ruleKey }, policyResult: 'playbook_exact_match' };
}
function approvalGate(role) {
  if (role === 'legal_approver') return 'legal'; if (role === 'business_approver') return 'business';
  const error = new Error('requires legal_approver or business_approver role'); error.statusCode = 403; throw error;
}
function evaluateCases(cases) {
  if (!Array.isArray(cases) || cases.length === 0) fail('cases must be a non-empty array');
  let detected = 0; let policy = 0; let cited = 0; let agreement = 0;
  for (const row of cases) {
    for (const field of ['clauseDetected', 'policyCompliant', 'citationSupported', 'reviewerAccepted', 'systemRecommended']) {
      if (typeof row[field] !== 'boolean') fail(`each case requires boolean ${field}`);
    }
    detected += Number(row.clauseDetected); policy += Number(row.policyCompliant); cited += Number(row.citationSupported);
    agreement += Number(row.reviewerAccepted === row.systemRecommended);
  }
  return { cases: cases.length, clauseDetectionRate: detected / cases.length, policyComplianceRate: policy / cases.length,
    citationSupportRate: cited / cases.length, reviewerAgreementRate: agreement / cases.length };
}
function eventHash(previousHash, event) { return sha256(`${previousHash || ''}|${canonical(event)}`); }
module.exports = { normalizeMatter, normalizePlaybook, normalizeRedline, approvalGate, evaluateCases, eventHash, digest, sha256 };
