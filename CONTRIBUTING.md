# Contributing

Thanks for improving Google Apps Script Skills.

## Development setup

1. Fork and clone the repository.
2. Install Node.js 20 or newer.
3. Run `npm test` to validate the current catalog.
4. Create a focused branch such as `feat/calendar-automation-skill`.

No npm dependency installation is required for validation.

## Add a skill

Copy `templates/skill-template/` to `skills/<kebab-case-name>/`, then:

1. Set matching `name` in `SKILL.md`.
2. Write a concise `description` that says when the skill should and should not trigger.
3. Keep the core workflow in `SKILL.md` and move optional detail to `references/`.
4. Add 2–3 realistic prompts to `evals/evals.json`.
5. Add UI metadata in `agents/openai.yaml`.
6. Add the skill to both README catalogs.
7. Run `npm test`.

## Quality checklist

- Instructions use imperative language and define inputs, decisions, outputs, and verification.
- Guidance accounts for Apps Script quotas and authorization identity.
- Examples use synthetic data and placeholders.
- Secrets never appear in source, HTML, screenshots, logs, or eval fixtures.
- Sheets operations are batched and concurrent writes use an appropriate lock.
- Trigger examples are idempotent and recoverable.
- External API examples check non-2xx responses and use bounded retries.
- Technical claims link to official Google or OpenAI documentation where practical.

## Pull requests

Explain the problem, affected skills, tests run, and any behavior or security tradeoffs. Keep unrelated formatting changes out of the same pull request.
