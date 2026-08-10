---
name: apps-script-automation
description: Build or repair Google Apps Script automations using simple or installable triggers, time-driven jobs, event handlers, queues, checkpoints, retries, notifications, and scheduled workflows. Use when automation must be idempotent, quota-aware, resumable, observable, and recoverable. Do not use for general one-off functions without an event or schedule boundary.
---

# Apps Script Automation

## Goal

Create event-driven and scheduled workflows that can be retried safely, fit execution limits, and expose enough state to diagnose and recover failures.

## Inputs to establish

- Trigger type, source, expected frequency, and owner.
- Event object shape and authorization mode.
- Required scopes and services.
- Expected item count, duration, ordering, and acceptable delay.
- Duplicate, concurrent, partial-failure, and manual-rerun behavior.
- Notification, audit, and recovery owner.

## Workflow

1. Inspect existing triggers, handlers, properties, locks, and failure notifications.
2. Choose a simple trigger only when its authorization restrictions fit; otherwise use an installable trigger.
3. Keep the handler thin: normalize the event, generate a correlation ID, and delegate.
4. Define an idempotency key for every externally observable action.
5. Batch work and persist checkpoints before approaching execution limits.
6. Lock only shared scheduling or mutation state; prevent overlapping workers.
7. Classify errors as permanent or transient. Retry transient failures with capped exponential backoff and jitter.
8. Persist terminal failures for manual recovery rather than retrying forever.
9. Log safe structured context and document trigger ownership and reauthorization.
10. Test duplicate delivery, concurrent runs, expired authorization, and partial completion.

## Trigger rules

- Installable triggers run as the user who created them; document that dependency.
- Trigger events are not guaranteed to contain every field in every context; validate defensively.
- Avoid assuming exactly-once delivery.
- Never send emails, charge accounts, or append duplicate records without an idempotency guard.
- Do not create a new continuation trigger on every retry without cleaning up or deduplicating it.

## Continuation state

Store the minimum state needed to resume:

```text
jobId, cursor, status, attempt, updatedAt, leaseUntil, lastErrorCode
```

Do not store secrets or full sensitive payloads in Properties Service.

## Required output

Provide trigger setup/cleanup functions, handler and worker separation, idempotency/checkpoint design, retry classification, observability, recovery procedure, and tests.

## Reference

Read [references/automation-checklist.md](references/automation-checklist.md) for trigger and retry design details.
