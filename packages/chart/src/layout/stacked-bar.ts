/**
 * Layout computation for stacked bar charts.
 */

import { getStringWidth } from "@tuicomponents/core";
import { computeNiceTicks, formatTickValue, scaleValue } from "../core/scaling.js";
import { getBarChar, SERIES_STYLES } from "../core/chars.js";
import type { ChartInputWithDefaults, BarLayout, StackedBarLayout } from "../types.js";

/**
 * Computed layout for a stacked bar chart.
 */
export interface StackedBarChartLayout {
  /** Chart type */
  type: "bar-stacked" | "bar-stacked-vertical";
  /** Stacked bars by category */
  stacks: StackedBarLayout[];
  /** Series names for legend */
  seriesNames: string[];
  /** Series styles for legend */
  seriesStyles: Array<{ char: string; useBackticks: boolean }>;
  /** Maximum label width */
  maxLabelWidth: number;
  /** Maximum total value width */
  maxValueWidth: number;
  /** Bar area width/height */
  barAreaSize: number;
  /** Y-scale */
  yScale: ReturnType<typeof computeNiceTicks>;
  /** Whether to show values */
  showValues: boolean;
  /** Chart dimensions */
  width: number;
  height: number;
}

/**
 * Compute layout for a stacked bar chart.
 *
 * @param input - Chart input with defaults
 * @returns Computed stacked bar layout
 */
export function computeStackedBarLayout(
  input: ChartInputWithDefaults
): StackedBarChartLayout {
  const isVertical = input.type === "bar-stacked-vertical";
  const series = input.series;

  // Build category -> series -> value map
  const categoryTotals = new Map<string, number>();
  const categoryData = new Map<string, Map<number, number>>();

  for (let seriesIndex = 0; seriesIndex < series.length; seriesIndex++) {
    const s = series[seriesIndex]!;
    for (const point of s.data) {
      const category = String(point.x);
      const value = point.y;

      // Track total per category
      const currentTotal = categoryTotals.get(category) ?? 0;
      categoryTotals.set(category, currentTotal + value);

      // Track per-series values
      let seriesMap = categoryData.get(category);
      if (!seriesMap) {
        seriesMap = new Map();
        categoryData.set(category, seriesMap);
      }
      seriesMap.set(seriesIndex, value);
    }
  }

  const categories = Array.from(categoryTotals.keys());

  // Compute Y-scale from totals
  const maxTotal = Math.max(...categoryTotals.values());
  const yScale = computeNiceTicks({
    dataMin: 0,
    dataMax: maxTotal,
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
    ? input.height - 2
    : input.width - maxLabelWidth - 3;

  // Build stacked bar layouts
  const stacks: StackedBarLayout[] = [];
  let maxValueWidth = 0;

  for (const category of categories) {
    const seriesMap = categoryData.get(category)!;
    const total = categoryTotals.get(category)!;
    const segments: BarLayout[] = [];

    let cumulativeValue = 0;

    for (let seriesIndex = 0; seriesIndex < series.length; seriesIndex++) {
      const value = seriesMap.get(seriesIndex) ?? 0;
      if (value <= 0) continue;

      const styleIndex = seriesIndex % SERIES_STYLES.length;
      const styleInfo = SERIES_STYLES[styleIndex]!;
      const s = series[seriesIndex]!;
      const barChar = s.style ? getBarChar(s.style) : styleInfo.char;
      const useBackticks = s.style ? false : styleInfo.useBackticks;

      // Scale cumulative position
      const startPos = scaleValue(cumulativeValue, yScale.min, yScale.max, barAreaSize);
      cumulativeValue += value;
      const endPos = scaleValue(cumulativeValue, yScale.min, yScale.max, barAreaSize);
      const length = Math.max(1, Math.round(endPos - startPos));

      const format = input.yAxis?.format ?? "number";
      const decimals = input.yAxis?.decimals;
      const formattedValue = formatTickValue(value, format, decimals);

      const valueWidth = getStringWidth(formattedValue);
      if (valueWidth > maxValueWidth) {
        maxValueWidth = valueWidth;
      }

      segments.push({
        seriesIndex,
        pointIndex: categories.indexOf(category),
        label: category,
        value,
        length,
        formattedValue,
        barChar,
        useBackticks,
        percentage: total > 0 ? (value / total) * 100 : 0,
      });
    }

    stacks.push({
      label: category,
      segments,
      total,
    });
  }

  // Build series info for legend
  const seriesNames = series.map((s) => s.name);
  const seriesStyles = series.map((s, i) => {
    const styleIndex = i % SERIES_STYLES.length;
    const styleInfo = SERIES_STYLES[styleIndex]!;
    return {
      char: s.style ? getBarChar(s.style) : styleInfo.char,
      useBackticks: s.style ? false : styleInfo.useBackticks,
    };
  });

  return {
    type: isVertical ? "bar-stacked-vertical" : "bar-stacked",
    stacks,
    seriesNames,
    seriesStyles,
    maxLabelWidth,
    maxValueWidth,
    barAreaSize,
    yScale,
    showValues: input.showValues,
    width: input.width,
    height: input.height,
  };
}
