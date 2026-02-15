# @tuicomponents/cli

## 0.3.0

### Minor Changes

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

- Updated dependencies [6e28f17]
- Updated dependencies [a6598dc]
- Updated dependencies [d06f7ef]
- Updated dependencies [65f6373]
  - @tuicomponents/list@0.2.0
  - @tuicomponents/progress@0.2.0
  - @tuicomponents/sparkline@0.2.0
  - @tuicomponents/box@0.2.0
  - @tuicomponents/chart@0.3.0
  - @tuicomponents/core@0.2.0
  - @tuicomponents/diff@0.3.0
  - @tuicomponents/gauge@0.2.0
  - @tuicomponents/graph@0.2.0
  - @tuicomponents/keyvalue@0.2.0
  - @tuicomponents/table@0.2.0
  - @tuicomponents/tree@1.0.0

## 0.2.1

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

## 0.2.0

### Minor Changes

- bd454dd: Add agent detection support for agentic TUI environments

  The CLI now detects when it's running in an AI agent environment and adapts its behavior
  to improve the user experience in chat interfaces.

  **What changed:**
  - Detect agentic TUI environments using the `is-agentic-tui` package (supports Claude Code, Cursor Agent, and other AI-powered development tools)
  - Append usage instructions to `--help` output when in agent mode, guiding AI agents on how to properly display diagram output without wrapping in markdown code blocks
  - Add 5 blank lines before diagram output (in markdown mode only) for better visual separation in chat interfaces
  - All agent-related functions are marked `@internal` and are not part of the public API

  **Why:**
  AI agents frequently render diagram output incorrectly by wrapping it in markdown code blocks, which breaks Unicode character rendering. These changes help agents present TUI component output correctly to end users.

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
