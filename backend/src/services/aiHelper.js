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

const DEFAULT_MODEL = process.env.OPENROUTER_MODEL || 'anthropic/claude-3-5-sonnet-20241022';

function assertAIRequestActive(signal) {
  if (!signal?.aborted) return;
  const error = signal.reason instanceof Error ? signal.reason : new Error('AI request cancelled.');
  if (!error.name || error.name === 'Error') error.name = 'AbortError';
  throw error;
}

function retryDelay(milliseconds, signal) {
  assertAIRequestActive(signal);
  return new Promise((resolve, reject) => {
    const cleanup = () => signal?.removeEventListener('abort', abort);
    const timer = setTimeout(() => { cleanup(); resolve(); }, milliseconds);
    const abort = () => { clearTimeout(timer); cleanup(); try { assertAIRequestActive(signal); } catch (error) { reject(error); } };
    signal?.addEventListener('abort', abort, { once: true });
    if (signal?.aborted) abort();
  });
}

async function callOpenRouter(systemPrompt, userMessage, opts = {}) {
  const { temperature = 0.5, maxTokens = 3000, model = DEFAULT_MODEL, signal } = opts;
  assertAIRequestActive(signal);
  if (!process.env.OPENROUTER_API_KEY) {
    const error = new Error('OpenRouter is not configured. Add OPENROUTER_API_KEY and restart the backend.');
    error.status = 503;
    throw error;
  }
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

  const controller = new AbortController();
  const cancel = () => controller.abort(signal.reason);
  signal?.addEventListener('abort', cancel, { once: true });
  if (signal?.aborted) cancel();
  const timeout = setTimeout(() => {
    const error = new Error('OpenRouter took too long to respond. Try again.');
    error.name = 'TimeoutError';
    error.status = 504;
    controller.abort(error);
  }, 90000);
  timeout.unref?.();
  try {
    let lastErr;
    for (let attempt = 0; attempt < 2; attempt++) {
      assertAIRequestActive(controller.signal);
      try {
        const r = await fetch(url, { method: 'POST', headers, body: JSON.stringify(payload), signal: controller.signal });
        if (!r.ok) {
          const error = new Error(`OpenRouter ${r.status}`);
          error.status = r.status === 429 ? 429 : 502;
          if ((r.status >= 500 || r.status === 429) && attempt === 0) {
            await r.text();
            lastErr = error;
            await retryDelay(800, controller.signal);
            continue;
          }
          await r.text();
          throw error;
        }
        const data = await r.json();
        assertAIRequestActive(controller.signal);
        const content = data.choices?.[0]?.message?.content;
        if (typeof content !== 'string' || !content.trim()) {
          const error = new Error('OpenRouter returned an empty answer. Try again.');
          error.status = 502;
          throw error;
        }
        return { content, model: data.model, usage: data.usage, raw: data };
      } catch (error) {
        assertAIRequestActive(controller.signal);
        lastErr = error;
        if (error.status || attempt === 1) throw error;
        await retryDelay(800, controller.signal);
      }
    }
    throw lastErr;
  } finally {
    clearTimeout(timeout);
    signal?.removeEventListener('abort', cancel);
  }
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

async function saveAIResult({ feature, contractId, userId, input, output, model, usage, signal }) {
  assertAIRequestActive(signal);
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
    assertAIRequestActive(signal);
    console.error('saveAIResult failed:', err.message);
    return null;
  }
}

module.exports = { callOpenRouter, parseAIJson, saveAIResult, assertAIRequestActive, DEFAULT_MODEL, prisma };
