# UI craft and hardening playbook

Use this playbook when an Apps Script interface must be shaped, polished, audited, or hardened beyond the baseline checklist.

## Choose the surface mode

Choose from the user's task rather than from the product category:

- **Operate:** dashboards, admin tools, forms, settings, dialogs, and sidebars. Optimize for task completion, scanability, consistency, and predictable controls. This is the default for Apps Script.
- **Persuade:** a public landing or onboarding surface whose job is to earn attention and an action. Allow more expression, but keep the Apps Script execution and hosting boundaries honest.
- **Read:** documentation, reports, and guidance. Prioritize hierarchy, navigation, and a comfortable reading measure.
- **Experience:** a portfolio or showcase where the artifact is the content. Confirm that Apps Script is the right host before adding heavy media or effects.

Do not apply landing-page decoration to an operational dashboard. Familiar controls and low-friction feedback usually beat novelty when users are completing work.

## Establish durable design context

Before changing visuals, capture a concise brief:

```text
surface, users, top tasks, mode, use environment,
brand attributes, anti-references, density, device mix,
content language, accessibility needs, performance budget
```

Inspect existing tokens, CSS, components, real copy, and representative data. Preserve an intentional incumbent system during refinement; replace it only when the user requested a redesign.

## Craft floor

Verify the result rather than merely stating intentions:

- Hierarchy makes the primary task and next action obvious.
- Related items use tight spacing; separate groups use visibly larger spacing.
- Typography has clear roles and handles real copy at every target width.
- Semantic colors, focus, borders, elevation, and motion come from tokens.
- Components share one vocabulary for shape, icon style, labels, and states.
- Browser-native surfaces such as focus rings, selection, carets, and table numerals fit the system without reducing usability.
- Controls use product language; errors explain the problem and a recovery action.
- Real data, empty results, long values, permission failures, and slow responses remain usable.

Treat visual anti-patterns as prompts for judgment, not universal bans. Common failure signals include nested cards, decoration without information, repeated icon-heading-text tiles, weak hierarchy, identical spacing everywhere, gratuitous gradients or glows, and animation on every section. Keep a pattern when the brief and user task genuinely justify it.

## Component states

For each interactive component, decide which states apply:

```text
default, hover, focus-visible, active, selected,
disabled, loading, validation error, success, forbidden
```

For each data region, decide:

```text
initial loading, incremental loading, populated, empty,
no search results, stale, partial failure, total failure
```

Avoid an unexplained centered spinner. Preserve layout, identify what is loading, block only the affected action, and keep recovery available.

## Hardening matrix

Test the implementation with conditions that reveal brittle UI:

| Dimension | Cases to verify |
| --- | --- |
| Text | empty, one character, long names, long unbroken strings, emoji, CJK, RTL |
| Numbers | zero, negative, very large, decimals, currency, locale separators |
| Collections | none, one, many, pagination boundary, duplicate-looking values |
| Network | slow, timeout, transient failure, retry, stale response, out-of-order response |
| Permissions | signed out, read-only, forbidden action, expired authorization |
| Concurrency | double click, repeated submit, optimistic update rollback, conflict |
| Viewport | narrow phone, tablet, desktop, 200% zoom, virtual keyboard |
| Motion | reduced-motion preference, interrupted animation, focus during transition |

Prefer CSS logical properties and `Intl` formatters. Give flexible children `min-width: 0`, let labels wrap, and do not fix control widths around English copy.

Apps Script server failures do not map reliably to HTTP status codes in `google.script.run`. Normalize server responses into safe domain errors and render states such as `validation`, `forbidden`, `conflict`, `rate_limited`, and `unexpected` deliberately.

## Audit rubric

Score each dimension from 0 to 4 only after citing evidence:

| Dimension | Evidence |
| --- | --- |
| Task clarity | Primary task, information hierarchy, copy, recovery |
| Accessibility | Semantics, names, keyboard, focus, contrast, zoom, motion |
| Responsive behavior | Reflow, touch targets, overflow, dense-data strategy |
| Performance | Payload, layout work, media, animation cost, server round trips |
| Resilience | Realistic content, async states, permissions, concurrency, i18n |
| System integrity | Tokens, component consistency, product-specific decisions |

Report P0 blocking, P1 major, P2 minor, and P3 polish findings. Explain user impact, evidence, location, and a concrete correction. Verify automated findings in context before reporting them.

## Bounded visual QA

Use a bounded finish loop so polish does not become open-ended:

1. Build the complete scoped change.
2. Inspect desktop and mobile in one batched pass with realistic data and slow states.
3. Fix the collected defects together.
4. Run one confirmation pass for the changed areas.
5. Stop and report remaining known limitations.

## Provenance

This Apps Script-specific playbook was independently written after studying the design-audit and product-surface ideas in [Impeccable](https://github.com/pbakaus/impeccable), licensed Apache-2.0. No Impeccable source code or assets are bundled here.

