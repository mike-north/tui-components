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

// =============================================================================
// FUTURE: Gradient Support (see docs/adr/001-gradient-support.md)
// =============================================================================

/**
 * A single color stop in a gradient.
 *
 * @public
 * @remarks
 * Not yet implemented. See docs/adr/001-gradient-support.md
 *
 * Defines a color at a specific position along the gradient.
 * Multiple stops can be used to create multi-color gradients.
 *
 * @example
 * ```typescript
 * const stop: GradientStop = {
 *   offset: 0.5,      // Middle of the gradient
 *   color: "#3b82f6"  // Blue
 * };
 * ```
 */
export const gradientStopSchema = z.object({
  /**
   * Position along the gradient (0 = start, 1 = end of bar).
   * Values outside 0-1 are clamped.
   */
  offset: z.number().min(0).max(1),

  /**
   * Hex color at this position (e.g., "#3b82f6").
   * Must be a valid 6-digit hex color code.
   */
  color: z.string().regex(/^#[0-9a-fA-F]{6}$/),
});

/**
 * Gradient configuration for bar chart series.
 *
 * @public
 * @remarks
 * Not yet implemented. See docs/adr/001-gradient-support.md
 *
 * Defines how colors transition across a bar. Supports linear gradients
 * in horizontal or vertical directions with multiple color stops.
 *
 * In ANSI mode, renders smooth color transitions (truecolor terminals) or
 * stepped transitions (256-color terminals) or shade characters (basic terminals).
 * In markdown mode, falls back to solid color using the first stop.
 *
 * @example
 * ```typescript
 * const gradient: GradientConfig = {
 *   type: "linear-horizontal",
 *   stops: [
 *     { offset: 0, color: "#3b82f6" },    // Blue at start
 *     { offset: 0.5, color: "#8b5cf6" },  // Purple at middle
 *     { offset: 1, color: "#ec4899" }     // Pink at end
 *   ]
 * };
 * ```
 */
export const gradientConfigSchema = z.object({
  /**
   * Gradient direction.
   * - "linear-horizontal": Left to right (default for horizontal bars)
   * - "linear-vertical": Bottom to top (for vertical bars)
   *
   * @default "linear-horizontal"
   */
  type: z
    .enum(["linear-horizontal", "linear-vertical"])
    .default("linear-horizontal"),

  /**
   * Color stops (minimum 2 required for a valid gradient).
   * Stops should be ordered by offset, though the implementation
   * will sort them if needed.
   */
  stops: z.array(gradientStopSchema).min(2),
});

// Note: These schemas are defined but not yet integrated into dataSeriesSchema.
// Integration will happen when gradient rendering is implemented.
// To integrate, add to dataSeriesSchema:
//   gradient: gradientConfigSchema.optional(),

// =============================================================================
// Main Chart Input Schema
// =============================================================================

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
