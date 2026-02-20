# tui-components

## 0.3.0

### Minor Changes

- 7f8aff6: Add CLI binary to umbrella package and register callout/layout in CLI

  The `tui-components` package now exposes a `tui-components` binary, enabling `npx tui-components render <component>` without needing to know about the internal `@tuicomponents/cli` package. The CLI now also registers the `callout` and `layout` components, bringing the total to 14 available components.

### Patch Changes

- Updated dependencies [7f8aff6]
  - @tuicomponents/cli@0.4.0

## 0.2.1

### Patch Changes

- 9e8336f: Fix box-drawing character rendering in markdown/grayscale screenshots

  Use JetBrains Mono web font for consistent Unicode box-drawing character widths in screenshot generation. This fixes an issue where horizontal box characters (─) rendered wider than vertical ones (│) in markdown and grayscale mode screenshots.

  Packages with updated README screenshots: box, sparkline

- Updated dependencies [9e8336f]
  - @tuicomponents/box@0.2.1
  - @tuicomponents/sparkline@0.2.1

## 0.2.0

### Minor Changes

- 8d6343d: Add semantic callout component for tips, warnings, alerts, and more
  - New `@tuicomponents/callout` package
  - `createCallout()` factory function
  - Semantic types: tip, note, info, warning, error, success
  - Default icons and titles per type
  - Auto-wrapping with `wrapText()` from core
  - Border styles: single, double, round, bold, none
  - ANSI and markdown render modes

- 6e28f17: Add task lists and definition lists to the list component
  - New `task` style with checkbox markers (`[x]`, `[ ]`, `[~]`) for checked, unchecked, and partial states
  - New `definition` style for term-definition pairs with auto-calculated or explicit `termWidth`
  - New item types: `TaskItem` with `checked` property, `DefinitionItem` with `term` and `definition` properties
  - Type guards: `isTaskItem()`, `isDefinitionItem()`, `isStandardItem()` for discriminating item types
  - New exports: `taskItemSchema`, `taskCheckedSchema`, `definitionItemSchema`, `getTaskMarker()`

- a6598dc: Add fit option for auto-sizing progress bars to available width

  When `fit: true`, the progress bar automatically expands to fill the available width (from context.width) minus the label, brackets, and suffix. A minimum bar width of 5 characters is guaranteed.

- d06f7ef: Add fit option for auto-sizing sparklines to available width

  When `fit: true`, the sparkline compresses data to fit the available width (from context.width) minus the label. A minimum sparkline width of 5 characters is guaranteed. Values cannot be expanded beyond the original data length.

- 4157c81: Add horizontal layout component for side-by-side composition
  - `createHorizontalLayout()` factory function to create horizontal layout components
  - Width distribution modes: `equal`, `auto`, `manual`
  - Manual width specs: fixed numbers, `fill`, or `auto` per item
  - Vertical alignment options: `top`, `middle`, `bottom` for items of different heights
  - Overflow behavior: `truncate` (default) or `stack` when items don't fit
  - Multi-line item support with proper alignment across rows
  - Both ANSI and markdown rendering modes

- 65f6373: Add user configuration system, theme presets, and compatibility documentation

  **Configuration System**
  - New YAML-based configuration via `.tui-components.yaml` or `~/.config/tui-components/config.yaml`
  - Theme preset selection (default, monokai, solarized-dark, solarized-light, nord)
  - Agent-specific render mode configuration for AI assistants
  - Terminal settings (color level, width override)

  **Theme Presets**
  - `getThemePreset()` function to retrieve preset themes
  - `ThemePreset` type for preset names
  - Note: All presets currently use the same T1 baseline; actual colors depend on terminal palette

  **Documentation**
  - `docs/COMPATIBILITY.md` - AI assistant and terminal compatibility matrix
  - `docs/CONFIGURATION.md` - User configuration guide
  - `docs/adr/001-gradient-support.md` - Architecture Decision Record for future gradient support

  **Chart Package**
  - Added `GradientStop` and `GradientConfig` types for future gradient support
  - Added `gradientStopSchema` and `gradientConfigSchema` Zod schemas

  **Documentation Scripts**
  - Multi-mode screenshot generation (ANSI, markdown, grayscale, inline)
  - Comparison image generation for side-by-side mode views
  - Compatibility matrix generator from YAML source

- 6ed4417: Add vertical layout component for stacking rendered components vertically
  - New `@tuicomponents/layout` package
  - `createVerticalLayout()` factory function
  - Support for gap between items, horizontal alignment (left, center, right)
  - ANSI and markdown render modes

### Patch Changes

- Updated dependencies [8d6343d]
- Updated dependencies [6e28f17]
- Updated dependencies [a6598dc]
- Updated dependencies [d06f7ef]
- Updated dependencies [4157c81]
- Updated dependencies [65f6373]
- Updated dependencies [6ed4417]
  - @tuicomponents/callout@0.2.0
  - @tuicomponents/list@0.2.0
  - @tuicomponents/progress@0.2.0
  - @tuicomponents/sparkline@0.2.0
  - @tuicomponents/layout@0.2.0
  - @tuicomponents/box@0.2.0
  - @tuicomponents/chart@0.3.0
  - @tuicomponents/core@0.2.0
  - @tuicomponents/diff@0.3.0
  - @tuicomponents/gauge@0.2.0
  - @tuicomponents/graph@0.2.0
  - @tuicomponents/keyvalue@0.2.0
  - @tuicomponents/table@0.2.0
  - @tuicomponents/tree@1.0.0

## 0.1.2

### Patch Changes

- Updated dependencies [5a1bb86]
  - @tuicomponents/diff@0.2.0
  - @tuicomponents/core@0.1.2
  - @tuicomponents/box@0.1.2
  - @tuicomponents/chart@0.2.1
  - @tuicomponents/gauge@0.1.2
  - @tuicomponents/graph@0.1.2
  - @tuicomponents/keyvalue@0.1.2
  - @tuicomponents/list@0.1.2
  - @tuicomponents/progress@0.1.2
  - @tuicomponents/sparkline@0.1.2
  - @tuicomponents/table@0.1.2
  - @tuicomponents/tree@0.1.2

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
- Updated dependencies [9493b07]
  - @tuicomponents/core@0.1.1
  - @tuicomponents/box@0.1.1
  - @tuicomponents/chart@0.2.0
  - @tuicomponents/diff@0.1.1
  - @tuicomponents/gauge@0.1.1
  - @tuicomponents/graph@0.1.1
  - @tuicomponents/keyvalue@0.1.1
  - @tuicomponents/list@0.1.1
  - @tuicomponents/progress@0.1.1
  - @tuicomponents/sparkline@0.1.1
  - @tuicomponents/table@0.1.1
  - @tuicomponents/tree@0.1.1
