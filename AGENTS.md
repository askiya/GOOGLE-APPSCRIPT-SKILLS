# Repository instructions

This repository contains reusable agent skills for Google Apps Script. Keep every change useful to a developer who installs one skill independently.

## Source of truth

- Skill directories live in `skills/<skill-name>/`.
- Every skill starts with a valid `SKILL.md` containing YAML `name` and `description` fields.
- The directory name and frontmatter `name` must match.
- Keep a skill focused on one job. Put detailed, optional material in `references/`.
- Treat `templates/` as examples to adapt, not production secrets or universal architecture.

## Apps Script engineering rules

- Prefer the V8 runtime and modern JavaScript supported by Apps Script.
- Batch Google service reads and writes; never recommend cell-by-cell Sheets operations for bulk data.
- Treat quotas and execution limits as design constraints and verify current values in official documentation.
- Use `LockService` around contested writes and design trigger handlers to be idempotent.
- Store secrets in Script Properties or an approved secret manager, never source control or client-side HTML.
- Minimize OAuth scopes. Explain the execution identity of web apps and installable triggers.
- Do not claim Apps Script HTML Service can provide every PWA capability. Surface hosting, service-worker scope, redirect, header, and offline limitations.
- Keep server functions thin and separate routing, validation, business logic, and repositories when project size warrants it.
- Use success and failure handlers for `google.script.run`; it is asynchronous.

## Verification

Run `npm test` before committing. Update the relevant `evals/evals.json` when a skill's expected behavior changes.

## Documentation

- Keep `README.md` as the Indonesian primary guide and `README.en.md` as the concise English guide.
- Use relative links for repository files.
- Never commit Script IDs, deployment IDs, access tokens, `.clasp.json`, `.clasprc.json`, or real personal data.
