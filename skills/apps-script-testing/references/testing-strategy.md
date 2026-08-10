# Testing strategy

## Layers

| Layer | Purpose | Typical location |
| --- | --- | --- |
| Pure unit | Domain rules, validation, mapping, retry, state machines | Local runner |
| Adapter contract | Verify calls and row/request/response translation | Local with fakes |
| Apps Script integration | Real services, scopes, manifest, triggers | Dedicated test script |
| Deployment smoke | Web-app identity, permissions, redirects, representative role flows | Test deployment |
| Manual acceptance | UX, sharing, consent, notifications, operational recovery | Staging checklist |

## Fake design

Fake observable behavior rather than cloning entire Google APIs. For a Sheets repository, a narrow fake might implement `readAll`, `appendRows`, and `replaceRows`; it does not need to mimic every `SpreadsheetApp` method.

## High-value assertions

- Unauthorized action produces no mutation or external side effect.
- Retried command produces one business result.
- Stale version is rejected rather than overwritten.
- Partial batch failure retains a recoverable checkpoint.
- Client error is safe while server logs retain a correlation ID.
- Trigger setup is idempotent.

## CI policy

Fast deterministic tests block every pull request. Platform integration tests may run on a protected schedule or manual environment with separate credentials, but release requires a recorded test deployment smoke pass.
