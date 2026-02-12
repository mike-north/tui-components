# @tuicomponents/cli

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
