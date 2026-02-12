/**
 * Axis layout computation for chart rendering.
 */

import { getStringWidth } from "@tuicomponents/core";
import {
  computeNiceTicks,
  formatTickValue,
  type NiceTicksResult,
} from "./scaling.js";

/**
 * Axis orientation.
 */
export type AxisOrientation = "horizontal" | "vertical";

/**
 * Axis position relative to the chart area.
 */
export type AxisPosition = "left" | "right" | "top" | "bottom";

/**
 * Configuration for axis layout computation.
 */
export interface AxisLayoutOptions {
  /** Data minimum value */
  dataMin: number;
  /** Data maximum value */
  dataMax: number;
  /** Available space for the axis (characters) */
  size: number;
  /** Axis orientation */
  orientation: AxisOrientation;
  /** Axis position */
  position: AxisPosition;
  /** Desired number of ticks */
  tickCount?: number;
  /** Whether to show tick marks */
  showTicks?: boolean;
  /** Label format */
  format?: "number" | "percent" | "compact" | "currency";
  /** Decimal places for labels */
  decimals?: number;
  /** Axis title */
  label?: string;
  /** Force minimum value */
  forceMin?: number;
  /** Force maximum value */
  forceMax?: number;
  /** Include zero in range */
  includeZero?: boolean;
}

/**
 * A single tick mark on an axis.
 */
export interface AxisTick {
  /** Tick value */
  value: number;
  /** Formatted label string */
  label: string;
  /** Position along axis (0 to size) */
  position: number;
}

/**
 * Computed axis layout.
 */
export interface AxisLayout {
  /** Axis orientation */
  orientation: AxisOrientation;
  /** Axis position */
  position: AxisPosition;
  /** Nice scale information */
  scale: NiceTicksResult;
  /** Computed tick marks */
  ticks: AxisTick[];
  /** Maximum label width (for alignment) */
  maxLabelWidth: number;
  /** Axis title */
  title?: string | undefined;
  /** Total axis width (including labels and padding) */
  totalWidth: number;
  /** Total axis height (including labels and padding) */
  totalHeight: number;
}

/**
 * Compute the layout for an axis.
 *
 * @param options - Axis configuration
 * @returns Computed axis layout
 */
export function computeAxisLayout(options: AxisLayoutOptions): AxisLayout {
  const {
    dataMin,
    dataMax,
    size,
    orientation,
    position,
    tickCount = 5,
    showTicks = true,
    format = "number",
    decimals,
    label,
    forceMin,
    forceMax,
    includeZero = true,
  } = options;

  // Compute nice tick values
  const scale = computeNiceTicks({
    dataMin,
    dataMax,
    tickCount,
    includeZero,
    forceMin,
    forceMax,
  });

  // Generate tick objects with formatted labels
  const ticks: AxisTick[] = scale.ticks.map((value) => {
    const label = formatTickValue(value, format, decimals);
    // Map value to position along the axis
    const normalizedPosition = (value - scale.min) / (scale.max - scale.min);
    const position =
      orientation === "vertical"
        ? size * (1 - normalizedPosition) // Invert for vertical (0 at bottom)
        : size * normalizedPosition;

    return { value, label, position };
  });

  // Calculate maximum label width
  let maxLabelWidth = 0;
  for (const tick of ticks) {
    const width = getStringWidth(tick.label);
    if (width > maxLabelWidth) {
      maxLabelWidth = width;
    }
  }

  // Calculate total dimensions
  let totalWidth: number;
  let totalHeight: number;

  if (orientation === "vertical") {
    // Vertical axis: width is label width + tick mark + gap
    totalWidth = maxLabelWidth + (showTicks ? 2 : 1);
    totalHeight = size;
  } else {
    // Horizontal axis: height is 1 line + label if present
    totalWidth = size;
    totalHeight = 1 + (label ? 1 : 0);
  }

  return {
    orientation,
    position,
    scale,
    ticks,
    maxLabelWidth,
    title: label,
    totalWidth,
    totalHeight,
  };
}

/**
 * Compute layouts for both axes of a chart.
 */
export interface DualAxisLayoutOptions {
  /** X-axis data min */
  xMin: number;
  /** X-axis data max */
  xMax: number;
  /** Y-axis data min */
  yMin: number;
  /** Y-axis data max */
  yMax: number;
  /** Chart width (characters) */
  chartWidth: number;
  /** Chart height (characters) */
  chartHeight: number;
  /** X-axis configuration */
  xAxis?: Partial<AxisLayoutOptions>;
  /** Y-axis configuration */
  yAxis?: Partial<AxisLayoutOptions>;
}

/**
 * Result of dual axis computation.
 */
export interface DualAxisLayout {
  /** X-axis layout */
  xAxis: AxisLayout;
  /** Y-axis layout */
  yAxis: AxisLayout;
  /** Available chart area width after axis labels */
  chartAreaWidth: number;
  /** Available chart area height after axis labels */
  chartAreaHeight: number;
  /** X offset of chart area */
  chartAreaX: number;
  /** Y offset of chart area */
  chartAreaY: number;
}

/**
 * Compute layouts for both X and Y axes.
 *
 * @param options - Dual axis configuration
 * @returns Both axis layouts and chart area dimensions
 */
export function computeDualAxisLayout(
  options: DualAxisLayoutOptions
): DualAxisLayout {
  const {
    xMin,
    xMax,
    yMin,
    yMax,
    chartWidth,
    chartHeight,
    xAxis: xAxisOpts = {},
    yAxis: yAxisOpts = {},
  } = options;

  // First pass: compute Y-axis to get label width
  const yAxisInitial = computeAxisLayout({
    dataMin: yMin,
    dataMax: yMax,
    size: chartHeight,
    orientation: "vertical",
    position: "left",
    ...yAxisOpts,
  });

  // Calculate available chart area
  const chartAreaX = yAxisInitial.totalWidth;
  const chartAreaY = 0;
  const chartAreaWidth = Math.max(1, chartWidth - yAxisInitial.totalWidth);
  const chartAreaHeight = Math.max(1, chartHeight - 2); // Reserve 2 lines for x-axis

  // Recompute Y-axis with final height
  const yAxis = computeAxisLayout({
    dataMin: yMin,
    dataMax: yMax,
    size: chartAreaHeight,
    orientation: "vertical",
    position: "left",
    ...yAxisOpts,
  });

  // Compute X-axis with final width
  const xAxis = computeAxisLayout({
    dataMin: xMin,
    dataMax: xMax,
    size: chartAreaWidth,
    orientation: "horizontal",
    position: "bottom",
    ...xAxisOpts,
  });

  return {
    xAxis,
    yAxis,
    chartAreaWidth,
    chartAreaHeight,
    chartAreaX,
    chartAreaY,
  };
}
