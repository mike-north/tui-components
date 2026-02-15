# Compatibility Matrix

This document provides comprehensive compatibility information for TUI Components across different AI assistants and terminals.

## AI Assistant Compatibility

The following table shows which render mode works best with each AI assistant:

| Assistant        | Best Mode   | Backticks | ANSI    | Newlines  | Notes                                |
| ---------------- | ----------- | --------- | ------- | --------- | ------------------------------------ |
| Claude Code      | `markdown`  | ✓         | ✗       | full      | Command output truncated ~3 lines    |
| GitHub Copilot   | `markdown`  | ✓         | ✗       | collapsed | Collapses newlines - use inline mode |
| Cline            | `grayscale` | ✗         | Partial | full      | No backtick highlighting             |
| OpenAI Codex CLI | `markdown`  | ✓         | ✗       | full      |                                      |
| Gemini CLI       | `markdown`  | ✓         | ✗       | full      |                                      |
| Kiro CLI         | `ansi`      | ✗         | Full    | full      | Full ANSI support in terminal        |
| OpenCode         | `markdown`  | ✓         | ✗       | full      |                                      |

### Legend

- **Best Mode**: The recommended render mode for this assistant
- **Backticks**: Whether the assistant supports syntax highlighting in triple backtick code blocks
- **ANSI**: Level of ANSI color code support (Full, Partial, or ✗)
- **Newlines**: How the assistant handles newlines (full, collapsed)

## Terminal Support

Terminal emulator support for ANSI rendering and ChromaTerm color enhancement:

| Terminal         | ANSI      | ChromaTerm | Unicode |
| ---------------- | --------- | ---------- | ------- |
| iTerm2           | truecolor | ✓          | full    |
| VS Code Terminal | truecolor | ✓          | full    |
| macOS Terminal   | 256color  | ✓          | full    |
| Windows Terminal | truecolor | ✗          | full    |
| GNOME Terminal   | truecolor | ✓          | full    |

### ANSI Support Levels

- **truecolor**: Full 24-bit RGB color support (16.7 million colors)
- **256color**: 256 color palette support
- **16color**: Basic 16 color support (8 colors + bright variants)

## Recommendations by Assistant

### Claude Code

**Recommended mode:** `markdown`

```typescript
renderer.markdown(component);
```

**Note:** Command output truncated ~3 lines

### GitHub Copilot

**Recommended mode:** `markdown` with `{"multilineMode":"inline"}`

This assistant collapses newlines, so use `multilineMode: "inline"` for markdown mode:

```typescript
renderer.markdown(component, {
  multilineMode: "inline",
});
```

**Note:** Collapses newlines - use inline mode

### Cline

**Recommended mode:** `grayscale`

```typescript
renderer.grayscale(component);
```

**Note:** No backtick highlighting

### OpenAI Codex CLI

**Recommended mode:** `markdown`

```typescript
renderer.markdown(component);
```

### Gemini CLI

**Recommended mode:** `markdown`

```typescript
renderer.markdown(component);
```

### Kiro CLI

**Recommended mode:** `ansi`

This assistant has full ANSI truecolor support in the terminal:

```typescript
renderer.ansi(component);
```

**Note:** Full ANSI support in terminal

### OpenCode

**Recommended mode:** `markdown`

```typescript
renderer.markdown(component);
```

## Recommendations by Mode

### Markdown Mode

Best for most AI assistants that display output in a chat interface.

**Benefits:**

- Syntax highlighting via triple backticks
- Compact display
- Works with collapsed newlines (GitHub Copilot)

**Usage:**

```typescript
import { renderer } from "tui-components";

// Default mode
const output = renderer.markdown(myChart);

// Inline mode for assistants that collapse newlines
const output = renderer.markdown(myChart, {
  multilineMode: "inline",
});
```

### ANSI Mode

Best for terminal-based AI assistants and ChromaTerm-compatible terminals.

**Benefits:**

- Full color support (truecolor)
- Rich visual rendering
- Works with terminal pagers

**Usage:**

```typescript
import { renderer } from "tui-components";

const output = renderer.ansi(myChart);
console.log(output);
```

**With ChromaTerm:**

```bash
my-cli render chart | ct
```

### Grayscale Mode

Best for assistants without backtick highlighting or limited ANSI support.

**Benefits:**

- Unicode box drawing
- Clear structure without color
- Works in plain text contexts

**Usage:**

```typescript
import { renderer } from "tui-components";

const output = renderer.grayscale(myChart);
```

### Plain Mode

Minimal ASCII-only rendering for maximum compatibility.

**Benefits:**

- No Unicode or ANSI required
- Works everywhere
- Accessible

**Usage:**

```typescript
import { renderer } from "tui-components";

const output = renderer.plain(myChart);
```

## Quick Start Examples

### For Claude Code

```typescript
import { renderer, Chart } from "tui-components";

const chart = new Chart({
  data: [
    ["Q1", 45],
    ["Q2", 67],
    ["Q3", 52],
    ["Q4", 78],
  ],
});

// Best for Claude Code
console.log(renderer.markdown(chart));
```

### For GitHub Copilot

```typescript
import { renderer, Chart } from "tui-components";

const chart = new Chart({
  data: [
    ["Q1", 45],
    ["Q2", 67],
    ["Q3", 52],
    ["Q4", 78],
  ],
});

// GitHub Copilot collapses newlines, use inline mode
console.log(renderer.markdown(chart, { multilineMode: "inline" }));
```

### For Kiro CLI (Terminal)

```typescript
import { renderer, Chart } from "tui-components";

const chart = new Chart({
  data: [
    ["Q1", 45],
    ["Q2", 67],
    ["Q3", 52],
    ["Q4", 78],
  ],
});

// Full ANSI color support
console.log(renderer.ansi(chart));
```

## Related Documentation

- [Render Modes](./RENDER_MODES.md) - Detailed render mode documentation
- [ChromaTerm Guide](./CHROMATERM.md) - Setting up ChromaTerm for color enhancement
- [Component Examples](../README.md) - Component usage examples
