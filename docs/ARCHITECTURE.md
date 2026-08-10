# Repository architecture

## Progressive disclosure

The repository follows the Agent Skills model:

1. `name` and `description` are lightweight routing metadata.
2. `SKILL.md` loads only when the skill is selected.
3. `references/`, `templates/`, and `scripts/` load or run only when needed.

This replaces the previous approach of loading thousands of lines of unrelated instructions at once.

## Layout

```text
.
├── .codex-plugin/plugin.json     # distributable skills-only plugin
├── skills/                       # canonical skill packages
│   └── <skill>/
│       ├── SKILL.md
│       ├── agents/openai.yaml
│       ├── evals/evals.json
│       └── references/
├── templates/                    # reusable starter files
├── scripts/                      # repository tooling
├── docs/                         # maintainer and implementation docs
└── .github/                      # CI and community templates
```

## Design boundaries

- Architecture chooses system boundaries; implementation skills write the relevant layer.
- Design research gathers attributed evidence and produces an original brief; UI/UX turns the approved brief into accessible implementation.
- Third-party UI repositories remain research inputs, not vendored dependencies; license and framework compatibility are decided before any code or asset enters a skill.
- Security reviews every boundary but does not replace functional design.
- PWA guidance treats Apps Script as a backend or origin with constraints; it does not promise unsupported service-worker behavior.
- SaaS guidance requires tenant isolation in every repository query and mutation.
- AI guidance never exposes provider keys to client-side HTML.

## Release process

1. Update skills and evals.
2. Run `npm test` and plugin validation.
3. Update `CHANGELOG.md` and `.codex-plugin/plugin.json` version.
4. Tag `vX.Y.Z` after merge.
