# Agent Instructions for @tuicomponents/chart

This document provides guidance for AI agents generating chart visualizations using the `@tuicomponents/chart` library.

## When to Use Charts

Generate charts when users request:
- Data visualization of numeric data
- Comparisons between categories or time periods
- Trend analysis over time
- Distribution or composition breakdowns
- Correlation between two numeric variables

## Chart Type Selection Guide

Choose the appropriate chart type based on the data and intent:

| Data Pattern | Recommended Chart | Why |
|--------------|-------------------|-----|
| Categories with single values | `bar` or `bar-vertical` | Clear comparison of discrete categories |
| Categories with multiple series | `bar-stacked` or `bar-stacked-vertical` | Shows composition within each category |
| Values over time (single series) | `line` | Shows trends and patterns |
| Values over time (multiple series) | `line` with multiple series | Compares trends across series |
| Cumulative values over time | `area-stacked` | Shows how parts contribute to whole over time |
| Two numeric variables | `scatter` | Shows correlation/distribution |
| Parts of a whole | `pie` or `donut` | Shows percentage breakdown (use for ≤6 categories) |
| 2D categorical data with intensity | `heatmap` | Shows patterns in matrix data |

## Input Schema Reference

```typescript
{
  type: "bar" | "bar-vertical" | "bar-stacked" | "bar-stacked-vertical" |
        "line" | "area" | "area-stacked" | "scatter" | "pie" | "donut" | "heatmap",

  series: [{
    name: string,           // Series name for legend
    data: [{
      x: string | number,   // Category label or x-coordinate
      y: number,            // Value or y-coordinate
      label?: string        // Optional: custom label (used for pie/heatmap row labels)
    }]
  }],

  // Dimensions
  width?: number,           // Default: 40 characters
  height?: number,          // Default: 10 lines

  // Display options
  title?: string,           // Chart title
  showValues?: boolean,     // Show values on data points (default: false)
  showAxes?: boolean,       // Show axes (default: true)

  // Style options
  lineStyle?: "blocks" | "braille" | "dots",      // For line/area charts
  barStyle?: "block" | "shaded" | "light" | "hash" | "equals" | "arrow",
  scatterStyle?: "dots" | "braille",              // For scatter plots
  heatmapStyle?: "blocks" | "ascii" | "numeric",  // For heatmaps

  // Donut-specific
  centerLabel?: string,     // Text in donut center
  innerRadius?: number,     // 0-0.9, donut hole size (default: 0.5)

  // Axis configuration
  xAxis?: { min?, max?, tickCount?, format?, decimals? },
  yAxis?: { min?, max?, tickCount?, format?, decimals? },

  // Legend
  legend?: { position?: "none" | "top" | "bottom" | "right" | "inline" }
}
```

## Recommended Dimensions by Chart Type

| Chart Type | Recommended Width | Recommended Height |
|------------|-------------------|-------------------|
| `bar` (horizontal) | 40-60 | auto (1 line per bar) |
| `bar-vertical` | 25-40 | 8-12 |
| `bar-stacked` | 40-60 | auto |
| `bar-stacked-vertical` | 30-45 | 10-15 |
| `line` | 20-40 | 6-10 |
| `area` | 15-30 | 6-10 |
| `scatter` | 25-40 | 8-12 |
| `pie` / `donut` | 25-35 | 8-12 |
| `heatmap` | auto (based on columns) | auto (based on rows) |

## Data Formatting Patterns

### Bar Charts
```typescript
// Single series - categories as x, values as y
{
  type: "bar",
  series: [{
    name: "Sales",
    data: [
      { x: "Product A", y: 1200 },
      { x: "Product B", y: 800 },
      { x: "Product C", y: 1500 }
    ]
  }]
}

// Multiple series - same x categories across series
{
  type: "bar-stacked",
  series: [
    { name: "2023", data: [{ x: "Q1", y: 100 }, { x: "Q2", y: 120 }] },
    { name: "2024", data: [{ x: "Q1", y: 130 }, { x: "Q2", y: 145 }] }
  ]
}
```

### Line/Area Charts
```typescript
// Time series - x as time labels, y as values
{
  type: "line",
  series: [{
    name: "Temperature",
    data: [
      { x: "Jan", y: 30 },
      { x: "Feb", y: 35 },
      { x: "Mar", y: 50 },
      // ...
    ]
  }],
  lineStyle: "braille"  // Use for smoother curves
}
```

### Scatter Plots
```typescript
// Both x and y are numeric
{
  type: "scatter",
  series: [{
    name: "Data Points",
    data: [
      { x: 10, y: 25 },
      { x: 30, y: 45 },
      { x: 50, y: 35 }
    ]
  }],
  scatterStyle: "dots"
}
```

### Pie/Donut Charts
```typescript
// Use label for slice names, y for values
{
  type: "pie",
  series: [{
    name: "Market Share",
    data: [
      { label: "Chrome", x: "Chrome", y: 65 },
      { label: "Firefox", x: "Firefox", y: 20 },
      { label: "Safari", x: "Safari", y: 15 }
    ]
  }]
}

// Donut with center text
{
  type: "donut",
  series: [/* same as pie */],
  centerLabel: "100%",
  innerRadius: 0.5
}
```

### Heatmaps
```typescript
// x = column, label = row, y = intensity value
{
  type: "heatmap",
  series: [{
    name: "Activity",
    data: [
      // Row "9am", columns Mon/Tue/Wed
      { x: "Mon", y: 10, label: "9am" },
      { x: "Tue", y: 50, label: "9am" },
      { x: "Wed", y: 90, label: "9am" },
      // Row "10am"
      { x: "Mon", y: 30, label: "10am" },
      { x: "Tue", y: 70, label: "10am" },
      { x: "Wed", y: 40, label: "10am" }
    ]
  }],
  heatmapStyle: "blocks"
}
```

## Style Guidelines

### Render Mode Selection

- **Use `ansi` mode** when outputting to a terminal that supports colors
- **Use `markdown` mode** when outputting to markdown documents, logs, or environments without ANSI support

### When to Use Braille Styles

Use `lineStyle: "braille"` or `scatterStyle: "braille"` when:
- You need smoother curves or more precise point positioning
- The data has many points that would overlap with character markers
- Visual precision is more important than compatibility

Use block/dot styles when:
- Terminal font may not render braille characters well
- You need maximum compatibility
- Data is sparse

### Heatmap Style Selection

- `blocks` (░▒▓█): Best visual impact, may not render in all fonts
- `ascii` (.:*#): Maximum compatibility, works everywhere
- `numeric`: When actual values matter more than visual pattern

## Error Handling

The chart component validates input with Zod schemas. Common validation errors:

| Error | Cause | Fix |
|-------|-------|-----|
| "series must have at least 1 element" | Empty series array | Ensure at least one series with data |
| "Invalid enum value" | Unknown chart type or style | Check spelling of type/style values |
| "Expected number, received string" | String value for y | Ensure y values are numbers |

## Performance Considerations

- Keep data points under 100 for readable output
- For large datasets, consider aggregating data before charting
- Heatmaps work best with grids under 20x20 cells
- Pie charts are most effective with ≤6 slices

## Example: Complete Chart Generation

```typescript
import { createChart } from "@tuicomponents/chart";

const chart = createChart();

// Generate a sales comparison chart
const result = chart.render(
  {
    type: "bar-vertical",
    title: "Quarterly Sales",
    series: [
      {
        name: "2024",
        data: [
          { x: "Q1", y: 150 },
          { x: "Q2", y: 180 },
          { x: "Q3", y: 165 },
          { x: "Q4", y: 210 }
        ]
      }
    ],
    height: 10,
    width: 30,
    yAxis: { format: "compact" },
    legend: { position: "bottom" }
  },
  { renderMode: "ansi" }
);

// result.output contains the rendered chart string
// result.lineCount tells you how many lines it occupies
// result.actualWidth tells you the actual character width
```

## Common Mistakes to Avoid

1. **Don't use pie charts for >6 categories** - becomes unreadable
2. **Don't omit series name** - required for legend rendering
3. **Don't use scatter for categorical x-axis** - x must be numeric for scatter
4. **Don't set height too small** - minimum 4-6 lines for most chart types
5. **Don't forget label field for heatmap rows** - without it, series name is used for all rows
