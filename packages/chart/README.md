# @tuicomponents/chart

A comprehensive terminal charting library for rendering data visualizations in ANSI and markdown formats.

## Features

- **11 chart types**: bar, bar-vertical, bar-stacked, bar-stacked-vertical, line, area, area-stacked, scatter, pie, donut, heatmap
- **Dual rendering**: ANSI (colored terminal output) and markdown (plain text with backtick styling)
- **High-resolution graphics**: Braille character rendering for smooth curves and precise positioning
- **Automatic scaling**: Smart tick computation with nice round numbers
- **Multi-series support**: Multiple data series with distinct visual styles
- **Flexible configuration**: Customizable dimensions, axes, legends, and styling

## Installation

```bash
npm install @tuicomponents/chart
# or
pnpm add @tuicomponents/chart
```

## Quick Start

```typescript
import { createChart } from "@tuicomponents/chart";

const chart = createChart();

const result = chart.render(
  {
    type: "bar",
    series: [
      {
        name: "Sales",
        data: [
          { x: "Q1", y: 120 },
          { x: "Q2", y: 150 },
          { x: "Q3", y: 180 },
          { x: "Q4", y: 200 },
        ],
      },
    ],
    showValues: true,
  },
  { renderMode: "ansi" }
);

console.log(result.output);
```

## Chart Types

### Bar Charts

```typescript
// Horizontal bar chart
{ type: "bar", series: [...] }

// Vertical bar chart (column chart)
{ type: "bar-vertical", series: [...], height: 8 }

// Stacked horizontal bars
{ type: "bar-stacked", series: [series1, series2, ...] }

// Stacked vertical bars
{ type: "bar-stacked-vertical", series: [series1, series2, ...] }
```

### Line & Area Charts

```typescript
// Line chart with height blocks
{ type: "line", series: [...], lineStyle: "blocks" }

// High-resolution braille line chart
{ type: "line", series: [...], lineStyle: "braille" }

// Filled area chart
{ type: "area", series: [...] }

// Stacked area chart
{ type: "area-stacked", series: [series1, series2] }
```

### Scatter Plot

```typescript
// Scatter with character markers
{
  type: "scatter",
  series: [{
    name: "Data",
    data: [
      { x: 10, y: 20 },
      { x: 30, y: 50 },
      { x: 50, y: 30 },
    ]
  }],
  scatterStyle: "dots"  // or "braille" for high-resolution
}
```

### Pie & Donut Charts

```typescript
// Pie chart
{
  type: "pie",
  series: [{
    name: "Revenue",
    data: [
      { label: "Sales", x: "Sales", y: 45 },
      { label: "Support", x: "Support", y: 30 },
      { label: "Other", x: "Other", y: 25 },
    ]
  }]
}

// Donut chart with center label
{
  type: "donut",
  series: [...],
  centerLabel: "100%",
  innerRadius: 0.5  // 0-0.9, controls hole size
}
```

### Heatmap

```typescript
{
  type: "heatmap",
  series: [{
    name: "Activity",
    data: [
      { x: "Mon", y: 10, label: "9am" },
      { x: "Tue", y: 50, label: "9am" },
      { x: "Wed", y: 90, label: "9am" },
      { x: "Mon", y: 30, label: "10am" },
      // ... more cells
    ]
  }],
  heatmapStyle: "blocks"  // "blocks", "ascii", or "numeric"
}
```

## Configuration Options

### Chart Input Schema

| Property       | Type    | Default  | Description                                                     |
| -------------- | ------- | -------- | --------------------------------------------------------------- |
| `type`         | string  | required | Chart type (see above)                                          |
| `series`       | array   | required | Data series array                                               |
| `title`        | string  | -        | Chart title                                                     |
| `width`        | number  | 40       | Width in characters                                             |
| `height`       | number  | 10       | Height in lines                                                 |
| `showValues`   | boolean | false    | Display values on data points                                   |
| `showAxes`     | boolean | true     | Display axes                                                    |
| `lineStyle`    | string  | "blocks" | Line rendering: "blocks", "braille", "dots"                     |
| `barStyle`     | string  | "block"  | Bar fill: "block", "shaded", "light", "hash", "equals", "arrow" |
| `scatterStyle` | string  | "dots"   | Scatter rendering: "dots", "braille"                            |
| `heatmapStyle` | string  | "blocks" | Heatmap rendering: "blocks", "ascii", "numeric"                 |
| `xAxis`        | object  | -        | X-axis configuration                                            |
| `yAxis`        | object  | -        | Y-axis configuration                                            |
| `legend`       | object  | -        | Legend configuration                                            |
| `grid`         | object  | -        | Grid line configuration                                         |

### Data Point Schema

```typescript
{
  x: string | number,  // Category or x-value
  y: number,           // Numeric y-value
  label?: string       // Optional custom label
}
```

### Axis Configuration

```typescript
{
  label?: string,      // Axis title
  min?: number,        // Minimum value (auto-computed if not set)
  max?: number,        // Maximum value (auto-computed if not set)
  tickCount?: number,  // Number of ticks (default: 5)
  showTicks?: boolean, // Show tick marks (default: true)
  format?: string,     // "number", "percent", "compact", "currency"
  decimals?: number    // Decimal places
}
```

### Legend Configuration

```typescript
{
  position?: string,  // "none", "top", "bottom", "right", "inline"
  boxed?: boolean     // Use boxed style
}
```

## Render Modes

### ANSI Mode

Produces colored terminal output using ANSI escape codes. Best for interactive terminal applications.

```typescript
chart.render(input, { renderMode: "ansi", theme: yourTheme });
```

### Markdown Mode

Produces plain text output using backticks for visual distinction. Best for embedding in markdown documents or environments without ANSI support.

```typescript
chart.render(input, { renderMode: "markdown" });
```

## Render Result

```typescript
interface RenderResult {
  output: string; // The rendered chart string
  actualWidth: number; // Actual width in characters
  lineCount: number; // Number of lines
}
```

## Advanced Usage

### Direct Layout Access

For advanced use cases, you can compute layouts separately from rendering:

```typescript
import {
  computeBarLayout,
  computeLineLayout,
  computeScatterLayout,
  computePieLayout,
  computeHeatmapLayout,
  renderBarChartAnsi,
  renderLineChartMarkdown,
} from "@tuicomponents/chart";

// Compute layout
const layout = computeBarLayout(chartInput);

// Render with custom options
const output = renderBarChartAnsi(layout, { theme, input: chartInput });
```

### Braille Canvas

The library includes a `BrailleCanvas` class for high-resolution terminal graphics:

```typescript
import { BrailleCanvas } from "@tuicomponents/chart";

const canvas = new BrailleCanvas(40, 10); // width, height in chars
canvas.setDot(x, y, seriesIndex);
canvas.drawLine(x1, y1, x2, y2, seriesIndex);
canvas.drawCircle(cx, cy, radius, seriesIndex);
const rendered = canvas.render();
```

## Character Sets

### Height Blocks

`▁▂▃▄▅▆▇█` - 8 levels for line/area charts

### Bar Fill Styles

- block: `████████`
- shaded: `▓▓▓▓▓▓▓▓`
- light: `░░░░░░░░`
- hash: `########`
- equals: `========`
- arrow: `>>>>>>>>`

### Heatmap Intensity

- blocks: `░▒▓█` (4 levels)
- ascii: `.:*#` (4 levels, markdown-friendly)

### Scatter Markers

`● ■ ▲ ◆ +` - 5 distinct markers for multi-series

## License

UNLICENSED
