const express = require('express');
const fetch = require('node-fetch');
const { body, validationResult } = require('express-validator');
const { aiRateLimiter } = require('../middleware/rateLimiter');

const router = express.Router();

const SYSTEM_PROMPT = 'You are an expert contract negotiation attorney with deep knowledge of commercial law, deal structuring, and negotiation strategy.';
const OPENROUTER_MODEL = 'anthropic/claude-3-5-sonnet-20241022';

async function callOpenRouter(systemPrompt, userMessage) {
  if (!process.env.OPENROUTER_API_KEY) {
    const e = new Error('AI provider not configured (OPENROUTER_API_KEY missing).');
    e.statusCode = 503;
    throw e;
  }
  const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
      'Content-Type': 'application/json',
      'HTTP-Referer': 'http://localhost:5173',
      'X-Title': 'Contract Negotiation Assistant'
    },
    body: JSON.stringify({
      model: OPENROUTER_MODEL,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userMessage }
      ],
      max_tokens: 3000
    })
  });

  if (!response.ok) {
    const errBody = await response.text();
    throw new Error(`OpenRouter API error (${response.status}): ${errBody}`);
  }

  const data = await response.json();
  if (!data.choices || !data.choices[0]) {
    throw new Error('Invalid response from AI');
  }
  return data.choices[0].message.content;
}

function handleValidation(req, res) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  return null;
}

// POST /api/ai/negotiation-playbook
router.post(
  '/negotiation-playbook',
  aiRateLimiter,
  [
    body('contract_type').notEmpty().withMessage('contract_type is required'),
    body('our_priorities').isArray({ min: 1 }).withMessage('our_priorities must be a non-empty array'),
    body('counterparty_profile').notEmpty().withMessage('counterparty_profile is required')
  ],
  async (req, res) => {
    const validErr = handleValidation(req, res);
    if (validErr !== null) return;

    try {
      const { contract_type, our_priorities, counterparty_profile } = req.body;

      const userMessage = `Generate a comprehensive negotiation playbook for the following scenario:

Contract Type: ${contract_type}
Our Priorities: ${our_priorities.join(', ')}
Counterparty Profile: ${typeof counterparty_profile === 'string' ? counterparty_profile : JSON.stringify(counterparty_profile)}

Please provide:
1. NEGOTIATION STRATEGY: Overall approach and positioning
2. BATNA ANALYSIS: Best Alternative To Negotiated Agreement - what we can do if talks fail, and likely counterparty BATNA
3. CONCESSION SEQUENCE: Ordered list of concessions we can make, starting from least to most important, with conditions
4. LEVERAGE POINTS: Our strongest negotiating advantages
5. COUNTERPARTY WEAKNESSES: Likely pressure points for the counterparty
6. RED LINES: Non-negotiable terms we must protect
7. OPENING POSITIONS: Recommended initial positions on key terms
8. CLOSING TACTICS: How to move toward agreement efficiently

Format each section clearly with actionable specifics.`;

      const result = await callOpenRouter(SYSTEM_PROMPT, userMessage);
      res.json({ success: true, playbook: result, contract_type, our_priorities, counterparty_profile });
    } catch (err) {
      res.status(500).json({ success: false, error: err.message });
    }
  }
);

// POST /api/ai/redline-analyzer
router.post(
  '/redline-analyzer',
  aiRateLimiter,
  [
    body('original_text').notEmpty().withMessage('original_text is required').isLength({ max: 200000 }).withMessage('original_text too long'),
    body('redlined_text').notEmpty().withMessage('redlined_text is required').isLength({ max: 200000 }).withMessage('redlined_text too long')
  ],
  async (req, res) => {
    const validErr = handleValidation(req, res);
    if (validErr !== null) return;

    try {
      const { original_text, redlined_text } = req.body;

      const userMessage = `Analyze the following contract redlines (tracked changes):

ORIGINAL TEXT:
${original_text}

REDLINED/REVISED TEXT:
${redlined_text}

Please provide:
1. CHANGES IDENTIFIED: List every change made (additions, deletions, modifications) with exact text
2. IMPACT ASSESSMENT: For each change, classify as:
   - FAVORABLE: Benefits our position
   - UNFAVORABLE: Disadvantages our position
   - NEUTRAL: Neither clearly beneficial nor harmful
3. RISK ANALYSIS: Overall risk impact of the redlines as a package
4. RECOMMENDATIONS: For each change, recommend:
   - ACCEPT: Acceptable as is
   - REJECT: Must push back
   - COUNTER: Suggest specific counter-language
5. PRIORITY RANKING: Which redlines need the most urgent attention
6. NEGOTIATION RESPONSE: Draft response strategy to the counterparty

Be specific about each change and explain the legal/commercial implications.`;

      const result = await callOpenRouter(SYSTEM_PROMPT, userMessage);
      res.json({ success: true, analysis: result });
    } catch (err) {
      res.status(500).json({ success: false, error: err.message });
    }
  }
);

// POST /api/ai/contract-benchmarking
router.post(
  '/contract-benchmarking',
  aiRateLimiter,
  [
    body('contract_terms').notEmpty().withMessage('contract_terms is required'),
    body('industry').notEmpty().withMessage('industry is required'),
    body('contract_type').notEmpty().withMessage('contract_type is required')
  ],
  async (req, res) => {
    const validErr = handleValidation(req, res);
    if (validErr !== null) return;

    try {
      const { contract_terms, industry, contract_type } = req.body;

      const userMessage = `Benchmark the following contract terms against market standards:

Industry: ${industry}
Contract Type: ${contract_type}
Contract Terms:
${typeof contract_terms === 'string' ? contract_terms : JSON.stringify(contract_terms, null, 2)}

Please provide:
1. MARKET STANDARD COMPARISON: For each key term, compare to typical market practice in the ${industry} industry
2. OUTLIER IDENTIFICATION: Flag any terms that significantly deviate from market norms (both favorable and unfavorable)
3. PERCENTILE RANKING: Estimate where this contract falls (e.g., "top 25% favorable for buyer")
4. RISK PREMIUM ASSESSMENT: Are the terms appropriate for the risk profile?
5. MISSING STANDARD TERMS: Important clauses typically found in ${contract_type} contracts that are absent
6. JURISDICTION NOTES: How these terms compare across different legal jurisdictions
7. NEGOTIATION LEVERAGE: Based on market position, which terms have strongest grounds for renegotiation
8. OVERALL ASSESSMENT: Summary rating (below market / at market / above market) with explanation`;

      const result = await callOpenRouter(SYSTEM_PROMPT, userMessage);
      res.json({ success: true, benchmarking: result, industry, contract_type });
    } catch (err) {
      res.status(500).json({ success: false, error: err.message });
    }
  }
);

// POST /api/ai/settlement-predictor
router.post(
  '/settlement-predictor',
  aiRateLimiter,
  [
    body('dispute_details').notEmpty().withMessage('dispute_details is required'),
    body('contract_terms').notEmpty().withMessage('contract_terms is required'),
    body('jurisdiction').notEmpty().withMessage('jurisdiction is required')
  ],
  async (req, res) => {
    const validErr = handleValidation(req, res);
    if (validErr !== null) return;

    try {
      const { dispute_details, contract_terms, jurisdiction } = req.body;

      const userMessage = `Analyze the following contract dispute and predict settlement outcomes:

Jurisdiction: ${jurisdiction}
Dispute Details:
${typeof dispute_details === 'string' ? dispute_details : JSON.stringify(dispute_details, null, 2)}

Relevant Contract Terms:
${typeof contract_terms === 'string' ? contract_terms : JSON.stringify(contract_terms, null, 2)}

Please provide:
1. LITIGATION RISK SCORE: Rate litigation risk 1-10 (10 = highest risk of going to trial) with reasoning
2. SETTLEMENT RANGE ESTIMATE:
   - Low estimate (floor): Minimum acceptable settlement
   - Mid estimate (likely): Most probable settlement value
   - High estimate (ceiling): Maximum reasonable demand
   - Express as monetary range or percentage of claimed damages
3. WIN PROBABILITY ASSESSMENT: Estimate probability of prevailing at trial (with key assumptions)
4. NEGOTIATION LEVERAGE POINTS: Strongest arguments for each party
5. TIME-TO-RESOLUTION ESTIMATE: Expected timeline for litigation vs. settlement
6. COST-BENEFIT ANALYSIS: Compare litigation costs vs. settlement costs
7. RECOMMENDED STRATEGY: Settlement vs. litigation recommendation with rationale
8. KEY RISK FACTORS: What could shift outcomes significantly
9. SETTLEMENT TIMING: Optimal time to propose/accept settlement

Base analysis on ${jurisdiction} law and current market conditions for similar disputes.`;

      const result = await callOpenRouter(SYSTEM_PROMPT, userMessage);
      res.json({ success: true, prediction: result, jurisdiction });
    } catch (err) {
      res.status(500).json({ success: false, error: err.message });
    }
  }
);

// POST /api/ai/highlight-risks
// Audit recommendation: stateless risk-clause highlighting endpoint.
router.post(
  '/highlight-risks',
  aiRateLimiter,
  [
    body('contract_text').notEmpty().withMessage('contract_text is required').isLength({ max: 200000 }).withMessage('contract_text too long'),
    body('party_perspective').optional().isString()
  ],
  async (req, res) => {
    const validErr = handleValidation(req, res);
    if (validErr !== null) return;

    try {
      const { contract_text, party_perspective } = req.body;

      const userMessage = `Analyze the following contract text and highlight risk clauses from the perspective of: ${party_perspective || 'the receiving/buying party'}.

CONTRACT TEXT:
${contract_text}

For each risk clause identified, return:
1. CLAUSE EXCERPT: Verbatim text of the risk clause
2. RISK CATEGORY: liability / indemnification / termination / IP / confidentiality / payment / warranty / dispute / other
3. SEVERITY: low / medium / high / critical with reasoning
4. WHY IT MATTERS: Plain-language explanation of the practical risk
5. RECOMMENDED REVISION: Suggested negotiation language to mitigate the risk

End with a "TOP RISKS" summary listing the 3 highest-priority items to renegotiate.`;

      const result = await callOpenRouter(SYSTEM_PROMPT, userMessage);
      res.json({ success: true, analysis: result, party_perspective: party_perspective || 'receiving party' });
    } catch (err) {
      res.status(500).json({ success: false, error: err.message });
    }
  }
);

// POST /api/ai/standard-terms-compare
// Audit recommendation: stateless standard-terms comparison endpoint.
router.post(
  '/standard-terms-compare',
  aiRateLimiter,
  [
    body('proposed_terms').notEmpty().withMessage('proposed_terms is required'),
    body('contract_type').notEmpty().withMessage('contract_type is required'),
    body('industry').optional().isString()
  ],
  async (req, res) => {
    const validErr = handleValidation(req, res);
    if (validErr !== null) return;

    try {
      const { proposed_terms, contract_type, industry } = req.body;

      const userMessage = `Compare the proposed contract terms below against industry-standard ${contract_type} terms${industry ? ` in the ${industry} industry` : ''}.

PROPOSED TERMS:
${typeof proposed_terms === 'string' ? proposed_terms : JSON.stringify(proposed_terms, null, 2)}

Provide:
1. TERM-BY-TERM COMPARISON: For each significant term, list standard vs. proposed and label as MORE FAVORABLE / STANDARD / LESS FAVORABLE.
2. MISSING STANDARD CLAUSES: Common clauses that are missing.
3. UNUSUAL CLAUSES: Clauses that are non-standard or unusual.
4. NEGOTIATION RECOMMENDATIONS: Which terms to push back on first.
5. OVERALL DEVIATION SCORE (0-100): How much this deviates from market standard, with brief justification.`;

      const result = await callOpenRouter(SYSTEM_PROMPT, userMessage);
      res.json({ success: true, comparison: result, contract_type, industry: industry || null });
    } catch (err) {
      res.status(500).json({ success: false, error: err.message });
    }
  }
);

// POST /api/ai/rank-risk-clauses
// Audit recommendation: rank an array of clauses by severity/score.
router.post(
  '/rank-risk-clauses',
  aiRateLimiter,
  [
    body('clauses').isArray({ min: 1 }).withMessage('clauses must be a non-empty array'),
    body('contract_type').optional().isString(),
    body('party_perspective').optional().isString()
  ],
  async (req, res) => {
    const validErr = handleValidation(req, res);
    if (validErr !== null) return;

    try {
      const { clauses, contract_type, party_perspective } = req.body;
      const numbered = clauses
        .map((c, i) => `${i + 1}. ${typeof c === 'string' ? c : (c.text || JSON.stringify(c))}`)
        .join('\n\n');

      const userMessage = `Rank the following contract clauses by risk severity from the perspective of: ${party_perspective || 'the receiving party'}${contract_type ? ` for a ${contract_type} contract` : ''}.

CLAUSES:
${numbered}

For each clause, return JSON-like structured output with:
- index: original 1-based index
- severity_score: 0-100 (higher = riskier)
- severity_label: low / medium / high / critical
- risk_category: liability / indemnification / termination / IP / confidentiality / payment / warranty / dispute / other
- one_line_reason: brief justification
- recommended_action: ACCEPT / NEGOTIATE / REJECT

Then output a final RANKED LIST sorted from highest to lowest severity_score with the top 5 explained in detail.`;

      const result = await callOpenRouter(SYSTEM_PROMPT, userMessage);
      res.json({ success: true, ranking: result, count: clauses.length });
    } catch (err) {
      const code = err.statusCode === 503 ? 503 : 500;
      res.status(code).json({ success: false, error: err.message });
    }
  }
);

// POST /api/ai/suggest-redline-counter
// Audit recommendation: suggest a counter-redline given counterparty redline.
router.post(
  '/suggest-redline-counter',
  aiRateLimiter,
  [
    body('original_clause').notEmpty().withMessage('original_clause is required').isLength({ max: 50000 }),
    body('counterparty_redline').notEmpty().withMessage('counterparty_redline is required').isLength({ max: 50000 }),
    body('our_position').optional().isString().isLength({ max: 5000 })
  ],
  async (req, res) => {
    const validErr = handleValidation(req, res);
    if (validErr !== null) return;

    try {
      const { original_clause, counterparty_redline, our_position } = req.body;

      const userMessage = `Recommend a counter-redline. Provide concrete language plus rationale and fallback positions.

ORIGINAL CLAUSE:
${original_clause}

COUNTERPARTY REDLINE:
${counterparty_redline}

${our_position ? `OUR POSITION / PRIORITIES:\n${our_position}\n\n` : ''}Return:
1. ASSESSMENT: How the counterparty redline shifts risk vs. original
2. PRIMARY COUNTER-REDLINE: Specific redlined language we propose
3. RATIONALE: Why this counter is reasonable for both sides
4. FALLBACK 1: A more conciliatory alternative if they reject the primary
5. FALLBACK 2: A harder-line alternative if they push further
6. RED LINES: Items we cannot concede in this clause`;

      const result = await callOpenRouter(SYSTEM_PROMPT, userMessage);
      res.json({ success: true, counter_redline: result });
    } catch (err) {
      const code = err.statusCode === 503 ? 503 : 500;
      res.status(code).json({ success: false, error: err.message });
    }
  }
);

// POST /api/ai/chat-about-contract
// Audit recommendation: stateless multi-turn chat anchored to a contract.
router.post(
  '/chat-about-contract',
  aiRateLimiter,
  [
    body('contract_text').notEmpty().withMessage('contract_text is required').isLength({ max: 200000 }),
    body('messages').isArray({ min: 1 }).withMessage('messages must be a non-empty array')
  ],
  async (req, res) => {
    const validErr = handleValidation(req, res);
    if (validErr !== null) return;

    try {
      const { contract_text, messages } = req.body;
      const transcript = messages
        .map((m) => {
          const role = (m && m.role) ? String(m.role).toUpperCase() : 'USER';
          const content = m && typeof m.content === 'string' ? m.content : JSON.stringify(m);
          return `${role}: ${content}`;
        })
        .join('\n\n');

      const userMessage = `You are anchored to the contract below. Answer the user's most recent question grounded in this text. If the contract does not address the question, say so explicitly.

CONTRACT TEXT:
${contract_text}

CONVERSATION HISTORY:
${transcript}

Respond as the assistant. Cite the relevant section/paragraph when possible (verbatim or by clear reference). Be concise but complete.`;

      const result = await callOpenRouter(SYSTEM_PROMPT, userMessage);
      res.json({ success: true, reply: result });
    } catch (err) {
      const code = err.statusCode === 503 ? 503 : 500;
      res.status(code).json({ success: false, error: err.message });
    }
  }
);

module.exports = router;
