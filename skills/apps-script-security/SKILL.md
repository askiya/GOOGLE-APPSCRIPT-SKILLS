---
name: apps-script-security
description: Threat-model, audit, harden, or review Google Apps Script code and deployments. Use for authentication, server-side authorization, OAuth scopes, web-app execution identity, triggers, secret storage, input/output validation, XSS, spreadsheet formula injection, webhook verification, external APIs, audit logs, privacy, and abuse controls. Use on any production-facing security review; do not perform unauthorized offensive testing or expose live secrets.
---

# Apps Script Security

## Goal

Find realistic security failures, explain their impact and evidence, and implement minimal verifiable mitigations without breaking the intended deployment model.

## Scope and safety

Confirm that the repository or deployment is authorized for review. Use synthetic inputs and non-destructive checks. Never retrieve, print, commit, or echo live credentials or private records.

## Inputs to establish

- Entry points, actors, roles, tenants, assets, and trust boundaries.
- Web-app execution identity, access audience, and trigger owners.
- Manifest OAuth scopes and sensitive/restricted data use.
- Storage locations for configuration, secrets, sessions, and audit data.
- External callers, webhooks, APIs, and browser content.

## Workflow

1. Map assets, entry points, identities, data flows, and trust boundaries.
2. Review `appsscript.json`, deployment settings, trigger ownership, and public functions.
3. Trace authentication and authorization for every protected action. UI visibility is not authorization.
4. Check input schema, canonicalization, output encoding, formula injection, and safe error handling.
5. Check secrets, OAuth scope minimization, token lifecycle, and logging redaction.
6. Review external requests for allowlists, TLS, signature verification, timeouts, non-2xx handling, retries, and SSRF-like URL control.
7. Review Sheets/Drive sharing, tenant filters, locks, state transitions, and audit integrity.
8. Rank findings by exploitability and impact, fix the highest-value issues, and add regression tests.
9. State residual risk and deployment actions that code changes cannot enforce.

## Core controls

- Authorize on the server using a trusted actor identity and requested resource.
- Use least-privilege OAuth scopes, especially for published apps.
- Store server secrets in Script Properties or an approved secret manager, never client HTML or Sheets.
- Validate against allowlisted schemas and encode at the output context.
- Prefix or otherwise neutralize untrusted spreadsheet values that can become formulas.
- Use stable request IDs and safe error codes; do not expose stacks or raw upstream bodies.
- Rate-limit or meter abusive operations where Apps Script's platform model permits a reliable control.

## Finding format

For each finding provide severity, affected boundary, evidence, realistic scenario, impact, remediation, verification, and residual risk. Distinguish confirmed findings from hypotheses.

## Reference

Read [references/security-checklist.md](references/security-checklist.md) for the detailed control set.
