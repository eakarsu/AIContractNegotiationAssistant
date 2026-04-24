const express = require('express');
const { PrismaClient } = require('@prisma/client');
const fetch = require('node-fetch');

const router = express.Router();
const prisma = new PrismaClient();

// Get all redlines
router.get('/', async (req, res) => {
  try {
    const { status, contractId } = req.query;
    const where = {};
    if (status) where.status = status;
    if (contractId) where.contractId = parseInt(contractId);

    const redlines = await prisma.redline.findMany({
      where,
      include: {
        contract: { select: { id: true, title: true, status: true } }
      },
      orderBy: { createdAt: 'desc' }
    });
    res.json(redlines);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get single redline
router.get('/:id', async (req, res) => {
  try {
    const redline = await prisma.redline.findUnique({
      where: { id: parseInt(req.params.id) },
      include: {
        contract: {
          include: {
            party: true
          }
        }
      }
    });
    if (!redline) {
      return res.status(404).json({ error: 'Redline not found' });
    }
    res.json(redline);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create redline
router.post('/', async (req, res) => {
  try {
    const redline = await prisma.redline.create({
      data: req.body,
      include: { contract: { select: { id: true, title: true } } }
    });
    res.status(201).json(redline);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Update redline
router.put('/:id', async (req, res) => {
  try {
    const redline = await prisma.redline.update({
      where: { id: parseInt(req.params.id) },
      data: req.body
    });
    res.json(redline);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Delete redline
router.delete('/:id', async (req, res) => {
  try {
    await prisma.redline.delete({
      where: { id: parseInt(req.params.id) }
    });
    res.json({ message: 'Redline deleted successfully' });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Accept redline
router.post('/:id/accept', async (req, res) => {
  try {
    const redline = await prisma.redline.update({
      where: { id: parseInt(req.params.id) },
      data: { status: 'accepted' }
    });
    res.json(redline);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Reject redline
router.post('/:id/reject', async (req, res) => {
  try {
    const redline = await prisma.redline.update({
      where: { id: parseInt(req.params.id) },
      data: { status: 'rejected' }
    });
    res.json(redline);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// AI-powered redline suggestion
router.post('/suggest/:contractId', async (req, res) => {
  try {
    const { section, context } = req.body;
    const contract = await prisma.contract.findUnique({
      where: { id: parseInt(req.params.contractId) }
    });

    if (!contract) {
      return res.status(404).json({ error: 'Contract not found' });
    }

    const contractText = context || contract.content || '';

    const systemMessage = `You are an expert contract attorney with 20+ years of experience in contract negotiation, risk mitigation, and legal drafting. You specialize in identifying problematic clauses, ambiguous language, missing protections, and opportunities for stronger legal positioning. Your redline suggestions are precise, actionable, and legally sound.`;

    const userMessage = `Analyze the following contract text and provide multiple redline suggestions to improve legal protection, clarity, fairness, and enforceability.

CONTRACT: ${contract.title}
CONTRACT TYPE: ${contract.contractType || 'General'}
SECTION FOCUS: ${section || 'Entire document'}

CONTRACT TEXT:
${contractText.substring(0, 6000)}

Respond in JSON format with the following structure:
{
  "suggestions": [
    {
      "section": "Name of the section or clause being addressed",
      "originalText": "The exact text from the contract that should be changed (quote directly)",
      "proposedText": "The improved replacement text with better legal protection",
      "reason": "Clear explanation of why this change improves the contract",
      "severity": "critical | major | minor | enhancement",
      "category": "risk_mitigation | clarity | compliance | fairness | missing_clause | ambiguity"
    }
  ],
  "overallAssessment": "Brief overall assessment of the contract's strengths and weaknesses",
  "priorityActions": ["Top 3 most important changes to make, in order of priority"]
}

Provide exactly 3 of the most important redline suggestions. Focus on the highest-priority issues:
1. Vague or ambiguous language that could be exploited
2. Missing protections or one-sided terms
3. Legal risks and liability exposure`;

    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'http://localhost:5173',
        'X-Title': 'Contract Negotiation Assistant'
      },
      body: JSON.stringify({
        model: process.env.OPENROUTER_MODEL || 'anthropic/claude-haiku-4.5',
        messages: [
          { role: 'system', content: systemMessage },
          { role: 'user', content: userMessage }
        ],
        response_format: { type: 'json_object' },
        max_tokens: 16000
      })
    });

    const aiResult = await response.json();

    const finishReason = aiResult.choices?.[0]?.finish_reason;
    const rawContent = aiResult.choices?.[0]?.message?.content;
    console.log(`[Redline Suggest] finish_reason: ${finishReason}, content length: ${rawContent?.length || 0}`);
    if (finishReason === 'length') {
      console.warn('[Redline Suggest] WARNING: Response was truncated due to max_tokens limit');
    }
    if (!rawContent) {
      console.error('[Redline Suggest] ERROR: No content in response', JSON.stringify(aiResult).substring(0, 500));
      return res.status(500).json({ error: 'AI returned empty response' });
    }

    let parsed;
    try {
      parsed = JSON.parse(rawContent);
      if (parsed.json && typeof parsed.json === 'object') {
        parsed = parsed.json;
      }
    } catch {
      // Try to extract JSON from markdown fences
      const jsonMatch = rawContent.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        try { parsed = JSON.parse(jsonMatch[0]); } catch { parsed = null; }
      }
    }

    if (!parsed || !Array.isArray(parsed.suggestions) || parsed.suggestions.length === 0) {
      // Fallback: create single suggestion from raw content
      const redline = await prisma.redline.create({
        data: {
          contractId: contract.id,
          originalText: contractText.substring(0, 500),
          proposedText: rawContent.substring(0, 2000),
          section: section || 'General',
          reason: 'AI suggested improvement',
          author: 'AI Assistant',
          status: 'pending'
        },
        include: { contract: { select: { id: true, title: true } } }
      });
      return res.status(201).json({ redlines: [redline], aiAnalysis: { overallAssessment: '', priorityActions: [] } });
    }

    // Convert content to proper string format
    const formatContent = (content) => {
      if (!content) return '';
      if (typeof content === 'string') return content;
      if (Array.isArray(content)) return content.join('\n');
      if (typeof content === 'object') return JSON.stringify(content, null, 2);
      return String(content);
    };

    // Create redlines from AI suggestions (cap at 4 max)
    const suggestions = parsed.suggestions.slice(0, 4);
    const createdRedlines = [];
    for (const suggestion of suggestions) {
      const redline = await prisma.redline.create({
        data: {
          contractId: contract.id,
          originalText: formatContent(suggestion.originalText) || '',
          proposedText: formatContent(suggestion.proposedText) || '',
          section: formatContent(suggestion.section) || section || 'General',
          reason: `[${(suggestion.severity || 'minor').toUpperCase()}] ${formatContent(suggestion.reason)}${suggestion.category ? ` (${suggestion.category})` : ''}`,
          author: 'AI Assistant',
          status: 'pending'
        },
        include: { contract: { select: { id: true, title: true } } }
      });
      createdRedlines.push(redline);
    }

    res.status(201).json({
      redlines: createdRedlines,
      aiAnalysis: {
        overallAssessment: parsed.overallAssessment || '',
        priorityActions: parsed.priorityActions || []
      }
    });
  } catch (error) {
    console.error('[Redline Suggest] Error:', error.message);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
