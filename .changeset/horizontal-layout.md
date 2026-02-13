---
"@tuicomponents/layout": minor
"tui-components": minor
---

Add horizontal layout component for side-by-side composition

- `createHorizontalLayout()` factory function to create horizontal layout components
- Width distribution modes: `equal`, `auto`, `manual`
- Manual width specs: fixed numbers, `fill`, or `auto` per item
- Vertical alignment options: `top`, `middle`, `bottom` for items of different heights
- Overflow behavior: `truncate` (default) or `stack` when items don't fit
- Multi-line item support with proper alignment across rows
- Both ANSI and markdown rendering modes
