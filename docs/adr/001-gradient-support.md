# ADR 001: Gradient Support for Bar Charts

## Status

Proposed

## Context

TUI Components bar charts currently support solid colors per series via the theme system. Users have requested gradient fills for more visually appealing charts. This ADR documents the design for adding gradient support to bar charts without implementing it yet.

Currently, bar charts apply colors through the theme's semantic colors (primary, secondary, etc.). The `BarLayout` interface computes a single `barChar` fill character (e.g., █, ▓, ░, #, =, >) that is repeated for the entire bar length. The ANSI renderer applies theme colors to the entire bar string uniformly.

## Decision

### Recommended Approach: Per-Series Gradient Configuration

We will add an optional `gradient` field to the data series schema, allowing each series to specify its own gradient configuration independently.

### Schema Design

```typescript
// New types to add to packages/chart/src/schema.ts

/**
 * A single color stop in a gradient.
 * @public
 */
const gradientStopSchema = z.object({
  /** Position along the gradient (0 = start, 1 = end of bar) */
  offset: z.number().min(0).max(1),
  /** Hex color at this position (e.g., "#3b82f6") */
  color: z.string().regex(/^#[0-9a-fA-F]{6}$/),
});

/**
 * Gradient configuration for bar chart series.
 * @public
 */
const gradientConfigSchema = z.object({
  /** Gradient direction */
  type: z
    .enum(["linear-horizontal", "linear-vertical"])
    .default("linear-horizontal"),
  /** Color stops (minimum 2 required) */
  stops: z.array(gradientStopSchema).min(2),
});

// Export inferred types
export type GradientStop = z.infer<typeof gradientStopSchema>;
export type GradientConfig = z.infer<typeof gradientConfigSchema>;

// Future: Add to dataSeriesSchema when implementing
// gradient: gradientConfigSchema.optional(),
```

### Example Usage

```typescript
const chartInput = {
  type: "bar",
  series: [
    {
      name: "Revenue",
      data: [
        { x: "Q1", y: 100 },
        { x: "Q2", y: 150 },
        { x: "Q3", y: 120 },
      ],
      gradient: {
        type: "linear-horizontal",
        stops: [
          { offset: 0, color: "#3b82f6" }, // Blue at start
          { offset: 1, color: "#10b981" }, // Green at end
        ],
      },
    },
    {
      name: "Costs",
      data: [
        { x: "Q1", y: 60 },
        { x: "Q2", y: 80 },
        { x: "Q3", y: 70 },
      ],
      gradient: {
        type: "linear-horizontal",
        stops: [
          { offset: 0, color: "#ef4444" }, // Red at start
          { offset: 0.5, color: "#f59e0b" }, // Orange at middle
          { offset: 1, color: "#eab308" }, // Yellow at end
        ],
      },
    },
  ],
  width: 40,
  showValues: true,
};
```

### Mode Behavior

| Mode             | Gradient Rendering                                            |
| ---------------- | ------------------------------------------------------------- |
| ANSI (truecolor) | Smooth color interpolation using 24-bit RGB colors            |
| ANSI (256-color) | Stepped color transition using nearest ANSI 256 colors        |
| ANSI (basic)     | Shade character progression (░▒▓█) from light to dark         |
| Markdown         | Falls back to solid fill (uses first stop color)              |
| Grayscale        | Shade character progression (░▒▓█) based on brightness values |

## Alternatives Considered

### 1. Global Gradient Palette

```typescript
// Applied uniformly across all series
gradient: {
  palette: ["#3b82f6", "#10b981", "#f59e0b"];
}
```

**Rejected**: Less flexible. Cannot customize different gradient styles per series, which limits visual distinction between multiple data series in the same chart.

### 2. Theme-Level Gradients

```typescript
theme: {
  gradients: {
    default: { stops: [...] },
    emphasis: { stops: [...] }
  }
}
```

**Rejected**: Mixes data visualization configuration with presentation theming. Makes it harder to override gradients on a per-chart or per-series basis without creating new themes.

### 3. CSS-like Gradient Strings

```typescript
gradient: "linear-gradient(90deg, #3b82f6 0%, #10b981 100%)";
```

**Rejected**: Harder to parse and validate with Zod. Less type-safe. Requires custom parsing logic. The structured object approach is more explicit and maintainable.

### 4. Automatic Gradient from Single Color

```typescript
// Automatically create gradient from base color
color: "#3b82f6"; // Auto-generates light to dark gradient
```

**Rejected**: Too much magic. Users should explicitly opt into gradients. Automatic color manipulation can produce unexpected results and makes it harder to achieve precise visual goals.

## Consequences

### Positive

- **Backward compatible**: `gradient` is optional, existing charts work unchanged
- **Flexible**: Different gradients per series enable rich visual distinction
- **Type-safe**: Full schema validation with Zod catches configuration errors early
- **Self-contained**: All configuration in the chart input, no external theme dependencies
- **Multiple stops**: Support for complex multi-color gradients (2+ stops)
- **Terminal-aware**: Graceful degradation based on terminal capabilities

### Negative

- **Complexity**: More rendering logic needed for color interpolation
- **Terminal limitations**: Not all terminals support truecolor; may fall back to less smooth gradients
- **Performance**: Calculating gradient color for each character position (likely negligible for typical chart sizes)
- **Markdown limitation**: Gradients cannot be represented in plain text, must fall back to solid color

### Risks

- **Terminal detection accuracy**: Terminal capability detection might be inaccurate, leading to incorrect rendering mode selection
- **Color interpolation**: Linear RGB interpolation can produce unexpected hues in the middle of gradients; may need perceptual color space (LAB/LCH) for better results
- **Accessibility**: Gradients may reduce contrast and readability for some users; ensure value labels remain readable

## Implementation Notes

### ANSI Gradient Rendering

#### Truecolor Terminals (24-bit color)

```typescript
/**
 * Interpolate between two RGB colors linearly.
 * @param color1 - Starting hex color (e.g., "#3b82f6")
 * @param color2 - Ending hex color (e.g., "#10b981")
 * @param t - Interpolation factor (0-1)
 * @returns Interpolated hex color
 */
function interpolateColor(color1: string, color2: string, t: number): string {
  const r1 = parseInt(color1.slice(1, 3), 16);
  const g1 = parseInt(color1.slice(3, 5), 16);
  const b1 = parseInt(color1.slice(5, 7), 16);

  const r2 = parseInt(color2.slice(1, 3), 16);
  const g2 = parseInt(color2.slice(3, 5), 16);
  const b2 = parseInt(color2.slice(5, 7), 16);

  const r = Math.round(r1 + (r2 - r1) * t);
  const g = Math.round(g1 + (g2 - g1) * t);
  const b = Math.round(b1 + (b2 - b1) * t);

  return `#${r.toString(16).padStart(2, "0")}${g.toString(16).padStart(2, "0")}${b.toString(16).padStart(2, "0")}`;
}

/**
 * Render a gradient bar with smooth color transitions.
 * @param width - Bar width in characters
 * @param stops - Gradient stops (sorted by offset)
 * @param barChar - Fill character to use
 * @returns ANSI-colored bar string
 */
function renderGradientBar(
  width: number,
  stops: GradientStop[],
  barChar: string
): string {
  let result = "";

  for (let i = 0; i < width; i++) {
    const t = i / (width - 1); // Position 0-1

    // Find the two stops this position falls between
    let startStop = stops[0];
    let endStop = stops[stops.length - 1];

    for (let j = 0; j < stops.length - 1; j++) {
      if (t >= stops[j].offset && t <= stops[j + 1].offset) {
        startStop = stops[j];
        endStop = stops[j + 1];
        break;
      }
    }

    // Interpolate between the two stops
    const segmentT =
      (t - startStop.offset) / (endStop.offset - startStop.offset);
    const color = interpolateColor(startStop.color, endStop.color, segmentT);

    // Apply as ANSI background color
    const rgb = hexToRgb(color);
    result += `\x1b[48;2;${rgb.r};${rgb.g};${rgb.b}m${barChar}\x1b[0m`;
  }

  return result;
}
```

#### 256-Color Terminals

```typescript
/**
 * Map hex color to nearest ANSI 256 color code.
 * Uses the ANSI 256-color palette cube (colors 16-231).
 */
function nearestAnsi256(hexColor: string): number {
  const rgb = hexToRgb(hexColor);

  // Map RGB (0-255) to 6-level cube (0-5)
  const r = Math.round((rgb.r / 255) * 5);
  const g = Math.round((rgb.g / 255) * 5);
  const b = Math.round((rgb.b / 255) * 5);

  // ANSI 256 color cube formula
  return 16 + 36 * r + 6 * g + b;
}
```

#### Basic Terminals (16-color)

```typescript
/**
 * Render gradient using Unicode shade characters.
 * Maps gradient positions to shade characters: ░▒▓█
 */
function renderShadeGradient(width: number, stops: GradientStop[]): string {
  const shadeChars = ["░", "▒", "▓", "█"];
  let result = "";

  for (let i = 0; i < width; i++) {
    const t = i / (width - 1);

    // Calculate brightness at this position (average of RGB)
    const color = getColorAtPosition(t, stops);
    const rgb = hexToRgb(color);
    const brightness = (rgb.r + rgb.g + rgb.b) / (3 * 255);

    // Map brightness to shade character
    const shadeIndex = Math.min(
      Math.floor(brightness * shadeChars.length),
      shadeChars.length - 1
    );
    result += shadeChars[shadeIndex];
  }

  return result;
}
```

### Markdown Fallback

Markdown has no concept of color gradients, so we fall back to solid color behavior:

```typescript
function renderMarkdownBar(
  width: number,
  gradient?: GradientConfig,
  barChar?: string
): string {
  // Ignore gradient, use solid fill
  // Could potentially use the first stop color for metadata purposes
  const char = barChar || "█";
  return char.repeat(width);
}
```

### Terminal Capability Detection

Use existing terminal capability detection from `@tuicomponents/core` or libraries like `supports-color`:

```typescript
function getTerminalColorSupport(): "none" | "basic" | "256" | "truecolor" {
  // Check for truecolor support
  if (
    process.env.COLORTERM === "truecolor" ||
    process.env.COLORTERM === "24bit"
  ) {
    return "truecolor";
  }

  // Check for 256-color support
  if (
    process.env.TERM?.includes("256") ||
    process.env.TERM === "xterm-256color"
  ) {
    return "256";
  }

  // Basic 16-color support
  if (process.env.TERM && process.env.TERM !== "dumb") {
    return "basic";
  }

  return "none";
}
```

## Future Extensions

- **Radial gradients**: For pie/donut charts
- **Gradient presets**: Named gradients like "sunset", "ocean", "rainbow"
- **Perceptual color interpolation**: Use LAB/LCH color space for more natural gradients
- **Pattern overlays**: Combine gradients with pattern fills (e.g., gradient + hash pattern)
- **Animation**: Gradient shifts for live/updating charts (out of scope for static rendering)

## References

- [ANSI Escape Codes](https://en.wikipedia.org/wiki/ANSI_escape_code)
- [Terminal Truecolor Support](https://github.com/termstandard/colors)
- [Chalk gradient implementation](https://github.com/bokub/chalk-animation)
- [supports-color library](https://github.com/chalk/supports-color)
- [Unicode Block Elements](https://en.wikipedia.org/wiki/Block_Elements)
- [Color Interpolation in LAB Color Space](https://observablehq.com/@mbostock/lab-and-rgb)
