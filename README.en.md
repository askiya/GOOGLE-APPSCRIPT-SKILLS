![Santriman Apps Script Skills Ecosystem](8bb19e71-88ac-40d1-87bb-5a5638513f9e.png)

# Google Apps Script Skills

A production-focused collection of 15 modular agent skills for researching visual direction, designing, building, securing, testing, optimizing, and deploying Google Apps Script applications.

[Bahasa Indonesia](README.md) · [Implementation guide](docs/IMPLEMENTATION-GUIDE.md) · [Contributing](CONTRIBUTING.md)

## Catalog

| Skill | Purpose |
| --- | --- |
| [`apps-script-architect`](skills/apps-script-architect/) | Requirements, boundaries, data flow, quotas, structure, and implementation plans. |
| [`apps-script-web-app`](skills/apps-script-web-app/) | HTML Service, web apps, ContentService endpoints, and `google.script.run`. |
| [`apps-script-sheets-data-layer`](skills/apps-script-sheets-data-layer/) | Schemas, repositories, batch I/O, locking, indexes, and migrations in Sheets. |
| [`apps-script-automation`](skills/apps-script-automation/) | Triggers, scheduled/event workflows, queues, retries, and idempotency. |
| [`apps-script-design-research`](skills/apps-script-design-research/) | Safe Dribbble inspiration research translated into original, implementation-ready UI briefs. |
| [`apps-script-ui-ux`](skills/apps-script-ui-ux/) | Responsive, accessible, fast HTML Service experiences. |
| [`apps-script-pwa`](skills/apps-script-pwa/) | PWA feasibility, installability, offline design, and hosting boundaries. |
| [`apps-script-security`](skills/apps-script-security/) | Threat modeling, auth, authorization, scopes, secrets, validation, and abuse controls. |
| [`apps-script-performance`](skills/apps-script-performance/) | Batching, caching, pagination, continuation, and quota-aware optimization. |
| [`apps-script-testing`](skills/apps-script-testing/) | Unit/integration tests, fakes, fixtures, smoke tests, and release gates. |
| [`apps-script-clasp-deployment`](skills/apps-script-clasp-deployment/) | Local development, clasp, manifests, CI, versioning, deployments, and rollback. |
| [`apps-script-integrations`](skills/apps-script-integrations/) | Workspace services, Advanced Services, webhooks, and external REST APIs. |
| [`apps-script-saas`](skills/apps-script-saas/) | Multi-tenant boundaries, roles, entitlements, isolation, audit, and lifecycle. |
| [`apps-script-ai-integration`](skills/apps-script-ai-integration/) | Secure AI calls, structured output, budgets, privacy, and fallbacks. |
| [`apps-script-debugging-migration`](skills/apps-script-debugging-migration/) | Diagnosis and controlled migration for auth, quotas, triggers, deployment, and V8. |

## Install

```bash
git clone https://github.com/askiya/GOOGLE-APPSCRIPT-SKILLS.git
cd GOOGLE-APPSCRIPT-SKILLS
```

PowerShell:

```powershell
.\scripts\install.ps1
```

macOS/Linux:

```bash
chmod +x scripts/install.sh
./scripts/install.sh
```

Install one skill by passing its name to the installer. The default target is `~/.agents/skills`. Restart Codex if the new skill does not appear.

For repository-only discovery, copy selected skills into `<your-repo>/.agents/skills/`. The root [plugin manifest](.codex-plugin/plugin.json) also makes this repository ready for a skills-only plugin workflow.

## Use

Invoke a skill explicitly:

```text
$apps-script-architect Design a role-based inventory approval web app backed by Sheets.
```

```text
$apps-script-security Audit this Apps Script deployment for scope, identity, authorization, and data leaks.
```

```text
$apps-script-performance Refactor this 50,000-row job to avoid timeouts and duplicate processing.
```

Codex can also select a skill implicitly when the request matches its description. Use `/skills` in Codex CLI or the IDE extension to inspect available skills.

## Validate

Node.js 20+ is required; there are no package dependencies.

```bash
npm test
```

`apps-script-ui-ux` includes a dependency-free static audit for local Apps Script HTML:

```bash
node skills/apps-script-ui-ux/scripts/audit-html.mjs path/to/Index.html --strict
```

Third-party UI repositories are research inputs rather than vendored dependencies. Code and assets must pass license, HTML Service compatibility, security, size, and maintenance checks; see the [third-party research notices](docs/THIRD-PARTY-NOTICES.md).

## Safety notes

- Review generated code and OAuth scopes before deployment.
- Confirm the execution identity for web apps and trigger ownership.
- Never commit `.clasp.json`, `.clasprc.json`, tokens, Script IDs, or credentials.
- Batch service calls, design for quotas, and lock contested writes.
- Treat a full PWA on Apps Script as a feasibility question, not an assumption.
- Verify changing platform behavior against [official resources](docs/OFFICIAL-RESOURCES.md).

See the [Indonesian README](README.md) for the full end-to-end tutorial.

## License

[MIT](LICENSE)
