const express = require('express');
const { PrismaClient } = require('@prisma/client');
const fetch = require('node-fetch');

const router = express.Router();
const prisma = new PrismaClient();

// Get all compliance checks
router.get('/', async (req, res) => {
  try {
    const checks = await prisma.complianceCheck.findMany({
      include: {
        contract: { select: { id: true, title: true, status: true } }
      },
      orderBy: { createdAt: 'desc' }
    });
    res.json(checks);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get single compliance check
router.get('/:id', async (req, res) => {
  try {
    const check = await prisma.complianceCheck.findUnique({
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
    if (!check) {
      return res.status(404).json({ error: 'Compliance check not found' });
    }
    res.json(check);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create compliance check
router.post('/', async (req, res) => {
  try {
    const check = await prisma.complianceCheck.create({
      data: req.body,
      include: { contract: { select: { id: true, title: true } } }
    });
    res.status(201).json(check);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Update compliance check
router.put('/:id', async (req, res) => {
  try {
    const check = await prisma.complianceCheck.update({
      where: { id: parseInt(req.params.id) },
      data: req.body
    });
    res.json(check);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Delete compliance check
router.delete('/:id', async (req, res) => {
  try {
    await prisma.complianceCheck.delete({
      where: { id: parseInt(req.params.id) }
    });
    res.json({ message: 'Compliance check deleted successfully' });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// AI-powered compliance check
router.post('/check/:contractId', async (req, res) => {
  try {
    const { regulation } = req.body;
    const contract = await prisma.contract.findUnique({
      where: { id: parseInt(req.params.contractId) },
      include: { clauses: { include: { clause: true } } }
    });

    if (!contract) {
      return res.status(404).json({ error: 'Contract not found' });
    }

    const clausesText = contract.clauses.map(cc => cc.clause.content).join('\n\n');
    const prompt = `Analyze this contract for compliance with ${regulation} regulations. Provide:
1. Compliance status (compliant, partially_compliant, non_compliant)
2. Key findings about compliance issues
3. Required actions to achieve compliance
4. Specific requirements that must be met

Contract Title: ${contract.title}
Contract Type: ${contract.contractType}
Contract Content:
${contract.content}

Clauses:
${clausesText}

Respond in JSON format with fields: status, findings (string), requirements (string)`;

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
        messages: [{ role: 'user', content: prompt }],
        response_format: { type: 'json_object' }
      })
    });

    const aiResult = await response.json();
    let analysisData;

    try {
      let parsed = JSON.parse(aiResult.choices[0].message.content);
      // Unwrap if response is nested in "json" key
      if (parsed.json && typeof parsed.json === 'object') {
        parsed = parsed.json;
      }
      analysisData = parsed;
    } catch {
      analysisData = {
        status: 'pending',
        findings: aiResult.choices[0].message.content,
        requirements: 'Manual review required'
      };
    }

    // Convert content to proper string format
    const formatContent = (content) => {
      if (!content) return '';
      if (typeof content === 'string') return content;
      if (Array.isArray(content)) {
        return content.map((item) => {
          if (typeof item === 'string') return item;
          if (typeof item === 'object') {
            return Object.entries(item)
              .map(([key, val]) => `${key}: ${val}`)
              .join(' - ');
          }
          return String(item);
        }).join('\n');
      }
      if (typeof content === 'object') {
        return JSON.stringify(content, null, 2);
      }
      return String(content);
    };

    const complianceCheck = await prisma.complianceCheck.create({
      data: {
        contractId: contract.id,
        regulation,
        status: analysisData.status || 'pending',
        findings: formatContent(analysisData.findings) || '',
        requirements: formatContent(analysisData.requirements) || '',
        aiAnalysis: JSON.stringify(analysisData),
        checkedAt: new Date()
      },
      include: { contract: { select: { id: true, title: true } } }
    });

    res.status(201).json(complianceCheck);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
