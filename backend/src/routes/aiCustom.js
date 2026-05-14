/**
 * AI Custom non-CRUD features for AIContractNegotiationAssistant (per audit):
 *  1. POST /draft-from-scratch          Generate full contract from requirements
 *  2. POST /redteam-simulator           AI plays opposing party
 *  3. POST /historical-analytics        Cluster + visualize past contracts
 *  4. POST /clause-conflict-detector    Identify contradictory clauses
 *  5. POST /regulatory-monitor          Flag contracts with outdated compliance
 *  6. POST /sentiment-analysis          Quantify favorability of terms
 *  7. POST /pricing-recommender         Suggest contract value vs precedents
 *  8. POST /auto-redline-engine         Smart counter-redlines from policy
 *  GET  /results                        Browse persisted ai_results
 */

const express = require('express');
const { body, validationResult } = require('express-validator');
const { aiRateLimiter } = require('../middleware/rateLimiter');
const { callOpenRouter, parseAIJson, saveAIResult, prisma } = require('../services/aiHelper');

const router = express.Router();

const SYSTEM = 'You are an expert contract negotiation attorney with deep knowledge of commercial law, deal structuring, and negotiation strategy. Always respond with valid JSON when requested.';

function uid(req) { return req.user?.userId || req.user?.id; }

function checkValidation(req, res) {
  const errs = validationResult(req);
  if (!errs.isEmpty()) { res.status(400).json({ errors: errs.array() }); return false; }
  return true;
}

// 1) Draft contract from scratch using requirements
router.post('/draft-from-scratch', aiRateLimiter, [
  body('contract_type').notEmpty(),
  body('requirements').notEmpty(),
], async (req, res) => {
  if (!checkValidation(req, res)) return;
  try {
    const { contract_type, requirements, parties, jurisdiction, value, duration } = req.body;
    const prompt = `Draft a complete, legally sound ${contract_type} from these requirements.

Requirements: ${typeof requirements === 'string' ? requirements : JSON.stringify(requirements)}
Parties: ${parties || 'Party A and Party B'}
Jurisdiction: ${jurisdiction || 'United States'}
Estimated Value: ${value || 'unspecified'}
Duration: ${duration || '12 months'}

Return JSON:
{
  "title": "string",
  "preamble": "string",
  "definitions": [{ "term": "string", "definition": "string" }],
  "sections": [{ "heading": "string", "body": "string" }],
  "signature_block": "string",
  "full_text": "Full multi-page contract text ready to use",
  "key_clauses_summary": [{ "clause": "string", "purpose": "string" }],
  "review_checklist": ["string"]
}`;
    const r = await callOpenRouter(SYSTEM, prompt, { temperature: 0.4, maxTokens: 5000 });
    const parsed = parseAIJson(r.content) || { raw: r.content };
    await saveAIResult({ feature: 'draft-from-scratch', userId: uid(req), input: { contract_type, jurisdiction }, output: parsed, model: r.model, usage: r.usage });
    res.json({ ...parsed, model: r.model, usage: r.usage });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// 2) Red-team negotiation simulator (AI plays counterparty)
router.post('/redteam-simulator', aiRateLimiter, [
  body('our_position').notEmpty(),
  body('counterparty_persona').notEmpty(),
], async (req, res) => {
  if (!checkValidation(req, res)) return;
  try {
    const { our_position, counterparty_persona, contract_type, rounds = 5 } = req.body;
    const prompt = `Run a ${rounds}-round adversarial negotiation simulation. You play the counterparty according to the persona.

Our Position: ${our_position}
Counterparty Persona: ${counterparty_persona}
Contract Type: ${contract_type || 'commercial agreement'}

Return JSON:
{
  "rounds": [
    {
      "round": 1,
      "our_move": "predicted opening from us",
      "counterparty_response": "your response in character",
      "tactics_used": ["string"],
      "concessions_demanded": ["string"],
      "leverage_applied": "string"
    }
  ],
  "final_state": {
    "agreement_reached": true,
    "winners_curse": "string",
    "value_split_pct_us": 50,
    "weak_spots_in_our_position": ["string"]
  },
  "lessons_learned": ["string"],
  "counter_strategies_for_real_negotiation": ["string"]
}`;
    const r = await callOpenRouter(SYSTEM, prompt, { temperature: 0.8, maxTokens: 4000 });
    const parsed = parseAIJson(r.content) || { raw: r.content };
    await saveAIResult({ feature: 'redteam-simulator', userId: uid(req), input: { contract_type }, output: parsed, model: r.model, usage: r.usage });
    res.json({ ...parsed, model: r.model, usage: r.usage });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// 3) Historical contract analytics — cluster similar contracts, visualize outcomes
router.post('/historical-analytics', aiRateLimiter, async (req, res) => {
  try {
    const { contract_type, party_id, period_days = 365 } = req.body;
    const since = new Date(Date.now() - parseInt(period_days) * 86400000);
    const where = {};
    if (contract_type) where.contractType = contract_type;
    if (party_id) where.partyId = parseInt(party_id);
    where.createdAt = { gte: since };

    const contracts = await prisma.contract.findMany({
      where, take: 100,
      orderBy: { createdAt: 'desc' },
      select: { id: true, title: true, contractType: true, status: true, value: true, riskLevel: true, riskScore: true, createdAt: true }
    });

    const stats = {
      total: contracts.length,
      by_status: contracts.reduce((a, c) => { a[c.status] = (a[c.status] || 0) + 1; return a; }, {}),
      by_risk: contracts.reduce((a, c) => { a[c.riskLevel || 'unset'] = (a[c.riskLevel || 'unset'] || 0) + 1; return a; }, {}),
      avg_value: contracts.length ? contracts.reduce((s, c) => s + (c.value || 0), 0) / contracts.length : 0,
      avg_risk_score: contracts.length ? contracts.reduce((s, c) => s + (c.riskScore || 0), 0) / contracts.length : 0
    };

    const prompt = `Analyze these historical contracts and produce clusters and insights.

Stats: ${JSON.stringify(stats)}
Sample (first 30): ${JSON.stringify(contracts.slice(0, 30)).slice(0, 4000)}

Return JSON:
{
  "clusters": [
    { "name": "string", "contract_ids": [0], "common_traits": ["string"], "avg_value": 0, "avg_risk": 0 }
  ],
  "trends": [{ "trend": "string", "direction": "up|down|stable", "magnitude": "string" }],
  "outliers": [{ "contract_id": 0, "reason": "string" }],
  "top_performing_patterns": ["string"],
  "underperforming_patterns": ["string"],
  "insights": ["string"],
  "recommended_focus_areas": ["string"]
}`;
    const r = await callOpenRouter(SYSTEM, prompt, { temperature: 0.4, maxTokens: 3500 });
    const parsed = parseAIJson(r.content) || { raw: r.content };
    const output = { ...parsed, stats };
    await saveAIResult({ feature: 'historical-analytics', userId: uid(req), input: { contract_type, party_id, period_days }, output, model: r.model, usage: r.usage });
    res.json({ ...output, model: r.model, usage: r.usage });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// 4) Cross-party clause conflict detector
router.post('/clause-conflict-detector', aiRateLimiter, [
  body('contract_id').notEmpty(),
], async (req, res) => {
  if (!checkValidation(req, res)) return;
  try {
    const { contract_id, additional_clauses } = req.body;
    const contract = await prisma.contract.findUnique({
      where: { id: parseInt(contract_id) },
      include: { clauses: { include: { clause: true } } }
    });
    if (!contract) return res.status(404).json({ error: 'Contract not found' });

    const allClauses = [
      ...contract.clauses.map(cc => ({ id: cc.clauseId, title: cc.clause?.title, content: cc.customContent || cc.clause?.content })),
      ...(additional_clauses || []).map((c, i) => ({ id: `additional-${i}`, title: c.title, content: c.content }))
    ];

    const prompt = `Find contradictions, conflicts, and inconsistencies between these contract clauses.

Contract: ${contract.title}
Clauses: ${JSON.stringify(allClauses).slice(0, 6000)}

Return JSON:
{
  "conflicts": [
    {
      "clause_a_id": "string",
      "clause_a_title": "string",
      "clause_b_id": "string",
      "clause_b_title": "string",
      "conflict_type": "contradiction|ambiguity|overlap|gap",
      "description": "string",
      "severity": "low|medium|high|critical",
      "resolution": "How to resolve"
    }
  ],
  "redundancies": [{ "clauses": ["string"], "description": "string" }],
  "gaps": [{ "topic": "string", "suggested_clause": "string" }],
  "consistency_score": 0,
  "executive_summary": "string"
}`;
    const r = await callOpenRouter(SYSTEM, prompt, { temperature: 0.3, maxTokens: 3500 });
    const parsed = parseAIJson(r.content) || { raw: r.content };
    await saveAIResult({ feature: 'clause-conflict-detector', contractId: parseInt(contract_id), userId: uid(req), input: { contract_id }, output: parsed, model: r.model, usage: r.usage });
    res.json({ ...parsed, model: r.model, usage: r.usage });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// 5) Regulatory update monitor
router.post('/regulatory-monitor', aiRateLimiter, [
  body('contract_id').notEmpty(),
], async (req, res) => {
  if (!checkValidation(req, res)) return;
  try {
    const { contract_id, regulations } = req.body;
    const contract = await prisma.contract.findUnique({
      where: { id: parseInt(contract_id) },
      include: { clauses: { include: { clause: true } }, complianceChecks: true }
    });
    if (!contract) return res.status(404).json({ error: 'Contract not found' });

    const prompt = `Check this contract for outdated compliance against current regulations.

Contract: ${JSON.stringify({ title: contract.title, type: contract.contractType, status: contract.status }).slice(0, 1000)}
Clauses: ${JSON.stringify(contract.clauses).slice(0, 3000)}
Regulations to verify: ${regulations || 'GDPR, CCPA, HIPAA, SOX, PCI-DSS (apply only those relevant)'}
Use your knowledge of regulatory updates through 2025.

Return JSON:
{
  "regulations_checked": ["string"],
  "outdated_clauses": [
    {
      "clause_id": 0,
      "clause_title": "string",
      "regulation": "string",
      "outdated_aspect": "string",
      "current_requirement": "string",
      "suggested_update": "string",
      "priority": "low|medium|high|urgent"
    }
  ],
  "missing_protections": [{ "regulation": "string", "needed_clause": "string" }],
  "alerts": [{ "type": "string", "message": "string", "deadline_days": 0 }],
  "compliance_score": 0,
  "executive_summary": "string"
}`;
    const r = await callOpenRouter(SYSTEM, prompt, { temperature: 0.3, maxTokens: 3500 });
    const parsed = parseAIJson(r.content) || { raw: r.content };
    await saveAIResult({ feature: 'regulatory-monitor', contractId: parseInt(contract_id), userId: uid(req), input: { regulations }, output: parsed, model: r.model, usage: r.usage });
    res.json({ ...parsed, model: r.model, usage: r.usage });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// 6) Sentiment analysis on contract language (favorability)
router.post('/sentiment-analysis', aiRateLimiter, [
  body('text').notEmpty(),
], async (req, res) => {
  if (!checkValidation(req, res)) return;
  try {
    const { text, our_role = 'buyer' } = req.body;
    const prompt = `Analyze the contract text below for term favorability sentiment from the perspective of the ${our_role}.

Text: ${String(text).slice(0, 8000)}

Return JSON:
{
  "overall_sentiment": "favorable|neutral|unfavorable",
  "favorability_score": 0,
  "perspective": "${our_role}",
  "section_breakdown": [
    {
      "section": "string",
      "excerpt": "string (first 100 chars)",
      "sentiment": "favorable|neutral|unfavorable",
      "score": 0,
      "reasoning": "string"
    }
  ],
  "power_imbalance": {
    "level": "balanced|moderate_imbalance|severe_imbalance",
    "favors": "us|counterparty",
    "explanation": "string"
  },
  "rewording_suggestions": [
    { "original": "string", "suggested": "string", "rationale": "string" }
  ],
  "executive_summary": "string"
}`;
    const r = await callOpenRouter(SYSTEM, prompt, { temperature: 0.3, maxTokens: 3500 });
    const parsed = parseAIJson(r.content) || { raw: r.content };
    await saveAIResult({ feature: 'sentiment-analysis', userId: uid(req), input: { our_role, text_len: String(text).length }, output: parsed, model: r.model, usage: r.usage });
    res.json({ ...parsed, model: r.model, usage: r.usage });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// 7) Pricing recommender from precedents
router.post('/pricing-recommender', aiRateLimiter, [
  body('contract_type').notEmpty(),
], async (req, res) => {
  if (!checkValidation(req, res)) return;
  try {
    const { contract_type, scope, industry, region, party_id } = req.body;

    // Pull historical pricing from DB
    const where = { contractType: contract_type };
    if (party_id) where.partyId = parseInt(party_id);
    const past = await prisma.contract.findMany({
      where, take: 50,
      select: { id: true, title: true, value: true, currency: true, startDate: true, endDate: true, status: true },
      orderBy: { createdAt: 'desc' }
    });
    const values = past.map(c => c.value).filter(Boolean);
    const stats = {
      sample: values.length,
      avg: values.length ? values.reduce((a, b) => a + b, 0) / values.length : 0,
      min: values.length ? Math.min(...values) : 0,
      max: values.length ? Math.max(...values) : 0,
      median: values.length ? [...values].sort((a, b) => a - b)[Math.floor(values.length / 2)] : 0
    };

    const prompt = `Recommend a contract price/value based on historical precedents and market data.

Contract Type: ${contract_type}
Scope: ${scope || 'standard'}
Industry: ${industry || 'general'}
Region: ${region || 'US'}
Historical Stats: ${JSON.stringify(stats)}
Recent Precedents: ${JSON.stringify(past.slice(0, 10))}

Return JSON:
{
  "recommended_value": 0,
  "currency": "USD",
  "range": { "low": 0, "mid": 0, "high": 0 },
  "confidence": "low|medium|high",
  "comparable_contracts": [{ "id": 0, "title": "string", "value": 0, "similarity_score": 0.0 }],
  "rationale": "string",
  "market_position": "below_market|at_market|premium",
  "negotiation_anchor": 0,
  "walkaway_floor": 0,
  "value_drivers": ["string"],
  "risks_to_pricing": ["string"]
}`;
    const r = await callOpenRouter(SYSTEM, prompt, { temperature: 0.4, maxTokens: 3000 });
    const parsed = parseAIJson(r.content) || { raw: r.content };
    const output = { ...parsed, historical_stats: stats };
    await saveAIResult({ feature: 'pricing-recommender', userId: uid(req), input: { contract_type, scope, industry, region, party_id }, output, model: r.model, usage: r.usage });
    res.json({ ...output, model: r.model, usage: r.usage });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// 8) Auto-redline engine: smart counter-redlines from company policy
router.post('/auto-redline-engine', aiRateLimiter, [
  body('proposed_text').notEmpty(),
  body('policy').notEmpty(),
], async (req, res) => {
  if (!checkValidation(req, res)) return;
  try {
    const { proposed_text, policy, contract_type } = req.body;
    const prompt = `Generate counter-redlines for the proposed contract text against our policy.

Proposed Text: ${String(proposed_text).slice(0, 6000)}
Our Policy: ${typeof policy === 'string' ? policy : JSON.stringify(policy)}
Contract Type: ${contract_type || 'commercial'}

Return JSON:
{
  "counter_redlines": [
    {
      "original_text": "exact problematic phrase",
      "proposed_redline": "exact replacement text",
      "rationale": "why this change",
      "policy_basis": "which policy rule",
      "criticality": "low|medium|high|deal_breaker",
      "negotiation_priority": 1
    }
  ],
  "policy_violations_found": 0,
  "deal_breakers": 0,
  "overall_assessment": "string",
  "alternative_phrasings": [
    { "redline_index": 0, "alternatives": ["string"] }
  ],
  "negotiation_message_draft": "Suggested email/letter to counterparty"
}`;
    const r = await callOpenRouter(SYSTEM, prompt, { temperature: 0.3, maxTokens: 4000 });
    const parsed = parseAIJson(r.content) || { raw: r.content };
    await saveAIResult({ feature: 'auto-redline-engine', userId: uid(req), input: { contract_type }, output: parsed, model: r.model, usage: r.usage });
    res.json({ ...parsed, model: r.model, usage: r.usage });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// Browse persisted ai_results (paginated)
router.get('/results', async (req, res) => {
  try {
    const page = Math.max(parseInt(req.query.page) || 1, 1);
    const limit = Math.min(parseInt(req.query.limit) || 20, 100);
    const where = {};
    if (req.query.feature) where.feature = req.query.feature;
    if (req.query.contract_id) where.contractId = parseInt(req.query.contract_id);

    const [data, total] = await Promise.all([
      prisma.aIResult.findMany({ where, take: limit, skip: (page - 1) * limit, orderBy: { createdAt: 'desc' } }),
      prisma.aIResult.count({ where })
    ]);
    res.json({ data, total, page, limit, total_pages: Math.ceil(total / limit) });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.get('/results/:id', async (req, res) => {
  try {
    const r = await prisma.aIResult.findUnique({ where: { id: parseInt(req.params.id) } });
    if (!r) return res.status(404).json({ error: 'Not found' });
    res.json(r);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

module.exports = router;
