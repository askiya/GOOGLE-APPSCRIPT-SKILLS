# clasp release checklist

## Local setup

```bash
npm install --global @google/clasp
clasp login
clasp clone SCRIPT_ID
clasp status
```

Use placeholders in documentation; never commit a real Script ID.

## Manifest review

- V8 runtime and intended time zone.
- Minimal explicit scopes for published apps.
- Advanced services and libraries are required and pinned appropriately.
- Web-app and execution API declarations match the product.
- Logging and exception behavior support operations without leaking data.

## Pre-push

- Clean or understood Git status.
- Correct `.clasp.json` target and `rootDir`.
- Generated output is current; tests and validator pass.
- `.claspignore` excludes credentials, local tests, and irrelevant artifacts.
- `clasp status` shows only intended files.

## Deployment

```bash
clasp push
clasp version "Release description"
clasp deployments
clasp deploy --description "Release description"
```

Use the exact current `clasp` syntax shown by `clasp help` in the installed version when updating an existing deployment.

## Smoke and rollback

- Exercise each role and entry point in a test deployment.
- Confirm trigger ownership, authorization, and external integration settings.
- Record previous deployment/version and rollback operator.
- Monitor safe error signals after promotion.

Official reference: [Use clasp](https://developers.google.com/apps-script/guides/clasp).
