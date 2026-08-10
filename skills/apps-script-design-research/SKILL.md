---
name: apps-script-design-research
description: Research visual direction and UI/UX inspiration for Google Apps Script interfaces, especially from public Dribbble search pages, then convert references into an original, accessible implementation brief. Use for moodboards, style exploration, competitor-pattern research, design-reference searches, visual audits, or requests to make an Apps Script web app look more polished. Do not scrape, clone, or redistribute source designs.
---

# Apps Script Design Research

## Goal

Turn visual inspiration into an original, buildable UI direction for an Apps Script web app, dialog, or sidebar without copying a designer's composition, assets, or brand.

## Inputs to establish

- Product, users, top tasks, and the surface being designed.
- Target screen, device mix, information density, and language.
- Brand constraints, accessibility needs, and implementation stack.
- Desired style adjectives and styles to avoid.
- Whether the user wants live research, a query plan, or synthesis from supplied links.

If live browsing is unavailable, return useful search links and a research worksheet instead of inventing references.

## Connection choice

Use public Dribbble search pages or a web search constrained to `dribbble.com/shots` for visual research. This requires no API credential and keeps the user on the source page.

Do not use `UrlFetchApp` or another automated client to scrape Dribbble pages. The documented Dribbble API v2 requires OAuth and supports account-oriented resources; it does not document a global shot-search endpoint. Use OAuth only when the actual requirement is an authorized Dribbble account operation, not inspiration search.

Read [references/dribbble-research-playbook.md](references/dribbble-research-playbook.md) before researching Dribbble or recommending a connection architecture.

Read [references/source-compatibility.md](references/source-compatibility.md) before recommending code, assets, templates, or dependencies from GitHub and component libraries.

## Workflow

1. Reduce the product brief to one surface and two or three user tasks.
2. Create three to six English search queries combining product type, surface, interaction pattern, density, and style.
3. Browse recent public results when tools permit. Collect a small, diverse reference set across multiple designers rather than choosing near-duplicates.
4. Record only the title, creator, source URL, and observed pattern. Mark interpretation separately from observation.
5. Compare references by hierarchy, layout, typography, color roles, components, interaction states, responsiveness, and data density.
6. Select patterns because they support a user task, not because they are fashionable.
7. Synthesize an original direction with design tokens, component anatomy, responsive rules, and full asynchronous states.
8. Adapt the direction to HTML Service constraints and `google.script.run` latency.
9. Classify each third-party source as adopt, adapt, reference, or reject based on compatibility, license, security, and maintenance.
10. Verify keyboard flow, contrast, zoom, reduced motion, empty/error/loading states, and realistic data.

## Research quality rules

- Keep direct links and creator attribution in the research notes.
- Use references as evidence, not as a specification to clone.
- Do not download, rehost, embed, or redistribute source artwork unless its license and the user's rights permit it.
- Avoid claiming a font, spacing value, animation curve, or component behavior that is not visible or documented; label estimates as estimates.
- Prefer patterns supported by several references, user needs, and accessibility constraints.
- Treat likes and popularity as weak signals, not usability evidence.
- Never invent a reference, designer, metric, or URL when live results cannot be verified.

## Apps Script handoff

When `apps-script-ui-ux` is available, coordinate with it if implementation is requested. Otherwise, finish with a self-contained handoff brief. The design-research output should give any implementer enough detail to build semantic HTML, reusable CSS tokens, responsive components, and explicit `google.script.run` states without needing to revisit the inspiration set.

## Required output

Return:

1. A concise product and user-task frame.
2. Search queries and clickable source/search URLs.
3. A reference matrix with attribution and observed patterns.
4. A synthesis explaining which patterns to adopt, adapt, or reject and why.
5. An original style brief covering tokens, layout, type, components, motion, accessibility, and responsive behavior.
6. Apps Script implementation notes and a verification checklist.
7. Clear uncertainty notes for anything not directly verified.
