---
name: apps-script-testing
description: Add, repair, or plan testing for Google Apps Script projects. Use for unit tests, dependency seams, fakes for Apps Script services, contract and integration tests, fixtures, trigger tests, authorization cases, deployment smoke tests, regression suites, and CI release gates. Do not claim local mocks prove Google platform behavior; separate deterministic tests from deployment verification.
---

# Apps Script Testing

## Goal

Create a layered test strategy that keeps domain logic fast and deterministic while explicitly testing platform, authorization, trigger, and deployment behavior in a safe environment.

## Inputs to establish

- Existing test framework, build tooling, clasp structure, and CI.
- Entry points, domain rules, repositories, integrations, triggers, and UI flows.
- Highest-risk regressions and production incidents.
- Test project/account/data availability and privacy constraints.
- What can run locally versus only inside Apps Script or a deployed web app.

## Workflow

1. Inventory behaviors and rank them by business/security risk.
2. Extract pure logic from Apps Script globals only where it improves a real test seam.
3. Add unit tests for validation, authorization policy, state transitions, mapping, retry rules, and idempotency.
4. Use explicit adapters or injected dependencies for Sheets, Properties, HTTP, time, UUIDs, and mail.
5. Add contract tests for repository row mapping and client/server envelopes.
6. Add integration tests in a dedicated Apps Script test project with synthetic data.
7. Add deployment smoke tests for identity, permissions, routes, triggers, and representative roles.
8. Make CI deterministic; quarantine or clearly label platform-dependent checks.
9. Record coverage by behavior, not only line percentage.

## Minimum behavior matrix

- Happy path and boundary values.
- Missing, malformed, oversized, and malicious input.
- Unauthenticated, unauthorized, wrong-tenant, and revoked-scope behavior.
- Duplicate and concurrent mutations.
- External timeout, throttle, non-2xx, malformed response, and partial success.
- Trigger rerun, overlap, expired authorization, and continuation recovery.
- Schema drift, empty data, date/time-zone, and formula-like text.

## Test isolation

- Use synthetic identifiers and fixtures.
- Never run destructive tests against production Sheets, Drive files, mailboxes, or calendars.
- Give test resources distinctive names and bounded cleanup.
- Avoid relying on test order or ambient account state.
- Inject a clock and ID generator for deterministic assertions.

## Required output

Provide a test matrix, seams/refactors, test files, commands, fixture policy, integration setup, smoke checklist, CI gate, and known platform gaps.

## Reference

Read [references/testing-strategy.md](references/testing-strategy.md) for layering and fake design.
