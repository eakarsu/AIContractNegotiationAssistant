const express = require('express');
const router = express.Router();

const parseAIResponse = (content) => {
  if (!content) return null;
  let text = typeof content === 'string' ? content : JSON.stringify(content);
  text = text.replace(/^```(?:json)?\s*\n?/i, '').replace(/\n?```\s*$/i, '');
  try {
    let data = JSON.parse(text);
    if (data.json && typeof data.json === 'object') data = data.json;
    if (data.response && typeof data.response === 'object') data = data.response;
    if (data.result && typeof data.result === 'object') data = data.result;
    return data;
  } catch (e) {}
  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (jsonMatch) {
    try { return JSON.parse(jsonMatch[0]); } catch (e) {}
  }
  return null;
};

const callAI = async (systemMessage, prompt) => {
  const fetch = require('node-fetch');
  const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
      'Content-Type': 'application/json',
      'HTTP-Referer': 'http://localhost:5173',
      'X-Title': 'Contract Negotiation Assistant - Compliance Audit'
    },
    body: JSON.stringify({
      model: 'anthropic/claude-3-5-sonnet-20241022',
      messages: [
        { role: 'system', content: systemMessage },
        { role: 'user', content: prompt }
      ],
      response_format: { type: 'json_object' },
      max_tokens: 16000
    })
  });
  const aiResult = await response.json();
  if (aiResult.error) throw new Error(aiResult.error.message || JSON.stringify(aiResult.error));
  return parseAIResponse(aiResult.choices?.[0]?.message?.content);
};

// Scan compliance
router.post('/scan-compliance', async (req, res) => {
  try {
    const { framework, scope, current_state } = req.body;
    if (!framework) return res.status(400).json({ error: 'Framework is required' });

    const result = await callAI(
      'You are a compliance audit expert specializing in regulatory frameworks including SOC2, GDPR, HIPAA, ISO 27001, PCI-DSS, and contract compliance standards. Always respond with valid JSON only.',
      `Scan for ${framework} compliance violations. Scope: ${scope || 'Full organization'}. Current state: ${current_state || 'Unknown'}. Return JSON with: compliance_score (0-100), violations (array with control_id, title, severity, description, remediation), compliant_areas (array), risk_level, executive_summary, immediate_actions (array).`
    );
    res.json(result || { error: 'Unable to analyze compliance' });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// Generate evidence requirements
router.post('/generate-evidence', async (req, res) => {
  try {
    const { framework, control, requirement } = req.body;
    if (!framework || !control) return res.status(400).json({ error: 'Framework and control are required' });

    const result = await callAI(
      'You are a compliance evidence specialist who helps organizations prepare documentation and evidence for regulatory audits. Always respond with valid JSON only.',
      `Generate evidence requirements for ${framework} control: "${control}". Requirement: ${requirement || 'General compliance'}. Return JSON with: evidence_needed (array with title, type, description, priority), documentation_templates (array), testing_procedures (array), review_checklist (array), common_gaps (array).`
    );
    res.json(result || { error: 'Unable to generate evidence requirements' });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// Create remediation plan
router.post('/remediation-plan', async (req, res) => {
  try {
    const { findings, framework, timeline } = req.body;
    if (!findings) return res.status(400).json({ error: 'Findings are required' });

    const result = await callAI(
      'You are a compliance remediation strategist who creates actionable plans to address audit findings and compliance gaps. Always respond with valid JSON only.',
      `Create remediation plan for ${framework || 'compliance'} findings: ${findings}. Timeline: ${timeline || '90 days'}. Return JSON with: remediation_steps (array with finding, action, owner, deadline, effort_hours, priority), total_effort_hours, risk_reduction_estimate, dependencies (array), milestones (array with date, milestone, deliverables), budget_estimate.`
    );
    res.json(result || { error: 'Unable to create remediation plan' });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

module.exports = router;
