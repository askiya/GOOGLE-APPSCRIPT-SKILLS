---
name: apps-script-saas
description: Design, implement, or audit multi-tenant SaaS-like applications built with Google Apps Script and Workspace storage. Use for tenant boundaries, membership, roles, entitlements, plans, onboarding/offboarding, tenant-scoped repositories, audit logs, quotas, billing-provider integration boundaries, and migration beyond Sheets. Do not claim Apps Script or Sheets provides strong database isolation automatically; enforce and test every tenant boundary.
---

# Apps Script SaaS

## Goal

Create a multi-tenant design in which identity, membership, authorization, storage, quota, lifecycle, and audit boundaries are explicit and every data access is tenant-scoped.

## Inputs to establish

- Tenant definition and trusted source for tenant membership.
- User identity, roles, resource ownership, and support/admin access.
- Shared-versus-per-tenant storage choice and expected scale.
- Entitlements, quotas, plans, trials, suspension, export, and deletion.
- Billing provider boundary, if any, without assuming payment handling belongs in Apps Script.
- Regulatory, retention, and audit expectations.

## Workflow

1. Map identities, tenants, memberships, roles, support access, and trust boundaries.
2. Define server-derived tenant context; never trust a client-supplied tenant ID alone.
3. Choose storage topology and document blast radius, operational cost, and migration threshold.
4. Make tenant scope mandatory in every repository read, write, cache key, job, and audit event.
5. Define authorization policy for actor, action, resource, tenant, and state.
6. Design per-tenant quotas, idempotent usage metering, and abuse controls.
7. Model onboarding, invitation, role change, suspension, export, offboarding, and deletion.
8. Add support break-glass access with explicit approval and immutable audit evidence.
9. Test cross-tenant identifiers, cache leakage, background jobs, exports, and administrator paths.
10. Define the path away from Sheets/Apps Script before isolation or scale becomes unsafe.

## Storage topologies

- **Shared sheets with tenant column:** lowest operational overhead, highest dependence on flawless filtering.
- **Spreadsheet per tenant:** clearer data boundary, higher provisioning and management cost.
- **External database:** stronger query/isolation options when scale and controls justify migration.

Choose from requirements; do not present one topology as universally safe.

## Required output

Return the tenant model, authorization matrix, storage decision, repository rules, cache/job isolation, lifecycle, audit, quota/metering design, tests, risks, and migration thresholds.

## Reference

Read [references/tenant-isolation.md](references/tenant-isolation.md) for detailed controls.
