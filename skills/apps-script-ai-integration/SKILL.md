---
name: apps-script-ai-integration
description: Design, implement, or review secure AI model integrations from Google Apps Script. Use for calling Gemini, OpenAI, or another model API with UrlFetchApp; structured outputs; prompt/data boundaries; key storage; token and cost budgets; retries; moderation; caching; evaluation; and human review. Do not invent current model names, pricing, limits, or API fields—verify them from the provider's official documentation before implementation.
---

# Apps Script AI Integration

## Goal

Build a provider-aware but maintainable AI boundary that protects data and credentials, validates outputs, controls spend and latency, and degrades safely when the model or API fails.

## Inputs to establish

- User-facing job and measurable success criteria.
- Data sent to the provider, sensitivity, residency, and retention constraints.
- Provider and current official API/model requirements.
- Latency, request volume, budget, quotas, and fallback behavior.
- Required output schema and which decisions require human approval.
- Threats from untrusted prompt content or model output.

## Workflow

1. Inspect the existing data flow, UrlFetch adapters, secrets, logs, and client/server boundary.
2. Verify current endpoint, model, authentication, request fields, limits, and pricing from official provider docs.
3. Minimize and redact the data sent. State what must never leave Workspace.
4. Put the provider behind a narrow server-side adapter; never call it directly from HTML with a secret.
5. Require a structured output schema when downstream code depends on model output.
6. Validate parsed output, length, enums, identifiers, URLs, and authorization again before side effects.
7. Add time, token, request, and cost budgets plus bounded retry for transient failures.
8. Separate prompt-instruction content from untrusted user/source content and treat model output as untrusted.
9. Add deterministic fixtures and scored eval cases for quality, safety, latency, and cost.
10. Provide human review and fallback for high-impact actions.

## Security rules

- Store provider secrets in Script Properties or an approved secret manager.
- Never log authorization headers, raw sensitive prompts, or unredacted responses.
- Never let model output directly choose arbitrary URLs, OAuth scopes, recipients, formulas, or privileged actions.
- Reauthorize every business mutation using trusted server state.
- Do not silently train, retain, or transmit data beyond the disclosed policy.

## Reliability rules

- Handle timeouts, 429, transient 5xx, malformed JSON, refusal, safety block, and schema mismatch.
- Retry only safe or idempotent requests with a strict cap and jitter.
- Cache only when inputs, identity, privacy, and staleness make reuse safe.
- Use a correlation ID and sanitized metrics for observability.
- Return a useful non-AI fallback rather than fabricating success.

## Required output

Return the data-flow/privacy decision, provider adapter, current-doc references, request/output schemas, validation, budgets, error/fallback policy, evaluation set, operational metrics, and human-review boundary.

## Reference

Read [references/ai-integration-checklist.md](references/ai-integration-checklist.md) for the detailed review.
