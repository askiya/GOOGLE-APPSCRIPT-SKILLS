---
name: apps-script-web-app
description: Build, refactor, or review Google Apps Script web apps and HTTP interfaces using HTML Service, doGet/doPost, ContentService, templates, and asynchronous google.script.run calls. Use for dashboards, forms, CRUD UIs, JSON endpoints, routing, server facades, client-server error handling, and deployment behavior. Do not use as the primary skill for visual design, PWA feasibility, or security audits; combine with those focused skills.
---

# Apps Script Web App

## Goal

Implement a clear client/server boundary for Apps Script web apps with thin entry points, server-side validation and authorization, predictable response contracts, and usable asynchronous UI states.

## Inputs to establish

- Existing `doGet`, `doPost`, HTML, manifest, and deployment configuration.
- Whether the UI is served by HTML Service or hosted externally.
- Required routes/actions, actors, authorization rules, and response formats.
- Web-app execution identity and intended access audience.
- CORS, redirects, custom headers, file upload, or third-party caller requirements.

Call out platform constraints before selecting an architecture.

## Workflow

1. Inspect entry points and deployment settings before editing.
2. Define request and response contracts, including validation and safe error envelopes.
3. Keep `doGet`/`doPost` and public `google.script.run` functions thin.
4. Validate input, resolve identity, authorize the action, then call a domain service.
5. Return JSON-safe values; normalize `Date` and unsupported types explicitly.
6. Wrap `google.script.run` calls with success and failure handling. Treat calls as asynchronous and potentially out of order.
7. Add loading, empty, success, validation, and failure states to the client flow.
8. Verify locally where possible, then smoke-test the test deployment using the intended account roles.

## Server structure

Prefer this dependency direction:

```text
doGet/doPost or public server facade
  -> validation and authorization
  -> domain service
  -> repository/integration adapter
```

Functions ending in `_` are private to Apps Script and cannot be invoked by `google.script.run`. Use this deliberately.

## Contract guidance

Use a consistent envelope when the project needs one:

```javascript
{
  ok: true,
  data: {},
  error: null,
  meta: { requestId: 'synthetic-id' }
}
```

Do not return stack traces, tokens, raw upstream responses, or internal authorization detail to the client.

## Verification

- Test anonymous/unauthorized, allowed, forbidden, invalid, duplicate, and server-failure paths.
- Confirm execution identity with real test accounts, not assumptions from the editor owner.
- Confirm query/body parsing and output encoding.
- Check concurrent `google.script.run` interactions and disable duplicate submits where needed.
- Verify deployment URLs and permissions without committing identifiers.

## Boundaries

Use `apps-script-ui-ux` for visual and accessibility depth, `apps-script-security` for a threat-led audit, and `apps-script-pwa` for service-worker/installability decisions.

## Reference

Read [references/web-app-patterns.md](references/web-app-patterns.md) for implementation patterns and review checks.
