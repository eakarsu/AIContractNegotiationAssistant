CREATE TABLE IF NOT EXISTS "User" (
  id SERIAL PRIMARY KEY, email TEXT UNIQUE NOT NULL, password TEXT NOT NULL, name TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'negotiator', tenant_id TEXT NOT NULL DEFAULT 'default',
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(), "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS tenant_id TEXT;
UPDATE "User" SET tenant_id='default' WHERE tenant_id IS NULL;
ALTER TABLE "User" ALTER COLUMN tenant_id SET DEFAULT 'default';
ALTER TABLE "User" ALTER COLUMN tenant_id SET NOT NULL;

CREATE TABLE governed_matters (
  id SERIAL PRIMARY KEY, tenant_id TEXT NOT NULL, matter_key TEXT NOT NULL, name TEXT NOT NULL,
  privilege_label TEXT NOT NULL CHECK (privilege_label IN ('attorney_client','work_product','confidential')),
  status TEXT NOT NULL DEFAULT 'active', created_by_id INTEGER NOT NULL REFERENCES "User"(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(), updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(), UNIQUE(tenant_id,matter_key)
);
CREATE INDEX governed_matters_tenant_idx ON governed_matters(tenant_id,id);
CREATE TABLE governed_playbooks (
  id SERIAL PRIMARY KEY, tenant_id TEXT NOT NULL, matter_id INTEGER NOT NULL REFERENCES governed_matters(id),
  name TEXT NOT NULL, version TEXT NOT NULL, jurisdiction TEXT NOT NULL, content_hash CHAR(64) NOT NULL,
  approved_by_id INTEGER NOT NULL REFERENCES "User"(id), approved_at TIMESTAMPTZ NOT NULL DEFAULT NOW(), created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(tenant_id,matter_id,name,version)
);
CREATE INDEX governed_playbooks_tenant_idx ON governed_playbooks(tenant_id,matter_id);
CREATE TABLE governed_playbook_rules (
  id SERIAL PRIMARY KEY, tenant_id TEXT NOT NULL, playbook_id INTEGER NOT NULL REFERENCES governed_playbooks(id),
  rule_key TEXT NOT NULL, clause_type TEXT NOT NULL, source_clause TEXT NOT NULL, preferred_text TEXT NOT NULL,
  fallback_text TEXT, risk_level TEXT NOT NULL, created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(), UNIQUE(playbook_id,rule_key)
);
CREATE INDEX governed_playbook_rules_tenant_idx ON governed_playbook_rules(tenant_id,playbook_id);
CREATE TABLE governed_contract_versions (
  id SERIAL PRIMARY KEY, tenant_id TEXT NOT NULL, matter_id INTEGER NOT NULL REFERENCES governed_matters(id),
  version_number INTEGER NOT NULL CHECK(version_number>0), content_hash CHAR(64) NOT NULL, source_document_id TEXT NOT NULL,
  created_by_id INTEGER NOT NULL REFERENCES "User"(id), created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(), UNIQUE(tenant_id,matter_id,version_number)
);
CREATE INDEX governed_contract_versions_tenant_idx ON governed_contract_versions(tenant_id,matter_id);
CREATE TABLE governed_redlines (
  id SERIAL PRIMARY KEY, tenant_id TEXT NOT NULL, matter_id INTEGER NOT NULL REFERENCES governed_matters(id),
  contract_version_id INTEGER NOT NULL REFERENCES governed_contract_versions(id), playbook_rule_id INTEGER NOT NULL REFERENCES governed_playbook_rules(id),
  source_text TEXT NOT NULL, proposed_text TEXT NOT NULL, rationale TEXT NOT NULL, tradeoffs TEXT NOT NULL, citation JSONB NOT NULL,
  policy_result TEXT NOT NULL, status TEXT NOT NULL DEFAULT 'pending' CHECK(status IN ('pending','approved','rejected')),
  created_by_id INTEGER NOT NULL REFERENCES "User"(id), created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(), updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX governed_redlines_tenant_idx ON governed_redlines(tenant_id,matter_id);
CREATE TABLE governed_redline_approvals (
  id SERIAL PRIMARY KEY, tenant_id TEXT NOT NULL, redline_id INTEGER NOT NULL REFERENCES governed_redlines(id),
  gate TEXT NOT NULL CHECK(gate IN ('legal','business')), decision TEXT NOT NULL CHECK(decision IN ('approved','rejected')),
  rationale TEXT NOT NULL, approver_id INTEGER NOT NULL REFERENCES "User"(id), created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(), UNIQUE(tenant_id,redline_id,gate)
);
CREATE INDEX governed_redline_approvals_tenant_idx ON governed_redline_approvals(tenant_id,redline_id);
CREATE TABLE governed_negotiation_events (
  id SERIAL PRIMARY KEY, tenant_id TEXT NOT NULL, matter_id INTEGER NOT NULL REFERENCES governed_matters(id), event_type TEXT NOT NULL,
  actor_user_id INTEGER NOT NULL REFERENCES "User"(id), payload JSONB NOT NULL, previous_hash CHAR(64), event_hash CHAR(64) NOT NULL UNIQUE,
  occurred_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX governed_events_tenant_idx ON governed_negotiation_events(tenant_id,matter_id,id);
CREATE OR REPLACE FUNCTION prevent_negotiation_event_mutation() RETURNS trigger AS $$ BEGIN RAISE EXCEPTION 'governed_negotiation_events is append-only'; END; $$ LANGUAGE plpgsql;
CREATE TRIGGER governed_negotiation_events_immutable BEFORE UPDATE OR DELETE ON governed_negotiation_events FOR EACH ROW EXECUTE FUNCTION prevent_negotiation_event_mutation();
