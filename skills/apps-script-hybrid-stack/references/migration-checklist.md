# Migration Checklist

Step-by-step guide for migrating from a pure Google Apps Script (Sheets-as-database) setup to a hybrid architecture with an external database.

---

## Phase 0 — Pre-migration assessment

- [ ] Inventory all Sheets used as databases (list sheet names, row counts, column schemas).
- [ ] Measure current daily read/write volumes (use execution logs or a counter in Script Properties).
- [ ] Identify which data is relational vs document-oriented.
- [ ] Identify which data contains sensitive/PII fields.
- [ ] Check current UrlFetchApp usage — migrating adds external API calls to this quota.
- [ ] Choose target pattern from [hybrid-architecture-patterns.md](hybrid-architecture-patterns.md).
- [ ] Verify target service free-tier limits against [free-tier-quota-matrix.md](free-tier-quota-matrix.md).
- [ ] Document rollback criteria: what failure conditions trigger a revert to Sheets.

## Phase 1 — Set up external service

- [ ] Create account on target service (Firebase/Supabase/Turso/etc.).
- [ ] Set up project/database with proper naming and region.
- [ ] Design the schema/collection structure based on current Sheets columns.
- [ ] Generate API credentials (Service Account, API key, tokens).
- [ ] Store credentials in Script Properties — never in source code.
- [ ] Test connectivity from Apps Script with a simple read/write.
- [ ] Verify error handling for auth failures, timeouts, and rate limits.

## Phase 2 — Build the adapter

- [ ] Create a dedicated `.gs` file for the external service adapter (e.g., `FirestoreAdapter.gs`).
- [ ] Implement domain-level functions (`getUser`, `saveOrder`), not raw HTTP helpers.
- [ ] Add retry logic with capped exponential backoff for transient errors.
- [ ] Add request/response logging (redact sensitive fields).
- [ ] Add quota counter: increment a Script Property on each API call.
- [ ] Write unit tests for the adapter with mocked responses.
- [ ] Copy a template from `templates/` and adapt it.

## Phase 3 — Dual-write period

> This is the critical safety phase. Run both old (Sheets) and new (external DB) simultaneously.

- [ ] Modify write functions to write to BOTH Sheets and external DB.
- [ ] Keep Sheets as the source of truth during this phase.
- [ ] Run for at least 1–2 weeks to build confidence.
- [ ] Compare data between Sheets and external DB daily (automated reconciliation script).
- [ ] Monitor for discrepancies: missing records, type mismatches, encoding issues.
- [ ] Monitor quota usage: are dual writes doubling your UrlFetchApp consumption?
- [ ] Document any data transformation issues found.

## Phase 4 — Data migration (bulk)

- [ ] Write a migration script that reads all rows from Sheets and writes to external DB.
- [ ] Handle GAS 6-minute execution limit: use checkpointing (save last-migrated row index in Script Properties) and time-driven triggers to resume.
- [ ] Use batch writes where the external service supports them.
- [ ] Validate migrated data: row counts match, spot-check 50+ random records.
- [ ] Generate a migration report (timestamp, rows migrated, errors).

## Phase 5 — Switch source of truth

- [ ] Change read functions to read from external DB (not Sheets).
- [ ] Keep write functions writing to BOTH for 1 more week.
- [ ] Monitor: latency, error rates, quota consumption.
- [ ] If stable, stop writing to Sheets (keep Sheets as read-only backup).
- [ ] Update all entry points (doGet, doPost, triggers, menus) to use the new adapter.

## Phase 6 — Cleanup and monitoring

- [ ] Remove dual-write code (keep Sheets backup read-only).
- [ ] Set up quota monitoring using [quota-monitor-template.md](quota-monitor-template.md).
- [ ] Configure email alerts at 70% and 90% quota thresholds.
- [ ] Document the new architecture in the project README.
- [ ] Archive the migration script (do not delete — may need for rollback).
- [ ] Schedule a monthly backup from external DB to Google Drive (JSON export).

## Rollback plan

If critical issues are found during migration:

1. **During dual-write (Phase 3–5):** Simply revert read functions to Sheets. Data is still there.
2. **After switch (Phase 6):** Run a reverse migration: read from external DB, write back to Sheets.
3. **External service outage:** The adapter's error handling should fall back to cached data or a maintenance page.

### Rollback triggers

- Error rate exceeds 5% of requests over 1 hour.
- Quota exceeded with no mitigation available.
- Data integrity check finds > 0.1% discrepancies.
- External service announces deprecation of free tier (like PlanetScale did in 2024).

---

## Common pitfalls

| Pitfall | Prevention |
|:--------|:-----------|
| Forgetting row-number-based references | Use stable document/row IDs, never Sheets row numbers |
| Date/timezone mismatches | Normalize all dates to UTC/ISO 8601 before storing |
| Character encoding issues | Ensure UTF-8 throughout; test with non-Latin characters |
| Hitting UrlFetchApp quota during bulk migration | Use time-driven triggers with checkpointing, not one big run |
| Losing data during switchover | Dual-write period prevents this |
| Service Account key in source control | .gitignore and Script Properties only |
| Supabase project pausing during migration | Set up a keep-alive ping trigger |
