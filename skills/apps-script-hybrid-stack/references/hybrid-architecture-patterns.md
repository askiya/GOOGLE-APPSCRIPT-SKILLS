# Hybrid Architecture Patterns

This document catalogs eight hybrid architecture patterns (A–H) that combine Google Apps Script with external free-tier services. Each pattern describes the architecture, connection method, code structure, capacity estimate, warnings, and upgrade path.

---

## Pattern A — GAS + Firebase Firestore

### Architecture

```
┌──────────────────┐      UrlFetchApp + JWT       ┌──────────────────┐
│  Google Apps      │ ──────────────────────────▶  │  Firebase         │
│  Script (Kode.gs) │                              │  Firestore        │
│                   │ ◀──────────────────────────  │  (Spark Plan)     │
│  • Business logic │      JSON responses          │  • 1 GiB storage  │
│  • Google Drive   │                              │  • 50K read/day   │
│  • Sheets export  │                              │  • 20K write/day  │
└──────────────────┘                               └──────────────────┘
        │
        ▼
┌──────────────────┐
│  Google Drive     │
│  • Images, PDFs   │
│  • 15 GB storage  │
└──────────────────┘
```

### Connection method

1. Create a Service Account in Google Cloud Console with Firestore access.
2. Store the private key and client email in Script Properties.
3. Generate a signed JWT in Apps Script, exchange it for an OAuth 2.0 access token.
4. Call Firestore REST API via `UrlFetchApp.fetch()`.

Alternatively, use the community `FirestoreGoogleAppsScript` library for simplified access.

### When to use

- Migrating from Sheets-as-database to a proper NoSQL document store.
- Application needs sub-second reads and flexible document schema.
- No relational query requirements (no JOINs).
- Developer wants to stay fully within Google ecosystem.

### Capacity estimate

| User activity | Max users/day |
|:-------------|:-------------|
| 100 reads/user | ~500 |
| 50 reads/user | ~1,000 |
| 20 reads/user | ~2,500 |

### Warnings

- Firestore Spark plan has hard limits — service stops, no surprise bills.
- Cloud Storage for Firebase is NOT available on Spark since Feb 2026.
- JWT generation in Apps Script consumes execution time (~200ms).
- Service Account credentials must never be committed to source control.

### Template

See [templates/firebase-adapter.js](../templates/firebase-adapter.js).

---

## Pattern B — GAS + Supabase

### Architecture

```
┌──────────────────┐      UrlFetchApp + API Key    ┌──────────────────┐
│  Google Apps      │ ──────────────────────────▶   │  Supabase         │
│  Script (Kode.gs) │                               │  PostgreSQL       │
│                   │ ◀──────────────────────────   │  • 500 MB storage │
│  • Business logic │      JSON responses           │  • 50K MAU auth   │
│  • Google Drive   │                               │  • Unlimited API  │
└──────────────────┘                                │  • Realtime       │
        │                                           │  • Edge Functions │
        ▼                                           └──────────────────┘
┌──────────────────┐
│  Google Drive     │
│  • Images, docs   │
│  Supabase Storage │
│  • 1 GB files     │
└──────────────────┘
```

### Connection method

1. Get the Supabase project URL and `anon` key from dashboard.
2. For server-side operations, also get the `service_role` key.
3. Store keys in Script Properties.
4. Call Supabase PostgREST API via `UrlFetchApp.fetch()`.
5. Use standard PostgREST query syntax: `?select=*&name=eq.John`.

### When to use

- Application needs relational queries (JOINs, aggregates, GROUP BY).
- Built-in auth is desired (email/password, OAuth, magic link) — 50K MAU free.
- Realtime subscriptions needed (note: not directly usable from GAS, but from frontend).
- Row-level security (RLS) policies for multi-tenant data isolation.

### Capacity estimate

| Bottleneck | Limit | Impact |
|:-----------|:------|:-------|
| Storage | 500 MB | ~500K rows of text data |
| Egress | 5 GB/month | ~50K API responses of ~100KB each |
| Auth MAU | 50,000 | Very generous |
| API calls | Unlimited | Not a bottleneck |

### Warnings

- **Inactivity pause:** Project pauses after 1 week of no requests. Mitigate with a GAS time-driven trigger every 6 days that pings the health endpoint.
- **Only 2 active projects** per organization on free plan.
- **No automatic backups.** Implement manual backup to Google Drive via scheduled GAS trigger.
- **Custom SMTP required** for auth email customization on free plan (June 2026 change).

### Template

See [templates/supabase-adapter.js](../templates/supabase-adapter.js).

---

## Pattern C — GAS + Cloudflare Workers/Pages/KV/R2

### Architecture

```
┌──────────┐       HTTPS        ┌──────────────────┐     UrlFetchApp    ┌──────────────┐
│  Browser  │ ───────────────▶  │  Cloudflare       │ ─────────────────▶ │  Google Apps  │
│  (User)   │                   │  Workers          │                    │  Script       │
│           │ ◀───────────────  │  • Route/cache     │ ◀───────────────── │  (Kode.gs)    │
└──────────┘   Cached response  │  • CORS            │   JSON response   └──────────────┘
                                │  • Rate limit       │          │
                                ├──────────────────┤          │
                                │  Cloudflare KV    │          ▼
                                │  • 1 GB cache     │  ┌──────────────┐
                                ├──────────────────┤  │  Firestore /  │
                                │  Cloudflare R2    │  │  Supabase     │
                                │  • 10 GB assets   │  │  (Database)   │
                                │  • Zero egress    │  └──────────────┘
                                ├──────────────────┤
                                │  Cloudflare Pages │
                                │  • Static site    │
                                │  • Global CDN     │
                                └──────────────────┘
```

### Connection method

1. Deploy frontend to Cloudflare Pages (React/Vue/vanilla).
2. Create a Cloudflare Worker as a reverse proxy.
3. Worker receives browser requests, checks KV cache.
4. On cache miss, Worker calls GAS `doGet`/`doPost` web app URL.
5. Worker caches the response in KV with a TTL.
6. Static assets (images, CSS, JS) served from R2 with zero egress cost.

### When to use

- Frontend needs to be served from a global CDN, not GAS HTML Service.
- Need to reduce UrlFetchApp pressure by caching responses at the edge.
- Public assets (product images, documents) need fast, free delivery worldwide.
- Need proper CORS headers, custom domains, or HTTP/2.

### Capacity estimate

With 80% cache-hit ratio:
- 100K Worker requests/day → only 20K cache misses → 20K GAS calls (within free quota).
- Effective throughput: **~10,000 users/day** at 10 requests/user.

### Warnings

- **CPU limit is 10ms per Worker invocation.** Workers must be lightweight — routing, caching, and response transformation only.
- **KV writes are limited to 1,000/day.** KV is designed for read-heavy workloads. Use long TTLs.
- **Pages Functions share the Worker request quota.** Plan accordingly.
- The GAS web app URL must be deployed as `Anyone` for the Worker to call it without auth.

### Template

See [templates/cloudflare-worker-proxy.js](../templates/cloudflare-worker-proxy.js).

---

## Pattern D — GAS + Turso

### Architecture

```
┌──────────────────┐     UrlFetchApp + Auth Token   ┌──────────────────┐
│  Google Apps      │ ──────────────────────────▶    │  Turso            │
│  Script (Kode.gs) │                                │  (libSQL/SQLite)  │
│                   │ ◀──────────────────────────    │  • 500 MB storage │
│  • Business logic │      JSON results              │  • 1M req/month   │
│  • Google Drive   │                                │  • 500M row reads │
└──────────────────┘                                 │  • 500 databases  │
                                                     └──────────────────┘
```

### Connection method

1. Create a Turso database and get the HTTP API URL.
2. Generate an auth token from Turso CLI.
3. Store the URL and token in Script Properties.
4. Send SQL queries via `UrlFetchApp.fetch()` to the Turso HTTP API as JSON payloads.

### When to use

- Need SQL without the overhead of a full PostgreSQL (Supabase/Neon).
- Multi-tenant app where each tenant could get its own database (500 DBs free).
- Need zero cold-start database (file-based, always warm).
- Edge-optimized for Cloudflare Workers companion pattern (C + D combo).

### Capacity estimate

| Resource | Daily equivalent | User estimate (50 queries/user) |
|:---------|:----------------|:-------------------------------|
| 1M requests/month | ~33K/day | ~660 users/day |
| 500M row reads/month | ~16.6M/day | Very generous |

### Warnings

- 500 MB total across ALL databases in your organization.
- Turso is newer; evaluate API stability for long-term production.
- SQL dialect is SQLite-compatible, not full PostgreSQL.

### Template

See [templates/turso-adapter.js](../templates/turso-adapter.js).

---

## Pattern E — GAS + Upstash Redis/QStash

### Architecture

```
┌──────────────────┐     UrlFetchApp + Token       ┌──────────────────┐
│  Google Apps      │ ──────────────────────────▶   │  Upstash Redis    │
│  Script (Kode.gs) │                               │  • 256 MB cache   │
│                   │ ◀──────────────────────────   │  • 500K cmd/month │
│  • Business logic │      JSON responses           ├──────────────────┤
│  • Rate limiting  │                               │  Upstash QStash   │
│  • Session mgmt   │ ──────────────────────────▶   │  • 500 msg/day    │
│  • Job scheduling │                               │  • Retry, delay   │
└──────────────────┘                                └──────────────────┘
        │                    │
        ▼                    ▼
┌──────────────┐    ┌──────────────┐
│  Firestore /  │    │  GAS doPost  │
│  Supabase     │    │  (webhook    │
│  (primary DB) │    │   receiver)  │
└──────────────┘    └──────────────┘
```

### Connection method

1. Create a Redis database at Upstash Console.
2. Get the REST API URL and token.
3. Store in Script Properties.
4. Use simple REST calls: `GET /get/key`, `POST /set/key/value`.
5. QStash: POST a message with a callback URL pointing to your GAS `doPost`.

### When to use

- Need caching layer to reduce database reads (Firestore/Supabase).
- Session management or rate limiting for GAS web app.
- Job queue for tasks exceeding GAS 6-minute execution limit: break into chunks, enqueue with QStash, each chunk calls back to GAS `doPost`.
- Pub/Sub for event-driven patterns.

### Capacity estimate

| Use case | Commands/user | Max users/day |
|:---------|:-------------|:-------------|
| Session cache (5 ops) | 5 | ~3,300 |
| Rate limiting (2 ops) | 2 | ~8,300 |
| Full cache + session (15 ops) | 15 | ~1,100 |

### Warnings

- 500K commands/month is modest. Use only for high-value caching, not as primary storage.
- QStash 500 messages/day limits the number of async jobs.
- Redis data is ephemeral by design — always back with a durable primary DB.

### Template

See [templates/upstash-adapter.js](../templates/upstash-adapter.js).

---

## Pattern F — GAS + MongoDB Atlas

### Architecture

```
┌──────────────────┐     UrlFetchApp + API Key     ┌──────────────────┐
│  Google Apps      │ ──────────────────────────▶   │  MongoDB Atlas    │
│  Script (Kode.gs) │                               │  M0 Free Cluster  │
│                   │ ◀──────────────────────────   │  • 512 MB storage │
│  • Business logic │      JSON documents           │  • 500 connections│
│  • Google Drive   │                               │  • Atlas Search   │
└──────────────────┘                                │  • Data API       │
                                                    └──────────────────┘
```

### Connection method

1. Create an M0 free cluster in MongoDB Atlas.
2. Enable the Data API in Atlas dashboard.
3. Create an API key for Data API access.
4. Store the endpoint, API key, and data source name in Script Properties.
5. Call the Data API via `UrlFetchApp.fetch()` with JSON body containing the action, collection, and filter/document.

### When to use

- Already familiar with MongoDB and want to keep using it.
- Need flexible schema that changes frequently (product catalogs, forms).
- Need built-in full-text search (Atlas Search) without setting up a separate search engine.
- Document model aligns naturally with the data (nested objects, arrays).

### Capacity estimate

| Resource | Limit | Notes |
|:---------|:------|:------|
| Storage | 512 MB | ~500K average documents |
| Connections | 500 | Data API handles pooling |
| Throughput | Shared | Variable, no guarantees |

### Warnings

- No automatic backups on M0. Schedule manual exports via Data API + GAS trigger.
- Shared resources mean inconsistent performance under load.
- Data API adds latency vs direct driver connection (~50-100ms overhead).
- MongoDB Atlas has historically maintained their free tier, but always have an exit plan.

### Template

See [templates/mongodb-adapter.js](../templates/mongodb-adapter.js).

---

## Pattern G — GAS + Neon PostgreSQL

### Architecture

```
┌──────────────────┐     UrlFetchApp + Connection   ┌──────────────────┐
│  Google Apps      │ ──────────────────────────▶    │  Neon PostgreSQL   │
│  Script (Kode.gs) │                                │  Serverless        │
│                   │ ◀──────────────────────────    │  • 500 MB storage  │
│  • Business logic │      JSON query results        │  • 100 CU-hr/month │
│  • Google Drive   │                                │  • 10 branches     │
└──────────────────┘                                 │  • Scale-to-zero   │
                                                     └──────────────────┘
```

### Connection method

1. Create a Neon project and database.
2. Get the connection string from Neon dashboard.
3. Use Neon's serverless driver HTTP endpoint (not raw TCP — Apps Script cannot do TCP).
4. Store the endpoint and credentials in Script Properties.
5. Send SQL queries as HTTP POST to the Neon serverless endpoint.

### When to use

- Need full PostgreSQL without Supabase's extra layers (auth, realtime, storage).
- Want database branching for dev/test environments (10 branches free).
- Need a clean, minimal PostgreSQL with scale-to-zero billing efficiency.
- Already have a mature PostgreSQL schema to migrate.

### Capacity estimate

| Resource | Effective daily | Notes |
|:---------|:---------------|:------|
| 100 CU-hours/month | ~3.3 CU-hours/day | Light queries: ~30K queries/day |
| 500 MB storage | — | ~500K rows of text data |
| 5 GB egress/month | ~170 MB/day | ~1,700 responses of ~100KB |

### Warnings

- **Scale-to-zero after 5 minutes.** First query after idle has ~300ms cold start.
- Compute budget (100 CU-hours) can be consumed quickly by complex queries or frequent access.
- 6-hour history window limits point-in-time recovery.
- Neon is venture-funded — monitor for pricing changes.

### Template

See [templates/neon-adapter.js](../templates/neon-adapter.js).

---

## Pattern H — GAS + Vercel

### Architecture

```
┌──────────┐       HTTPS        ┌──────────────────┐     UrlFetchApp     ┌──────────────┐
│  Browser  │ ───────────────▶  │  Vercel           │ ──────────────────▶ │  Google Apps  │
│  (User)   │                   │  Edge/Serverless  │                     │  Script       │
│           │ ◀───────────────  │  Functions        │ ◀────────────────── │  (Kode.gs)    │
└──────────┘   SSR/ISR page     │  • 1M invocations │   JSON response    └──────────────┘
                                │  • 300s duration   │
                                │  • Next.js/Nuxt    │
                                └──────────────────┘
```

### Connection method

1. Deploy a Next.js/Nuxt/SvelteKit app to Vercel.
2. Create API routes or Edge Functions that call GAS web app URL.
3. Use ISR (Incremental Static Regeneration) to cache GAS responses.
4. GAS handles business logic and database operations.

### When to use

- Want a modern SSR/SSG framework (Next.js) with GAS as the API backend.
- Need ISR for SEO-friendly pages that update periodically.
- Prototyping or personal project (non-commercial).

### Capacity estimate

| Resource | Monthly | Daily equivalent |
|:---------|:--------|:----------------|
| Function invocations | 1,000,000 | ~33,333 |
| Edge requests | 1,000,000 | ~33,333 |
| Data transfer | 100 GB | ~3.3 GB |

### Warnings

> **⚠️ CRITICAL: Vercel Hobby plan is strictly for non-commercial, personal use.** Any commercial project, revenue generation, or business use requires the Pro plan at $20/month. Violating this may result in account termination.

- Active CPU is limited to 4 CPU-hours/month — monitor in Vercel dashboard.
- No team collaboration on Hobby plan.
- If the project grows to commercial use, budget for the Pro plan upgrade.

### Template

See [templates/vercel-edge-proxy.js](../templates/vercel-edge-proxy.js).

---

## Composite patterns (combining multiple)

### Mega Combo: A + C + E (Firestore + Cloudflare + Upstash)

Best for: Production-grade free-tier app with maximum scalability.

```
Browser → Cloudflare Pages (static frontend)
       → Cloudflare Worker (edge proxy + cache)
       → GAS Kode.gs (business logic)
       → Firestore (database)
       → Upstash Redis (cache + session)
       → Google Drive (files)
       → Cloudflare R2 (public assets)
```

### Relational Combo: B + C + E (Supabase + Cloudflare + Upstash)

Best for: Apps needing SQL, auth, and global CDN.

### Edge-Native Combo: C + D + E (Cloudflare + Turso + Upstash)

Best for: Maximum edge performance with GAS as background worker only.

### Budget SaaS: B + E + G (Supabase auth + Upstash cache + Neon DB)

Best for: Multi-tenant SaaS with PostgreSQL and built-in auth.
