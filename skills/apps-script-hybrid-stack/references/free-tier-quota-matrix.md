# Free-Tier Quota Matrix

> **Warning:** Free-tier limits change frequently. Always verify against official pricing pages before making architectural decisions. This matrix was last verified August 2026.

## Google Apps Script (baseline)

| Resource | Consumer (free) | Workspace |
|:---------|:----------------|:----------|
| Execution time per run | 6 minutes | 6 minutes |
| Total trigger runtime/day | 90 minutes | 6 hours |
| `UrlFetchApp` calls/day | 20,000 | 100,000 |
| `UrlFetchApp` payload | 50 MB per call | 50 MB per call |
| Script properties | 500 KB total | 500 KB total |
| Simultaneous executions | 30 | 30 |
| `fetchAll` batch | ~100 recommended | ~100 recommended |

## Google Drive (included with Google account)

| Resource | Free |
|:---------|:-----|
| Storage | 15 GB shared across Drive, Gmail, Photos |
| File upload | 5 TB per file (theoretical) |
| API calls | 12,000 queries/min/project (Cloud Console) |
| Sharing | Public or restricted |

---

## Pattern A — Firebase Firestore (Spark Plan)

| Resource | Limit | Reset |
|:---------|:------|:------|
| Stored data | 1 GiB | — |
| Document reads | 50,000/day | Midnight PT |
| Document writes | 20,000/day | Midnight PT |
| Document deletes | 20,000/day | Midnight PT |
| Network egress | 10 GiB/month | Monthly |
| Cloud Storage | ❌ Not available on Spark (Feb 2026) | — |

**Capacity estimate:** ~500 users × 100 reads/day = 50K reads. At 200 reads/user → ~250 users/day.

**Exceeding behavior:** Service stops responding until next reset. No surprise bills on Spark.

**Upgrade:** Blaze (pay-as-you-go): $0.06/100K reads, $0.18/100K writes. Requires billing account. No hard spending cap — set budget alerts.

---

## Pattern B — Supabase (Free Plan)

| Resource | Limit | Reset |
|:---------|:------|:------|
| Database storage | 500 MB | — |
| File storage | 1 GB | — |
| Monthly Active Users (Auth) | 50,000 | Monthly |
| Database egress | 5 GB/month | Monthly |
| Cached egress | 5 GB/month | Monthly |
| API requests | Unlimited | — |
| Edge Functions | 500,000 invocations/month | Monthly |
| Active projects | 2 per org | — |
| Compute | Shared CPU, ~500 MB RAM | — |
| Backups | ❌ None | — |

**Capacity estimate:** Unlimited API requests + 50K MAU auth → very generous for CRUD apps. Storage (500 MB) is the real bottleneck.

**⚠️ Inactivity pause:** Project pauses after 1 week of no activity. Must keep alive with a periodic ping (e.g., GAS time-driven trigger every 6 days).

**Upgrade:** Pro plan at $25/month: 8 GB DB, 100K MAU, daily backups.

---

## Pattern C — Cloudflare (Free Plan)

### Workers

| Resource | Limit | Reset |
|:---------|:------|:------|
| Requests | 100,000/day | Midnight UTC |
| CPU time | 10 ms/invocation | Per request |
| Scripts | 100 | — |

### KV

| Resource | Limit | Reset |
|:---------|:------|:------|
| Storage | 1 GB | — |
| Reads | 100,000/day | Midnight UTC |
| Writes | 1,000/day | Midnight UTC |
| Deletes | 1,000/day | Midnight UTC |
| Lists | 1,000/day | Midnight UTC |

### R2

| Resource | Limit | Reset |
|:---------|:------|:------|
| Storage | 10 GB/month | Monthly |
| Class A ops (write/list) | 1,000,000/month | Monthly |
| Class B ops (read) | 10,000,000/month | Monthly |
| Egress | **Unlimited free** 🔥 | — |

### Pages

| Resource | Limit | Reset |
|:---------|:------|:------|
| Builds | 500/month | Monthly |
| Files per site | 20,000 | — |
| File size | 25 MiB/asset | — |
| Projects | 100 | — |
| Functions requests | Shared with Workers quota | Daily |

**Capacity estimate:** 100K Workers req/day ÷ ~10 req/user = ~10,000 users/day (for cached responses). R2 zero-egress is exceptional for public file serving.

**⚠️ CPU limit:** 10ms CPU is very tight. Workers should only do routing, caching, and response transformation — no heavy computation.

**Upgrade:** Workers Paid at $5/month: 10M requests, 30M CPU-ms.

---

## Pattern D — Turso (Free Plan)

| Resource | Limit | Reset |
|:---------|:------|:------|
| Storage | 500 MB total | — |
| Requests | 1,000,000/month | Monthly |
| Row reads | 500,000,000/month | Monthly |
| Databases | 500 | — |
| Cold start | None (file-based) | — |

**Capacity estimate:** 1M requests/month ÷ 30 = ~33K/day. Very generous row reads.

**Upgrade:** Developer plan at $4.99/month: 2.5B row reads, more databases.

---

## Pattern E — Upstash (Free Plan)

### Redis

| Resource | Limit | Reset |
|:---------|:------|:------|
| Storage | 256 MB | — |
| Commands | 500,000/month | Monthly |

### QStash

| Resource | Limit | Reset |
|:---------|:------|:------|
| Messages | 500/day | Daily |
| Retries | Included | — |

**Capacity estimate:** 500K commands/month ÷ 30 = ~16,600/day. For caching/sessions, each user might use ~10 commands → ~1,600 users/day.

**Upgrade:** Pay-as-you-go: $0.20/100K commands + $0.25/GB storage.

---

## Pattern F — MongoDB Atlas (M0 Free Cluster)

| Resource | Limit | Reset |
|:---------|:------|:------|
| Storage | 512 MB | — |
| Connections | 500 simultaneous | — |
| RAM/vCPU | Shared | — |
| Atlas Search | Included (limited) | — |
| Backups | ❌ None | — |
| Data API | Available | — |
| Time limit | None (no expiry) | — |

**Capacity estimate:** 500 connections shared. For REST API via Data API, connection pooling is handled server-side — effectively unlimited concurrent API callers.

**Upgrade:** M10 dedicated at ~$9/month: dedicated resources, backups, 10+ GB.

---

## Pattern G — Neon PostgreSQL (Free Plan)

| Resource | Limit | Reset |
|:---------|:------|:------|
| Storage | 500 MB/project | — |
| Compute | 100 CU-hours/month | Monthly |
| Autoscaling | Up to 2 CU (~8 GB RAM) | — |
| Scale-to-zero | After 5 min inactivity | — |
| Branches | 10/project | — |
| Projects | 100 | — |
| Egress | 5 GB/month | Monthly |
| History | 6 hours | — |

**Capacity estimate:** 100 CU-hours ≈ 6,000 CU-minutes. If each query uses 0.01 CU-min → ~600K queries/month → ~20K/day.

**⚠️ Cold start:** ~300ms resume from suspended state. Not ideal for latency-sensitive real-time apps.

**Upgrade:** Launch plan: pay-per-use at ~$0.106/CU-hour. No monthly minimum.

---

## Pattern H — Vercel (Hobby Plan)

| Resource | Limit | Reset |
|:---------|:------|:------|
| Serverless function invocations | 1,000,000/month | Monthly |
| Function duration | 300 seconds | Per invocation |
| Function memory | 2 GB RAM, 1 vCPU | Per invocation |
| Edge requests | 1,000,000/month | Monthly |
| Edge function duration | 25s initial + 300s streaming | Per invocation |
| Data transfer | 100 GB/month (fair use) | Monthly |
| Active CPU | 4 CPU-hours/month | Monthly |
| Builds | Unlimited | — |

**⚠️ CRITICAL: Non-commercial use only.** Vercel Terms of Service require a paid Pro plan ($20/month) for any commercial project. Include in architecture only for personal projects, learning, or prototypes.

**Capacity estimate:** 1M invocations/month is very generous for personal projects.

**Upgrade:** Pro plan at $20/month: commercial use, 1TB bandwidth, team features.

---

## Composite quota planning

When combining multiple services, the **bottleneck is the smallest quota**. Example for the "Mega Combo" stack:

| Layer | Service | Daily limit | Bottleneck? |
|:------|:--------|:------------|:------------|
| Edge | Cloudflare Workers | 100K req/day | Unlikely |
| Cache | Cloudflare KV | 100K reads/day | Unlikely |
| Backend | Apps Script UrlFetchApp | 20K calls/day | **Often yes** |
| Database | Firestore | 50K reads/day | Medium risk |
| Queue | Upstash Redis | ~16.6K cmd/day | Medium risk |
| Files | Google Drive | 15 GB storage | Low risk |
| Public assets | Cloudflare R2 | 10 GB storage | Low risk |

**Typical bottleneck order:** GAS UrlFetchApp (20K/day) → Firestore reads (50K/day) → Upstash commands (16.6K/day) → everything else.

**Mitigation:** Use Cloudflare KV as a read cache to reduce both UrlFetchApp calls and Firestore reads. A cache-hit ratio of 80% effectively multiplies your capacity by 5×.

---

## Warning thresholds

Set up monitoring (see [quota-monitor-template.md](quota-monitor-template.md)) with these thresholds:

| Level | Usage | Action |
|:------|:------|:-------|
| 🟢 Normal | < 70% | No action |
| 🟡 Warning | 70–89% | Email alert, review usage patterns |
| 🟠 Critical | 90–99% | Activate caching, reduce polling frequency |
| 🔴 Exceeded | 100% | Service stops (Spark) or bills start (Blaze/Pay-as-you-go) |
