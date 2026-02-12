/**
 * Layout computation for area and stacked area charts.
 */

import { getStringWidth } from "@tuicomponents/core";
import {
  computeNiceTicks,
  formatTickValue,
  scaleValue,
} from "../core/scaling.js";
import { valueToBlock, SERIES_STYLES } from "../core/chars.js";
import type { ChartInputWithDefaults, LineStyle } from "../types.js";

/**
 * A column in the area chart with stacked values.
 */
export interface AreaColumn {
  /** X position */
  x: number;
  /** Category label */
  label: string;
  /** Cumulative values per series (bottom to top) */
  cumulativeValues: number[];
  /** Normalized cumulative heights (0-1) */
  normalizedHeights: number[];
}

/**
 * A row in the area chart display.
 */
export interface AreaRow {
  /** Y-axis label */
  yLabel?: string | undefined;
  /** Characters for each column */
  chars: string[];
  /** Whether each char uses backticks */
  useBackticks: boolean[];
  /** Fill character for each column */
  fillChars: string[];
}

/**
 * Computed layout for an area chart.
 */
export interface AreaChartLayout {
  /** Chart type */
  type: "area" | "area-stacked";
  /** Line style */
  lineStyle: LineStyle;
  /** X-axis categories */
  categories: string[];
  /** Series names */
  seriesNames: string[];
  /** Series styles */
  seriesStyles: { char: string; useBackticks: boolean }[];
  /** Column data */
  columns: AreaColumn[];
  /** Display rows (top to bottom) */
  rows: AreaRow[];
  /** Y-scale */
  yScale: ReturnType<typeof computeNiceTicks>;
  /** Y-axis label width */
  yAxisWidth: number;
  /** Chart dimensions */
  width: number;
  height: number;
  /** Whether to show values */
  showValues: boolean;
}

/**
 * Compute layout for an area or stacked area chart.
 *
 * @param input - Chart input with defaults
 * @returns Computed area chart layout
 */
export function computeAreaLayout(
  input: ChartInputWithDefaults
): AreaChartLayout {
  const isStacked = input.type === "area-stacked";
  const series = input.series;
  const lineStyle = input.lineStyle;

  // Build category -> series -> value map
  const categoryData = new Map<string, number[]>();
  const categories: string[] = [];

  // First pass: collect categories in order
  for (const s of series) {
    for (const point of s.data) {
      const category = String(point.x);
      if (!categoryData.has(category)) {
        categoryData.set(
          category,
          new Array(series.length).fill(0) as number[]
        );
        categories.push(category);
      }
    }
  }

  // Second pass: fill in values
  for (let seriesIndex = 0; seriesIndex < series.length; seriesIndex++) {
    const s = series[seriesIndex];
    if (!s) continue;
    for (const point of s.data) {
      const category = String(point.x);
      const values = categoryData.get(category);
      if (!values) continue;
      values[seriesIndex] = point.y;
    }
  }

  // Compute cumulative values and find max
  let maxValue = 0;
  const columns: AreaColumn[] = [];

  for (let i = 0; i < categories.length; i++) {
    const category = categories[i];
    if (!category) continue;
    const values = categoryData.get(category);
    if (!values) continue;

    const cumulativeValues: number[] = [];
    let cumulative = 0;

    for (const value of values) {
      if (isStacked) {
        cumulative += value;
        cumulativeValues.push(cumulative);
      } else {
        cumulativeValues.push(value);
        if (value > cumulative) cumulative = value;
      }
    }

    if (cumulative > maxValue) maxValue = cumulative;

    columns.push({
      x: i,
      label: category,
      cumulativeValues,
      normalizedHeights: [], // Fill in after we have scale
    });
  }

  // Compute Y-scale
  const yScale = computeNiceTicks({
    dataMin: 0,
    dataMax: maxValue,
    tickCount: input.yAxis?.tickCount ?? 5,
    includeZero: true,
    forceMin: input.yAxis?.min,
    forceMax: input.yAxis?.max,
  });

  // Calculate normalized heights
  for (const column of columns) {
    column.normalizedHeights = column.cumulativeValues.map((v) =>
      scaleValue(v, yScale.min, yScale.max, 1)
    );
  }

  // Calculate Y-axis label width
  let yAxisWidth = 0;
  const format = input.yAxis?.format ?? "number";
  const decimals = input.yAxis?.decimals;
  for (const tick of yScale.ticks) {
    const label = formatTickValue(tick, format, decimals);
    const width = getStringWidth(label);
    if (width > yAxisWidth) {
      yAxisWidth = width;
    }
  }
  yAxisWidth += 2;

  // Build series style info
  const seriesNames = series.map((s) => s.name);
  const seriesStyles = series.map((_, i) => {
    const styleIndex = i % SERIES_STYLES.length;
    const style = SERIES_STYLES[styleIndex];
    if (!style) throw new Error(`Invalid style index: ${String(styleIndex)}`);
    return style;
  });

  // Determine chart height
  const chartHeight = input.height - 2;

  // Build display rows
  const rows: AreaRow[] = [];

  for (let rowIndex = 0; rowIndex < chartHeight; rowIndex++) {
    const rowBottom = 1 - (rowIndex + 1) / chartHeight;
    const rowTop = 1 - rowIndex / chartHeight;

    // Find Y tick label
    let yLabel: string | undefined;
    for (const tick of yScale.ticks) {
      const tickNormalized = (tick - yScale.min) / (yScale.max - yScale.min);
      if (tickNormalized > rowBottom && tickNormalized <= rowTop) {
        yLabel = formatTickValue(tick, format, decimals);
        break;
      }
    }

    // Build characters for each column
    const chars: string[] = [];
    const useBackticks: boolean[] = [];
    const fillChars: string[] = [];

    for (const column of columns) {
      // Find which series this row belongs to
      let activeSeriesIndex = -1;
      let fillLevel = 0;

      for (
        let seriesIndex = column.normalizedHeights.length - 1;
        seriesIndex >= 0;
        seriesIndex--
      ) {
        const height = column.normalizedHeights[seriesIndex];
        if (height === undefined) continue;
        const prevHeight =
          seriesIndex > 0
            ? (column.normalizedHeights[seriesIndex - 1] ?? 0)
            : 0;

        if (height > rowBottom && prevHeight < rowTop) {
          activeSeriesIndex = seriesIndex;
          // Calculate fill level within the row
          const effectiveTop = Math.min(height, rowTop);
          const effectiveBottom = Math.max(prevHeight, rowBottom);
          fillLevel = (effectiveTop - effectiveBottom) / (rowTop - rowBottom);
          break;
        }
      }

      if (activeSeriesIndex >= 0) {
        const char = valueToBlock(fillLevel);
        const style = seriesStyles[activeSeriesIndex];
        if (!style) {
          chars.push(" ");
          useBackticks.push(false);
          fillChars.push(" ");
        } else {
          chars.push(char);
          useBackticks.push(style.useBackticks);
          fillChars.push(style.char);
        }
      } else {
        chars.push(" ");
        useBackticks.push(false);
        fillChars.push(" ");
      }
    }

    rows.push({
      yLabel,
      chars,
      useBackticks,
      fillChars,
    });
  }

  return {
    type: isStacked ? "area-stacked" : "area",
    lineStyle,
    categories,
    seriesNames,
    seriesStyles,
    columns,
    rows,
    yScale,
    yAxisWidth,
    width: input.width,
    height: input.height,
    showValues: input.showValues,
  };
}
