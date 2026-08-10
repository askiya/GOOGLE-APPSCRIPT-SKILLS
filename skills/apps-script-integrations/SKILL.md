---
name: apps-script-integrations
description: Design, implement, or review Google Apps Script integrations with Google Workspace services, Advanced Services, Google APIs, webhooks, and external REST APIs using UrlFetchApp. Use for request/response contracts, OAuth, pagination, batching, rate limits, retries, signatures, idempotency, and synchronization. Do not expose keys to client HTML or assume a Google service call is authorized simply because the script owner can access it.
---

# Apps Script Integrations

## Goal

Build a reliable and least-privilege boundary between Apps Script and Google or third-party services with explicit contracts, safe credentials, bounded retries, and recoverable synchronization.

## Inputs to establish

- Provider, official API documentation, endpoint/version, and data ownership.
- Caller and execution identity, OAuth/API-key method, and required scopes.
- Request volume, pagination, quotas, latency, and ordering.
- Mutation idempotency and webhook verification support.
- Sensitive fields, retention, and logging policy.
- Expected behavior on partial success and provider outage.

## Workflow

1. Inspect existing adapters, credentials, scopes, and payload logs.
2. Define a narrow internal interface independent of the provider SDK or HTTP shape.
3. Build request validation, canonical serialization, authentication headers, timeout assumptions, and response parsing.
4. Treat every non-2xx, malformed body, and provider error as an explicit branch.
5. Implement pagination and bounded batches.
6. Retry only transient failures with capped backoff and jitter; honor provider hints when trustworthy.
7. Add idempotency keys for mutations and deduplicate webhook events.
8. Redact logs and map provider details into safe domain error codes.
9. Add contract tests with fixtures plus a sandbox/test-account smoke check.
10. Document quota, credential rotation, ownership, replay, and outage procedures.

## Google service choices

- Prefer built-in Apps Script services for simple supported operations.
- Use Advanced Services when the REST API surface or fields are needed.
- Use `UrlFetchApp` for external APIs or unavailable Google API operations.
- Verify current scopes and enablement requirements from official docs.

## External request rules

- Keep base URLs fixed or allowlisted.
- Encode query parameters and JSON deliberately.
- Set `muteHttpExceptions` only when code inspects status and body safely.
- Batch independent safe requests with `fetchAll` when it improves limits and does not violate ordering.
- Never log `Authorization`, cookies, API keys, signed URLs, or full sensitive bodies.

## Required output

Provide the adapter contract, implementation, auth/scope notes, error taxonomy, pagination/batching, retry/idempotency, tests, observability, and operational runbook.

## Reference

Read [references/integration-checklist.md](references/integration-checklist.md) for the adapter review.
