# @tuicomponents/callout

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
