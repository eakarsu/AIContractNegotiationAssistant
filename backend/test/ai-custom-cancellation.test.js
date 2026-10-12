const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const http = require('node:http');
const { createRequire } = require('node:module');

function load(file, replacements) {
  const nativeRequire = createRequire(file);
  const loaded = { exports: {} };
  new Function('require', 'module', 'exports', '__dirname', fs.readFileSync(file, 'utf8'))(
    (name) => Object.hasOwn(replacements, name) ? replacements[name] : nativeRequire(name),
    loaded, loaded.exports, path.dirname(file),
  );
  return loaded.exports;
}

test('native AI routes abort the actual provider connection and never save cancelled answers', { timeout: 15000 }, async () => {
  const previous = { key: process.env.OPENROUTER_API_KEY, url: process.env.OPENROUTER_BASE_URL };
  process.env.OPENROUTER_API_KEY = 'isolated-test-key';
  const saved = [];
  let calls = 0;
  let mode = 'pending';
  let started;
  let disconnected;
  const provider = http.createServer((req, res) => {
    calls++;
    req.resume();
    res.once('close', () => { if (!res.writableEnded) disconnected?.(); });
    if (mode === 'success') {
      res.setHeader('Content-Type', 'application/json');
      res.end(JSON.stringify({ choices: [{ message: { content: '{"executive_summary":"Review the supplied contract terms."}' } }], model: 'test/real-http', usage: { total_tokens: 17 } }));
    } else if (mode === 'retry') {
      res.statusCode = 503;
      res.end('Temporarily unavailable');
    }
    started?.();
  });
  await new Promise(resolve => provider.listen(0, '127.0.0.1', resolve));
  process.env.OPENROUTER_BASE_URL = `http://127.0.0.1:${provider.address().port}`;
  const prisma = {
    aIResult: { create: async ({ data }) => { saved.push(data); return { id: saved.length, ...data }; } },
    contract: {
      findMany: async () => [],
      findUnique: async () => ({ id: 1, title: 'Isolated fixture', contractType: 'services', clauses: [], complianceChecks: [] }),
    },
  };
  const helper = load(path.resolve(__dirname, '../src/services/aiHelper.js'), {
    '@prisma/client': { PrismaClient: class { constructor() { return prisma; } } },
  });
  const router = load(path.resolve(__dirname, '../src/routes/aiCustom.js'), {
    '../services/aiHelper': helper,
    '../middleware/rateLimiter': { aiRateLimiter: (_req, _res, next) => next() },
  });
  const express = require('express');
  const app = express();
  app.use(express.json());
  app.use((req, _res, next) => { req.user = { userId: 7 }; next(); });
  app.use('/api/ai', router);
  const server = http.createServer(app);
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  const payloads = {
    'draft-from-scratch': { contract_type: 'services', requirements: 'Draft an agreement for a fictional design project.' },
    'redteam-simulator': { our_position: 'Payment within 30 days.', counterparty_persona: 'A buyer seeking flexible payment terms.' },
    'historical-analytics': { period_days: 90 },
    'clause-conflict-detector': { contract_id: 1 },
    'regulatory-monitor': { contract_id: 1, regulations: 'Review the supplied policy text.' },
    'sentiment-analysis': { text: 'Payment is due within 30 days.', our_role: 'buyer' },
    'pricing-recommender': { contract_type: 'services' },
    'auto-redline-engine': { proposed_text: 'Payment is due upon receipt.', policy: 'Payment must allow 30 days.' },
  };
  try {
    for (const [route, payload] of Object.entries(payloads)) {
      const ready = new Promise(resolve => { started = resolve; });
      const closed = new Promise(resolve => { disconnected = resolve; });
      const before = calls;
      const body = JSON.stringify(payload);
      const client = http.request({ hostname: '127.0.0.1', port: server.address().port, path: `/api/ai/${route}`, method: 'POST', headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(body) } });
      client.on('error', () => {});
      client.end(body);
      await ready;
      client.destroy();
      await closed;
      await new Promise(resolve => setImmediate(resolve));
      assert.equal(calls, before + 1, `${route}: cancellation must not retry`);
      assert.equal(saved.length, 0, `${route}: cancelled answer must not be saved`);
    }

    const alreadyCancelled = new AbortController();
    alreadyCancelled.abort();
    await assert.rejects(helper.saveAIResult({ feature: 'sentiment-analysis', userId: 7, output: {}, signal: alreadyCancelled.signal }), { name: 'AbortError' });
    assert.equal(saved.length, 0);

    mode = 'retry';
    const controller = new AbortController();
    const ready = new Promise(resolve => { started = resolve; });
    const before = calls;
    const pending = helper.callOpenRouter('Test instruction', 'Test prompt', { signal: controller.signal });
    await ready;
    await new Promise(resolve => setTimeout(resolve, 30));
    controller.abort();
    await assert.rejects(pending, { name: 'AbortError' });
    assert.equal(calls, before + 1, 'Aborting retry backoff must prevent a second provider call');

    mode = 'success';
    const response = await fetch(`http://127.0.0.1:${server.address().port}/api/ai/sentiment-analysis`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payloads['sentiment-analysis']),
    });
    assert.equal(response.status, 200);
    assert.equal((await response.json()).executive_summary, 'Review the supplied contract terms.');
    assert.equal(saved.length, 1);
    assert.equal(saved[0].userId, 7);
    assert.equal(saved[0].model, 'test/real-http');

    delete process.env.OPENROUTER_API_KEY;
    const beforeMissingKey = calls;
    await assert.rejects(helper.callOpenRouter('Test', 'Test'), error => error.status === 503);
    assert.equal(calls, beforeMissingKey);
  } finally {
    server.closeAllConnections();
    provider.closeAllConnections();
    await Promise.all([new Promise(resolve => server.close(resolve)), new Promise(resolve => provider.close(resolve))]);
    if (previous.key === undefined) delete process.env.OPENROUTER_API_KEY; else process.env.OPENROUTER_API_KEY = previous.key;
    if (previous.url === undefined) delete process.env.OPENROUTER_BASE_URL; else process.env.OPENROUTER_BASE_URL = previous.url;
  }
});
