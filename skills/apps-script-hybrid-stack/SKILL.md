---
name: apps-script-hybrid-stack
description: Design, evaluate, or implement hybrid architectures that keep Google Apps Script as the backend while offloading database, caching, hosting, or storage to free-tier external services (Firebase Firestore, Supabase, Cloudflare Workers/Pages/KV/R2, Turso, Upstash Redis, MongoDB Atlas, Neon PostgreSQL, Vercel). Use for scaling beyond Sheets-as-database, choosing a free-tier combination, migrating data, monitoring quotas, or architecting a multi-service stack that remains cost-free. Do not use for pure Apps Script work that stays entirely within Google Workspace; use the relevant GAS skill instead.
---

# Apps Script Hybrid Stack

## Goal

Extend a Google Apps Script application beyond Workspace-only limits by combining it with external free-tier services — without spending money and without abandoning the Apps Script ecosystem.

The skill helps the agent choose the right combination of services, design the integration boundary, implement adapters, plan data migration, and set up quota monitoring so the developer gets early warnings before hitting limits.

## Inputs to establish

- Current architecture: pure Sheets, pure GAS web app, or already hybrid.
- Data profile: volume, read/write ratio, query complexity, relational needs, schema flexibility.
- User scale: current daily active users, projected growth, peak concurrency.
- File profile: types (images, documents, PDFs), average size, public vs private access.
- Latency needs: real-time, near-real-time, or batch is acceptable.
- Budget constraint: must remain at $0, or a small paid tier is acceptable as a ceiling.
- Compliance: data residency, GDPR, or organizational restrictions on external services.
- Existing familiarity: which external services the developer already knows.

## Decision workflow

1. Quantify the bottleneck: is it storage capacity, read/write throughput, query capability, file serving speed, execution time, or frontend hosting?
2. Match the bottleneck to a pattern from [references/hybrid-architecture-patterns.md](references/hybrid-architecture-patterns.md).
3. Verify current free-tier limits against [references/free-tier-quota-matrix.md](references/free-tier-quota-matrix.md) — limits change; always check official docs.
4. Estimate headroom: divide free-tier daily/monthly quota by per-user cost to find the maximum users before hitting limits.
5. If one pattern is not enough, compose patterns (e.g., Pattern A + C + E = Firestore + Cloudflare + Upstash).
6. Design the adapter boundary: thin wrapper in `Kode.gs` that isolates external calls behind a stable internal interface.
7. Plan data migration using [references/migration-checklist.md](references/migration-checklist.md).
8. Set up quota monitoring using [references/quota-monitor-template.md](references/quota-monitor-template.md).

## Available patterns

| Pattern | Stack | Best for |
|:--------|:------|:---------|
| A | GAS + Firebase Firestore | NoSQL CRUD, simple scaling from Sheets |
| B | GAS + Supabase | Relational queries, built-in auth, realtime |
| C | GAS + Cloudflare Workers/Pages/KV/R2 | Global CDN, static hosting, edge caching, zero-egress storage |
| D | GAS + Turso | Edge SQLite, multi-tenant, no cold start |
| E | GAS + Upstash Redis/QStash | Caching, session management, job queues |
| F | GAS + MongoDB Atlas | Flexible document DB, full-text search |
| G | GAS + Neon PostgreSQL | Serverless Postgres, database branching |
| H | GAS + Vercel | Serverless functions, ISR, frontend hosting (non-commercial only) |

See [references/hybrid-architecture-patterns.md](references/hybrid-architecture-patterns.md) for detailed documentation of each pattern including architecture diagrams, connection methods, capacity estimates, and warnings.

## Adapter rules

- Every external service gets its own adapter module in `Kode.gs` (or a dedicated `.gs` file).
- The adapter exposes a domain interface (`getUser`, `saveOrder`) not a transport interface (`httpGet`, `postJson`).
- Store all API keys, service account credentials, and tokens in `PropertiesService.getScriptProperties()`, never in source code.
- Set `muteHttpExceptions: true` and inspect `getResponseCode()` explicitly.
- Implement capped exponential backoff with jitter for transient errors (429, 5xx).
- Batch reads with `UrlFetchApp.fetchAll()` when ordering does not matter.
- Make all writes idempotent: use stable document IDs or upsert semantics.
- Log quota-relevant metrics (call count, bytes transferred) to a monitoring sheet or property.

## Template adapters

Ready-to-adapt templates are available in `templates/`:

- `firebase-adapter.js` — Firestore REST via Service Account JWT
- `supabase-adapter.js` — Supabase PostgREST with anon/service keys
- `cloudflare-worker-proxy.js` — Cloudflare Worker reverse proxy for GAS
- `turso-adapter.js` — Turso libSQL HTTP API
- `upstash-adapter.js` — Upstash Redis REST + QStash
- `mongodb-adapter.js` — MongoDB Atlas Data API
- `neon-adapter.js` — Neon serverless HTTP driver
- `vercel-edge-proxy.js` — Vercel Edge Function proxy

These are examples to adapt, not production secrets or universal architecture.

## Required output

1. Chosen pattern(s) with rationale and rejected alternatives.
2. Architecture diagram showing data flow between GAS, external DB, cache, CDN, and file storage.
3. Adapter code for each external service, following the adapter rules above.
4. Free-tier headroom calculation: quota ÷ per-user usage = max users before limit.
5. Migration plan if moving from an existing pure-GAS setup.
6. Quota monitoring setup with early-warning thresholds (70%, 90%, 100%).
7. Upgrade path: what happens when free tier is exhausted, cost of next tier, migration effort.
8. Risks: vendor lock-in, service discontinuation (e.g., PlanetScale killed free tier in 2024), data sovereignty.

## Handoff

Route implementation details to narrower skills:
- `apps-script-integrations` — for deep adapter and API contract work
- `apps-script-security` — for credential management and OAuth
- `apps-script-performance` — for batching and execution-time optimization
- `apps-script-architect` — for overall system design review
- `apps-script-web-app` — for frontend deployment decisions
- `apps-script-pwa` — for PWA-specific hosting considerations

## References

- [references/free-tier-quota-matrix.md](references/free-tier-quota-matrix.md) — complete free-tier limits
- [references/hybrid-architecture-patterns.md](references/hybrid-architecture-patterns.md) — pattern catalog
- [references/migration-checklist.md](references/migration-checklist.md) — migration guide
- [references/quota-monitor-template.md](references/quota-monitor-template.md) — monitoring template
