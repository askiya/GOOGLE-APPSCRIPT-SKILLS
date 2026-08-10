# Tenant isolation checklist

## Trusted context

- Actor identity comes from a trusted server context suitable for the deployment.
- Membership lookup is server-side and active/suspended state is checked.
- Tenant context cannot be overridden by request body, query parameter, or hidden form field.

## Data path

- Every repository method requires tenant context.
- IDs are checked for both existence and tenant ownership.
- Unique constraints are scoped correctly.
- Cache keys and Properties entries include tenant and, where needed, user context.
- Export, search, audit, and background jobs apply the same scope.

## Operations

- Provisioning is idempotent and recoverable.
- Offboarding revokes access before asynchronous deletion.
- Retention and export procedures are tested.
- Support access is time-bounded, approved, and audited.
- Per-tenant quota consumption cannot be bypassed by retries or concurrent runs.

## Adversarial tests

- Change a resource ID to one from another tenant.
- Replay an old invitation or suspended-user request.
- Read another tenant through search, export, cache, logs, or background jobs.
- Trigger concurrent quota consumption.
- Attempt support/admin functions from a normal role.
