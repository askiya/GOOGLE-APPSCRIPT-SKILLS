---
name: apps-script-debugging-migration
description: Diagnose Google Apps Script failures and migrate legacy projects safely. Use for runtime errors, authorization and scope failures, trigger problems, quota/timeouts, web-app deployment mismatches, Spreadsheet schema drift, external API failures, Rhino-to-V8 cleanup, deprecated services, and controlled refactors. Diagnose from evidence before changing behavior, and preserve a rollback path for migrations.
---

# Apps Script Debugging and Migration

## Goal

Find the smallest evidence-supported root cause, implement or plan a controlled fix, and verify the actual execution context without masking the symptom with broad retries or rewrites.

## Inputs to establish

- Exact error, time, execution type, function, deployment/version, and affected accounts.
- Reproduction steps and whether the editor, trigger, test deployment, and production differ.
- Recent code, manifest, scope, owner, sharing, schema, or provider changes.
- Logs and safe correlation context without credentials or personal data.
- Legacy runtime/features and required compatibility.

## Diagnostic workflow

1. Reproduce safely or narrow the failure with logs and a minimal input.
2. Identify the real execution identity and authorization mode.
3. Classify the layer: input, auth, authorization, quota/runtime, concurrency, data/schema, platform/deployment, client/server, or external provider.
4. Compare source with the version actually deployed.
5. Trace the failing call and inspect preconditions rather than catching everything.
6. Form ranked hypotheses and run the cheapest discriminating checks.
7. State the root cause with evidence and separate contributing conditions.
8. When a fix is requested, apply the smallest coherent change and add a regression test or runbook check.

## Migration workflow

1. Inventory deprecated syntax, services, manifests, libraries, scopes, triggers, and deployments.
2. Capture current behavior with tests and representative fixtures.
3. Migrate in checkpoints that keep the project runnable.
4. Apps Script projects must use the supported V8 runtime; remove Rhino-only assumptions and test V8 differences.
5. Separate mechanical conversion from behavior change.
6. Verify authorization, time zones, serialization, enumeration behavior, and global function discovery.
7. Test in a separate project/deployment and define rollback before production promotion.

## Common traps

- Editor success does not prove trigger or web-app identity behavior.
- `clasp push` does not automatically move a versioned deployment to new code.
- A new service call can require reauthorization and manifest scope changes.
- Reordered/missing headers can make valid code read the wrong data.
- Repeated retries can multiply a non-idempotent side effect.
- Catching and returning every exception can erase the evidence needed to debug.

## Required output

Return reproduction/context, evidence, ranked hypotheses, confirmed root cause, fix or migration steps, regression verification, deployment actions, rollback, and residual uncertainty.

## Reference

Read [references/diagnostic-runbook.md](references/diagnostic-runbook.md) for targeted checks.
