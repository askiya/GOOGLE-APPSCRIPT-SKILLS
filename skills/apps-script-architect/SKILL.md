---
name: apps-script-architect
description: Design or review Google Apps Script application architecture before implementation. Use for new Apps Script systems, major features, unclear requirements, folder/data-flow decisions, Spreadsheet-backed apps, web apps, add-ons, automation, scalability, quota planning, or production-readiness plans. Do not use for a narrow isolated code fix when the architecture is already established; use the relevant implementation or debugging skill instead.
---

# Apps Script Architect

## Goal

Turn a product request into a reviewable Apps Script architecture and implementation plan that respects execution identity, authorization, quotas, concurrency, data ownership, and operational constraints.

## Inputs to establish

Inspect the existing repository first. Then establish:

- users, roles, tenants, and trust boundaries;
- project type: standalone, container-bound, web app, add-on, API executable, or library;
- entry points: UI, `doGet`, `doPost`, trigger, custom function, menu, or external call;
- data volume, sensitivity, retention, and source of truth;
- Workspace and external services involved;
- latency, schedule, reliability, and recovery expectations;
- deployment audience and the identity the script executes as;
- acceptance criteria and constraints that are still unknown.

Ask only for decisions that materially change the design. State safe, reversible assumptions for the rest.

## Workflow

1. Inventory the current files, manifest, entry points, deployments, triggers, and storage.
2. Translate the request into actors, use cases, state transitions, non-functional constraints, and out-of-scope items.
3. Draw the smallest useful boundary map: client, public server facade, domain services, repositories, integrations, and operations.
4. Choose storage based on access patterns and scale. Do not default to Sheets when atomicity, query complexity, or growth makes it unsafe.
5. Model authorization separately from authentication. Identify who invokes the script and whose authority each execution uses.
6. Identify quotas, runtime ceilings, concurrency, retry, and idempotency risks. Verify changing numerical limits from official docs.
7. Define error contracts, observability, audit events, backup, migration, and rollback.
8. Produce a phased file plan with verification after every phase.

## Architecture principles

- Keep entry points thin; validate and authorize before calling business logic.
- Separate business rules from `SpreadsheetApp`, `DriveApp`, `GmailApp`, and HTTP transport.
- Batch service calls and keep data transformations in memory.
- Use stable IDs instead of row numbers as identity.
- Protect contested writes with locks and, when useful, optimistic versions.
- Make trigger, webhook, and retry handlers idempotent.
- Keep secrets server-side and minimize OAuth scopes.
- Prefer a simpler deployment over speculative layers, while documenting the threshold for moving beyond Sheets or Apps Script.

## Required output

Return:

1. context and explicit assumptions;
2. actors, use cases, and acceptance criteria;
3. proposed architecture and request/event flows;
4. data model and ownership;
5. authorization, scope, and execution-identity model;
6. quota, performance, concurrency, and failure strategy;
7. folder/file plan with responsibilities;
8. phased implementation and verification plan;
9. risks, alternatives, and open decisions.

Do not generate the full application unless the user also requests implementation.

## Handoff

Route implementation to the narrowest skills: `apps-script-sheets-data-layer`, `apps-script-web-app`, `apps-script-automation`, `apps-script-security`, `apps-script-testing`, or `apps-script-clasp-deployment`.

## Reference

Read [references/architecture-checklist.md](references/architecture-checklist.md) for a detailed production review.
