---
"@tuicomponents/sparkline": minor
"tui-components": minor
---

Add fit option for auto-sizing sparklines to available width

When `fit: true`, the sparkline compresses data to fit the available width (from context.width) minus the label. A minimum sparkline width of 5 characters is guaranteed. Values cannot be expanded beyond the original data length.
