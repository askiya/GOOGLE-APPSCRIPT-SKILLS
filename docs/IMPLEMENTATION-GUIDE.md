# Implementing skills in an Apps Script project

## Recommended project loop

1. Start with `apps-script-architect` to capture requirements, execution identities, quotas, data ownership, and deployment shape.
2. Use `apps-script-design-research` before `apps-script-ui-ux` when the visual direction is unclear or source-backed inspiration is requested.
3. Select only the implementation skills needed for the task.
4. Ask for a file plan before code generation on non-trivial projects.
5. Review generated `appsscript.json`, OAuth scopes, web-app execution identity, and trigger owners.
6. Run local tests and static checks before `clasp push`.
7. Deploy a test version, validate with synthetic data, then promote deliberately.

When using a third-party UI repository, record an adopt/adapt/reference/reject decision before implementation. Do not copy framework components, media, agent configuration, or secrets merely because the source is publicly accessible.

## Example sequence

```text
$apps-script-architect Design an inventory approval app backed by Sheets.
$apps-script-sheets-data-layer Implement the inventory repository with locks and batch writes.
$apps-script-web-app Build the HTML Service UI and asynchronous server bridge.
$apps-script-design-research Research an original mobile-first visual direction from attributed public references.
$apps-script-ui-ux Implement the approved visual brief with accessible asynchronous states.
$apps-script-security Audit OAuth scopes, authorization, validation, and data exposure.
$apps-script-testing Add unit tests and a manual deployment smoke-test plan.
$apps-script-clasp-deployment Configure local development and a safe release checklist.
```

Before the final UI review, run the dependency-free static audit and verify its candidate findings:

```bash
node skills/apps-script-ui-ux/scripts/audit-html.mjs path/to/Index.html --strict
```

## Review gates

- **Functional:** acceptance criteria and error states are covered.
- **Data:** schema, IDs, timestamps, concurrency, and migrations are explicit.
- **Security:** authentication and authorization are checked server-side.
- **Performance:** service calls are batched and work fits execution limits.
- **Operations:** logs are useful without leaking data; retries are bounded.
- **Release:** scopes and execution identity match the intended audience.
