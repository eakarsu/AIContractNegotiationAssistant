const express = require('express');
const { PrismaClient } = require('@prisma/client');
const fetch = require('node-fetch');

const router = express.Router();
const prisma = new PrismaClient();

const parseAIResponse = (content) => {
  if (!content) {
    console.error('[Lease parseAIResponse] No content provided');
    return null;
  }
  let text = typeof content === 'string' ? content : JSON.stringify(content);
  console.log('[Lease parseAIResponse] Raw content first 200 chars:', text.substring(0, 200));

  // Strip markdown code fences
  text = text.replace(/^```(?:json)?\s*\n?/i, '').replace(/\n?```\s*$/i, '');

  // Try direct parse first
  try {
    let data = JSON.parse(text);
    if (data.json && typeof data.json === 'object') data = data.json;
    if (data.response && typeof data.response === 'object') data = data.response;
    if (data.result && typeof data.result === 'object') data = data.result;
    console.log('[Lease parseAIResponse] Direct parse succeeded, keys:', Object.keys(data));
    return data;
  } catch (e) {
    console.log('[Lease parseAIResponse] Direct parse failed:', e.message);
  }

  // Try extracting JSON object with regex
  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (jsonMatch) {
    try {
      let data = JSON.parse(jsonMatch[0]);
      if (data.json && typeof data.json === 'object') data = data.json;
      if (data.response && typeof data.response === 'object') data = data.response;
      if (data.result && typeof data.result === 'object') data = data.result;
      console.log('[Lease parseAIResponse] Regex parse succeeded, keys:', Object.keys(data));
      return data;
    } catch (e) {
      console.error('[Lease parseAIResponse] Regex parse also failed:', e.message);
      console.error('[Lease parseAIResponse] Extracted text first 500 chars:', jsonMatch[0].substring(0, 500));
    }
  } else {
    console.error('[Lease parseAIResponse] No JSON object found in content');
  }

  return null;
};

// Get all lease analyses
router.get('/', async (req, res) => {
  try {
    const analyses = await prisma.leaseAnalysis.findMany({
      orderBy: { createdAt: 'desc' }
    });
    res.json(analyses);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get single lease analysis
router.get('/:id', async (req, res) => {
  try {
    const analysis = await prisma.leaseAnalysis.findUnique({
      where: { id: parseInt(req.params.id) }
    });
    if (!analysis) {
      return res.status(404).json({ error: 'Lease analysis not found' });
    }
    res.json(analysis);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create lease analysis
router.post('/', async (req, res) => {
  try {
    const analysis = await prisma.leaseAnalysis.create({
      data: req.body
    });
    res.status(201).json(analysis);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Update lease analysis
router.put('/:id', async (req, res) => {
  try {
    const analysis = await prisma.leaseAnalysis.update({
      where: { id: parseInt(req.params.id) },
      data: req.body
    });
    res.json(analysis);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Delete lease analysis
router.delete('/:id', async (req, res) => {
  try {
    await prisma.leaseAnalysis.delete({
      where: { id: parseInt(req.params.id) }
    });
    res.json({ message: 'Lease analysis deleted successfully' });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// AI-powered lease analysis
router.post('/analyze', async (req, res) => {
  try {
    const { title, leaseContent, propertyAddress, propertyType, landlord, tenant, monthlyRent, securityDeposit, leaseTerm } = req.body;

    if (!leaseContent) {
      return res.status(400).json({ error: 'Lease content is required' });
    }

    const systemMessage = `You are a real estate attorney and tenant rights advocate with 15+ years of experience reviewing residential and commercial leases. You specialize in identifying unfair terms, hidden costs, and tenant traps in lease agreements. You are equally familiar with landlord-tenant laws across US states and can spot provisions that may be unenforceable.

Your lease analysis approach:
1. Evaluate every clause from the tenant's perspective — identify what's fair, what's aggressive, and what's illegal
2. Check rent escalation clauses, maintenance responsibilities, and early termination penalties
3. Assess security deposit terms against local laws (many states cap deposits and require interest)
4. Review subletting, assignment, and renewal provisions
5. Identify hidden fees (late fees, administrative fees, common area maintenance charges)
6. Check for illegal or unenforceable provisions (waiver of habitability, unreasonable entry rights)
7. Compare financial terms against market rates when possible
8. Flag any provisions that shift unusual risk or liability to the tenant

Always respond with valid JSON only — no markdown, no code fences, no extra text.`;

    const prompt = `Perform a comprehensive analysis of this real estate lease agreement from the tenant's perspective.

PROPERTY DETAILS:
- Address: ${propertyAddress || 'Not specified'}
- Type: ${propertyType || 'Not specified'}
- Landlord: ${landlord || 'Not specified'}
- Tenant: ${tenant || 'Not specified'}
- Monthly Rent: ${monthlyRent ? '$' + monthlyRent : 'Not specified'}
- Security Deposit: ${securityDeposit ? '$' + securityDeposit : 'Not specified'}
- Lease Term: ${leaseTerm || 'Not specified'}

FULL LEASE CONTENT:
---
${leaseContent}
---

Analyze thoroughly and respond with a JSON object containing:
{
  "score": <number 0-100, overall tenant favorability, where 100 = extremely tenant-friendly>,
  "keyTerms": [
    {
      "term": "<term name, e.g., 'Rent Escalation'>",
      "value": "<what the lease says>",
      "assessment": "favorable" | "neutral" | "unfavorable" | "concerning",
      "marketComparison": "<how this compares to typical terms>",
      "concern": "<specific concern or positive note>"
    }
  ],
  "risks": [
    {
      "risk": "<risk name>",
      "severity": "low" | "medium" | "high" | "critical",
      "clause": "<relevant clause text>",
      "explanation": "<detailed explanation of the risk>",
      "financialImpact": "<estimated financial exposure if applicable>"
    }
  ],
  "redFlags": [
    {
      "flag": "<description of the red flag>",
      "clause": "<relevant text>",
      "reason": "<why this is a red flag>",
      "legalNote": "<whether this may be unenforceable in some jurisdictions>"
    }
  ],
  "positiveTerms": ["<tenant-favorable provisions>"],
  "hiddenCosts": ["<fees or costs that may not be immediately obvious>"],
  "recommendations": [
    {
      "recommendation": "<specific action>",
      "priority": "high" | "medium" | "low",
      "suggestedLanguage": "<alternative language to propose>"
    }
  ],
  "negotiationPoints": ["<top items to negotiate before signing>"],
  "summary": "<4-5 sentence comprehensive assessment of this lease>"
}`;

    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'http://localhost:5173',
        'X-Title': 'Contract Negotiation Assistant'
      },
      body: JSON.stringify({
        model: 'anthropic/claude-3-5-sonnet-20241022',
        messages: [
          { role: 'system', content: systemMessage },
          { role: 'user', content: prompt }
        ],
        response_format: { type: 'json_object' },
        max_tokens: 16000
      })
    });

    const aiResult = await response.json();

    // Log full response structure for debugging
    console.log('[Lease Analyzer] Response status:', response.status);
    console.log('[Lease Analyzer] AI result keys:', Object.keys(aiResult));

    if (aiResult.error) {
      console.error('[Lease Analyzer] API Error:', JSON.stringify(aiResult.error));
      throw new Error(`OpenRouter API Error: ${aiResult.error.message || JSON.stringify(aiResult.error)}`);
    }

    const finishReason = aiResult.choices?.[0]?.finish_reason;
    const rawContent = aiResult.choices?.[0]?.message?.content;
    console.log(`[Lease Analyzer] finish_reason: ${finishReason}, content length: ${rawContent?.length || 0}`);
    if (finishReason === 'length') {
      console.warn('[Lease Analyzer] WARNING: Response was truncated due to max_tokens limit');
    }
    if (!rawContent) {
      console.error('[Lease Analyzer] ERROR: No content in response. Full response:', JSON.stringify(aiResult).substring(0, 1000));
    }

    const analysisData = parseAIResponse(rawContent) || {
      score: 50,
      keyTerms: [],
      risks: [],
      recommendations: [],
      summary: 'Unable to analyze'
    };

    console.log('[Lease Analyzer] Parsed analysis keys:', Object.keys(analysisData), 'score:', analysisData.score);

    const analysis = await prisma.leaseAnalysis.create({
      data: {
        title: title || `Lease Analysis - ${propertyAddress || 'Property'}`,
        propertyAddress: propertyAddress || null,
        propertyType: propertyType || null,
        landlord: landlord || null,
        tenant: tenant || null,
        leaseContent,
        monthlyRent: monthlyRent ? parseFloat(monthlyRent) : null,
        securityDeposit: securityDeposit ? parseFloat(securityDeposit) : null,
        leaseTerm: leaseTerm || null,
        keyTerms: JSON.stringify(analysisData.keyTerms || []),
        risks: JSON.stringify(analysisData.risks || []),
        recommendations: JSON.stringify(analysisData.recommendations || []),
        score: parseInt(analysisData.score) || 50,
        aiAnalysis: JSON.stringify(analysisData)
      }
    });

    res.status(201).json(analysis);
  } catch (error) {
    console.error('Lease analysis error:', error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
