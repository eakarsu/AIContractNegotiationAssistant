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

// Get all NDAs
router.get('/', async (req, res) => {
  try {
    const ndas = await prisma.nDADocument.findMany({
      orderBy: { createdAt: 'desc' }
    });
    res.json(ndas);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get single NDA
router.get('/:id', async (req, res) => {
  try {
    const nda = await prisma.nDADocument.findUnique({
      where: { id: parseInt(req.params.id) }
    });
    if (!nda) {
      return res.status(404).json({ error: 'NDA not found' });
    }
    res.json(nda);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create NDA
router.post('/', async (req, res) => {
  try {
    const nda = await prisma.nDADocument.create({
      data: req.body
    });
    res.status(201).json(nda);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Update NDA
router.put('/:id', async (req, res) => {
  try {
    const nda = await prisma.nDADocument.update({
      where: { id: parseInt(req.params.id) },
      data: req.body
    });
    res.json(nda);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Delete NDA
router.delete('/:id', async (req, res) => {
  try {
    await prisma.nDADocument.delete({
      where: { id: parseInt(req.params.id) }
    });
    res.json({ message: 'NDA deleted successfully' });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// AI-powered NDA generation
router.post('/generate', async (req, res) => {
  try {
    const { title, disclosingParty, receivingParty, purpose, duration, jurisdiction } = req.body;

    if (!disclosingParty || !receivingParty) {
      return res.status(400).json({ error: 'Disclosing and receiving party names are required' });
    }

    const systemMessage = `You are an experienced corporate attorney specializing in intellectual property protection and confidentiality agreements. You have drafted thousands of NDAs for companies ranging from startups to Fortune 500 corporations. Your NDAs are known for being comprehensive yet clear, enforceable, and balanced.

Your NDA drafting principles:
1. Use precise, unambiguous definitions — especially for "Confidential Information"
2. Include standard carve-outs (publicly available info, independently developed, prior knowledge)
3. Specify clear obligations with reasonable scope (not overreaching)
4. Include appropriate remedies including injunctive relief provisions
5. Address return/destruction of materials upon termination
6. Include residuals clause where appropriate
7. Ensure enforceability in the specified jurisdiction
8. Use professional legal formatting with numbered sections and subsections

Always respond with valid JSON only — no markdown, no code fences, no extra text.`;

    const prompt = `Draft a comprehensive, professional Non-Disclosure Agreement with the following parameters:

DISCLOSING PARTY: ${disclosingParty}
RECEIVING PARTY: ${receivingParty}
PURPOSE: ${purpose || 'Business discussions and potential collaboration'}
CONFIDENTIALITY DURATION: ${duration || '2 years'}
GOVERNING JURISDICTION: ${jurisdiction || 'United States'}

Generate a complete NDA and respond with a JSON object containing:
{
  "content": "<the full NDA document text with professional formatting, numbered sections, signature blocks, and effective date placeholder. Include: Preamble/Recitals, Definitions, Scope of Confidential Information, Exclusions, Obligations, Permitted Disclosures, Term and Termination, Return of Materials, Remedies, General Provisions, Signature Blocks>",
  "confidentialInfo": "<detailed description of what constitutes Confidential Information under this NDA>",
  "exclusions": "<standard exclusions from confidentiality obligations with explanations>",
  "obligations": "<key obligations of the Receiving Party, clearly listed>",
  "sections": ["<ordered list of all section titles in the NDA>"],
  "keyProvisions": [
    {
      "provision": "<name>",
      "description": "<what this provision does>",
      "importance": "<why it matters>"
    }
  ],
  "enforceabilityNotes": "<notes on enforceability in the specified jurisdiction>",
  "summary": "<3-4 sentence executive summary of the NDA's key terms and protections>"
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
      content: 'Unable to generate NDA',
      confidentialInfo: '',
      exclusions: '',
      obligations: ''
    };

    // Helper to ensure values are strings (AI may return arrays or objects)
    const toStr = (val) => {
      if (!val) return '';
      if (typeof val === 'string') return val;
      if (Array.isArray(val)) return val.join('\n');
      if (typeof val === 'object') return JSON.stringify(val, null, 2);
      return String(val);
    };

    const nda = await prisma.nDADocument.create({
      data: {
        title: title || `NDA - ${disclosingParty} & ${receivingParty}`,
        disclosingParty,
        receivingParty,
        purpose: purpose || 'Business discussions',
        duration: duration || '2 years',
        jurisdiction: jurisdiction || 'United States',
        content: toStr(analysisData.content) || 'Document generation failed',
        confidentialInfo: toStr(analysisData.confidentialInfo),
        exclusions: toStr(analysisData.exclusions),
        obligations: toStr(analysisData.obligations),
        status: 'draft',
        aiAnalysis: JSON.stringify(analysisData)
      }
    });

    res.status(201).json(nda);
  } catch (error) {
    console.error('NDA generation error:', error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
