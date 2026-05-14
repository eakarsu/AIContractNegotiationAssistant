# Audit Apply Notes — AIContractNegotiationAssistant

Source: `/Users/erolakarsu/projects/_AUDIT/reports/batch_02.md` (lines 377-411).

## Original audit recommendations

### Missing AI counterparts
- `/translate-to-plain-language`, `/find-precedent-clauses`, `/highlight-risks`,
  `/compare-standard-terms`, `/generate-nda`, `/analyze-lease-terms`,
  `/chat-about-contract`, `/suggest-redline-counter`, `/rank-risk-clauses`.

### Missing non-AI features
- Version control / track-changes integration.
- Signature/approval workflow integration (DocuSign, HelloSign).
- Legal research API integrations (Westlaw, LexisNexis).
- Deal-room / data-room management.

### Custom feature suggestions
- Agentic negotiation modeling and concession sequencing.
- Regulatory change alerting.
- Market-benchmark comparison.
- Negotiation playbook generation from past deals.
- Precedent analysis at scale across contract library.

## Implemented in this pass (mechanical)

1. `POST /api/ai/highlight-risks` (in `backend/src/routes/aiNew.js`) — stateless
   risk-clause highlighting matching audit gap `/highlight-risks`.
2. `POST /api/ai/standard-terms-compare` (in `backend/src/routes/aiNew.js`) —
   stateless market/standard-terms comparison matching audit gap
   `/compare-standard-terms`.

Both follow the existing `aiNew.js` patterns: OpenRouter via the local
`callOpenRouter` helper, `aiRateLimiter`, `express-validator` body validation,
and JSON success/error envelopes. No new files, no new dependencies, no schema
changes. Verified with `node --check`.

## Backlog (not implemented this pass)

### Mechanical, low-risk
- `/api/ai/rank-risk-clauses` — accept array of clauses, return ranked
  severity/score list.
- `/api/ai/suggest-redline-counter` — input clause + counterparty redline,
  output recommended counter-redline.
- `/api/ai/chat-about-contract` — multi-turn chat anchored on a contract.

### Needs product decision
- Generation endpoints that should persist (NDA generator, lease analyzer,
  precedent finder) require Prisma model decisions and storage strategy.

### Needs credentials / external SDK
- DocuSign / HelloSign signature workflow.
- Westlaw / LexisNexis legal research.
- Regulatory feed monitoring (Federal Register API, state secretaries).

### Too risky / large refactor
- Agentic negotiation modeling, contract-library-wide precedent search,
  deal-room management — multi-week features.

## Apply pass 3 (frontend)

LEFT-AS-IS — frontend already wired. `frontend/src/pages/HighlightRisksStateless.tsx`
calls `POST /api/ai/highlight-risks` and `frontend/src/pages/StandardTermsCompareStateless.tsx`
calls `POST /api/ai/standard-terms-compare`. Both pages use the shared
`services/api` axios instance (JWT Bearer from localStorage, 503-no-key error
surfaced via `e.response?.data?.error`) and are registered in `App.tsx` under
`/ai-tools/highlight-risks` and `/ai-tools/standard-terms-compare`. No edits.

## Apply pass 4 (mechanical backlog)

LEFT-AS-IS. The 3 mechanical backlog items listed above
(`/api/ai/rank-risk-clauses`, `/api/ai/suggest-redline-counter`,
`/api/ai/chat-about-contract`) are already implemented end-to-end:

- BE: in `backend/src/routes/aiNew.js`, all three reuse the shared
  `callOpenRouter` helper which throws an Error with `statusCode = 503` when
  `OPENROUTER_API_KEY` is missing; route handlers already map that to
  `res.status(503).json(...)`.
- BE mount: `app.use('/api/ai', authMiddleware, aiNewRoutes)` in
  `backend/src/index.js` (JWT-protected, rate-limited).
- FE: `RankRiskClausesStateless.tsx`, `SuggestRedlineCounterStateless.tsx`,
  `ChatAboutContractStateless.tsx` registered at `/ai-tools/*` in `App.tsx`,
  using the shared axios `services/api` (JWT Bearer + 503 surfaced via
  `e.response?.data?.error`).

Remaining backlog (NDA/lease/precedent persistence, DocuSign/Westlaw,
agentic-negotiation, deal-room) is NEEDS-PRODUCT-DECISION / NEEDS-CREDS /
TOO-RISKY and explicitly out of scope for this mechanical pass.
