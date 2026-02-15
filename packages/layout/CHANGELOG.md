# @tuicomponents/layout

## 0.2.0

### Minor Changes

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

- Updated dependencies [65f6373]
  - @tuicomponents/core@0.2.0
