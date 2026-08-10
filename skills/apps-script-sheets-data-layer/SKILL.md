---
name: apps-script-sheets-data-layer
description: Design, implement, migrate, or optimize a Google Sheets data layer used by Apps Script. Use for schemas, repositories, CRUD, batch reads and writes, stable IDs, header mapping, indexes, locks, optimistic concurrency, migrations, audit logs, pagination, and decisions about when Sheets is no longer suitable. Do not use for spreadsheet formula help or purely visual formatting.
---

# Apps Script Sheets Data Layer

## Goal

Make Spreadsheet-backed application data predictable, efficient, concurrent-safe, testable, and migratable without treating row numbers as durable identity.

## Inputs to establish

- Spreadsheet and sheet responsibilities without exposing real IDs.
- Headers, types, required fields, unique constraints, and relationships.
- Expected row count, read/write frequency, concurrency, and retention.
- Query and reporting patterns.
- Existing formulas, protected ranges, filters, and human edits that must coexist.

## Workflow

1. Inspect current schema and every place that reads or writes it.
2. Define canonical field names, stable IDs, timestamps, actor IDs, versions, and deletion/archive rules.
3. Centralize header-to-column mapping and fail clearly on schema drift.
4. Read ranges once, transform in memory, and write rectangular arrays in batches.
5. Build lookup maps in memory or maintain an explicit index where repeated full scans are too costly.
6. Validate and authorize before mutation.
7. Use `LockService` for contested critical sections. Re-read relevant state after acquiring the lock.
8. Add optimistic version checks when users can edit stale records.
9. Define migration, backup, rollback, and integrity checks.
10. Measure realistic volume and recommend a database when Sheets no longer fits.

## Invariants

- Never identify a business entity only by row number.
- Never alternate individual service reads and writes inside a bulk loop.
- Never silently create missing columns in production unless the migration explicitly owns that change.
- Never hold a lock during slow network calls or UI work.
- Never put untrusted text into a cell without considering formula injection.

## Repository contract

Separate storage mechanics from business rules. A repository may expose domain-shaped operations such as:

```text
findById(id)
list(query)
insert(record, actor)
update(id, patch, expectedVersion, actor)
archive(id, expectedVersion, actor)
```

Return domain objects rather than raw row arrays outside the repository layer.

## Verification

- Empty sheet and header-only sheet.
- Missing, duplicate, reordered, and extra headers.
- Duplicate IDs and invalid types.
- Concurrent mutation and stale-version rejection.
- Batch sizes near realistic limits.
- Partial failure, retry, and migration rollback.
- Formula-like user input and date/time-zone normalization.

## Reference

Read [references/sheets-patterns.md](references/sheets-patterns.md) for schema and locking patterns.
