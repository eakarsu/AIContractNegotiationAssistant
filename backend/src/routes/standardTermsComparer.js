const express = require('express');
const { PrismaClient } = require('@prisma/client');
const fetch = require('node-fetch');

const router = express.Router();
const prisma = new PrismaClient();

const parseAIResponse = (content) => {
  if (!content) return null;
  let text = typeof content === 'string' ? content : JSON.stringify(content);

  // Strip markdown code fences
  text = text.replace(/^```(?:json)?\s*\n?/i, '').replace(/\n?```\s*$/i, '');

  // Try direct parse first
  try {
    let data = JSON.parse(text);
    if (data.json && typeof data.json === 'object') data = data.json;
    if (data.response && typeof data.response === 'object') data = data.response;
    if (data.result && typeof data.result === 'object') data = data.result;
    return data;
  } catch (e) {
    // Direct parse failed, try regex extraction
  }

  // Try extracting JSON object with regex
  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (jsonMatch) {
    try {
      let data = JSON.parse(jsonMatch[0]);
      if (data.json && typeof data.json === 'object') data = data.json;
      if (data.response && typeof data.response === 'object') data = data.response;
      if (data.result && typeof data.result === 'object') data = data.result;
      return data;
    } catch (e) {
      console.error('[parseAIResponse] Failed to parse extracted JSON:', e.message);
    }
  }

  console.error('[parseAIResponse] Could not parse AI response, first 300 chars:', text.substring(0, 300));
  return null;
};

// Get all comparisons
router.get('/', async (req, res) => {
  try {
    const comparisons = await prisma.standardTermComparison.findMany({
      orderBy: { createdAt: 'desc' }
    });
    res.json(comparisons);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get single comparison
router.get('/:id', async (req, res) => {
  try {
    const comparison = await prisma.standardTermComparison.findUnique({
      where: { id: parseInt(req.params.id) }
    });
    if (!comparison) {
      return res.status(404).json({ error: 'Comparison not found' });
    }
    res.json(comparison);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create comparison
router.post('/', async (req, res) => {
  try {
    const comparison = await prisma.standardTermComparison.create({
      data: req.body
    });
    res.status(201).json(comparison);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Update comparison
router.put('/:id', async (req, res) => {
  try {
    const comparison = await prisma.standardTermComparison.update({
      where: { id: parseInt(req.params.id) },
      data: req.body
    });
    res.json(comparison);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Delete comparison
router.delete('/:id', async (req, res) => {
  try {
    await prisma.standardTermComparison.delete({
      where: { id: parseInt(req.params.id) }
    });
    res.json({ message: 'Comparison deleted successfully' });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// AI-powered comparison
router.post('/compare', async (req, res) => {
  try {
    const { title, contractTerms, standardTerms, contractId } = req.body;

    if (!contractTerms || !standardTerms) {
      return res.status(400).json({ error: 'Both contract terms and standard terms are required' });
    }

    const systemMessage = `You are an expert contract compliance analyst specializing in benchmarking contract terms against industry standards, regulatory requirements, and best practices. You have deep knowledge of standard contract frameworks across industries including SaaS (SaaS Agreement standards), procurement (UCC), construction (AIA), and employment law.

Your analysis approach:
1. Perform a clause-by-clause comparison identifying every deviation
2. Classify each deviation by severity: critical (deal-breaker), major (significant disadvantage), minor (cosmetic or low-impact)
3. Assess the cumulative risk of all deviations together
4. Provide specific language suggestions to bring terms into alignment
5. Highlight any terms that are MORE favorable than standard (positive deviations)

Always respond with valid JSON only — no markdown, no code fences, no extra text.`;

    const prompt = `Perform a detailed comparison between the following contract terms and the provided standard/industry terms.

YOUR CONTRACT TERMS:
---
${contractTerms}
---

STANDARD/INDUSTRY TERMS:
---
${standardTerms}
---

Analyze thoroughly and respond with a JSON object containing:
{
  "complianceScore": <number 0-100, where 100 = fully aligned with standards>,
  "deviations": [
    {
      "term": "<name of the term or clause>",
      "contractVersion": "<what your contract says>",
      "standardVersion": "<what the standard says>",
      "severity": "critical" | "major" | "minor",
      "impact": "<detailed explanation of business/legal impact>",
      "direction": "unfavorable" | "favorable" | "neutral",
      "suggestedFix": "<specific language to bring into alignment>"
    }
  ],
  "positiveDeviations": ["<list of terms where your contract is MORE favorable than standard>"],
  "riskAssessment": "<comprehensive paragraph assessing overall risk posture considering all deviations together>",
  "recommendations": [
    {
      "priority": "high" | "medium" | "low",
      "action": "<specific recommended action>",
      "rationale": "<why this matters>"
    }
  ],
  "negotiationLeverage": "<advice on which deviations to push back on and which to accept>",
  "summary": "<3-4 sentence executive summary of the comparison findings>"
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
        model: process.env.OPENROUTER_MODEL || 'anthropic/claude-3-haiku-20240307',
        messages: [
          { role: 'system', content: systemMessage },
          { role: 'user', content: prompt }
        ],
        response_format: { type: 'json_object' },
        max_tokens: 16000
      })
    });

    const aiResult = await response.json();

    const finishReason = aiResult.choices?.[0]?.finish_reason;
    const rawContent = aiResult.choices?.[0]?.message?.content;
    console.log(`[AI Response] finish_reason: ${finishReason}, content length: ${rawContent?.length || 0}`);
    if (finishReason === 'length') {
      console.warn('[AI Response] WARNING: Response was truncated due to max_tokens limit');
    }
    if (!rawContent) {
      console.error('[AI Response] ERROR: No content in response', JSON.stringify(aiResult).substring(0, 500));
    }

    if (aiResult.error) {
      throw new Error(`OpenRouter API Error: ${aiResult.error.message || JSON.stringify(aiResult.error)}`);
    }

    const analysisData = parseAIResponse(aiResult.choices?.[0]?.message?.content) || {
      complianceScore: 50,
      deviations: [],
      riskAssessment: 'Unable to analyze',
      recommendations: []
    };

    const comparison = await prisma.standardTermComparison.create({
      data: {
        contractId: contractId || null,
        title: title || 'Term Comparison',
        contractTerms,
        standardTerms,
        deviations: JSON.stringify(analysisData.deviations || []),
        riskAssessment: typeof analysisData.riskAssessment === 'string' ? analysisData.riskAssessment : JSON.stringify(analysisData.riskAssessment),
        recommendations: JSON.stringify(analysisData.recommendations || []),
        complianceScore: parseInt(analysisData.complianceScore) || 50,
        aiAnalysis: JSON.stringify(analysisData)
      }
    });

    res.status(201).json(comparison);
  } catch (error) {
    console.error('Standard terms comparison error:', error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
