# UI review checklist

## Flow

- Primary action is obvious and matches the user's current task.
- Empty state explains what to do next.
- Validation appears next to the affected control and in a useful summary when needed.
- Forbidden and expired-session states do not masquerade as generic errors.
- Destructive actions require clear intent and explain the consequence.

## Responsive behavior

- Test approximately 320, 375, 768, 1024, and 1440 CSS pixels.
- Tables have an explicit mobile strategy: priority columns, cards, or deliberate horizontal scrolling.
- Fixed headers and bottom navigation respect safe areas.
- Virtual keyboard does not hide the focused field or primary submit control.

## Performance

- Render a useful shell before non-critical data arrives.
- Avoid layout shifts by reserving space.
- Debounce search and coalesce filter changes.
- Paginate or virtualize large lists rather than rendering every row.
- Avoid UI-heavy libraries when small repeated `google.script.run` calls magnify startup cost.

## Accessibility verification

- Keyboard-only pass.
- 200% zoom/reflow pass.
- Screen-reader names for buttons, inputs, tables, dialogs, and status regions.
- Reduced-motion pass.
- Contrast check for text, icons, controls, and focus.
