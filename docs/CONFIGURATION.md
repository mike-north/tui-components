# Configuration

TUI Components supports user configuration via YAML dotfiles. This allows you to customize themes, rendering modes, terminal settings, and agent-specific behaviors.

## Config File Locations

Configuration is loaded from these locations in priority order:

1. **Project config**: `.tui-components.yaml` or `.tui-components.yml` in the current directory or any parent directory
2. **User config**: `~/.config/tui-components/config.yaml`

Project config takes precedence over user config. This allows you to have global defaults while overriding settings for specific projects.

## Configuration Schema

```yaml
# Theme configuration
theme:
  # Choose a preset theme
  preset: default # default, monokai, solarized-dark, solarized-light, nord

  # Note: Semantic color overrides are currently not fully supported
  # Prefer using theme presets directly for now
  # semantic:
  #   success: "#00ff00"
  #   error: "#ff0000"
  #   warning: "#ffff00"
  #   info: "#00ffff"
  #   muted: "#808080"

# Render mode configuration
render:
  # Default render mode (when not auto-detected)
  defaultMode: ansi # ansi, markdown, grayscale

  # Whether to auto-detect render mode based on environment
  autoDetect: true

  # Agent-specific configuration overrides
  agents:
    github-copilot:
      mode: markdown
      markdownOptions:
        multilineMode: inline
    cline:
      mode: grayscale

# Terminal environment configuration
terminal:
  # Color support level: 0=none, 1=basic (16), 2=256, 3=truecolor
  colorLevel: 3

  # Terminal width override (in columns)
  width: 80
```

## Theme Presets

TUI Components includes several built-in theme preset names for configuration compatibility:

- `default` - The original TUI Components theme
- `monokai` - Monokai-inspired colors
- `solarized-dark` - Solarized dark variant
- `solarized-light` - Solarized light variant
- `nord` - Nord arctic color palette

**Note:** Currently, all theme presets use the same baseline theme structure because the underlying color library (chromaterm) uses ANSI color indices at the T1 level without custom RGB resolution. The actual colors displayed depend on your terminal's color scheme, not the preset selection.

To get custom colors, you can:

1. Configure your terminal emulator's color palette
2. Use VS Code terminal color customization
3. Use `detectTheme()` instead of `createRenderContext()` for terminal probing

Theme presets are provided for future extensibility when runtime color customization becomes available.

## Render Modes

TUI Components supports three render modes:

### ansi

Full ANSI color support with Unicode characters. Uses the configured theme for styling. This is the default mode in terminal environments.

### markdown

Renders components using markdown formatting (bold, inline code, etc.). Ideal for AI coding assistants that support markdown but may have limited ANSI support.

### grayscale

Renders components using ASCII characters and grayscale shading. Useful for environments with no color or markdown support.

## Agent-Specific Configuration

You can configure rendering behavior for specific AI coding assistants using the `render.agents` section:

```yaml
render:
  agents:
    github-copilot:
      mode: markdown
      markdownOptions:
        multilineMode: inline # Collapses newlines for Copilot's chat
    cline:
      mode: grayscale # No backtick support in Cline
    kiro-cli:
      mode: markdown
      markdownOptions:
        spacingMode: relaxed # Adds spacing for edge cases
```

The agent is detected via the `TUI_AGENT` environment variable or can be set programmatically.

## Configuration Examples

### Using a Theme Preset

```yaml
# .tui-components.yaml
theme:
  preset: monokai
```

### Custom Semantic Colors (Future)

> **Note:** Semantic color overrides are not currently implemented. The configuration schema accepts them for forward compatibility, but they have no effect. See the "Theme Presets" section above for current color customization options.

```yaml
# This configuration is accepted but has no effect currently
theme:
  preset: nord
  semantic:
    success: "#00FF00" # Not yet implemented
    error: "#FF0000" # Not yet implemented
```

### Force Markdown Mode

```yaml
render:
  defaultMode: markdown
  autoDetect: false # Disable environment detection
```

### Configure for GitHub Copilot

```yaml
render:
  agents:
    github-copilot:
      mode: markdown
      markdownOptions:
        multilineMode: inline
```

### Terminal Width Override

```yaml
terminal:
  width: 120 # Force 120-column width
```

### Disable Colors

```yaml
terminal:
  colorLevel: 0 # No colors
```

## Programmatic Configuration

You can also configure TUI Components programmatically:

```typescript
import { createRenderContext, getThemePreset } from "tui-components";

// Use a specific theme preset
const ctx = createRenderContext({
  theme: getThemePreset("monokai"),
});

// Override render mode
const ctx = createRenderContext({
  renderMode: "markdown",
});

// Disable config loading
const ctx = createRenderContext({
  loadUserConfig: false,
});

// Provide explicit config
const ctx = createRenderContext({
  userConfig: {
    theme: { preset: "nord" },
    render: { defaultMode: "markdown" },
  },
});
```

## Environment Variables

TUI Components respects standard terminal environment variables:

- `NO_COLOR`: If set, disables all colors
- `FORCE_COLOR`: Forces color level (0-3)
- `COLORTERM`: Detects truecolor support (`truecolor` or `24bit`)
- `TERM`: Detects color support level (e.g., `xterm-256color`)
- `TUI_AGENT`: Identifies the AI coding assistant for agent-specific config

## Configuration Precedence

Configuration is resolved in the following order (highest to lowest precedence):

1. Programmatic options passed to `createRenderContext()`
2. Project config (`.tui-components.yaml` in cwd or parent)
3. User config (`~/.config/tui-components/config.yaml`)
4. Built-in agent configurations
5. Auto-detection based on environment
6. Default values

## Validation

Configuration files are validated against a Zod schema. Invalid configuration will be silently ignored, and defaults will be used instead. This ensures that malformed config files don't break your application.

## Integration with Components

All TUI components automatically use the configured theme and render mode when you call `createRenderContext()`:

```typescript
import { createRenderContext } from "tui-components";
import { Chart } from "tui-components/chart";

// Automatically loads user config and applies theme
const ctx = createRenderContext();

const chart = Chart({
  data: [
    { label: "Q1", value: 100 },
    { label: "Q2", value: 150 },
  ],
});

console.log(chart.render(ctx));
```

The component will use the theme preset, render mode, and terminal settings from your config file.
