/**
 * Layout computation for scatter plots.
 *
 * Supports multiple rendering styles:
 * - "dots": Simple character markers (●, ■, ▲, ◆, +)
 * - "braille": High-resolution braille dot patterns
 */

import { getStringWidth } from "@tuicomponents/core";
import { computeNiceTicks, formatTickValue, scaleValue } from "../core/scaling.js";
import { BrailleCanvas, SCATTER_MARKER_SEQUENCE, SERIES_STYLES } from "../core/chars.js";
import type { ChartInputWithDefaults, ScatterStyle, ValueFormat } from "../types.js";
import type { NiceTicksResult } from "../core/scaling.js";

/**
 * A single point in the scatter plot.
 */
export interface ScatterPoint {
  /** Original X data value */
  dataX: number;
  /** Original Y data value */
  dataY: number;
  /** Character column position */
  charX: number;
  /** Character row position */
  charY: number;
  /** Series index for coloring/marker */
  seriesIndex: number;
}

/**
 * Computed layout for a scatter chart.
 */
export interface ScatterChartLayout {
  /** Chart type */
  type: "scatter";
  /** Scatter rendering style */
  scatterStyle: ScatterStyle;
  /** Series names */
  seriesNames: string[];
  /** All points across series */
  points: ScatterPoint[];
  /** X-axis scale */
  xScale: NiceTicksResult;
  /** Y-axis scale */
  yScale: NiceTicksResult;
  /** Y-axis label width */
  yAxisWidth: number;
  /** Chart area width (excluding Y-axis) */
  chartWidth: number;
  /** Chart area height (excluding X-axis) */
  chartHeight: number;
  /** Total width */
  width: number;
  /** Total height */
  height: number;
  /** Character grid for dots mode */
  grid?: string[][];
  /** Series indices for each grid cell */
  seriesIndices?: (number | null)[][];
  /** Braille canvas render result (for braille mode) */
  brailleChars?: string[][];
  /** Braille series indices */
  brailleSeriesIndices?: (number | null)[][];
}

/**
 * Compute layout for a scatter plot.
 */
export function computeScatterLayout(input: ChartInputWithDefaults): ScatterChartLayout {
  const series = input.series;
  const scatterStyle = input.scatterStyle;

  // Extract all X and Y values
  const allXValues: number[] = [];
  const allYValues: number[] = [];

  for (const s of series) {
    for (const point of s.data) {
      const xVal = typeof point.x === "number" ? point.x : parseFloat(String(point.x));
      if (!isNaN(xVal)) {
        allXValues.push(xVal);
      }
      allYValues.push(point.y);
    }
  }

  if (allXValues.length === 0 || allYValues.length === 0) {
    return {
      type: "scatter",
      scatterStyle,
      seriesNames: series.map((s) => s.name),
      points: [],
      xScale: { min: 0, max: 100, step: 20, ticks: [0, 20, 40, 60, 80, 100] },
      yScale: { min: 0, max: 100, step: 20, ticks: [0, 20, 40, 60, 80, 100] },
      yAxisWidth: 6,
      chartWidth: input.width - 6,
      chartHeight: input.height - 2,
      width: input.width,
      height: input.height,
    };
  }

  const seriesNames = series.map((s) => s.name);

  // Compute scales
  const xDataMin = Math.min(...allXValues);
  const xDataMax = Math.max(...allXValues);
  const yDataMin = Math.min(...allYValues);
  const yDataMax = Math.max(...allYValues);

  const xScale = computeNiceTicks({
    dataMin: xDataMin,
    dataMax: xDataMax,
    tickCount: input.xAxis?.tickCount ?? 5,
    includeZero: input.xAxis?.min === undefined,
    forceMin: input.xAxis?.min,
    forceMax: input.xAxis?.max,
  });

  const yScale = computeNiceTicks({
    dataMin: yDataMin,
    dataMax: yDataMax,
    tickCount: input.yAxis?.tickCount ?? 5,
    includeZero: input.yAxis?.min === undefined,
    forceMin: input.yAxis?.min,
    forceMax: input.yAxis?.max,
  });

  // Calculate axis label widths
  const yFormat = input.yAxis?.format ?? "number";
  const yDecimals = input.yAxis?.decimals;
  let yAxisWidth = 0;
  for (const tick of yScale.ticks) {
    const label = formatTickValue(tick, yFormat, yDecimals);
    const width = getStringWidth(label);
    if (width > yAxisWidth) {
      yAxisWidth = width;
    }
  }
  yAxisWidth += 2; // Padding

  // Chart dimensions
  const chartHeight = input.height - 2; // Reserve for X-axis
  const chartWidth = input.width - yAxisWidth - 1; // Reserve for Y-axis

  // Build points array
  const points: ScatterPoint[] = [];

  for (let seriesIndex = 0; seriesIndex < series.length; seriesIndex++) {
    const s = series[seriesIndex]!;

    for (const point of s.data) {
      const xVal = typeof point.x === "number" ? point.x : parseFloat(String(point.x));
      if (isNaN(xVal)) continue;

      const normalizedX = scaleValue(xVal, xScale.min, xScale.max, 1);
      const normalizedY = scaleValue(point.y, yScale.min, yScale.max, 1);

      const charX = Math.round(Math.max(0, Math.min(1, normalizedX)) * (chartWidth - 1));
      const charY = Math.round((1 - Math.max(0, Math.min(1, normalizedY))) * (chartHeight - 1));

      points.push({
        dataX: xVal,
        dataY: point.y,
        charX,
        charY,
        seriesIndex,
      });
    }
  }

  // Build grid based on style
  if (scatterStyle === "braille") {
    return computeBrailleScatterLayout(
      input,
      seriesNames,
      points,
      xScale,
      yScale,
      yAxisWidth,
      chartWidth,
      chartHeight
    );
  } else {
    return computeDotsScatterLayout(
      input,
      seriesNames,
      points,
      xScale,
      yScale,
      yAxisWidth,
      chartWidth,
      chartHeight
    );
  }
}

/**
 * Compute scatter layout using simple character markers.
 */
function computeDotsScatterLayout(
  input: ChartInputWithDefaults,
  seriesNames: string[],
  points: ScatterPoint[],
  xScale: NiceTicksResult,
  yScale: NiceTicksResult,
  yAxisWidth: number,
  chartWidth: number,
  chartHeight: number
): ScatterChartLayout {
  // Create character grid
  const grid: string[][] = [];
  const seriesIndices: (number | null)[][] = [];

  for (let row = 0; row < chartHeight; row++) {
    grid.push(Array(chartWidth).fill(" "));
    seriesIndices.push(Array(chartWidth).fill(null));
  }

  // Plot points
  for (const point of points) {
    if (
      point.charY >= 0 &&
      point.charY < chartHeight &&
      point.charX >= 0 &&
      point.charX < chartWidth
    ) {
      // Use different markers for different series
      const marker =
        SCATTER_MARKER_SEQUENCE[point.seriesIndex % SCATTER_MARKER_SEQUENCE.length]!;
      grid[point.charY]![point.charX] = marker;
      seriesIndices[point.charY]![point.charX] = point.seriesIndex;
    }
  }

  return {
    type: "scatter",
    scatterStyle: "dots",
    seriesNames,
    points,
    xScale,
    yScale,
    yAxisWidth,
    chartWidth,
    chartHeight,
    width: input.width,
    height: input.height,
    grid,
    seriesIndices,
  };
}

/**
 * Compute scatter layout using braille characters.
 */
function computeBrailleScatterLayout(
  input: ChartInputWithDefaults,
  seriesNames: string[],
  points: ScatterPoint[],
  xScale: NiceTicksResult,
  yScale: NiceTicksResult,
  yAxisWidth: number,
  chartWidth: number,
  chartHeight: number
): ScatterChartLayout {
  // Create braille canvas
  const canvas = new BrailleCanvas(chartWidth, chartHeight);

  // Plot points in braille
  for (const point of points) {
    // Convert to dot coordinates (2x width, 4x height)
    const dotX = Math.round(
      scaleValue(point.dataX, xScale.min, xScale.max, chartWidth * 2 - 1)
    );
    const dotY = Math.round(
      (1 - scaleValue(point.dataY, yScale.min, yScale.max, 1)) * (chartHeight * 4 - 1)
    );

    // Draw a small marker
    canvas.drawPoint(dotX, dotY, point.seriesIndex);
  }

  // Render canvas
  const rendered = canvas.render();

  return {
    type: "scatter",
    scatterStyle: "braille",
    seriesNames,
    points,
    xScale,
    yScale,
    yAxisWidth,
    chartWidth,
    chartHeight,
    width: input.width,
    height: input.height,
    brailleChars: rendered.chars,
    brailleSeriesIndices: rendered.seriesIndices,
  };
}
