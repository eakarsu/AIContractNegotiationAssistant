const express = require('express');
const { PrismaClient } = require('@prisma/client');
const fetch = require('node-fetch');
const { body, validationResult } = require('express-validator');

const router = express.Router();
const prisma = new PrismaClient();

function handleValidation(req, res) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
  return null;
}

// Get chat history for a session
router.get('/history/:sessionId', async (req, res) => {
  try {
    const messages = await prisma.chatHistory.findMany({
      where: { sessionId: req.params.sessionId },
      orderBy: { createdAt: 'asc' }
    });
    res.json(messages);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Send message to AI
router.post(
  '/message',
  [
    body('sessionId').notEmpty().withMessage('sessionId is required'),
    body('message').notEmpty().withMessage('message is required').isLength({ max: 50000 }).withMessage('message too long')
  ],
  async (req, res) => {
  const validErr = handleValidation(req, res);
  if (validErr !== null) return;
  try {
    const { sessionId, message, context, contractId } = req.body;

    // Save user message
    await prisma.chatHistory.create({
      data: {
        sessionId,
        role: 'user',
        content: message,
        context: contractId ? `contract:${contractId}` : null
      }
    });

    // Get conversation history
    const history = await prisma.chatHistory.findMany({
      where: { sessionId },
      orderBy: { createdAt: 'asc' },
      take: 20
    });

    // Build context if contract is provided
    let systemContext = `You are an AI Contract Negotiation Assistant specialized in legal contracts.
You help users with:
- Drafting and reviewing contracts
- Identifying risks and compliance issues
- Suggesting negotiation strategies
- Explaining legal terms and clauses
- Providing best practices for contract management

Be professional, precise, and helpful. When analyzing contracts, highlight key issues and provide actionable recommendations.`;

    if (contractId) {
      const contract = await prisma.contract.findUnique({
        where: { id: parseInt(contractId) },
        include: {
          party: true,
          clauses: { include: { clause: true } }
        }
      });

      if (contract) {
        systemContext += `\n\nCurrent contract context:
Title: ${contract.title}
Type: ${contract.contractType}
Status: ${contract.status}
Party: ${contract.party?.name || 'Not specified'}
Content preview: ${contract.content.substring(0, 1000)}...`;
      }
    }

    if (context) {
      systemContext += `\n\nAdditional context: ${context}`;
    }

    const messages = [
      { role: 'system', content: systemContext },
      ...history.map(h => ({ role: h.role, content: h.content }))
    ];

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
        messages,
        max_tokens: 2000
      })
    });

    const aiResult = await response.json();

    if (!aiResult.choices || !aiResult.choices[0]) {
      throw new Error('Invalid response from AI');
    }

    const assistantMessage = aiResult.choices[0].message.content;

    // Save assistant message
    const saved = await prisma.chatHistory.create({
      data: {
        sessionId,
        role: 'assistant',
        content: assistantMessage,
        context: contractId ? `contract:${contractId}` : null
      }
    });

    res.json({
      id: saved.id,
      role: 'assistant',
      content: assistantMessage,
      createdAt: saved.createdAt
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Analyze contract with AI
router.post(
  '/analyze-contract',
  [
    body('contractId').notEmpty().withMessage('contractId is required').isInt().withMessage('contractId must be an integer'),
    body('analysisType').optional().isIn(['summary', 'risks', 'negotiation', 'compliance']).withMessage('Invalid analysisType')
  ],
  async (req, res) => {
  const validErr = handleValidation(req, res);
  if (validErr !== null) return;
  try {
    const { contractId, analysisType } = req.body;

    const contract = await prisma.contract.findUnique({
      where: { id: parseInt(contractId) },
      include: {
        party: true,
        clauses: { include: { clause: true } }
      }
    });

    if (!contract) {
      return res.status(404).json({ error: 'Contract not found' });
    }

    const clausesText = contract.clauses.map(cc => cc.clause.content).join('\n\n');

    let prompt;
    switch (analysisType) {
      case 'summary':
        prompt = `Provide a comprehensive summary of this contract including key terms, obligations, and important dates.`;
        break;
      case 'risks':
        prompt = `Identify all potential risks and liabilities in this contract. Rate each risk as low, medium, or high.`;
        break;
      case 'negotiation':
        prompt = `Suggest negotiation points and strategies for improving this contract's terms.`;
        break;
      case 'compliance':
        prompt = `Review this contract for regulatory compliance issues and suggest necessary modifications.`;
        break;
      default:
        prompt = `Analyze this contract and provide insights on its key terms, risks, and recommendations.`;
    }

    prompt += `\n\nContract Title: ${contract.title}
Contract Type: ${contract.contractType}
Party: ${contract.party?.name || 'Not specified'}
Value: ${contract.value ? `${contract.currency} ${contract.value}` : 'Not specified'}

Contract Content:
${contract.content}

Clauses:
${clausesText}`;

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
        max_tokens: 3000
      })
    });

    const aiResult = await response.json();

    if (!aiResult.choices || !aiResult.choices[0]) {
      throw new Error('Invalid response from AI');
    }

    res.json({
      analysis: aiResult.choices[0].message.content,
      contractId: contract.id,
      analysisType
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Generate clause with AI
router.post(
  '/generate-clause',
  [
    body('clauseType').notEmpty().withMessage('clauseType is required')
  ],
  async (req, res) => {
  const validErr = handleValidation(req, res);
  if (validErr !== null) return;
  try {
    const { clauseType, context, jurisdiction } = req.body;

    const prompt = `Generate a professional legal clause for a contract.

Clause Type: ${clauseType}
Jurisdiction: ${jurisdiction || 'United States'}
Context: ${context || 'General business contract'}

Requirements:
1. Use clear, unambiguous legal language
2. Include all necessary provisions
3. Follow best practices for the jurisdiction
4. Make it comprehensive yet concise

Provide the clause text only, without explanations.`;

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
        max_tokens: 1500
      })
    });

    const aiResult = await response.json();

    if (!aiResult.choices || !aiResult.choices[0]) {
      throw new Error('Invalid response from AI');
    }

    res.json({
      clause: aiResult.choices[0].message.content,
      clauseType,
      jurisdiction: jurisdiction || 'United States'
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Clear chat history
router.delete('/history/:sessionId', async (req, res) => {
  try {
    await prisma.chatHistory.deleteMany({
      where: { sessionId: req.params.sessionId }
    });
    res.json({ message: 'Chat history cleared' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
