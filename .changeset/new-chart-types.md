---
"@tuicomponents/chart": minor
---

Add scatter plot, pie/donut chart, and heatmap chart types

**New chart types:**
- `scatter`: 2D scatter plot with numeric X and Y axes. Supports `dots` and `braille` styles for point rendering.
- `pie`: Circular pie chart rendered using braille characters for smooth curves.
- `donut`: Pie chart variant with configurable inner radius and optional center label.
- `heatmap`: 2D grid visualization with intensity shading. Supports `blocks`, `ascii`, and `numeric` styles.

**New schema options:**
- `scatterStyle`: Controls scatter plot rendering (`"dots"` | `"braille"`)
- `heatmapStyle`: Controls heatmap rendering (`"blocks"` | `"ascii"` | `"numeric"`)
- `centerLabel`: Optional text displayed in donut chart center
- `innerRadius`: Controls donut hole size (0-0.9)

**New exports:**
- Layout types: `ScatterChartLayout`, `PieChartLayout`, `HeatmapChartLayout`
- Layout functions: `computeScatterLayout`, `computePieLayout`, `computeHeatmapLayout`
- Render functions for both ANSI and markdown modes
- Character constants: `SCATTER_MARKERS`, `HEATMAP_BLOCKS`, `HEATMAP_ASCII`

**Bug fixes:**
- Fix heatmap column label truncation by computing proper column widths
- Fix axis range configuration not being applied for single data points
- Filter zero and negative values from pie chart slices
