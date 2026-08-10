# Sheets data-layer patterns

## Header mapping

```javascript
function buildHeaderMap_(headers) {
  return headers.reduce((map, value, index) => {
    const key = String(value).trim();
    if (!key) return map;
    if (Object.prototype.hasOwnProperty.call(map, key)) {
      throw new Error(`Duplicate header: ${key}`);
    }
    map[key] = index;
    return map;
  }, {});
}
```

## Contested mutation

```javascript
function withScriptLock_(work, timeoutMs = 10000) {
  const lock = LockService.getScriptLock();
  lock.waitLock(timeoutMs);
  try {
    return work();
  } finally {
    lock.releaseLock();
  }
}
```

Acquire the narrowest lock appropriate to the shared resource. Re-read state inside the lock and avoid external HTTP calls while holding it.

## Suggested system fields

| Field | Purpose |
| --- | --- |
| `id` | Stable immutable identifier. |
| `version` | Optimistic concurrency counter. |
| `createdAt` / `updatedAt` | UTC timestamps serialized consistently. |
| `createdBy` / `updatedBy` | Auditable actor identifier. |
| `status` | Validated state-machine value. |
| `archivedAt` | Soft-delete/archive marker where required. |

## Scaling signals

Reassess Sheets when scans, formula calculation, cell count, concurrent writes, relational queries, audit requirements, or execution time make correctness or reliability hard. Do not wait for a single published hard limit; evaluate access patterns and operational cost.

Official reference: [Apps Script best practices](https://developers.google.com/apps-script/guides/support/best-practices).
