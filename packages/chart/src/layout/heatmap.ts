/**
 * Layout computation for heatmap charts.
 *
 * Renders a 2D grid with intensity shading based on values.
 */

import { getStringWidth } from "@tuicomponents/core";
import { valueToHeatmapChar } from "../core/chars.js";
import type { ChartInputWithDefaults, HeatmapStyle } from "../types.js";

/**
 * A single cell in the heatmap.
 */
export interface HeatmapCell {
  /** Row index */
  row: number;
  /** Column index */
  col: number;
  /** Raw value */
  value: number;
  /** Normalized value (0-1) */
  normalizedValue: number;
  /** Display character */
  displayChar: string;
}

/**
 * Computed layout for a heatmap chart.
 */
export interface HeatmapChartLayout {
  /** Chart type */
  type: "heatmap";
  /** Heatmap rendering style */
  heatmapStyle: HeatmapStyle;
  /** Row labels */
  rowLabels: string[];
  /** Column labels */
  colLabels: string[];
  /** Cell data grid (rows x cols) */
  cells: HeatmapCell[][];
  /** Value range */
  valueRange: { min: number; max: number };
  /** Width of each cell in characters */
  cellWidth: number;
  /** Width of row labels */
  rowLabelWidth: number;
  /** Total width */
  width: number;
  /** Total height */
  height: number;
}

/**
 * Compute layout for a heatmap chart.
 */
export function computeHeatmapLayout(input: ChartInputWithDefaults): HeatmapChartLayout {
  const series = input.series;
  const heatmapStyle = input.heatmapStyle;

  // Extract row/col labels and values from data
  const rowLabelSet = new Set<string>();
  const colLabelSet = new Set<string>();
  const valueMap = new Map<string, number>(); // "row:col" -> value

  for (const s of series) {
    for (const point of s.data) {
      // For heatmap, we interpret data as:
      // - x: column label
      // - y: value
      // - label: row label (if provided), otherwise series name
      const colLabel = String(point.x);
      const rowLabel = point.label ?? s.name;
      const value = point.y;

      rowLabelSet.add(rowLabel);
      colLabelSet.add(colLabel);
      valueMap.set(`${rowLabel}:${colLabel}`, value);
    }
  }

  const rowLabels = Array.from(rowLabelSet);
  const colLabels = Array.from(colLabelSet);

  // Calculate value range
  const values = Array.from(valueMap.values());
  const minValue = values.length > 0 ? Math.min(...values) : 0;
  const maxValue = values.length > 0 ? Math.max(...values) : 1;
  const valueRange = { min: minValue, max: maxValue };

  // Calculate label widths
  let rowLabelWidth = 0;
  for (const label of rowLabels) {
    const width = getStringWidth(label);
    if (width > rowLabelWidth) {
      rowLabelWidth = width;
    }
  }
  rowLabelWidth += 2; // Padding

  // Calculate cell width
  // For numeric mode, cells need to show values
  let cellWidth: number;
  if (heatmapStyle === "numeric") {
    // Calculate based on max value width
    const maxValueWidth = Math.max(
      getStringWidth(formatValue(minValue)),
      getStringWidth(formatValue(maxValue))
    );
    cellWidth = Math.max(3, maxValueWidth + 1);
  } else {
    // For blocks/ascii, use 2-char cells for visibility
    cellWidth = 2;
  }

  // Build cell grid
  const cells: HeatmapCell[][] = [];

  for (let rowIdx = 0; rowIdx < rowLabels.length; rowIdx++) {
    const rowLabel = rowLabels[rowIdx];
    if (!rowLabel) continue;
    const rowCells: HeatmapCell[] = [];

    for (let colIdx = 0; colIdx < colLabels.length; colIdx++) {
      const colLabel = colLabels[colIdx];
      if (!colLabel) continue;
      const key = `${rowLabel}:${colLabel}`;
      const value = valueMap.get(key) ?? 0;

      // Normalize value
      const range = maxValue - minValue;
      const normalizedValue = range > 0 ? (value - minValue) / range : 0.5;

      // Get display character
      let displayChar: string;
      if (heatmapStyle === "numeric") {
        displayChar = formatValue(value);
      } else {
        const baseChar = valueToHeatmapChar(
          normalizedValue,
          heatmapStyle === "blocks" ? "blocks" : "ascii"
        );
        displayChar = baseChar.repeat(cellWidth);
      }

      rowCells.push({
        row: rowIdx,
        col: colIdx,
        value,
        normalizedValue,
        displayChar,
      });
    }

    cells.push(rowCells);
  }

  return {
    type: "heatmap",
    heatmapStyle,
    rowLabels,
    colLabels,
    cells,
    valueRange,
    cellWidth,
    rowLabelWidth,
    width: input.width,
    height: input.height,
  };
}

/**
 * Format a numeric value for display.
 */
function formatValue(value: number): string {
  if (Number.isInteger(value)) {
    return String(value);
  }
  if (Math.abs(value) >= 100) {
    return value.toFixed(0);
  }
  if (Math.abs(value) >= 10) {
    return value.toFixed(1);
  }
  return value.toFixed(2);
}
