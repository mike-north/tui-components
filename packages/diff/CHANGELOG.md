# @tuicomponents/diff

## 0.2.0

### Minor Changes

- 5a1bb86: Add IDE-style rendering options to diff component
  - `displayStyle: "gutter"` - Line numbers in left gutter with +/- indicators
  - `backgroundMode: "line"` - Full-width colored backgrounds on changed lines
  - Added `addedBackground` and `removedBackground` to theme semantic colors

  Both options are opt-in with backward-compatible defaults (`displayStyle: "inline"`, `backgroundMode: "none"`).

### Patch Changes

- Updated dependencies [5a1bb86]
  - @tuicomponents/core@0.1.2

## 0.1.1

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
