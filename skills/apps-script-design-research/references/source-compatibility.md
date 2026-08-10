# Third-party source compatibility

Use this checklist when research includes GitHub repositories, component libraries, templates, demos, code pens, or downloadable assets.

## Separate inspiration from incorporation

- **Observe:** record visible hierarchy, layout, interaction, and state patterns with a source URL.
- **Reimplement independently:** write a small original implementation from the product requirement rather than translating source line by line.
- **Incorporate:** copy or modify third-party code or assets only when the license permits the intended distribution and all notices are preserved.
- **Vendor:** bring an upstream package into the repository only when maintenance, security, size, and update ownership are explicit.

An idea can be useful even when its implementation is incompatible. Never treat a public GitHub repository as permission to copy; a missing license normally means no redistribution permission has been granted.

## Intake checklist

Record:

```text
upstream name and URL, inspected revision or release,
license file and package metadata, code/assets considered,
framework and build requirements, runtime dependencies,
bundle/media size, browser APIs, network behavior,
secret/config requirements, maintenance status
```

If the README and license disagree, stop incorporation until the upstream terms are clarified. Apply the stricter interpretation while uncertain.

## Apps Script compatibility

Reject direct integration when source assumes server-side Next.js behavior, JSX compilation, Svelte compilation, Node-only APIs, unrestricted service workers, cross-origin isolation, or framework-specific registries that the target project does not build.

For a bundled frontend, document the build output, how it is copied into Apps Script source, content size, source-map policy, external origins, and how `google.script.run` is bridged. Do not introduce a framework only to reproduce a small visual effect.

## License gate

| Situation | Default decision |
| --- | --- |
| Permissive license with clear notice requirements | May incorporate after compatibility and security review |
| Restricted redistribution or prohibited ports | Link for inspiration only; do not copy or port |
| Missing license | Do not copy code or assets |
| Conflicting license statements | Pause and clarify upstream |
| User owns the code but provenance is unclear | Ask for confirmation before redistribution |

This is an engineering hygiene check, not legal advice. Preserve copyright notices and add a third-party notice when code or substantial licensed material is incorporated.

## Security and privacy gate

- Never copy `.env`, OAuth tokens, API keys, deployment IDs, or credential files.
- Review install scripts, hooks, post-install steps, network calls, telemetry, and dynamic `@latest` dependencies.
- Do not import agent configuration that weakens approvals, expands filesystem access, enables unrestricted network access, or persists sensitive transcripts.
- Prefer pinned versions and the smallest dependency surface.
- Scan copied code for HTML injection, unsafe URL handling, unbounded animation loops, and external asset tracking.

## Decision record

Return one decision per source:

```text
ADOPT: compatible and licensed; preserve notices and tests.
ADAPT: use the idea, write an Apps Script-specific implementation.
REFERENCE: retain attribution and link, but include no code/assets.
REJECT: incompatible, unsafe, unlicensed, or outside the skill's job.
```

Explain the user value, cost, risk, and exact material included. Do not copy a whole upstream repository when one focused reference or original helper is sufficient.

