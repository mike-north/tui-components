---
"tui-components-scripts": patch
"@tuicomponents/box": patch
"@tuicomponents/sparkline": patch
"tui-components": patch
---

Fix box-drawing character rendering in markdown/grayscale screenshots

Use JetBrains Mono web font for consistent Unicode box-drawing character widths in screenshot generation. This fixes an issue where horizontal box characters (─) rendered wider than vertical ones (│) in markdown and grayscale mode screenshots.

Packages with updated README screenshots: box, sparkline
