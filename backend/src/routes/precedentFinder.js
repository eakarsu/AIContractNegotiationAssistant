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

// Get all precedent searches
router.get('/', async (req, res) => {
  try {
    const searches = await prisma.precedentSearch.findMany({
      orderBy: { createdAt: 'desc' }
    });
    res.json(searches);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get single precedent search
router.get('/:id', async (req, res) => {
  try {
    const search = await prisma.precedentSearch.findUnique({
      where: { id: parseInt(req.params.id) }
    });
    if (!search) {
      return res.status(404).json({ error: 'Precedent search not found' });
    }
    res.json(search);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create precedent search
router.post('/', async (req, res) => {
  try {
    const search = await prisma.precedentSearch.create({
      data: req.body
    });
    res.status(201).json(search);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Update precedent search
router.put('/:id', async (req, res) => {
  try {
    const search = await prisma.precedentSearch.update({
      where: { id: parseInt(req.params.id) },
      data: req.body
    });
    res.json(search);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Delete precedent search
router.delete('/:id', async (req, res) => {
  try {
    await prisma.precedentSearch.delete({
      where: { id: parseInt(req.params.id) }
    });
    res.json({ message: 'Precedent search deleted successfully' });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// AI-powered precedent search
router.post('/search', async (req, res) => {
  try {
    const { query, clauseType, jurisdiction } = req.body;

    if (!query) {
      return res.status(400).json({ error: 'Search query is required' });
    }

    const systemMessage = `You are a senior legal research specialist with extensive experience in case law analysis, contract precedents, and legal scholarship. You have access to comprehensive knowledge of landmark cases, statutory frameworks, and industry-standard contract language across multiple jurisdictions.

Your research approach:
1. Identify the most relevant and authoritative precedents for the query
2. Focus on cases that are still good law (not overruled or distinguished)
3. Prioritize precedents from the specified jurisdiction, then related jurisdictions
4. Include both supporting and cautionary precedents (cases where similar clauses were struck down)
5. Provide standard clause language that reflects current best practices based on the legal landscape
6. Consider recent trends in how courts interpret the relevant contract provisions
7. Note any splits in authority or evolving legal standards

Always respond with valid JSON only — no markdown, no code fences, no extra text.`;

    const prompt = `Research legal precedents, case law, and standard contract language for the following query.

RESEARCH QUERY: ${query}
${clauseType ? `CLAUSE TYPE: ${clauseType}` : ''}
${jurisdiction ? `JURISDICTION: ${jurisdiction}` : 'JURISDICTION: General / Multi-jurisdictional'}

Provide comprehensive research results as a JSON object:
{
  "precedents": [
    {
      "title": "<case name>",
      "citation": "<formal legal citation>",
      "year": <year>,
      "court": "<court name>",
      "summary": "<2-3 sentence summary of the case and its holding>",
      "relevance": "<how this case applies to the query>",
      "keyHolding": "<the court's key ruling>",
      "impact": "supporting" | "cautionary" | "mixed"
    }
  ],
  "relevanceScore": <number 0-100>,
  "citations": ["<formatted legal citations>"],
  "standardLanguage": "<recommended standard clause language based on precedent analysis, ready to use in a contract>",
  "alternativeLanguage": "<alternative clause language for different risk tolerances>",
  "legalLandscape": "<paragraph describing the current legal landscape and trends for this area>",
  "recommendations": [
    {
      "recommendation": "<specific drafting recommendation>",
      "basis": "<which precedent or principle supports this>",
      "priority": "high" | "medium" | "low"
    }
  ],
  "riskFactors": ["<factors that could affect enforceability>"],
  "summary": "<3-4 sentence executive summary of findings>"
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
      precedents: [],
      relevanceScore: 50,
      citations: [],
      recommendations: []
    };

    const search = await prisma.precedentSearch.create({
      data: {
        query,
        clauseType: clauseType || null,
        jurisdiction: jurisdiction || null,
        precedents: JSON.stringify(analysisData.precedents || []),
        relevanceScore: parseInt(analysisData.relevanceScore) || 50,
        citations: JSON.stringify(analysisData.citations || []),
        aiAnalysis: JSON.stringify(analysisData)
      }
    });

    res.status(201).json(search);
  } catch (error) {
    console.error('Precedent search error:', error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
