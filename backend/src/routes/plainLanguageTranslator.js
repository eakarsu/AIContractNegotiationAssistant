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

// Get all translations
router.get('/', async (req, res) => {
  try {
    const translations = await prisma.plainLanguageTranslation.findMany({
      orderBy: { createdAt: 'desc' }
    });
    res.json(translations);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get single translation
router.get('/:id', async (req, res) => {
  try {
    const translation = await prisma.plainLanguageTranslation.findUnique({
      where: { id: parseInt(req.params.id) }
    });
    if (!translation) {
      return res.status(404).json({ error: 'Translation not found' });
    }
    res.json(translation);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create translation
router.post('/', async (req, res) => {
  try {
    const translation = await prisma.plainLanguageTranslation.create({
      data: req.body
    });
    res.status(201).json(translation);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Update translation
router.put('/:id', async (req, res) => {
  try {
    const translation = await prisma.plainLanguageTranslation.update({
      where: { id: parseInt(req.params.id) },
      data: req.body
    });
    res.json(translation);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Delete translation
router.delete('/:id', async (req, res) => {
  try {
    await prisma.plainLanguageTranslation.delete({
      where: { id: parseInt(req.params.id) }
    });
    res.json({ message: 'Translation deleted successfully' });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// AI-powered translation
router.post('/translate', async (req, res) => {
  try {
    const { title, originalText } = req.body;

    if (!originalText) {
      return res.status(400).json({ error: 'Original text is required' });
    }

    const systemMessage = `You are a legal communications expert who specializes in translating complex legal language into plain English that non-lawyers can easily understand. You have a background in both law and consumer advocacy, and you're known for making legal documents accessible without losing their legal meaning.

Your translation principles:
1. Replace legal jargon with everyday words (e.g., "indemnify" → "protect and pay for", "notwithstanding" → "even if", "hereinafter" → simply use the name)
2. Break long, complex sentences into shorter, clearer ones
3. Use active voice instead of passive voice
4. Explain what each provision ACTUALLY means for the reader in practical terms
5. Preserve the legal intent — simplify the language, not the meaning
6. Flag any provisions that could surprise or disadvantage the reader
7. Identify hidden obligations or rights the reader might not notice

Always respond with valid JSON only — no markdown, no code fences, no extra text.`;

    const prompt = `Translate the following legal text into plain, easy-to-understand language.

ORIGINAL LEGAL TEXT:
---
${originalText}
---

Provide a comprehensive translation and respond with a JSON object containing:
{
  "translatedText": "<full plain language translation, paragraph by paragraph, maintaining the same structure but in simple English>",
  "complexityScore": <number 0-100, where 100 = extremely complex legal language>,
  "keyTerms": [
    {
      "term": "<legal term or phrase>",
      "definition": "<formal legal definition>",
      "plainMeaning": "<what it actually means in everyday language>",
      "whyItMatters": "<practical impact on the reader>"
    }
  ],
  "hiddenImplications": ["<things a non-lawyer might miss that are important>"],
  "summary": "<2-3 paragraph plain language summary of what this text means for you>",
  "readingLevel": "<reading level of original, e.g., 'Graduate level', 'College', '12th grade'>",
  "translatedReadingLevel": "<reading level of the translation, target: '6th-8th grade'>",
  "actionItems": ["<specific things the reader should be aware of or act on>"]
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
      translatedText: 'Unable to translate',
      complexityScore: 50,
      keyTerms: [],
      summary: ''
    };

    const translation = await prisma.plainLanguageTranslation.create({
      data: {
        title: title || 'Legal Text Translation',
        originalText,
        translatedText: analysisData.translatedText || 'Translation unavailable',
        complexityScore: parseInt(analysisData.complexityScore) || 50,
        keyTerms: JSON.stringify(analysisData.keyTerms || []),
        summary: analysisData.summary || '',
        aiAnalysis: JSON.stringify(analysisData)
      }
    });

    res.status(201).json(translation);
  } catch (error) {
    console.error('Plain language translation error:', error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
