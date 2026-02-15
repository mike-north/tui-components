# @tuicomponents/assistant-simulator

## 0.2.0

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

## 0.1.2

### Patch Changes

- Initial release of assistant-simulator package
- Transform functions: stripAnsi, collapseNewlines, truncateLines, stripBackticks, stripBoldMarkers, addSpaceAfterBoxChars
- Assistant configurations: Claude Code, GitHub Copilot, Cline, Codex, Gemini CLI, Kiro CLI, OpenCode
- Pipeline-based simulation with metadata tracking
