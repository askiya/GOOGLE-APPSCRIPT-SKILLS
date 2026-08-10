---
name: apps-script-performance
description: Diagnose and optimize slow, quota-heavy, or timeout-prone Google Apps Script code. Use for Sheets batching, reducing service calls, caching, pagination, chunking, continuation triggers, lock contention, UrlFetch batching, UI latency, memory, and capacity planning. Do not optimize from intuition alone; measure the current flow and preserve correctness, authorization, and idempotency.
---

# Apps Script Performance

## Goal

Reduce elapsed time, service calls, quota consumption, and failure probability while preserving correctness and producing evidence that the bottleneck improved.

## Inputs to establish

- Slow entry point and realistic input size.
- Current duration, call counts, failure mode, and relevant logs.
- Services called inside loops.
- Concurrency, locks, cache, triggers, and external APIs.
- Required freshness, consistency, ordering, and completion window.

## Workflow

1. Reproduce or instrument the slow path with synthetic or sanitized data.
2. Break time into service I/O, external HTTP, computation, serialization, and client/server round trips.
3. Remove alternating reads/writes; batch rectangular Sheets operations.
4. Build lookup maps and transform in memory.
5. Batch independent external requests when safe and supported.
6. Add cache only with a clear key, scope, TTL, invalidation, sensitivity, and miss path.
7. Paginate UI reads and chunk background work.
8. Add checkpoints and continuation only after making each batch idempotent.
9. Reduce lock duration and never wait on network work inside a critical section.
10. Re-measure and report before/after evidence plus remaining capacity risks.

## Optimization order

Prefer, in order:

1. eliminate unnecessary work;
2. reduce service round trips;
3. batch and index;
4. cache safe repeated reads;
5. split work across resumable executions;
6. change storage or architecture when the workload no longer fits.

## Correctness constraints

- Do not cache authorization decisions without a carefully bounded identity-aware policy.
- Do not make writes parallel when ordering or uniqueness requires serialization.
- Do not retry non-idempotent operations blindly.
- Do not hardcode quota numbers; verify the current official quota page.
- Do not report improvement from toy data only when production scale is the problem.

## Required output

Return the bottleneck evidence, prioritized changes, code modifications, before/after metrics, quota/capacity notes, tests, and residual risks.

## Reference

Read [references/performance-playbook.md](references/performance-playbook.md) for patterns and measurement fields.
