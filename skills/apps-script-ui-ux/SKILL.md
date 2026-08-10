---
name: apps-script-ui-ux
description: Design, implement, polish, harden, or audit user interfaces for Google Apps Script HTML Service web apps, dialogs, and sidebars. Use for responsive layouts, accessible forms, dashboards, design systems, interaction states, mobile behavior, UX writing, purposeful motion, visual quality, edge cases, and client performance. Do not use for backend routing, authorization, or PWA service-worker architecture except to coordinate their visible states.
---

# Apps Script UI/UX

## Goal

Create an accessible, responsive, and fast interface that communicates asynchronous Apps Script behavior clearly and works for keyboard, touch, and assistive-technology users.

## Inputs to establish

- Users, top tasks, device mix, language, and accessibility needs.
- Existing HTML/CSS/JS, brand constraints, and component patterns.
- Data density and expected loading times.
- Client/server actions and their validation, permission, and failure states.
- Whether the surface is a web app, sidebar, or dialog.
- Whether the task is operational, persuasive, reading-focused, or experiential.

## Workflow

1. Inspect the current UI and task flow before choosing a visual style.
2. If the user requests inspiration, a moodboard, or Dribbble references, use `apps-script-design-research` first when available; otherwise establish an attributable visual brief inline. Treat references as evidence rather than a layout to clone.
3. Define page hierarchy, user flow, and the smallest reusable token/component set.
4. Design mobile-first layouts that also handle dense desktop workflows.
5. Implement semantic HTML and native controls before custom widgets.
6. Give every asynchronous action idle, loading, success, empty, validation, forbidden, and failure states.
7. Preserve focus, label controls, announce status changes, and support keyboard interaction.
8. Prevent duplicate actions and make destructive actions explicit and reversible where possible.
9. Minimize client payload and server round trips; batch related data requests.
10. Harden the result against extreme content, locales, permissions, concurrency, and partial failures.
11. Test responsive widths, zoom, keyboard-only navigation, reduced motion, and realistic slow responses in a bounded visual-QA pass.

## Design-system minimum

Define tokens for color roles, type scale, spacing, radius, elevation, borders, motion, and focus. Components should use semantic state names such as `success`, `warning`, and `danger`, not raw colors as meaning.

## Accessibility baseline

- One clear page heading and logical heading order.
- Visible labels, instructions, and error associations.
- Sufficient contrast and a visible focus indicator.
- No color-only status communication.
- Touch targets large enough for the intended users.
- Dialog focus trap and focus restoration.
- Live-region announcements only for important dynamic updates.
- Respect `prefers-reduced-motion`.

## Apps Script-specific guidance

- Treat `google.script.run` as asynchronous and potentially slow.
- Keep client state separate from server response objects.
- Serialize dates and format them with an explicit locale/time-zone policy.
- Do not place secrets, privileged configuration, or authorization decisions in HTML.
- Avoid many short server calls; compose useful view models on the server.

## Optional static audit

Run `node scripts/audit-html.mjs <file-or-directory>` from this skill directory when local HTML files are available. Treat its output as candidate findings and verify them in context. Add `--json` for machine-readable output or `--strict` to return a failing exit code when P1 findings remain.

## Required output

Return the user flow, surface mode, component/state inventory, token choices, implementation files, accessibility notes, responsive and hardening behavior, source/license decisions for third-party material, and verification evidence.

## References

Read [references/ui-review.md](references/ui-review.md) for the full review checklist.

Read [references/ui-craft-and-hardening.md](references/ui-craft-and-hardening.md) for polish, audit, resilient content, and bounded visual QA.

Read [references/motion-and-effects.md](references/motion-and-effects.md) when animation, smooth scrolling, GSAP, component-library effects, or other advanced visuals are requested.
