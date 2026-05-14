/**
 * Shared OpenRouter AI helper for AIContractNegotiationAssistant.
 * - DEFAULT_MODEL = anthropic/claude-3-5-sonnet-20241022
 * - Retry on 5xx / 429
 * - 3-strategy parseAIJson
 * - saveAIResult writes to AIResult (JSONB output)
 */

const fetch = require('node-fetch');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const DEFAULT_MODEL = 'anthropic/claude-3-5-sonnet-20241022';

async function callOpenRouter(systemPrompt, userMessage, opts = {}) {
  const { temperature = 0.5, maxTokens = 3000, model = DEFAULT_MODEL } = opts;
  const url = (process.env.OPENROUTER_BASE_URL || 'https://openrouter.ai/api/v1') + '/chat/completions';

  const payload = {
    model,
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userMessage }
    ],
    temperature,
    max_tokens: maxTokens
  };

  const headers = {
    'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
    'Content-Type': 'application/json',
    'HTTP-Referer': process.env.FRONTEND_URL || 'http://localhost:5173',
    'X-Title': 'AI Contract Negotiation Assistant'
  };

  let lastErr;
  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      const r = await fetch(url, { method: 'POST', headers, body: JSON.stringify(payload), timeout: 90000 });
      if (!r.ok) {
        if (r.status >= 500 || r.status === 429) {
          await new Promise(res => setTimeout(res, 800 * (attempt + 1)));
          lastErr = new Error(`OpenRouter ${r.status}`);
          continue;
        }
        const text = await r.text();
        throw new Error(`OpenRouter ${r.status}: ${text}`);
      }
      const data = await r.json();
      return {
        content: data.choices?.[0]?.message?.content || '',
        model: data.model,
        usage: data.usage,
        raw: data
      };
    } catch (err) {
      lastErr = err;
      await new Promise(res => setTimeout(res, 800 * (attempt + 1)));
    }
  }
  throw lastErr;
}

function parseAIJson(text) {
  if (!text || typeof text !== 'string') return null;
  const trimmed = text.trim();
  // strategy 1
  try { return JSON.parse(trimmed); } catch (_) {}
  // strategy 2
  const fenced = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/i);
  if (fenced) { try { return JSON.parse(fenced[1].trim()); } catch (_) {} }
  // strategy 3
  const f = trimmed.indexOf('{'); const l = trimmed.lastIndexOf('}');
  if (f !== -1 && l > f) { try { return JSON.parse(trimmed.slice(f, l + 1)); } catch (_) {} }
  return null;
}

async function saveAIResult({ feature, contractId, userId, input, output, model, usage }) {
  try {
    return await prisma.aIResult.create({
      data: {
        feature,
        contractId: contractId || null,
        userId: userId || null,
        input: input ? input : undefined,
        output: output ? output : undefined,
        model: model || null,
        usage: usage || undefined
      }
    });
  } catch (err) {
    console.error('saveAIResult failed:', err.message);
    return null;
  }
}

module.exports = { callOpenRouter, parseAIJson, saveAIResult, DEFAULT_MODEL, prisma };
