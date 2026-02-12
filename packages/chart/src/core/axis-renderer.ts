/**
 * Shared axis rendering utilities for vertical charts.
 *
 * Provides consistent Y-axis and X-axis rendering with tick marks
 * across all chart types (bar, stacked bar, line, area).
 */

import { padToWidth } from "@tuicomponents/core";
import { AXIS_CHARS } from "./chars.js";
import { formatTickValue } from "./scaling.js";

/**
 * Y-axis scale information.
 */
export interface YAxisScale {
  min: number;
  max: number;
  ticks: number[];
}

/**
 * Configuration for Y-axis rendering.
 */
export interface YAxisConfig {
  /** Scale with min, max, and tick values */
  scale: YAxisScale;
  /** Total chart height in rows */
  chartHeight: number;
  /** Width reserved for Y-axis labels */
  labelWidth: number;
  /** Number format */
  format?: "number" | "percent" | "currency" | "compact" | undefined;
  /** Decimal places */
  decimals?: number | undefined;
}

/**
 * Result of Y-axis label computation for a single row.
 */
export interface YAxisRowResult {
  /** Formatted label (padded to labelWidth) or spaces if no tick */
  label: string;
  /** Whether this row has a tick mark */
  hasTick: boolean;
  /** The axis character to use (┤ for tick, │ otherwise) */
  axisChar: string;
}

/**
 * Compute Y-axis label and tick mark for a given row.
 *
 * @param row - Row index (0 = bottom, chartHeight-1 = top)
 * @param config - Y-axis configuration
 * @returns Label, tick status, and axis character for this row
 */
export function computeYAxisRow(row: number, config: YAxisConfig): YAxisRowResult {
  const { scale, chartHeight, labelWidth, format = "number", decimals } = config;

  const rowBottom = row / chartHeight;
  const rowTop = (row + 1) / chartHeight;

  let label = " ".repeat(labelWidth);
  let hasTick = false;

  for (const tick of scale.ticks) {
    const tickNorm = (tick - scale.min) / (scale.max - scale.min);

    // Skip the zero tick - it goes on the x-axis line
    if (tickNorm < 0.001) continue;

    // Use inclusive upper bound, exclusive lower bound with small epsilon
    const epsilon = 0.001;
    if (tickNorm > rowBottom - epsilon && tickNorm <= rowTop) {
      label = padToWidth(formatTickValue(tick, format, decimals), labelWidth - 1) + " ";
      hasTick = true;
      break;
    }
  }

  const axisChar = hasTick ? AXIS_CHARS.yTickLeft : AXIS_CHARS.vertical;

  return { label, hasTick, axisChar };
}

/**
 * Configuration for X-axis rendering.
 */
export interface XAxisConfig {
  /** Category labels */
  categories: string[];
  /** Width of each bar/category area */
  barWidth: number;
  /** Width reserved for Y-axis (for alignment) */
  yAxisWidth: number;
  /** Total chart width */
  chartWidth: number;
  /** Minimum value for zero label */
  minValue: number;
  /** Number format for zero label */
  format?: "number" | "percent" | "currency" | "compact" | undefined;
  /** Decimal places for zero label */
  decimals?: number | undefined;
}

/**
 * Result of X-axis rendering.
 */
export interface XAxisResult {
  /** The X-axis line with origin and tick marks */
  axisLine: string;
  /** The category labels line (centered under ticks) */
  labelLine: string;
}

/**
 * Render the X-axis with tick marks and centered labels.
 *
 * @param config - X-axis configuration
 * @returns Axis line and label line
 */
export function renderXAxis(config: XAxisConfig): XAxisResult {
  const {
    categories,
    barWidth,
    yAxisWidth,
    chartWidth,
    minValue,
    format = "number",
    decimals,
  } = config;

  // Zero label aligned with origin
  const zeroLabel = padToWidth(formatTickValue(minValue, format, decimals), yAxisWidth - 1) + " ";

  // Build x-axis line with tick marks at category centers
  let xAxisLine = "";
  for (let i = 0; i < categories.length; i++) {
    const tickPos = Math.floor(barWidth / 2);
    const beforeTick = AXIS_CHARS.horizontal.repeat(tickPos);
    const afterTick = AXIS_CHARS.horizontal.repeat(barWidth - tickPos - 1);
    xAxisLine += beforeTick + AXIS_CHARS.xTick + afterTick;
    if (i < categories.length - 1) {
      xAxisLine += AXIS_CHARS.horizontal; // Space between bars
    }
  }

  // Fill remaining width
  const remaining = chartWidth - yAxisWidth - xAxisLine.length - 1;
  if (remaining > 0) {
    xAxisLine += AXIS_CHARS.horizontal.repeat(remaining);
  }

  const fullAxisLine = zeroLabel + AXIS_CHARS.origin + xAxisLine;

  // Build label line with centered labels
  let labelLine = "";
  for (let i = 0; i < categories.length; i++) {
    const label = categories[i];
    if (!label) continue;
    const tickPos = Math.floor(barWidth / 2);
    const labelStart = Math.max(0, tickPos - Math.floor(label.length / 2));
    const labelEnd = labelStart + label.length;
    const paddingBefore = " ".repeat(labelStart);
    const paddingAfter = " ".repeat(Math.max(0, barWidth - labelEnd));
    labelLine += paddingBefore + label + paddingAfter;
    if (i < categories.length - 1) {
      labelLine += " "; // Space between bars
    }
  }

  const fullLabelLine = " ".repeat(yAxisWidth + 1) + labelLine;

  return {
    axisLine: fullAxisLine,
    labelLine: fullLabelLine,
  };
}

/**
 * Configuration for a complete chart area with axes.
 */
export interface ChartAreaConfig {
  /** Y-axis configuration */
  yAxis: YAxisConfig;
  /** X-axis configuration */
  xAxis: XAxisConfig;
}

/**
 * Helper to build a complete row with Y-axis and content.
 *
 * @param row - Row index
 * @param content - The chart content for this row
 * @param config - Y-axis configuration
 * @returns Complete row string with Y-axis label and content
 */
export function buildChartRow(
  row: number,
  content: string,
  config: YAxisConfig
): string {
  const { label, axisChar } = computeYAxisRow(row, config);
  return `${label}${axisChar}${content}`;
}
