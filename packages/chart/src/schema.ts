/**
 * Zod schemas for chart input validation.
 */

import { z } from "zod";

/**
 * Chart type variants.
 */
export const chartTypeSchema = z.enum([
  "bar", // Horizontal bars
  "bar-vertical", // Vertical bars (column chart)
  "bar-stacked", // Stacked horizontal bars
  "bar-stacked-vertical", // Stacked vertical bars
  "line", // Line chart (height blocks)
  "area", // Filled area
  "area-stacked", // Stacked area
  "scatter", // 2D scatter plot with X/Y axes
  "pie", // Pie chart (circular)
  "donut", // Donut chart (pie with inner radius)
  "heatmap", // 2D grid with intensity shading
]);

/**
 * Style options for bar fill.
 */
export const barStyleSchema = z.enum([
  "block", // ████████
  "shaded", // ▓▓▓▓▓▓▓▓
  "light", // ░░░░░░░░
  "hash", // ########
  "equals", // ========
  "arrow", // >>>>>>>>
]);

/**
 * Style options for line rendering.
 */
export const lineStyleSchema = z.enum([
  "blocks", // Height blocks: ▁▂▃▄▅▆▇█ (default)
  "braille", // Braille dots (high resolution)
  "dots", // Point markers: · • ●
]);

/**
 * Style options for scatter plot rendering.
 */
export const scatterStyleSchema = z.enum([
  "dots", // Simple character dots (●, ■, ▲)
  "braille", // High-resolution braille positioning
]);

/**
 * Marker shapes for scatter plot series distinction.
 */
export const scatterMarkerSchema = z.enum([
  "circle", // ●
  "square", // ■
  "triangle", // ▲
  "diamond", // ◆
  "plus", // +
]);

/**
 * Style options for heatmap rendering.
 */
export const heatmapStyleSchema = z.enum([
  "blocks", // ░▒▓█ (4 intensity levels)
  "ascii", // . : * # (4 levels, markdown-friendly)
  "numeric", // Show actual values in cells
]);

/**
 * Value format options.
 */
export const valueFormatSchema = z.enum([
  "number", // Regular number
  "percent", // Percentage
  "compact", // K/M/B suffixes
  "currency", // Dollar prefix
]);

/**
 * Legend position options.
 */
export const legendPositionSchema = z.enum([
  "none", // No legend
  "top", // Above chart
  "bottom", // Below chart
  "right", // To the right
  "inline", // Inline with data
]);

/**
 * A single data point in a chart.
 */
export const dataPointSchema = z.object({
  /**
   * Category or x-value.
   * Can be a string (categorical) or number (continuous).
   */
  x: z.union([z.string(), z.number()]),

  /**
   * Numeric y-value.
   */
  y: z.number(),

  /**
   * Optional custom label for this data point.
   */
  label: z.string().optional(),
});

/**
 * A series of data points.
 */
export const dataSeriesSchema = z.object({
  /**
   * Series name (used in legend).
   */
  name: z.string(),

  /**
   * Data points in this series.
   */
  data: z.array(dataPointSchema),

  /**
   * Optional style for this series.
   */
  style: barStyleSchema.optional(),
});

/**
 * Axis configuration.
 */
export const axisConfigSchema = z.object({
  /**
   * Axis title/label.
   */
  label: z.string().optional(),

  /**
   * Explicit minimum value (auto-computed if not set).
   */
  min: z.number().optional(),

  /**
   * Explicit maximum value (auto-computed if not set).
   */
  max: z.number().optional(),

  /**
   * Number of tick marks.
   * @default 5
   */
  tickCount: z.number().int().positive().default(5),

  /**
   * Whether to show tick marks.
   * @default true
   */
  showTicks: z.boolean().default(true),

  /**
   * Value format for tick labels.
   * @default "number"
   */
  format: valueFormatSchema.default("number"),

  /**
   * Number of decimal places.
   */
  decimals: z.number().int().nonnegative().optional(),
});

/**
 * Legend configuration.
 */
export const legendConfigSchema = z.object({
  /**
   * Legend position.
   * @default "bottom"
   */
  position: legendPositionSchema.default("bottom"),

  /**
   * Whether to use boxed style.
   * @default false
   */
  boxed: z.boolean().default(false),
});

/**
 * Grid configuration.
 */
export const gridConfigSchema = z.object({
  /**
   * Show horizontal grid lines.
   * @default false
   */
  horizontal: z.boolean().default(false),

  /**
   * Show vertical grid lines.
   * @default false
   */
  vertical: z.boolean().default(false),

  /**
   * Grid character.
   * @default "·"
   */
  char: z.string().default("·"),
});

/**
 * Main chart input schema.
 */
export const chartInputSchema = z.object({
  /**
   * Chart type.
   */
  type: chartTypeSchema,

  /**
   * Data series to display.
   */
  series: z.array(dataSeriesSchema).min(1),

  /**
   * Chart title.
   */
  title: z.string().optional(),

  /**
   * X-axis configuration.
   */
  xAxis: axisConfigSchema.optional(),

  /**
   * Y-axis configuration.
   */
  yAxis: axisConfigSchema.optional(),

  /**
   * Legend configuration.
   */
  legend: legendConfigSchema.optional(),

  /**
   * Grid configuration.
   */
  grid: gridConfigSchema.optional(),

  /**
   * Chart width in characters.
   * @default 40
   */
  width: z.number().int().positive().default(40),

  /**
   * Chart height in lines.
   * @default 10
   */
  height: z.number().int().positive().default(10),

  /**
   * Show values on data points.
   * @default false
   */
  showValues: z.boolean().default(false),

  /**
   * Show axes.
   * @default true
   */
  showAxes: z.boolean().default(true),

  /**
   * Line/area rendering style.
   * @default "blocks"
   */
  lineStyle: lineStyleSchema.default("blocks"),

  /**
   * Default bar style for series without explicit style.
   * @default "block"
   */
  barStyle: barStyleSchema.default("block"),

  /**
   * Scatter plot rendering style.
   * @default "dots"
   */
  scatterStyle: scatterStyleSchema.default("dots"),

  /**
   * Heatmap rendering style.
   * @default "blocks"
   */
  heatmapStyle: heatmapStyleSchema.default("blocks"),

  /**
   * Center label for donut charts.
   * Displayed in the center of the donut.
   */
  centerLabel: z.string().optional(),

  /**
   * Inner radius ratio for donut charts (0-0.9).
   * 0 = pie chart, 0.5 = typical donut.
   * @default 0.5
   */
  innerRadius: z.number().min(0).max(0.9).default(0.5),
});

// Export inferred types are in types.ts
