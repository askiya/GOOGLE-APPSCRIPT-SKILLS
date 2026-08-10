# Diagnostic runbook

## Authorization

- Which identity runs this invocation?
- Did code add a service requiring a new scope?
- Does the trigger owner still have access and authorization?
- Does published-app consent or verification affect the audience?
- Are manifest scopes explicit and complete?

## Deployment

- Is the tested URL a test deployment or a versioned production deployment?
- Which source version is attached to the deployment?
- Did access audience or "execute as" change?
- Are client assets and server functions from the same release?

## Data and concurrency

- Did headers, sheet names, protections, filters, formulas, or locale change?
- Are row IDs stable and unique?
- Does the failure require concurrent execution?
- Is a lock acquired at the correct scope and released in `finally`?
- Is stale state re-read after acquiring the lock?

## Quota and external systems

- Identify the exact current quota or runtime limit from official docs.
- Count service/API calls at realistic scale.
- Inspect upstream status, retry headers, redirects, and sanitized body shape.
- Distinguish transient throttling from permanent validation/auth errors.

## V8 migration

- Confirm `runtimeVersion: "V8"` in the manifest where explicitly configured.
- Review deprecated Rhino-only syntax and iteration/enumeration assumptions.
- Test date/time zone behavior and JSON serialization.
- Ensure entry-point functions remain discoverable in the required form.
- Verify libraries and advanced services under V8.

Official references: [Troubleshooting](https://developers.google.com/apps-script/guides/support/troubleshooting), [V8 migration](https://developers.google.com/apps-script/guides/v8-runtime/migration), and [Quotas](https://developers.google.com/apps-script/guides/services/quotas).
