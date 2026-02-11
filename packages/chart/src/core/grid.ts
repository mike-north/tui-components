/**
 * Grid line computation for chart backgrounds.
 */

import type { AxisLayout } from "./axis.js";

/**
 * Configuration for grid computation.
 */
export interface GridOptions {
  /** Chart area width */
  width: number;
  /** Chart area height */
  height: number;
  /** X-axis layout (for vertical grid lines) */
  xAxis?: AxisLayout;
  /** Y-axis layout (for horizontal grid lines) */
  yAxis?: AxisLayout;
  /** Show horizontal grid lines */
  showHorizontal?: boolean;
  /** Show vertical grid lines */
  showVertical?: boolean;
  /** Grid character */
  char?: string;
}

/**
 * A single grid line.
 */
export interface GridLine {
  /** Line orientation */
  orientation: "horizontal" | "vertical";
  /** Position along perpendicular axis */
  position: number;
  /** Start position */
  start: number;
  /** End position */
  end: number;
}

/**
 * Computed grid layout.
 */
export interface GridLayout {
  /** Horizontal grid lines */
  horizontalLines: GridLine[];
  /** Vertical grid lines */
  verticalLines: GridLine[];
  /** Grid character */
  char: string;
}

/**
 * Default grid character (center dot).
 */
export const DEFAULT_GRID_CHAR = "·";

/**
 * Compute grid lines for a chart.
 *
 * @param options - Grid configuration
 * @returns Computed grid layout
 */
export function computeGridLayout(options: GridOptions): GridLayout {
  const {
    width,
    height,
    xAxis,
    yAxis,
    showHorizontal = true,
    showVertical = false,
    char = DEFAULT_GRID_CHAR,
  } = options;

  const horizontalLines: GridLine[] = [];
  const verticalLines: GridLine[] = [];

  // Generate horizontal lines from Y-axis ticks
  if (showHorizontal && yAxis) {
    for (const tick of yAxis.ticks) {
      // Skip first and last ticks (at boundaries)
      if (tick.position === 0 || tick.position === height) continue;

      horizontalLines.push({
        orientation: "horizontal",
        position: Math.round(tick.position),
        start: 0,
        end: width,
      });
    }
  }

  // Generate vertical lines from X-axis ticks
  if (showVertical && xAxis) {
    for (const tick of xAxis.ticks) {
      // Skip first and last ticks (at boundaries)
      if (tick.position === 0 || tick.position === width) continue;

      verticalLines.push({
        orientation: "vertical",
        position: Math.round(tick.position),
        start: 0,
        end: height,
      });
    }
  }

  return {
    horizontalLines,
    verticalLines,
    char,
  };
}

/**
 * Create a 2D character grid with grid lines.
 *
 * @param width - Grid width
 * @param height - Grid height
 * @param grid - Grid layout
 * @returns 2D array of characters
 */
export function createGridBuffer(
  width: number,
  height: number,
  grid: GridLayout
): string[][] {
  // Initialize with spaces
  const buffer: string[][] = [];
  for (let y = 0; y < height; y++) {
    const row: string[] = [];
    for (let x = 0; x < width; x++) {
      row.push(" ");
    }
    buffer.push(row);
  }

  // Draw horizontal grid lines
  for (const line of grid.horizontalLines) {
    const y = line.position;
    if (y >= 0 && y < height) {
      for (let x = line.start; x < line.end && x < width; x++) {
        buffer[y]![x] = grid.char;
      }
    }
  }

  // Draw vertical grid lines (overwrites horizontal at intersections)
  for (const line of grid.verticalLines) {
    const x = line.position;
    if (x >= 0 && x < width) {
      for (let y = line.start; y < line.end && y < height; y++) {
        buffer[y]![x] = grid.char;
      }
    }
  }

  return buffer;
}
