/**
 * Layout computation for horizontal and vertical bar charts.
 */

import { getStringWidth } from "@tuicomponents/core";
import {
  computeNiceTicks,
  formatTickValue,
  scaleValue,
} from "../core/scaling.js";
import { getBarChar, SERIES_STYLES } from "../core/chars.js";
import type { ChartInputWithDefaults, BarLayout } from "../types.js";
import type { AxisLayout } from "../core/axis.js";

/**
 * Computed layout for a bar chart.
 */
export interface BarChartLayout {
  /** Chart type */
  type: "bar" | "bar-vertical";
  /** Individual bar layouts */
  bars: BarLayout[];
  /** Categories (x-axis labels) */
  categories: string[];
  /** Maximum label width */
  maxLabelWidth: number;
  /** Maximum value width */
  maxValueWidth: number;
  /** Bar area width (for horizontal) or height (for vertical) */
  barAreaSize: number;
  /** Y-axis scale info */
  yScale: ReturnType<typeof computeNiceTicks>;
  /** Y-axis layout */
  yAxis?: AxisLayout;
  /** Whether to show values */
  showValues: boolean;
  /** Chart dimensions */
  width: number;
  height: number;
}

/**
 * Compute layout for a horizontal or vertical bar chart.
 *
 * @param input - Chart input with defaults
 * @returns Computed bar chart layout
 */
export function computeBarLayout(
  input: ChartInputWithDefaults
): BarChartLayout {
  const isVertical = input.type === "bar-vertical";
  const series = input.series;

  // Extract all data points and categories
  const allValues: number[] = [];
  const categorySet = new Set<string>();

  for (const s of series) {
    for (const point of s.data) {
      allValues.push(point.y);
      categorySet.add(String(point.x));
    }
  }

  const categories = Array.from(categorySet);

  // Compute Y-scale from data
  const dataMin = Math.min(0, ...allValues);
  const dataMax = Math.max(...allValues);
  const yScale = computeNiceTicks({
    dataMin,
    dataMax,
    tickCount: input.yAxis?.tickCount ?? 5,
    includeZero: true,
    forceMin: input.yAxis?.min,
    forceMax: input.yAxis?.max,
  });

  // Calculate label widths
  let maxLabelWidth = 0;
  for (const category of categories) {
    const width = getStringWidth(category);
    if (width > maxLabelWidth) {
      maxLabelWidth = width;
    }
  }

  // Determine bar area size
  const barAreaSize = isVertical
    ? input.height - 2 // Reserve for x-axis
    : input.width - maxLabelWidth - 3; // Reserve for labels and spacing

  // Compute individual bar layouts
  const bars: BarLayout[] = [];
  const formattedValues: string[] = [];

  for (let seriesIndex = 0; seriesIndex < series.length; seriesIndex++) {
    const s = series[seriesIndex];
    if (!s) continue;
    const styleIndex = seriesIndex % SERIES_STYLES.length;
    const styleInfo = SERIES_STYLES[styleIndex];
    if (!styleInfo) continue;
    const barChar = s.style ? getBarChar(s.style) : styleInfo.char;
    const useBackticks = s.style ? false : styleInfo.useBackticks;

    for (let pointIndex = 0; pointIndex < s.data.length; pointIndex++) {
      const point = s.data[pointIndex];
      if (!point) continue;
      const value = point.y;
      const label = point.label ?? String(point.x);

      // Scale value to bar length
      const normalizedValue = scaleValue(
        value,
        yScale.min,
        yScale.max,
        barAreaSize
      );
      const length = Math.max(0, Math.round(normalizedValue));

      // Format value
      const format = input.yAxis?.format ?? "number";
      const decimals = input.yAxis?.decimals;
      const formattedValue = formatTickValue(value, format, decimals);
      formattedValues.push(formattedValue);

      // Calculate percentage
      const percentage =
        yScale.max !== yScale.min
          ? ((value - yScale.min) / (yScale.max - yScale.min)) * 100
          : 0;

      bars.push({
        seriesIndex,
        pointIndex,
        label,
        value,
        length,
        formattedValue,
        barChar,
        useBackticks,
        percentage,
      });
    }
  }

  // Calculate max value width
  let maxValueWidth = 0;
  for (const formatted of formattedValues) {
    const width = getStringWidth(formatted);
    if (width > maxValueWidth) {
      maxValueWidth = width;
    }
  }

  return {
    type: isVertical ? "bar-vertical" : "bar",
    bars,
    categories,
    maxLabelWidth,
    maxValueWidth,
    barAreaSize,
    yScale,
    showValues: input.showValues,
    width: input.width,
    height: input.height,
  };
}

/**
 * Group bars by category for multi-series charts.
 *
 * @param layout - Bar chart layout
 * @returns Map of category to bars
 */
export function groupBarsByCategory(
  layout: BarChartLayout
): Map<string, BarLayout[]> {
  const groups = new Map<string, BarLayout[]>();

  for (const bar of layout.bars) {
    const existing = groups.get(bar.label);
    if (existing) {
      existing.push(bar);
    } else {
      groups.set(bar.label, [bar]);
    }
  }

  return groups;
}
