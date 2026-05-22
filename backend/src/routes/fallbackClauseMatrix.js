const express = require('express');

const router = express.Router();

const clausePositions = [
  { id: 1, topic: 'Liability Cap', preferred: 'Fees paid in the prior 12 months', fallback: 'Two times fees paid in the prior 12 months', walkAway: 'Unlimited indirect damages exposure', risk: 'high', owner: 'Legal' },
  { id: 2, topic: 'Indemnity', preferred: 'Third-party IP infringement only', fallback: 'Third-party claims caused by breach', walkAway: 'First-party operational losses', risk: 'medium', owner: 'Commercial Counsel' },
  { id: 3, topic: 'Termination Assistance', preferred: '30 days at standard rates', fallback: '60 days at discounted transition rates', walkAway: 'Open-ended transition obligations', risk: 'medium', owner: 'Deal Desk' },
];

router.get('/', (req, res) => {
  const highRisk = clausePositions.filter((item) => item.risk === 'high').length;
  res.json({
    summary: { totalPositions: clausePositions.length, highRisk, fallbackReady: clausePositions.length - highRisk },
    clausePositions,
  });
});

router.post('/recommend', (req, res) => {
  const { topic, counterpartyPosition } = req.body || {};
  const match = clausePositions.find((item) => item.topic.toLowerCase() === String(topic || '').toLowerCase()) || clausePositions[0];
  res.json({
    topic: match.topic,
    recommendedFallback: match.fallback,
    negotiationNote: counterpartyPosition ? `Counterparty position "${counterpartyPosition}" should be answered with the approved fallback before escalation.` : 'Use the approved fallback and preserve the walk-away point for escalation.',
    escalationTrigger: match.walkAway,
  });
});

module.exports = router;
