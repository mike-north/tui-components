/**
 * Shared TypeScript types for the chart system.
 */

import type { z } from "zod";
import type {
  chartTypeSchema,
  dataPointSchema,
  dataSeriesSchema,
  axisConfigSchema,
  legendConfigSchema,
  gridConfigSchema,
  chartInputSchema,
  barStyleSchema,
  lineStyleSchema,
  valueFormatSchema,
  scatterStyleSchema,
  scatterMarkerSchema,
  heatmapStyleSchema,
  gradientStopSchema,
  gradientConfigSchema,
} from "./schema.js";

/**
 * Chart type variants.
 */
export type ChartType = z.infer<typeof chartTypeSchema>;

/**
 * Style options for bar fill characters.
 */
export type BarStyle = z.infer<typeof barStyleSchema>;

/**
 * Style options for line rendering.
 */
export type LineStyle = z.infer<typeof lineStyleSchema>;

/**
 * Value format options for axis labels.
 */
export type ValueFormat = z.infer<typeof valueFormatSchema>;

/**
 * Style options for scatter plot rendering.
 */
export type ScatterStyle = z.infer<typeof scatterStyleSchema>;

/**
 * Marker shapes for scatter plot series.
 */
export type ScatterMarker = z.infer<typeof scatterMarkerSchema>;

/**
 * Style options for heatmap rendering.
 */
export type HeatmapStyle = z.infer<typeof heatmapStyleSchema>;

/**
 * A single color stop in a gradient.
 *
 * @public
 * @remarks
 * Not yet implemented. See docs/adr/001-gradient-support.md
 */
export type GradientStop = z.infer<typeof gradientStopSchema>;

/**
 * Gradient configuration for bar chart series.
 *
 * @public
 * @remarks
 * Not yet implemented. See docs/adr/001-gradient-support.md
 */
export type GradientConfig = z.infer<typeof gradientConfigSchema>;

/**
 * A single data point in a chart.
 */
export type DataPoint = z.infer<typeof dataPointSchema>;

/**
 * A series of data points with styling.
 */
export type DataSeries = z.infer<typeof dataSeriesSchema>;

/**
 * Axis configuration.
 */
export type AxisConfig = z.infer<typeof axisConfigSchema>;

/**
 * Legend configuration.
 */
export type LegendConfig = z.infer<typeof legendConfigSchema>;

/**
 * Grid configuration.
 */
export type GridConfig = z.infer<typeof gridConfigSchema>;

/**
 * Chart input (before defaults applied).
 */
export type ChartInput = z.input<typeof chartInputSchema>;

/**
 * Chart input with defaults applied.
 */
export type ChartInputWithDefaults = z.output<typeof chartInputSchema>;

/**
 * Computed layout for a single bar.
 */
export interface BarLayout {
  /** Series index */
  seriesIndex: number;
  /** Data point index within series */
  pointIndex: number;
  /** Category label or x value */
  label: string;
  /** Numeric value */
  value: number;
  /** Scaled bar length (in characters) */
  length: number;
  /** Formatted value string */
  formattedValue: string;
  /** Bar fill character */
  barChar: string;
  /** Whether to use backticks for markdown */
  useBackticks: boolean;
  /** Percentage of max (0-100) */
  percentage: number;
}

/**
 * Computed layout for stacked bars at a single category.
 */
export interface StackedBarLayout {
  /** Category label */
  label: string;
  /** Segments from bottom to top */
  segments: BarLayout[];
  /** Total value */
  total: number;
}

/**
 * Computed layout for a line chart row.
 */
export interface LineRowLayout {
  /** Y-axis label for this row (optional) */
  yLabel?: string;
  /** Characters for each column */
  chars: string[];
  /** Whether each column uses backticks */
  useBackticks: boolean[];
}

/**
 * Computed layout for the entire chart.
 */
export interface ChartLayout {
  /** Chart type */
  type: ChartType;
  /** Width of chart area (characters) */
  width: number;
  /** Height of chart area (lines) */
  height: number;
  /** Y-axis label width (for alignment) */
  yAxisWidth: number;
  /** Whether to show axes */
  showAxes: boolean;
  /** Content rows (from top to bottom) */
  rows: string[][];
  /** Title line (if present) */
  title?: string;
}
