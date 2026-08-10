# PWA feasibility and sync checklist

## Hosting

- Final page origin is known after redirects.
- Service-worker script is served from the required origin and allowed scope.
- Manifest is reachable with a correct content type.
- Icons and start URL are reachable without unexpected authentication redirects.
- Required headers and navigation fallback can be controlled.
- Deep-link and update behavior are verified on the deployed URL, not only localhost.

## Cache classification

| Resource | Typical decision |
| --- | --- |
| Versioned static shell | Precache after verifying origin/scope. |
| Public reference data | Stale-while-revalidate with bounded age. |
| User-specific data | Network-first or carefully partitioned cache. |
| Secrets/tokens | Do not cache in ordinary PWA stores. |
| Mutations | Queue only with server idempotency and conflict rules. |

## Offline mutation record

```text
operationId, actorContext, entityId, command, baseVersion,
createdAt, attempts, nextAttemptAt, status, safeErrorCode
```

Reauthorize and revalidate on replay. A locally accepted mutation is pending, not committed.

## Test matrix

- Chromium and Safari/iOS behavior where relevant.
- First install and subsequent update.
- Offline start and offline navigation.
- Auth expiration while queued.
- Duplicate replay and out-of-order replay.
- Server conflict and user resolution.
- Storage eviction and corrupted cache recovery.
