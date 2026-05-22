const express = require('express');
const { PrismaClient } = require('@prisma/client');
const fetch = require('node-fetch');

const router = express.Router();
const prisma = new PrismaClient();

// Helper function to extract clean text from any data structure
const extractText = (data) => {
  if (!data) return '';
  if (typeof data === 'string') return data;

  if (Array.isArray(data)) {
    return data.map((item, idx) => {
      if (typeof item === 'string') return `${idx + 1}. ${item}`;
      if (typeof item === 'object' && item !== null) {
        // Extract meaningful text from object
        const text = item.description || item.finding || item.riskItem || item.risk || item.recommendation || item.text || item.content;
        const severity = item.severity || item.level || item.priority;
        if (text) {
          return severity ? `${idx + 1}. [${severity.toUpperCase()}] ${text}` : `${idx + 1}. ${text}`;
        }
        // Fallback: join all string values
        const values = Object.values(item).filter(v => typeof v === 'string');
        return `${idx + 1}. ${values.join(' - ')}`;
      }
      return `${idx + 1}. ${String(item)}`;
    }).join('\n');
  }

  if (typeof data === 'object') {
    // If it's an object, try to find an array inside
    for (const key of ['findings', 'items', 'risks', 'recommendations', 'issues', 'list']) {
      if (Array.isArray(data[key])) {
        return extractText(data[key]);
      }
    }
    // Fallback: stringify
    return JSON.stringify(data);
  }

  return String(data);
};

// Helper function to deeply extract analysis data from AI response
const parseAIResponse = (content) => {
  if (!content) return null;

  let text = typeof content === 'string' ? content : JSON.stringify(content);

  // Strip markdown code blocks (```json ... ``` or ``` ... ```)
  text = text.replace(/^```(?:json)?\s*\n?/i, '').replace(/\n?```\s*$/i, '');

  // Also handle if there's text after the JSON block
  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (jsonMatch) {
    text = jsonMatch[0];
  }

  let data;
  try {
    data = JSON.parse(text);
  } catch (e) {
    console.error('JSON parse error:', e.message);
    return null;
  }

  // Unwrap common wrapper keys
  if (data.json) data = data.json;
  if (data.response) data = data.response;
  if (data.result) data = data.result;
  if (data.data) data = data.data;
  if (data.analysis) data = data.analysis;

  return data;
};

// Get all risk analyses
router.get('/', async (req, res) => {
  try {
    const risks = await prisma.riskAnalysis.findMany({
      include: {
        contract: { select: { id: true, title: true, status: true, contractType: true } }
      },
      orderBy: { createdAt: 'desc' }
    });
    res.json(risks);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get single risk analysis
router.get('/:id', async (req, res) => {
  try {
    const risk = await prisma.riskAnalysis.findUnique({
      where: { id: parseInt(req.params.id) },
      include: {
        contract: {
          include: {
            party: true,
            clauses: { include: { clause: true } }
          }
        }
      }
    });
    if (!risk) {
      return res.status(404).json({ error: 'Risk analysis not found' });
    }
    res.json(risk);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create risk analysis
router.post('/', async (req, res) => {
  try {
    const risk = await prisma.riskAnalysis.create({
      data: req.body,
      include: { contract: { select: { id: true, title: true } } }
    });
    res.status(201).json(risk);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Update risk analysis
router.put('/:id', async (req, res) => {
  try {
    const risk = await prisma.riskAnalysis.update({
      where: { id: parseInt(req.params.id) },
      data: req.body
    });
    res.json(risk);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Delete risk analysis
router.delete('/:id', async (req, res) => {
  try {
    await prisma.riskAnalysis.delete({
      where: { id: parseInt(req.params.id) }
    });
    res.json({ message: 'Risk analysis deleted successfully' });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// AI-powered risk analysis for a contract
router.post('/analyze/:contractId', async (req, res) => {
  try {
    const contract = await prisma.contract.findUnique({
      where: { id: parseInt(req.params.contractId) },
      include: { clauses: { include: { clause: true } } }
    });

    if (!contract) {
      return res.status(404).json({ error: 'Contract not found' });
    }

    const clausesText = contract.clauses.map(cc => cc.clause.content).join('\n\n');
    const prompt = `Analyze this contract for legal and business risks.

Contract Title: ${contract.title}
Contract Type: ${contract.contractType}
Contract Content:
${contract.content}

Clauses:
${clausesText}

Respond with a JSON object containing:
- overallScore: number 0-100
- financialRisk: number 0-100
- legalRisk: number 0-100
- operationalRisk: number 0-100
- reputationalRisk: number 0-100
- category: "low" or "medium" or "high"
- findings: array of strings describing each risk found
- recommendations: array of strings with mitigation suggestions`;

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
        messages: [{ role: 'user', content: prompt }],
        response_format: { type: 'json_object' }
      })
    });

    const aiResult = await response.json();

    // Log for debugging
    console.log('========== AI RAW RESPONSE ==========');
    console.log(JSON.stringify(aiResult, null, 2));

    // Check for API errors
    if (aiResult.error) {
      console.error('OpenRouter API Error:', aiResult.error);
      throw new Error(`OpenRouter API Error: ${aiResult.error.message || JSON.stringify(aiResult.error)}`);
    }

    if (!aiResult.choices || !aiResult.choices[0] || !aiResult.choices[0].message) {
      console.error('Invalid API response structure');
      throw new Error('Invalid response from AI service');
    }

    console.log('========== MESSAGE CONTENT ==========');
    const messageContent = aiResult.choices[0].message.content;
    console.log(messageContent);
    console.log('========== PARSING ==========');

    let analysisData = parseAIResponse(messageContent);
    console.log('Parsed analysisData:', JSON.stringify(analysisData, null, 2));

    if (!analysisData) {
      // Fallback if parsing fails
      analysisData = {
        overallScore: 50,
        financialRisk: 50,
        legalRisk: 50,
        operationalRisk: 50,
        reputationalRisk: 50,
        findings: 'Unable to parse AI response. Please try again.',
        recommendations: 'Manual review recommended.',
        category: 'medium'
      };
    }

    // Extract and format findings and recommendations
    console.log('========== EXTRACTING TEXT ==========');
    console.log('Raw findings:', analysisData.findings);
    console.log('Raw recommendations:', analysisData.recommendations);

    const findingsText = extractText(analysisData.findings);
    const recommendationsText = extractText(analysisData.recommendations);

    console.log('========== FORMATTED TEXT ==========');
    console.log('Findings text:', findingsText);
    console.log('Recommendations text:', recommendationsText);

    const riskAnalysis = await prisma.riskAnalysis.create({
      data: {
        contractId: contract.id,
        overallScore: parseInt(analysisData.overallScore) || 50,
        financialRisk: parseInt(analysisData.financialRisk) || 50,
        legalRisk: parseInt(analysisData.legalRisk) || 50,
        operationalRisk: parseInt(analysisData.operationalRisk) || 50,
        reputationalRisk: parseInt(analysisData.reputationalRisk) || 50,
        category: analysisData.category || 'medium',
        findings: findingsText || 'No specific findings.',
        recommendations: recommendationsText || 'No specific recommendations.',
        aiAnalysis: JSON.stringify(analysisData)
      },
      include: { contract: { select: { id: true, title: true } } }
    });

    // Update contract risk level
    await prisma.contract.update({
      where: { id: contract.id },
      data: {
        riskLevel: analysisData.category || 'medium',
        riskScore: parseInt(analysisData.overallScore) || 50
      }
    });

    res.status(201).json(riskAnalysis);
  } catch (error) {
    console.error('Risk analysis error:', error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
