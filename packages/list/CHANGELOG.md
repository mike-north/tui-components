# @tuicomponents/list

## 0.2.0

### Minor Changes

- 6e28f17: Add task lists and definition lists to the list component
  - New `task` style with checkbox markers (`[x]`, `[ ]`, `[~]`) for checked, unchecked, and partial states
  - New `definition` style for term-definition pairs with auto-calculated or explicit `termWidth`
  - New item types: `TaskItem` with `checked` property, `DefinitionItem` with `term` and `definition` properties
  - Type guards: `isTaskItem()`, `isDefinitionItem()`, `isStandardItem()` for discriminating item types
  - New exports: `taskItemSchema`, `taskCheckedSchema`, `definitionItemSchema`, `getTaskMarker()`

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

### Patch Changes

- Updated dependencies [65f6373]
  - @tuicomponents/core@0.2.0

## 0.1.2

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
