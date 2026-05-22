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

// Get all ToS
router.get('/', async (req, res) => {
  try {
    const terms = await prisma.termsOfService.findMany({
      orderBy: { createdAt: 'desc' }
    });
    res.json(terms);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get single ToS
router.get('/:id', async (req, res) => {
  try {
    const terms = await prisma.termsOfService.findUnique({
      where: { id: parseInt(req.params.id) }
    });
    if (!terms) {
      return res.status(404).json({ error: 'Terms of Service not found' });
    }
    res.json(terms);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create ToS
router.post('/', async (req, res) => {
  try {
    const terms = await prisma.termsOfService.create({
      data: req.body
    });
    res.status(201).json(terms);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Update ToS
router.put('/:id', async (req, res) => {
  try {
    const terms = await prisma.termsOfService.update({
      where: { id: parseInt(req.params.id) },
      data: req.body
    });
    res.json(terms);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Delete ToS
router.delete('/:id', async (req, res) => {
  try {
    await prisma.termsOfService.delete({
      where: { id: parseInt(req.params.id) }
    });
    res.json({ message: 'Terms of Service deleted successfully' });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// AI-powered ToS generation
router.post('/generate', async (req, res) => {
  try {
    const { title, companyName, serviceType, website } = req.body;

    if (!companyName) {
      return res.status(400).json({ error: 'Company name is required' });
    }

    const systemMessage = `You are a technology and internet law attorney who specializes in drafting Terms of Service, Privacy Policies, and user agreements for digital platforms. You have worked with major SaaS companies, e-commerce platforms, and mobile apps. Your ToS documents are known for being legally comprehensive while remaining readable.

Your ToS drafting principles:
1. Cover all essential sections: acceptance, eligibility, user accounts, acceptable use, IP rights, disclaimers, limitation of liability, indemnification, termination, dispute resolution, governing law
2. Address modern digital concerns: data privacy references, DMCA/copyright, user-generated content, API usage, third-party integrations
3. Include appropriate liability caps and warranty disclaimers
4. Draft dispute resolution clauses (arbitration vs. litigation options)
5. Ensure compliance with relevant regulations (CAN-SPAM, CCPA/GDPR references, ADA)
6. Use clear section headings and numbered paragraphs for readability
7. Tailor language to the specific service type and business model

Always respond with valid JSON only — no markdown, no code fences, no extra text.`;

    const prompt = `Draft comprehensive, professional Terms of Service for the following company:

COMPANY NAME: ${companyName}
SERVICE TYPE: ${serviceType || 'Online services'}
WEBSITE/PLATFORM: ${website || 'Not specified'}

Generate a complete Terms of Service document and respond with a JSON object containing:
{
  "content": "<the full Terms of Service document with professional formatting, numbered sections, and all standard provisions. Include: Acceptance of Terms, Eligibility, User Accounts, Acceptable Use Policy, Intellectual Property, User Content, Payment Terms (if applicable), Privacy, Disclaimers, Limitation of Liability, Indemnification, Termination, Dispute Resolution, Governing Law, Modifications, Severability, Entire Agreement, Contact Information>",
  "sections": ["<ordered list of all section titles>"],
  "userRights": "<comprehensive summary of user rights under these terms>",
  "userObligations": "<summary of what users must and must not do>",
  "limitations": "<detailed summary of limitations, disclaimers, and liability caps>",
  "disputeResolution": "<explanation of how disputes are handled>",
  "dataPrivacy": "<summary of data handling and privacy provisions>",
  "complianceNotes": [
    {
      "regulation": "<e.g., GDPR, CCPA, CAN-SPAM>",
      "status": "<how these ToS address it>",
      "recommendation": "<any additional steps needed>"
    }
  ],
  "effectiveDate": "The effective date should be set to the date of publication",
  "summary": "<4-5 sentence executive summary of the key terms users should know>"
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
        model: process.env.OPENROUTER_MODEL || 'anthropic/claude-3-5-sonnet-20241022',
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
      content: 'Unable to generate Terms of Service',
      sections: [],
      userRights: '',
      limitations: '',
      disputeResolution: ''
    };

    // Helper to ensure values are strings (AI may return arrays or objects)
    const toStr = (val) => {
      if (!val) return '';
      if (typeof val === 'string') return val;
      if (Array.isArray(val)) return val.join('\n');
      if (typeof val === 'object') return JSON.stringify(val, null, 2);
      return String(val);
    };

    const terms = await prisma.termsOfService.create({
      data: {
        title: title || `Terms of Service - ${companyName}`,
        companyName,
        serviceType: serviceType || 'Online services',
        website: website || '',
        content: toStr(analysisData.content) || 'Document generation failed',
        sections: JSON.stringify(analysisData.sections || []),
        userRights: toStr(analysisData.userRights),
        limitations: toStr(analysisData.limitations),
        disputeResolution: toStr(analysisData.disputeResolution),
        status: 'draft',
        aiAnalysis: JSON.stringify(analysisData)
      }
    });

    res.status(201).json(terms);
  } catch (error) {
    console.error('ToS generation error:', error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
