export type AIExampleField = { name: string; label: string; type?: string; required?: boolean; options?: string[] };
export type SavedAIReference = { id: number; title?: string; name?: string; contractType?: string };
export const ALL_RECORDS = '__all__';
export const AI_EXAMPLE_LABELS = ['Balanced agreement', 'Risk review', 'Negotiation preparation'] as const;

// These are editable request examples. They never create contracts, parties, or AI results.
const examples: Record<string, Record<string, string | number>[]> = {
  'draft-from-scratch': [
    { contract_type: 'Services agreement', requirements: 'Draft an agreement for a fictional website redesign. Include milestones, acceptance criteria, change requests, confidentiality, intellectual property, termination and a dispute process. Identify assumptions for legal review.', parties: 'Example Studio LLC (supplier) and Sample Retail LLC (customer)', jurisdiction: 'New York, United States; confirm with counsel before use', value: 'USD 24,000, payable in three milestone installments', duration: '12 weeks, followed by a 30-day correction period' },
    { contract_type: 'Software subscription agreement', requirements: 'Draft a fictional subscription agreement with data handling, availability commitments, incident notification, liability limits and an exit/export process. Highlight unresolved security and privacy requirements.', parties: 'Sample Software LLC (vendor) and Example Operations LLC (subscriber)', jurisdiction: 'England and Wales; confirm applicable law with counsel', value: 'GBP 18,000 per year, excluding applicable taxes', duration: '12 months; renewal only after written agreement' },
    { contract_type: 'Consulting agreement', requirements: 'Draft a fictional consulting engagement with deliverables, ownership of work, permitted background materials, invoicing, cancellation and negotiation alternatives for disputed terms.', parties: 'Example Advisory LLC (consultant) and Sample Manufacturing LLC (client)', jurisdiction: 'California, United States; confirm with counsel before use', value: 'USD 36,000; USD 12,000 per accepted phase', duration: 'Six months with a 30-day termination notice' },
  ],
  'redteam-simulator': [
    { our_position: 'Fictional buyer: accept milestone payments after documented acceptance, a 30-day cure period and a liability cap aligned to annual fees. Ask for practical concessions without inventing facts.', counterparty_persona: 'Fictional small services supplier concerned about cash flow and disproportionate liability; commercially pragmatic.', contract_type: 'Services agreement', rounds: 3 },
    { our_position: 'Fictional subscriber: require a documented data return process, incident notification and measurable support commitments; flag any assumption that needs evidence.', counterparty_persona: 'Fictional software vendor with standard terms; prefers a single annual liability cap and limited service credits.', contract_type: 'Software subscription agreement', rounds: 4 },
    { our_position: 'Fictional consultant: retain background intellectual property, offer defined deliverables and seek fair acceptance and termination terms.', counterparty_persona: 'Fictional procurement manager seeking predictable cost, ownership of deliverables and the ability to exit a delayed project.', contract_type: 'Consulting agreement', rounds: 5 },
  ],
  'historical-analytics': [
    { contract_type: ALL_RECORDS, party_id: ALL_RECORDS, period_days: 90 },
    { contract_type: ALL_RECORDS, party_id: ALL_RECORDS, period_days: 365 },
    { contract_type: ALL_RECORDS, party_id: ALL_RECORDS, period_days: 730 },
  ],
  'clause-conflict-detector': [{}, {}, {}],
  'regulatory-monitor': [
    { regulations: 'Review privacy and data-protection clauses relevant to this saved contract. Separate possible concerns from verified obligations and identify sources and versions counsel must confirm.' },
    { regulations: 'Review record-retention, confidentiality and incident-notification clauses in this saved contract. Identify jurisdiction questions and request current authoritative sources before asserting any legal change.' },
    { regulations: 'Review assignment, termination and applicable regulatory clauses in this saved contract. Explain uncertainty, missing context and items for qualified legal review.' },
  ],
  'sentiment-analysis': [
    { text: 'Fictional clause: The buyer will pay within 30 days after acceptance. The seller has 15 business days to correct documented defects. Neither party may terminate for convenience during an accepted milestone.', our_role: 'buyer' },
    { text: 'Fictional clause: The licensee must indemnify the licensor for all third-party claims, regardless of cause. The licensor may change service terms without notice and has no obligation to return customer data.', our_role: 'licensee' },
    { text: 'Fictional clause: The consultant retains background methods and licenses incorporated materials to the client. New deliverables transfer upon payment; disputed invoices require a written explanation within ten business days.', our_role: 'seller' },
  ],
  'pricing-recommender': [
    { contract_type: 'Services agreement', scope: 'Fictional 12-week website redesign with discovery, design, implementation, accessibility checks and a 30-day correction period; distinguish actual saved precedents from assumptions.', industry: 'Retail', region: 'New York, United States', party_id: ALL_RECORDS },
    { contract_type: 'Software subscription agreement', scope: 'Fictional annual subscription for 50 users with onboarding, support and data export. Show any limits in the available saved pricing history.', industry: 'Business software', region: 'United Kingdom', party_id: ALL_RECORDS },
    { contract_type: 'Consulting agreement', scope: 'Fictional three-phase operational review with workshops, findings and implementation guidance. Compare actual saved precedents only and state missing data.', industry: 'Manufacturing', region: 'California, United States', party_id: ALL_RECORDS },
  ],
  'auto-redline-engine': [
    { proposed_text: 'Fictional clause: The supplier may increase fees at any time. All deliverables are deemed accepted on delivery, and the customer has no right to reject defective work.', policy: 'Require advance written agreement to fee changes, objective acceptance criteria, ten business days for review and a reasonable correction period. Explain each suggested revision for counsel.', contract_type: 'Services agreement' },
    { proposed_text: 'Fictional clause: The vendor may use customer data for any purpose and may retain all copies indefinitely after termination. No incident notification is required.', policy: 'Limit data use to agreed services, specify authorized retention and deletion, require an export process and propose incident notification for legal review. Avoid claiming compliance without evidence.', contract_type: 'Software subscription agreement' },
    { proposed_text: 'Fictional clause: The client owns all consultant materials, including pre-existing methods. The client may withhold all fees if any deliverable is disputed.', policy: 'Preserve background intellectual property with an appropriate deliverable license, distinguish disputed from undisputed fees and add a written acceptance and cure process.', contract_type: 'Consulting agreement' },
  ],
};

const positiveId = (value: unknown) => Number.isSafeInteger(Number(value)) && Number(value) > 0;

export function fillContractAIExample(
  toolId: string,
  index: number,
  fields: AIExampleField[],
  current: Record<string, string | number>,
  contracts: SavedAIReference[],
  parties: SavedAIReference[],
): { values: Record<string, string | number>; missingReference: boolean } {
  const source = examples[toolId]?.[index];
  if (!source) throw new Error('Unknown AI example');
  const values = { ...source };
  if (fields.some(field => field.name === 'contract_id')) {
    values.contract_id = positiveId(current.contract_id) ? current.contract_id : contracts[index % Math.max(contracts.length, 1)]?.id ?? '';
  }
  if (fields.some(field => field.name === 'party_id')) {
    // Keep an explicit selection; “All parties” is a real unfiltered query, not a made-up ID.
    values.party_id = positiveId(current.party_id) ? current.party_id : current.party_id === ALL_RECORDS ? ALL_RECORDS : parties[index % Math.max(parties.length, 1)]?.id ?? ALL_RECORDS;
  }
  if (toolId === 'historical-analytics') {
    values.contract_type = current.contract_type || contracts[index % Math.max(contracts.length, 1)]?.contractType || ALL_RECORDS;
  } else if (toolId === 'pricing-recommender') {
    values.contract_type = contracts[index % Math.max(contracts.length, 1)]?.contractType || values.contract_type;
  }
  return { values, missingReference: fields.some(field => field.name === 'contract_id' && !positiveId(values.contract_id)) };
}

export function contractAIRequestPayload(toolId: string, fields: AIExampleField[], form: Record<string, string | number>) {
  const payload: Record<string, string | number> = {};
  for (const field of fields) {
    const value = form[field.name];
    if (value == null || String(value).trim() === '') continue;
    if ((field.name === 'party_id' || (toolId === 'historical-analytics' && field.name === 'contract_type')) && value === ALL_RECORDS) continue;
    if (field.type === 'number') {
      if (!positiveId(value)) throw new Error(`${field.label} must be a positive whole number`);
      payload[field.name] = Number(value);
    } else {
      payload[field.name] = value;
    }
  }
  return payload;
}
