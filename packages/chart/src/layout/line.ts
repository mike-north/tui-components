/**
 * Layout computation for line charts.
 *
 * Supports multiple rendering styles:
 * - "blocks": Simple line-drawing characters (●, ╱, ╲, ─)
 * - "braille": High-resolution braille dot patterns
 * - "dots": Point markers only
 */

import { getStringWidth } from "@tuicomponents/core";
import {
  computeNiceTicks,
  formatTickValue,
  scaleValue,
} from "../core/scaling.js";
import { BrailleCanvas, SERIES_STYLES } from "../core/chars.js";
import type {
  ChartInputWithDefaults,
  LineStyle,
  ValueFormat,
} from "../types.js";

/**
 * A single point in the line chart.
 */
export interface LinePoint {
  /** X position (column index) */
  x: number;
  /** Y value (data value) */
  value: number;
  /** Normalized Y (0-1) */
  normalizedY: number;
  /** Series index */
  seriesIndex: number;
}

/**
 * A row in the line chart display.
 */
export interface LineRow {
  /** Y-axis label for this row */
  yLabel?: string | undefined;
  /** Y-axis value at this row */
  yValue: number;
  /** Characters for each column */
  chars: string[];
  /** Whether each char uses backticks (for multi-series distinction) */
  useBackticks: boolean[];
  /** Series index for each column (for ANSI coloring) */
  seriesIndices: (number | null)[];
}

/**
 * Computed layout for a line chart.
 */
export interface LineChartLayout {
  /** Chart type */
  type: "line";
  /** Line style */
  lineStyle: LineStyle;
  /** X-axis categories */
  categories: string[];
  /** Series names */
  seriesNames: string[];
  /** Points per series */
  points: LinePoint[][];
  /** Display rows (top to bottom) */
  rows: LineRow[];
  /** Y-scale */
  yScale: ReturnType<typeof computeNiceTicks>;
  /** X-axis label width */
  maxXLabelWidth: number;
  /** Y-axis label width */
  yAxisWidth: number;
  /** Chart dimensions */
  width: number;
  height: number;
  /** Whether to show values */
  showValues: boolean;
}

/**
 * Line drawing characters for connecting points.
 */
const LINE_DRAW = {
  horizontal: "─",
  point: "●",
  rise: "╱",
  fall: "╲",
} as const;

/**
 * Compute layout for a line chart.
 */
export function computeLineLayout(
  input: ChartInputWithDefaults
): LineChartLayout {
  const series = input.series;
  const lineStyle = input.lineStyle;

  // Extract all values and categories
  const allValues: number[] = [];
  const categorySet = new Set<string>();

  for (const s of series) {
    for (const point of s.data) {
      allValues.push(point.y);
      categorySet.add(String(point.x));
    }
  }

  const categories = Array.from(categorySet);
  const seriesNames = series.map((s) => s.name);

  // Compute Y-scale
  const dataMin = Math.min(...allValues);
  const dataMax = Math.max(...allValues);
  const yScale = computeNiceTicks({
    dataMin,
    dataMax,
    tickCount: input.yAxis?.tickCount ?? 5,
    includeZero: input.yAxis?.min === undefined,
    forceMin: input.yAxis?.min,
    forceMax: input.yAxis?.max,
  });

  // Calculate axis widths
  let maxXLabelWidth = 0;
  for (const category of categories) {
    const width = getStringWidth(category);
    if (width > maxXLabelWidth) {
      maxXLabelWidth = width;
    }
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

  const chartHeight = input.height - 2;

  // Choose layout based on line style
  if (lineStyle === "braille") {
    return computeBrailleLayout(
      input,
      categories,
      seriesNames,
      series,
      yScale,
      yAxisWidth,
      chartHeight,
      format,
      decimals
    );
  } else {
    return computeBlocksLayout(
      input,
      categories,
      seriesNames,
      series,
      yScale,
      yAxisWidth,
      chartHeight,
      format,
      decimals,
      lineStyle
    );
  }
}

/**
 * Compute layout using simple line-drawing characters.
 */
function computeBlocksLayout(
  input: ChartInputWithDefaults,
  categories: string[],
  seriesNames: string[],
  series: ChartInputWithDefaults["series"],
  yScale: ReturnType<typeof computeNiceTicks>,
  yAxisWidth: number,
  chartHeight: number,
  format: ValueFormat,
  decimals: number | undefined,
  lineStyle: LineStyle
): LineChartLayout {
  // Two columns per category to allow for connecting lines
  const chartWidth = categories.length * 2 - 1;

  // Build points array
  const points: LinePoint[][] = [];

  for (let seriesIndex = 0; seriesIndex < series.length; seriesIndex++) {
    const s = series[seriesIndex];
    if (!s) continue;
    const seriesPoints: LinePoint[] = [];

    for (const point of s.data) {
      const categoryIndex = categories.indexOf(String(point.x));
      const colPos = categoryIndex * 2;
      const normalizedY = scaleValue(point.y, yScale.min, yScale.max, 1);
      const clampedY = Math.max(0, Math.min(1, normalizedY));

      seriesPoints.push({
        x: colPos,
        value: point.y,
        normalizedY: clampedY,
        seriesIndex,
      });
    }

    seriesPoints.sort((a, b) => a.x - b.x);
    points.push(seriesPoints);
  }

  // Build character grid
  const grid: string[][] = [];
  const seriesGrid: (number | null)[][] = [];

  for (let row = 0; row < chartHeight; row++) {
    grid.push(Array(chartWidth).fill(" ") as string[]);
    seriesGrid.push(Array(chartWidth).fill(null) as (number | null)[]);
  }

  // Draw lines between consecutive points for each series
  for (let seriesIndex = 0; seriesIndex < points.length; seriesIndex++) {
    const seriesPoints = points[seriesIndex];
    if (!seriesPoints) continue;

    for (let i = 0; i < seriesPoints.length; i++) {
      const p = seriesPoints[i];
      if (!p) continue;
      const row = Math.floor((1 - p.normalizedY) * (chartHeight - 0.001));
      const col = p.x;

      if (row >= 0 && row < chartHeight && col >= 0 && col < chartWidth) {
        const gridRow = grid[row];
        const seriesGridRow = seriesGrid[row];
        if (!gridRow || !seriesGridRow) continue;

        // Draw point marker (unless dots-only mode)
        gridRow[col] = lineStyle === "dots" ? "●" : LINE_DRAW.point;
        seriesGridRow[col] = seriesIndex;

        // Draw connecting line to next point (skip for dots mode)
        if (lineStyle !== "dots" && i < seriesPoints.length - 1) {
          const nextP = seriesPoints[i + 1];
          if (!nextP) continue;
          const nextRow = Math.floor(
            (1 - nextP.normalizedY) * (chartHeight - 0.001)
          );
          const nextCol = nextP.x;

          if (nextCol > col + 1) {
            const rowDiff = nextRow - row;
            const colDiff = nextCol - col;

            for (let c = col + 1; c < nextCol; c++) {
              const t = (c - col) / colDiff;
              const interpRow = Math.round(row + rowDiff * t);

              const interpGridRow = grid[interpRow];
              const interpSeriesGridRow = seriesGrid[interpRow];
              if (
                interpRow >= 0 &&
                interpRow < chartHeight &&
                interpGridRow?.[c] === " "
              ) {
                if (rowDiff < 0) {
                  interpGridRow[c] = LINE_DRAW.rise;
                } else if (rowDiff > 0) {
                  interpGridRow[c] = LINE_DRAW.fall;
                } else {
                  interpGridRow[c] = LINE_DRAW.horizontal;
                }
                if (interpSeriesGridRow) {
                  interpSeriesGridRow[c] = seriesIndex;
                }
              }
            }
          }
        }
      }
    }
  }

  // Build display rows with Y-axis labels
  const rows: LineRow[] = [];

  for (let rowIndex = 0; rowIndex < chartHeight; rowIndex++) {
    const rowBottom = 1 - (rowIndex + 1) / chartHeight;
    const rowTop = 1 - rowIndex / chartHeight;

    let yLabel: string | undefined;
    let yValue = yScale.min + rowTop * (yScale.max - yScale.min);

    for (const tick of yScale.ticks) {
      const tickNormalized = (tick - yScale.min) / (yScale.max - yScale.min);
      if (tickNormalized > rowBottom && tickNormalized <= rowTop) {
        yLabel = formatTickValue(tick, format, decimals);
        yValue = tick;
        break;
      }
    }

    const chars = grid[rowIndex];
    const seriesIndices = seriesGrid[rowIndex];
    if (!chars || !seriesIndices) continue;

    const useBackticks = seriesIndices.map((idx) => {
      if (idx === null) return false;
      const styleIndex = idx % SERIES_STYLES.length;
      return SERIES_STYLES[styleIndex]?.useBackticks ?? false;
    });

    rows.push({ yLabel, yValue, chars, useBackticks, seriesIndices });
  }

  return {
    type: "line",
    lineStyle: input.lineStyle,
    categories,
    seriesNames,
    points,
    rows,
    yScale,
    maxXLabelWidth: Math.max(...categories.map((c) => getStringWidth(c))),
    yAxisWidth,
    width: input.width,
    height: input.height,
    showValues: input.showValues,
  };
}

/**
 * Compute layout using braille characters for high-resolution lines.
 */
function computeBrailleLayout(
  input: ChartInputWithDefaults,
  categories: string[],
  seriesNames: string[],
  series: ChartInputWithDefaults["series"],
  yScale: ReturnType<typeof computeNiceTicks>,
  yAxisWidth: number,
  chartHeight: number,
  format: ValueFormat,
  decimals: number | undefined
): LineChartLayout {
  // For braille, we want more horizontal resolution
  // Each braille char is 2 dots wide, so use more chars per category
  const charsPerCategory = 3;
  const chartWidth = categories.length * charsPerCategory;

  // Build points array with braille coordinates
  const points: LinePoint[][] = [];

  for (let seriesIndex = 0; seriesIndex < series.length; seriesIndex++) {
    const s = series[seriesIndex];
    if (!s) continue;
    const seriesPoints: LinePoint[] = [];

    for (const point of s.data) {
      const categoryIndex = categories.indexOf(String(point.x));
      // Center point within category area
      const colPos =
        categoryIndex * charsPerCategory + Math.floor(charsPerCategory / 2);
      const normalizedY = scaleValue(point.y, yScale.min, yScale.max, 1);
      const clampedY = Math.max(0, Math.min(1, normalizedY));

      seriesPoints.push({
        x: colPos,
        value: point.y,
        normalizedY: clampedY,
        seriesIndex,
      });
    }

    seriesPoints.sort((a, b) => a.x - b.x);
    points.push(seriesPoints);
  }

  // Create braille canvas
  const canvas = new BrailleCanvas(chartWidth, chartHeight);

  // Draw lines for each series
  for (let seriesIndex = 0; seriesIndex < points.length; seriesIndex++) {
    const seriesPoints = points[seriesIndex];
    if (!seriesPoints) continue;

    for (let i = 0; i < seriesPoints.length; i++) {
      const p = seriesPoints[i];
      if (!p) continue;

      // Convert to dot coordinates
      // X: center of the character cell (each char is 2 dots wide)
      const dotX = p.x * 2 + 1;
      // Y: invert because dot Y=0 is top, normalizedY=1 is top
      const dotY = Math.round((1 - p.normalizedY) * (chartHeight * 4 - 1));

      // Draw line to next point
      if (i < seriesPoints.length - 1) {
        const nextP = seriesPoints[i + 1];
        if (nextP) {
          const nextDotX = nextP.x * 2 + 1;
          const nextDotY = Math.round(
            (1 - nextP.normalizedY) * (chartHeight * 4 - 1)
          );
          canvas.drawLine(dotX, dotY, nextDotX, nextDotY, seriesIndex);
        }
      }

      // Draw point marker
      canvas.drawPoint(dotX, dotY, seriesIndex);
    }
  }

  // Render canvas to characters
  const rendered = canvas.render();

  // Build display rows with Y-axis labels
  const rows: LineRow[] = [];

  for (let rowIndex = 0; rowIndex < chartHeight; rowIndex++) {
    const rowBottom = 1 - (rowIndex + 1) / chartHeight;
    const rowTop = 1 - rowIndex / chartHeight;

    let yLabel: string | undefined;
    let yValue = yScale.min + rowTop * (yScale.max - yScale.min);

    for (const tick of yScale.ticks) {
      const tickNormalized = (tick - yScale.min) / (yScale.max - yScale.min);
      if (tickNormalized > rowBottom && tickNormalized <= rowTop) {
        yLabel = formatTickValue(tick, format, decimals);
        yValue = tick;
        break;
      }
    }

    const chars = rendered.chars[rowIndex] ?? [];
    const seriesIndices = rendered.seriesIndices[rowIndex] ?? [];

    const useBackticks = seriesIndices.map((idx) => {
      if (idx === null) return false;
      const styleIndex = idx % SERIES_STYLES.length;
      return SERIES_STYLES[styleIndex]?.useBackticks ?? false;
    });

    rows.push({ yLabel, yValue, chars, useBackticks, seriesIndices });
  }

  return {
    type: "line",
    lineStyle: input.lineStyle,
    categories,
    seriesNames,
    points,
    rows,
    yScale,
    maxXLabelWidth: Math.max(...categories.map((c) => getStringWidth(c))),
    yAxisWidth,
    width: input.width,
    height: input.height,
    showValues: input.showValues,
  };
}
