# Feature Requests for tui-components

This document outlines feature requests for components that would enhance the tui-components library for general-purpose terminal UI development.

---

## 1. Layout Composition System

### Problem

Currently, tui-components provides individual components (tables, boxes, charts, etc.) but lacks utilities for composing multiple components into complex layouts. Users need to manually concatenate strings and manage alignment, which is error-prone and doesn't account for terminal width constraints.

### Proposed Solution

Add a `@tuicomponents/layout` package with responsive layout primitives.

### API Design

#### 1.1 Horizontal Layout

Arrange components side-by-side with automatic width distribution.

```typescript
import { createHorizontalLayout } from "@tuicomponents/layout";

const layout = createHorizontalLayout();

const result = layout.render(
  {
    // Components to arrange (rendered output strings or arrays)
    items: [gaugeOutput, sparklineOutput, tableOutput],

    // Gap between items (default: 2)
    gap: 2,

    // How to distribute available width
    distribution: "equal" | "auto" | "manual",

    // For 'manual' distribution: explicit widths or ratios
    widths: [20, 30, "fill"], // 'fill' takes remaining space

    // Vertical alignment when items have different heights
    align: "top" | "middle" | "bottom",

    // Responsive behavior when terminal is too narrow
    responsive: {
      // Minimum width before wrapping/stacking
      minItemWidth: 20,

      // What to do when items don't fit
      overflow: "wrap" | "stack" | "truncate" | "scroll",
    },
  },
  context
);
```

**Output example (80-char terminal):**

```
┌─ CPU ────────────┐  ┌─ Memory ─────────┐  ┌─ Disk ───────────┐
│ ████████░░ 78%   │  │ ██████░░░░ 62%   │  │ ████░░░░░░ 41%   │
└──────────────────┘  └──────────────────┘  └──────────────────┘
```

**Same content on narrow terminal (40 chars) with `overflow: 'stack'`:**

```
┌─ CPU ────────────────────────────────┐
│ ████████░░░░░░░░░░░░░░░░░░░░░░░ 78%  │
└──────────────────────────────────────┘
┌─ Memory ─────────────────────────────┐
│ ██████░░░░░░░░░░░░░░░░░░░░░░░░░ 62%  │
└──────────────────────────────────────┘
┌─ Disk ───────────────────────────────┐
│ ████░░░░░░░░░░░░░░░░░░░░░░░░░░░ 41%  │
└──────────────────────────────────────┘
```

#### 1.2 Vertical Layout

Stack components vertically with consistent width and gap control.

```typescript
import { createVerticalLayout } from "@tuicomponents/layout";

const layout = createVerticalLayout();

const result = layout.render(
  {
    items: [headerBox, contentTable, footerBar],

    // Gap between items (in lines)
    gap: 1,

    // Width behavior
    width: "auto" | "full" | number, // 'full' uses context.width

    // Horizontal alignment when items have different widths
    align: "left" | "center" | "right",
  },
  context
);
```

#### 1.3 Grid Layout

Arrange components in a responsive grid.

```typescript
import { createGridLayout } from "@tuicomponents/layout";

const layout = createGridLayout();

const result = layout.render(
  {
    items: [gauge1, gauge2, gauge3, gauge4, gauge5, gauge6],

    // Number of columns (or 'auto' to calculate from minItemWidth)
    columns: 3,

    // Or specify minimum item width for auto-calculation
    minItemWidth: 25,

    // Gaps
    columnGap: 2,
    rowGap: 1,

    // How to handle the last row if not full
    lastRowAlign: "start" | "center" | "stretch",
  },
  context
);
```

**Output (80 chars, 3 columns):**

```
┌─ Metric 1 ──────┐  ┌─ Metric 2 ──────┐  ┌─ Metric 3 ──────┐
│ ████████░░ 80%  │  │ ██████░░░░ 60%  │  │ ████░░░░░░ 40%  │
└─────────────────┘  └─────────────────┘  └─────────────────┘
┌─ Metric 4 ──────┐  ┌─ Metric 5 ──────┐  ┌─ Metric 6 ──────┐
│ ██░░░░░░░░ 20%  │  │ ██████████ 100% │  │ █████░░░░░ 50%  │
└─────────────────┘  └─────────────────┘  └─────────────────┘
```

#### 1.4 Width-Aware Rendering

All layout components should respect `context.width` and provide utilities for child components:

```typescript
interface LayoutContext extends RenderContext {
  // Available width for this component (may be less than terminal width)
  availableWidth: number;

  // Whether this component is in a constrained layout
  isConstrained: boolean;
}
```

### Schema

```typescript
// Horizontal layout input
const horizontalLayoutInputSchema = z.object({
  items: z.array(z.string()),
  gap: z.number().min(0).default(2),
  distribution: z.enum(["equal", "auto", "manual"]).default("auto"),
  widths: z.array(z.union([z.number(), z.literal("fill")])).optional(),
  align: z.enum(["top", "middle", "bottom"]).default("top"),
  responsive: z
    .object({
      minItemWidth: z.number().min(1).default(10),
      overflow: z
        .enum(["wrap", "stack", "truncate", "scroll"])
        .default("stack"),
    })
    .optional(),
});

// Vertical layout input
const verticalLayoutInputSchema = z.object({
  items: z.array(z.string()),
  gap: z.number().min(0).default(1),
  width: z
    .union([z.literal("auto"), z.literal("full"), z.number()])
    .default("auto"),
  align: z.enum(["left", "center", "right"]).default("left"),
});

// Grid layout input
const gridLayoutInputSchema = z.object({
  items: z.array(z.string()),
  columns: z.union([z.number().min(1), z.literal("auto")]).default("auto"),
  minItemWidth: z.number().min(1).default(20),
  columnGap: z.number().min(0).default(2),
  rowGap: z.number().min(0).default(1),
  lastRowAlign: z.enum(["start", "center", "stretch"]).default("start"),
});
```

### Implementation Notes

1. **Width calculation priority**: Terminal width → Layout constraints → Padding/margins → Content
2. **Use `getStringWidth()` / `getMarkdownRenderedWidth()`** for all width calculations to handle Unicode and markdown formatting
3. **Responsive breakpoints** should be calculated based on `minItemWidth * columns + gaps`
4. **Empty items** should be handled gracefully (skip or render placeholder)

---

## 2. Callout / Alert Box Component

### Problem

The existing `@tuicomponents/box` component supports titles but lacks:

- Icon support for visual categorization (💡 TIP, ⚠️ WARNING, etc.)
- Semantic presets for common callout types
- Auto-wrapping of long content

This is important for CLI tools that need to display tips, warnings, errors, and notes in a visually distinct way.

### Proposed Solution

Extend the box component or create a new `@tuicomponents/callout` component.

### API Design

```typescript
import { createCallout } from "@tuicomponents/callout";

const callout = createCallout();

const result = callout.render(
  {
    // Content (string or array of strings)
    content: "Remember to run tests before committing.",

    // Semantic type (provides default icon, color, and border style)
    type: "tip" | "note" | "warning" | "error" | "success" | "info",

    // Custom title (overrides type default)
    title: "Pro Tip",

    // Custom icon (overrides type default)
    icon: "🚀",

    // Border style
    borderStyle: "single" | "double" | "round" | "heavy" | "none",

    // Width behavior
    width: "auto" | "full" | number,
    maxWidth: 80,

    // Content wrapping
    wrap: true,
  },
  context
);
```

### Semantic Type Defaults

| Type      | Icon | ANSI Color | Markdown Style | Default Title |
| --------- | ---- | ---------- | -------------- | ------------- |
| `tip`     | 💡   | cyan       | `**TIP**`      | TIP           |
| `note`    | 📝   | blue       | `**NOTE**`     | NOTE          |
| `warning` | ⚠️   | yellow     | `**WARNING**`  | WARNING       |
| `error`   | ❌   | red        | `**ERROR**`    | ERROR         |
| `success` | ✅   | green      | `**SUCCESS**`  | SUCCESS       |
| `info`    | ℹ️   | default    | `**INFO**`     | INFO          |

### Output Examples

**ANSI mode:**

```
╭─ 💡 TIP ─────────────────────────────────────────╮
│ Remember to run tests before committing.         │
╰──────────────────────────────────────────────────╯
```

**Markdown mode:**

```
│╭─ **💡 TIP** ────────────────────────────────────╮
││ Remember to run tests before committing.        │
│╰─────────────────────────────────────────────────╯
```

**Warning with wrapped content:**

```
╭─ ⚠️ WARNING ─────────────────────────────────────╮
│ This operation will delete all data in the       │
│ database. This action cannot be undone. Please   │
│ ensure you have a backup before proceeding.      │
╰──────────────────────────────────────────────────╯
```

### Schema

```typescript
const calloutTypeSchema = z.enum([
  "tip",
  "note",
  "warning",
  "error",
  "success",
  "info",
]);

const calloutInputSchema = z.object({
  content: z.union([z.string(), z.array(z.string())]),
  type: calloutTypeSchema.default("note"),
  title: z.string().optional(),
  icon: z.string().optional(),
  borderStyle: z
    .enum(["single", "double", "round", "heavy", "none"])
    .default("round"),
  width: z
    .union([z.literal("auto"), z.literal("full"), z.number()])
    .default("auto"),
  maxWidth: z.number().min(20).default(80),
  wrap: z.boolean().default(true),
});
```

### Implementation Notes

1. **Icon width handling**: Icons like ⚠️ (with variation selector) need proper width measurement
2. **Word wrapping**: Use word boundaries, respect `maxWidth`, handle long words gracefully
3. **Markdown mode**: Icons should work in markdown (most renderers support emoji)
4. **Color inheritance**: In ANSI mode, the border and title should use the semantic color

---

## 3. Fitted / Auto-Sizing Components

### Problem

When building dashboards with fixed-width layouts, users need components that automatically size themselves to fit available space. Current components require explicit width configuration, which breaks when terminal size changes.

### Proposed Solution

Add `fitted` variants or a `fit` option to existing components that automatically calculate dimensions based on available width.

### API Design

#### 3.1 Fitted Progress/Gauge

```typescript
import { createProgress } from "@tuicomponents/progress";

const progress = createProgress();

const result = progress.render(
  {
    value: 73,
    max: 100,

    // Label takes priority, bar fills remaining space
    label: "Build progress",
    labelWidth: "auto" | number, // 'auto' = label.length + padding

    // Fit mode: bar expands/contracts to fill available width
    fit: true,

    // Show percentage (accounts for width in fit calculation)
    showPercent: true,
  },
  context
);
```

**40-char terminal:**

```
Build progress ████████████░░░░ 73%
```

**80-char terminal:**

```
Build progress ████████████████████████████████████████████████████████░░░░░░░░░░░░░░░░░░░░ 73%
```

#### 3.2 Fitted Sparkline

```typescript
import { createSparkline } from "@tuicomponents/sparkline";

const sparkline = createSparkline();

const result = sparkline.render(
  {
    values: [10, 20, 15, 30, 25, 40, 35, 50, 45, 60, 55, 70],

    // Fit mode: samples or interpolates data to fit available width
    fit: true,

    // Optional label
    label: "CPU",
    labelWidth: 6,
  },
  context
);
```

**20-char terminal:** (data sampled to fit)

```
CPU ▁▂▃▄▅▆▇█▇█▆▇█
```

**40-char terminal:** (more data points shown)

```
CPU ▁▁▂▁▂▃▂▃▄▃▄▅▄▅▆▅▆▇▆▇█▇█▇█▆▇█▆▇█
```

#### 3.3 General Fit Wrapper

A utility to make any component width-aware:

```typescript
import { fitToWidth } from "@tuicomponents/layout";

// Wrap any component output to fit a specific width
const fitted = fitToWidth(componentOutput, {
  width: context.width,

  // How to handle overflow
  overflow: "truncate" | "wrap" | "ellipsis",

  // Alignment if content is narrower than width
  align: "left" | "center" | "right",
});
```

### Implementation Notes

1. **Data sampling**: For sparklines with more data points than available width, use appropriate sampling (average, max, min-max) rather than simple decimation
2. **Minimum widths**: Components should define minimum viable widths and gracefully degrade
3. **Width propagation**: Layouts should pass available width to children via context

---

## 4. Component Composition Utilities

### Problem

Users often need to embed one component's output inside another (e.g., sparkline in a table cell, gauge in a box). Currently, this requires manual string manipulation and careful width accounting.

### Proposed Solution

Add utilities for composing components while maintaining correct alignment.

### API Design

```typescript
import { compose, inline } from "@tuicomponents/core";

// Compose components into a single output
const dashboard = compose(
  [
    { component: header, width: "full" },
    { component: metricsRow, width: "full" },
    { component: detailsTable, width: "full" },
  ],
  {
    gap: 1,
    direction: "vertical",
  },
  context
);

// Create an inline component for embedding in text/cells
const inlineSparkline = inline(
  sparkline.render(
    {
      values: [1, 2, 3, 4, 5],
    },
    context
  )
);

// Use in table cell
table.render(
  {
    rows: [{ metric: "CPU", trend: inlineSparkline }],
  },
  context
);
```

### Implementation Notes

1. **Inline components** should strip anchors and newlines
2. **Width accounting** must use markdown-aware measurement when in markdown mode
3. **Nesting depth** should be tracked to prevent infinite recursion

---

## 5. Enhanced List Component

### Problem

The current list component supports bullets and numbers but lacks some features common in CLI output:

- Definition lists (term: description)
- Task/checkbox lists
- Indentation-aware wrapping

### Proposed Solution

Extend `@tuicomponents/list` with additional list types.

### API Design

```typescript
import { createList } from "@tuicomponents/list";

const list = createList();

// Task list
const taskList = list.render(
  {
    items: [
      { text: "Write tests", checked: true },
      { text: "Update docs", checked: false },
      { text: "Review PR", checked: "partial" }, // [~] or [-]
    ],
    style: "task",
  },
  context
);

// Definition list
const defList = list.render(
  {
    items: [
      { term: "API", definition: "Application Programming Interface" },
      { term: "CLI", definition: "Command Line Interface" },
    ],
    style: "definition",
    termWidth: 10, // or 'auto'
  },
  context
);
```

**Task list output:**

```
[✓] Write tests
[ ] Update docs
[~] Review PR
```

**Definition list output:**

```
API        Application Programming Interface
CLI        Command Line Interface
```

### Schema Extensions

```typescript
const listItemSchema = z.union([
  // Standard item
  z.object({
    text: z.string(),
    items: z.array(z.lazy(() => listItemSchema)).optional(),
  }),
  // Task item
  z.object({
    text: z.string(),
    checked: z.union([z.boolean(), z.literal("partial")]),
  }),
  // Definition item
  z.object({
    term: z.string(),
    definition: z.string(),
  }),
]);

const listStyleSchema = z.enum([
  "bullet",
  "numbered",
  "lettered",
  "arrow",
  "dash",
  "none",
  "task", // [✓] [ ] [~]
  "definition", // term: definition
]);
```

---

## Summary

| Feature               | Priority | Complexity | Package                    |
| --------------------- | -------- | ---------- | -------------------------- |
| Horizontal Layout     | High     | Medium     | `@tuicomponents/layout`    |
| Vertical Layout       | High     | Low        | `@tuicomponents/layout`    |
| Grid Layout           | Medium   | Medium     | `@tuicomponents/layout`    |
| Callout/Alert Box     | High     | Low        | `@tuicomponents/callout`   |
| Fitted Progress       | Medium   | Low        | `@tuicomponents/progress`  |
| Fitted Sparkline      | Medium   | Low        | `@tuicomponents/sparkline` |
| Fit Wrapper Utility   | Medium   | Low        | `@tuicomponents/core`      |
| Composition Utilities | Medium   | Medium     | `@tuicomponents/core`      |
| Task Lists            | Low      | Low        | `@tuicomponents/list`      |
| Definition Lists      | Low      | Low        | `@tuicomponents/list`      |

### Implementation Order Recommendation

1. **Phase 1**: Layout primitives (horizontal, vertical) - enables building dashboards
2. **Phase 2**: Callout component - high visibility, low complexity
3. **Phase 3**: Fitted variants - enhances existing components
4. **Phase 4**: Grid layout and composition utilities - more complex use cases
5. **Phase 5**: List enhancements - nice to have
