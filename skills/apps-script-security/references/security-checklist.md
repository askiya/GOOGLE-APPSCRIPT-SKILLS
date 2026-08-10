# Security checklist

## Identity and authorization

- Web-app "execute as" and "who has access" settings match the intended model.
- Every protected server function authorizes the actor, action, and resource.
- Role data cannot be supplied or overridden by the client.
- Tenant ID is derived from trusted context and enforced in every query/mutation.
- Trigger execution authority and owner lifecycle are documented.

## OAuth and secrets

- Manifest uses the narrowest practical explicit scopes for published apps.
- `@OnlyCurrentDoc` is considered for suitable container-bound use cases.
- Secrets are absent from source, HTML, URLs, Sheets, logs, and test fixtures.
- Rotation and incident response do not require code edits.

## Input and output

- Request size, type, length, enum, format, and relationship constraints are checked.
- HTML output uses context-appropriate escaping and avoids unsafe raw injection.
- Spreadsheet-bound text is protected against formula injection.
- File uploads validate type, size, content expectations, sharing, and retention.
- Client errors do not reveal stacks, sheet names, internal IDs, or upstream credentials.

## External integration

- Webhook signatures and replay windows are verified where supported.
- Destination URLs are fixed or allowlisted when user input influences them.
- Redirect behavior and non-2xx status codes are handled deliberately.
- Retries are bounded and mutations are idempotent.

## Data protection

- Spreadsheet/Drive sharing is no broader than necessary.
- Sensitive fields have explicit retention, deletion, and audit policies.
- Logs contain correlation context without sensitive payloads.
- Backups and exports receive the same access controls as primary data.

Official references: [Authorization](https://developers.google.com/apps-script/guides/services/authorization) and [OAuth scopes](https://developers.google.com/apps-script/concepts/scopes).
