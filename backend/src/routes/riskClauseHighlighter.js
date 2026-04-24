const express = require('express');
const { PrismaClient } = require('@prisma/client');
const fetch = require('node-fetch');

const router = express.Router();
const prisma = new PrismaClient();

// Helper function to parse AI response
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

// Get all risk clause highlights
router.get('/', async (req, res) => {
  try {
    const highlights = await prisma.riskClauseHighlight.findMany({
      orderBy: { createdAt: 'desc' }
    });
    res.json(highlights);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get single highlight
router.get('/:id', async (req, res) => {
  try {
    const highlight = await prisma.riskClauseHighlight.findUnique({
      where: { id: parseInt(req.params.id) }
    });
    if (!highlight) {
      return res.status(404).json({ error: 'Risk clause highlight not found' });
    }
    res.json(highlight);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create highlight
router.post('/', async (req, res) => {
  try {
    const highlight = await prisma.riskClauseHighlight.create({
      data: req.body
    });
    res.status(201).json(highlight);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Update highlight
router.put('/:id', async (req, res) => {
  try {
    const highlight = await prisma.riskClauseHighlight.update({
      where: { id: parseInt(req.params.id) },
      data: req.body
    });
    res.json(highlight);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Delete highlight
router.delete('/:id', async (req, res) => {
  try {
    await prisma.riskClauseHighlight.delete({
      where: { id: parseInt(req.params.id) }
    });
    res.json({ message: 'Risk clause highlight deleted successfully' });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// AI-powered risk clause highlighting
router.post('/analyze', async (req, res) => {
  try {
    const { title, content, contractId, clauseId } = req.body;

    if (!content) {
      return res.status(400).json({ error: 'Content is required' });
    }

    const systemMessage = `You are a senior contract risk analyst with 20+ years of experience in corporate law, specializing in identifying hidden risks, ambiguous language, and unfavorable terms in legal contracts. You have expertise across multiple jurisdictions and industries including technology, finance, healthcare, and real estate.

Your analysis approach:
1. Identify specific risky phrases, ambiguous wording, and one-sided terms
2. Assess each risk by severity (financial exposure, legal liability, operational impact)
3. Consider how courts have historically interpreted similar language
4. Provide actionable, specific rewording suggestions — not generic advice
5. Flag missing protections that should be present (e.g., limitation of liability caps, notice periods, cure periods)

Always respond with valid JSON only — no markdown, no code fences, no extra text.`;

    const prompt = `Perform a comprehensive risk analysis on the following contract clause.

CLAUSE TITLE: ${title || 'Untitled Clause'}

CLAUSE CONTENT:
---
${content}
---

Analyze this clause thoroughly and respond with a JSON object containing:
{
  "riskLevel": "low" | "medium" | "high",
  "riskScore": <number 0-100, where 0=no risk, 100=extreme risk>,
  "highlightedText": [
    {
      "text": "<exact risky text from the clause>",
      "riskType": "<e.g., Ambiguous Language, One-Sided Term, Missing Protection, Unlimited Liability, etc.>",
      "severity": "low" | "medium" | "high"
    }
  ],
  "explanation": "<detailed paragraph explaining all identified risks, their potential consequences, and how they interact>",
  "suggestions": [
    {
      "issue": "<specific problem>",
      "currentText": "<problematic text>",
      "suggestedText": "<improved text>",
      "rationale": "<why this change reduces risk>"
    }
  ],
  "missingProtections": ["<list of standard protections absent from this clause>"],
  "summary": "<2-3 sentence executive summary of the risk profile>"
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
      riskLevel: 'medium',
      riskScore: 50,
      highlightedText: [],
      explanation: 'Unable to analyze',
      suggestions: []
    };

    const highlight = await prisma.riskClauseHighlight.create({
      data: {
        contractId: contractId || null,
        clauseId: clauseId || null,
        title: title || 'Untitled Analysis',
        content,
        riskLevel: analysisData.riskLevel || 'medium',
        riskScore: parseInt(analysisData.riskScore) || 50,
        highlightedText: JSON.stringify(analysisData.highlightedText || []),
        explanation: typeof analysisData.explanation === 'string' ? analysisData.explanation : JSON.stringify(analysisData.explanation),
        suggestions: JSON.stringify(analysisData.suggestions || []),
        aiAnalysis: JSON.stringify(analysisData)
      }
    });

    res.status(201).json(highlight);
  } catch (error) {
    console.error('Risk clause analysis error:', error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
