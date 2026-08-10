---
name: apps-script-clasp-deployment
description: Set up, repair, or review local Google Apps Script development and releases using clasp, appsscript.json, Git, npm scripts, CI, versions, and deployments. Use for cloning or creating projects, source layout, manifest/scopes, push/pull safety, test deployments, release checklists, rollback, and secret hygiene. Do not perform a production deployment without verifying the target, diff, scopes, execution identity, and user authorization.
---

# Apps Script clasp Deployment

## Goal

Create a reproducible local-to-Apps-Script workflow with explicit targets, reviewable manifests, protected credentials, test deployments, and a documented rollback path.

## Inputs to establish

- Existing Git repository, source directory, `.clasp.json`, and ignore rules.
- Apps Script project type and environment targets.
- Manifest, OAuth scopes, runtime, dependencies, and advanced services.
- Current deployments, execution identity, access audience, and release owner.
- Build/transpile/test steps and CI secret policy.

Never print or commit Script IDs, deployment IDs, refresh tokens, credentials, or real environment values.

## Workflow

1. Inspect repository status, clasp configuration, manifest, and generated artifacts.
2. Confirm the intended remote project before any push or deployment.
3. Set a single canonical source directory and exclude tests, secrets, and local-only files from upload.
4. Validate V8 runtime, time zone, dependencies, exception logging, and minimal OAuth scopes.
5. Add deterministic lint/test/build checks before `clasp push`.
6. Review `clasp status` and the exact source diff.
7. Push to a test project or create a test deployment first.
8. Smoke-test representative accounts, scopes, triggers, routes, and integrations.
9. Create an immutable version and deliberately create or update a deployment.
10. Record release evidence and rollback instructions without storing secrets.

## Safety rules

- Treat `clasp push --force` as exceptional; explain why it is necessary and inspect the target first.
- Do not use `clasp pull` over uncommitted local changes without preserving them.
- Keep user credentials outside the repository and use least-privilege protected CI credentials.
- Separate test and production projects when risk warrants it.
- Recheck consent and verification impact when scopes change.
- Remember that changing source does not necessarily update an existing versioned deployment.

## Release output

Return project layout, ignore/config guidance, manifest review, commands, CI checks, test-deployment plan, production checklist, rollback, and manual Google Console/Apps Script actions.

## Reference

Read [references/release-checklist.md](references/release-checklist.md) before any release recommendation.
