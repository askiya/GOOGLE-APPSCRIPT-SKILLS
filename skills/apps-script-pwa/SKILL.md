---
name: apps-script-pwa
description: Assess and design Progressive Web App capabilities around a Google Apps Script solution. Use for installability, web app manifests, service workers, offline reads/writes, caching, background sync, push, mobile capabilities, and deciding whether Apps Script should serve the UI or act as a backend. Always use when a request assumes a full PWA can be hosted directly on Apps Script; verify origin, scope, redirects, headers, and browser support before implementation.
---

# Apps Script PWA

## Goal

Produce a feasible PWA architecture that distinguishes browser capabilities from Apps Script hosting constraints and never promises offline or install behavior without a testable origin and synchronization design.

## Start with feasibility

Establish:

- the final UI origin and whether it is stable and under developer control;
- whether a service worker can be served from the required origin and scope;
- manifest URL, icon delivery, MIME types, redirects, and header needs;
- authentication behavior online, after expiration, and while offline;
- browser/device targets and required capabilities;
- which data and actions may be cached or queued safely.

Do not write a service worker until these checks pass.

## Architecture decision

Choose deliberately between:

1. **Apps Script-hosted UI:** suitable only for the capabilities verified on the actual deployment.
2. **Static PWA frontend + Apps Script backend:** often better when service-worker scope, headers, routing, or asset control is required.
3. **Non-PWA responsive web app:** preferable when install/offline value does not justify sync and hosting complexity.

Explain tradeoffs rather than forcing PWA terminology onto a normal web app.

## Workflow

1. Inspect current deployment URLs, redirects, HTML shell, and authentication.
2. Build a capability matrix for target browsers and hosting.
3. Classify assets and data by sensitivity, staleness tolerance, and cache policy.
4. Select caching strategies per resource; never use one catch-all strategy.
5. For offline mutations, define a durable queue, idempotency key, ordering, retry cap, and conflict resolution.
6. Define cache versioning, invalidation, update prompts, and rollback.
7. Add online/offline/stale/syncing/conflict/error UX.
8. Test first install, update, offline reload, expired auth, replay, conflict, storage pressure, and cache corruption.

## Security and privacy

- Do not cache secrets, authorization tokens, or sensitive records by default.
- Do not treat local storage as a secure database.
- Partition or clear user-specific caches on sign-out and account changes.
- Require server-side authorization when queued actions replay.
- Minimize retained offline data and document deletion behavior.

## Required output

Return the feasibility verdict, chosen topology, capability matrix, cache/data classification, offline mutation protocol, update strategy, UX states, security constraints, and test plan.

## Reference

Read [references/pwa-feasibility.md](references/pwa-feasibility.md) before proposing implementation.
