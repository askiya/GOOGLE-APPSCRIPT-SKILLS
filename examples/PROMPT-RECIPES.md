# Prompt recipes

Adapt these prompts with sanitized project context. Do not paste credentials, Script IDs, deployment IDs, or personal data.

## New internal application

```text
$apps-script-architect
Design a [product] for [actors and roles]. Entry points: [web app/triggers/menu].
Source of truth: [Sheets/Drive/external]. Expected scale: [volume/concurrency].
Include execution identity, authorization, quotas, state transitions, data model,
failure recovery, observability, file plan, tests, deployment, and open decisions.
```

## Security and performance audit

```text
$apps-script-security Audit this authorized repository and deployment model.
Rank confirmed findings, show evidence, implement minimal fixes when requested,
and add regression checks. Never print secrets or personal data.

$apps-script-performance Measure the same critical paths at realistic scale.
Reduce service calls and timeouts while preserving authorization, concurrency,
idempotency, and output equivalence. Report before/after evidence.
```

## Production incident

```text
$apps-script-debugging-migration
Diagnose this incident before editing. Error: [sanitized exact message].
Invocation: [editor/web app/trigger/API]. Started after: [change].
Compare source with deployed version, identify identity/scopes/quotas/schema,
rank hypotheses, run discriminating checks, and propose a reversible fix.
```

## Offline field workflow

```text
$apps-script-pwa
Assess feasibility before generating a service worker. Target URL/origin: [value].
Users need [offline reads/writes/install/push]. Data sensitivity: [classification].
Return hosting capability checks, topology, cache policy, mutation queue,
reauthorization, conflict handling, updates, and device test matrix.
```
