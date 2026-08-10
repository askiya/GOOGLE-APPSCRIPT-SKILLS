# Motion and effects for Apps Script UI

Use this reference when the user requests animation, smooth scrolling, visual effects, or components inspired by React, Svelte, GSAP, Magic UI, SyntaxUI, or another frontend library.

## Start with purpose

Assign every motion choice one purpose:

- show a state change;
- preserve spatial continuity;
- confirm an action;
- reveal newly available information;
- guide attention to an error or next step.

Remove motion that exists only to make an operational screen feel busy. Apps Script users commonly wait on server calls; decorative animation must not hide latency or delay task completion.

## Compatibility gate

Apps Script HTML Service accepts HTML, CSS, and browser JavaScript, but framework source is not automatically portable. Before using a third-party pattern, identify:

- runtime and build requirements;
- package size and transitive dependencies;
- DOM, Canvas, WebGL, worker, and module assumptions;
- iframe, CSP, origin, and external-asset behavior;
- license and redistribution rights;
- keyboard, screen-reader, reduced-motion, and touch behavior.

Prefer a small original CSS or Web Animations API implementation when the effect is simple. Do not paste React, Next.js, Svelte, Vue, Tailwind registry, or JSX code into an Apps Script HTML file and call it integrated.

## Motion budget

For an operational interface:

- Use roughly 120-250 ms for local feedback and state transitions.
- Animate `transform` and `opacity` where possible.
- Avoid continuous animation, large blurred layers, and multiple full-screen effects.
- Keep one primary authored motion moment per surface, plus small state feedback.
- Do not orchestrate a page-load sequence before users can work.
- Stop timers, observers, and animation frames when their target is hidden or removed.

Measure on the lowest-powered target device when motion is important. A visually impressive desktop effect that drops frames on a warehouse phone is a failed design.

## Reduced motion

Reduced motion should preserve state and hierarchy, not disable all feedback blindly:

```css
.panel {
  opacity: 0;
  transform: translateY(0.5rem);
  transition: opacity 180ms ease-out, transform 180ms ease-out;
}

.panel[data-open="true"] {
  opacity: 1;
  transform: translateY(0);
}

@media (prefers-reduced-motion: reduce) {
  .panel {
    transform: none;
    transition-duration: 1ms;
  }
}
```

Do not animate focus away from the active control. After asynchronous rendering, restore or deliberately move focus based on the user's action.

## Recommended effect tiers

| Tier | Typical techniques | Default decision |
| --- | --- | --- |
| 0 | Native state changes, no animation | Safe for every surface |
| 1 | CSS transitions, progress, skeletons, small transforms | Preferred for operational UI |
| 2 | Web Animations API, SVG drawing, limited scroll reveal | Use with a clear purpose and tests |
| 3 | GSAP timelines, Canvas, WebGL, smooth-scroll engines | Require explicit justification, performance budget, and compatibility proof |

Avoid replacing native scrolling in dialogs, sidebars, data tables, or form-heavy web apps. Smooth-scroll engines can conflict with iframe boundaries, nested scrollers, focus movement, anchors, and touch input.

## Async motion pattern

When an action calls `google.script.run`:

1. Lock only the submitted control or affected region.
2. Keep the current content stable while showing bounded progress.
3. Ignore stale responses using a request identifier when queries can overlap.
4. On success, update the smallest useful region and announce the result.
5. On failure, stop progress, preserve input, focus or link to the error, and offer recovery.
6. Respect reduced motion for every transition between these states.

## Validation

- Test with keyboard, touch, 200% zoom, and reduced motion.
- Test rapid repeated actions and navigation during animation.
- Check that overlays are not clipped by scroll containers.
- Check CPU usage when the page is idle; decorative effects should become idle too.
- Verify the core task remains complete if optional effects fail to load.

## Inspiration versus code

Component galleries may inform composition and interaction ideas. Reimplement only the small behavior the product needs, and only when the license permits it. Keep attribution and source links in research notes. Never redistribute a component or port when its license forbids that use.

