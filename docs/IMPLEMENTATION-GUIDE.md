# Implementing skills in an Apps Script project

## Recommended project loop

1. Start with `apps-script-architect` to capture requirements, execution identities, quotas, data ownership, and deployment shape.
2. Select only the implementation skills needed for the task.
3. Ask for a file plan before code generation on non-trivial projects.
4. Review generated `appsscript.json`, OAuth scopes, web-app execution identity, and trigger owners.
5. Run local tests and static checks before `clasp push`.
6. Deploy a test version, validate with synthetic data, then promote deliberately.

## Example sequence

```text
$apps-script-architect Design an inventory approval app backed by Sheets.
$apps-script-sheets-data-layer Implement the inventory repository with locks and batch writes.
$apps-script-web-app Build the HTML Service UI and asynchronous server bridge.
$apps-script-security Audit OAuth scopes, authorization, validation, and data exposure.
$apps-script-testing Add unit tests and a manual deployment smoke-test plan.
$apps-script-clasp-deployment Configure local development and a safe release checklist.
```

## Review gates

- **Functional:** acceptance criteria and error states are covered.
- **Data:** schema, IDs, timestamps, concurrency, and migrations are explicit.
- **Security:** authentication and authorization are checked server-side.
- **Performance:** service calls are batched and work fits execution limits.
- **Operations:** logs are useful without leaking data; retries are bounded.
- **Release:** scopes and execution identity match the intended audience.
