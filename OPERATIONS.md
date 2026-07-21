# Operations

`/api/governed-negotiations` is the supported reference workflow. It isolates matters by tenant, records privilege labels and contract hashes, requires legal-approved versioned playbooks, accepts only exact preferred/fallback clause text, preserves citations/tradeoffs/history, and requires independent legal plus business approval. Approval is internal authorization only: the app cannot sign or commit a party.

Run `npm ci` separately in backend/frontend, copy `.env.example`, configure a least-privilege PostgreSQL URL and strong JWT secret, then run `npm run db:migrate` and `npm run db:generate` in backend. Startup never installs, migrates, resets, or seeds. Provision users with the environment-only `npm run create-user` command. Self-registration and broad legacy/gap/AI routes are disabled by default. The destructive demo seed requires both the explicit `db:seed:demo` command and `ALLOW_DEMO_SEED=true`.

OCR/document comparison, authoritative clause libraries, e-signature, CRM/procurement/matter-system sync, legal research, identity-provider integration, data retention, legal-hold, and privilege-policy validation require real vendors and qualified legal/security review. This code is not legal advice and makes no provider, professional, signature, or jurisdictional-validation claim.
