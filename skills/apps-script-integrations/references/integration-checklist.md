# Integration checklist

## Contract

- Provider version and required fields are explicit.
- Internal domain model is not coupled to every provider field.
- Dates, time zones, currencies, and identifiers are normalized.
- Pagination termination and maximum work are bounded.

## Authentication

- Credential type fits server-to-server or delegated-user behavior.
- Secrets live in server-side properties or an approved secret manager.
- OAuth scopes are minimal and consent impact is documented.
- Rotation can occur without exposing values in code review.

## Reliability

- Connect/read duration fits Apps Script execution constraints.
- 429, transient 5xx, timeouts, and malformed bodies are handled.
- Retry policy is capped and mutation replay is idempotent.
- Partial batch results are recorded and recoverable.
- Circuit-breaker or deferred retry behavior is considered for sustained outages.

## Webhooks

- Verify signature, timestamp/replay window, event type, and payload schema.
- Deduplicate by provider event ID or a stable derived key.
- Acknowledge only according to the provider's documented retry semantics.
- Store only the minimum safe event context needed for recovery.
