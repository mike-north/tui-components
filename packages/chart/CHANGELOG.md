# @tuicomponents/chart

## 0.2.1

### Patch Changes

- Updated dependencies [5a1bb86]
  - @tuicomponents/core@0.1.2

## 0.2.0

### Minor Changes

- 9493b07: Add scatter plot, pie/donut chart, and heatmap chart types

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

### Patch Changes

- 9493b07: Initial release of TUI Components library

  A comprehensive terminal UI component library for rendering rich text-based visualizations in ANSI and markdown formats.

  **Packages included:**
  - `@tuicomponents/core` - Core rendering primitives, theming, and component registry
  - `@tuicomponents/box` - Box drawing with borders and padding
  - `@tuicomponents/chart` - Bar, line, area, scatter, pie, donut, and heatmap charts
  - `@tuicomponents/cli` - Command-line interface for rendering components
  - `@tuicomponents/diff` - Text diff visualization
  - `@tuicomponents/gauge` - Gauge/meter visualizations
  - `@tuicomponents/graph` - Graph/network visualizations
  - `@tuicomponents/keyvalue` - Key-value pair formatting
  - `@tuicomponents/list` - List rendering with bullets and nesting
  - `@tuicomponents/progress` - Progress bars and spinners
  - `@tuicomponents/sparkline` - Inline sparkline charts
  - `@tuicomponents/table` - Table rendering with alignment and borders
  - `@tuicomponents/tree` - Tree structure visualization
  - `tui-components` - Meta-package bundling all components

- Updated dependencies [9493b07]
  - @tuicomponents/core@0.1.1
