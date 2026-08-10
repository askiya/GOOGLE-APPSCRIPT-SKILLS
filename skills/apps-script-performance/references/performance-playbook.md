# Performance playbook

## Instrumentation fields

```text
requestId, operation, inputCount, batchNumber, serviceCalls,
cacheHit, durationMs, outcome, safeErrorCode
```

Avoid logging sensitive payloads.

## Common transformations

| Smell | Better direction |
| --- | --- |
| `getValue()` / `setValue()` inside a row loop | One `getValues()`, in-memory transform, one `setValues()`. |
| Repeated `find` over all rows | Build a `Map` once or maintain an index. |
| One HTTP call per independent item | Consider `UrlFetchApp.fetchAll` with bounded batches. |
| Full dataset returned to UI | Filter, project, and paginate on the server. |
| Repeated expensive reference read | Cache with explicit invalidation and safe staleness. |
| Monolithic job near timeout | Idempotent batches with persisted continuation state. |

## Cache decision

Document cache scope (`script`, `user`, or `document`), key composition, maximum value size, TTL, invalidation event, stale behavior, privacy classification, and stampede control. CacheService is opportunistic; code must work on a miss.

## Capacity review

- Worst-case rows and calls per run.
- Runs per day and concurrent users.
- Execution time margin and failure recovery cost.
- Cell growth, formulas, and human interaction cost.
- Threshold and migration path beyond Apps Script/Sheets.

Official references: [Best practices](https://developers.google.com/apps-script/guides/support/best-practices) and [Quotas](https://developers.google.com/apps-script/guides/services/quotas).
