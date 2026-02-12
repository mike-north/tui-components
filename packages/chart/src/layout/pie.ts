/**
 * Layout computation for pie and donut charts.
 *
 * Uses braille characters to draw circular charts with filled wedges.
 */

import { BrailleCanvas, SERIES_STYLES } from "../core/chars.js";
import type { ChartInputWithDefaults } from "../types.js";

/**
 * A single slice in a pie chart.
 */
export interface PieSlice {
  /** Slice label */
  label: string;
  /** Slice value */
  value: number;
  /** Percentage of total (0-100) */
  percentage: number;
  /** Start angle in radians (0 = top, clockwise) */
  startAngle: number;
  /** End angle in radians */
  endAngle: number;
  /** Display character for legend */
  barChar: string;
  /** Whether to use backticks in markdown */
  useBackticks: boolean;
  /** Series index */
  seriesIndex: number;
}

/**
 * Computed layout for a pie or donut chart.
 */
export interface PieChartLayout {
  /** Chart type */
  type: "pie" | "donut";
  /** Slices data */
  slices: PieSlice[];
  /** Total value */
  total: number;
  /** Radius in character cells */
  radius: number;
  /** Center X in character cells */
  centerX: number;
  /** Center Y in character cells */
  centerY: number;
  /** Inner radius (0 for pie, >0 for donut) */
  innerRadius: number;
  /** Center label for donut */
  centerLabel?: string;
  /** Chart width */
  width: number;
  /** Chart height */
  height: number;
  /** Braille canvas rendered characters */
  brailleChars: string[][];
  /** Series indices for each character */
  brailleSeriesIndices: (number | null)[][];
  /** Series styles */
  seriesStyles: readonly { char: string; useBackticks: boolean }[];
}

/**
 * Compute layout for a pie or donut chart.
 */
export function computePieLayout(
  input: ChartInputWithDefaults
): PieChartLayout {
  const type = input.type as "pie" | "donut";
  const series = input.series;

  // Collect all data points as slices
  // For pie charts, we use the first series and each data point becomes a slice
  const slicesData: { label: string; value: number }[] = [];
  for (const s of series) {
    for (const point of s.data) {
      const label = point.label ?? String(point.x);
      // Only accept positive values (filter out zero and negative)
      if (point.y > 0) {
        slicesData.push({ label, value: point.y });
      }
    }
  }

  // Calculate total
  const total = slicesData.reduce((sum, s) => sum + s.value, 0);

  // Handle edge case: no data or zero total
  if (total === 0 || slicesData.length === 0) {
    return {
      type,
      slices: [],
      total: 0,
      radius: 0,
      centerX: Math.floor(input.width / 2),
      centerY: Math.floor(input.height / 2),
      innerRadius: 0,
      ...(input.centerLabel !== undefined && {
        centerLabel: input.centerLabel,
      }),
      width: input.width,
      height: input.height,
      brailleChars: [],
      brailleSeriesIndices: [],
      seriesStyles: SERIES_STYLES,
    };
  }

  // Calculate dimensions
  // Reserve space for legend at bottom
  const chartHeight = input.height - 2;
  const chartWidth = input.width;

  // Radius in character cells
  // Terminal characters have a ~2:1 aspect ratio (taller than wide visually)
  // Braille cells are 2 dots wide x 4 dots tall
  // To make circles appear round, we compute radius in character cells,
  // then scale differently for X and Y when converting to dot coordinates
  const maxRadiusY = Math.floor(chartHeight / 2);
  const maxRadiusX = Math.floor(chartWidth / 2);
  const radius = Math.min(maxRadiusX, maxRadiusY);

  // Center position
  const centerX = Math.floor(chartWidth / 2);
  const centerY = Math.floor(chartHeight / 2);

  // Inner radius for donut (in character cells)
  const innerRadiusRatio = type === "donut" ? input.innerRadius : 0;

  // Build slices with angles
  const slices: PieSlice[] = [];
  let currentAngle = 0; // Start at top (0 radians)

  for (let i = 0; i < slicesData.length; i++) {
    const data = slicesData[i];
    if (!data) continue;
    const percentage = (data.value / total) * 100;
    const arcAngle = (data.value / total) * Math.PI * 2;

    const style = SERIES_STYLES[i % SERIES_STYLES.length];
    if (!style) continue;

    slices.push({
      label: data.label,
      value: data.value,
      percentage,
      startAngle: currentAngle,
      endAngle: currentAngle + arcAngle,
      barChar: style.char,
      useBackticks: style.useBackticks,
      seriesIndex: i,
    });

    currentAngle += arcAngle;
  }

  // Create braille canvas and draw
  const canvas = new BrailleCanvas(chartWidth, chartHeight);

  // Convert character cell coordinates to dot coordinates
  // Each char cell is 2 dots wide x 4 dots tall
  const dotCenterX = centerX * 2;
  const dotCenterY = centerY * 4;
  // Scale radius: in X direction, 1 char = 2 dots; in Y direction, 1 char = 4 dots
  // For a circle that looks round, we need to compensate
  const dotRadiusX = radius * 2;
  const dotRadiusY = radius * 4;
  const dotRadius = Math.min(dotRadiusX, dotRadiusY);
  const _dotInnerRadius = dotRadius * innerRadiusRatio;

  // Draw each slice
  for (const slice of slices) {
    // Use fillWedge with aspect ratio compensation
    // We'll draw with ellipse compensation
    drawEllipticalWedge(
      canvas,
      dotCenterX,
      dotCenterY,
      dotRadiusX,
      dotRadiusY,
      slice.startAngle,
      slice.endAngle,
      slice.seriesIndex,
      dotRadiusX * innerRadiusRatio,
      dotRadiusY * innerRadiusRatio
    );
  }

  // Render canvas
  const rendered = canvas.render();

  return {
    type,
    slices,
    total,
    radius,
    centerX,
    centerY,
    innerRadius: radius * innerRadiusRatio,
    ...(input.centerLabel !== undefined && { centerLabel: input.centerLabel }),
    width: input.width,
    height: input.height,
    brailleChars: rendered.chars,
    brailleSeriesIndices: rendered.seriesIndices,
    seriesStyles: SERIES_STYLES,
  };
}

/**
 * Draw an elliptical wedge to compensate for terminal character aspect ratio.
 *
 * Terminal characters have a ~2:1 aspect ratio (taller than wide). This function
 * draws wedges with separate X and Y radii to produce circles that appear round
 * on screen.
 *
 * @param canvas - Braille canvas to draw on
 * @param centerX - Center X coordinate in dot space
 * @param centerY - Center Y coordinate in dot space
 * @param radiusX - Horizontal radius in dots
 * @param radiusY - Vertical radius in dots
 * @param startAngle - Start angle in radians (0 = top, clockwise)
 * @param endAngle - End angle in radians
 * @param seriesIndex - Series index for coloring
 * @param innerRadiusX - Inner horizontal radius for donut hole
 * @param innerRadiusY - Inner vertical radius for donut hole
 */
function drawEllipticalWedge(
  canvas: BrailleCanvas,
  centerX: number,
  centerY: number,
  radiusX: number,
  radiusY: number,
  startAngle: number,
  endAngle: number,
  seriesIndex: number,
  innerRadiusX: number,
  innerRadiusY: number
): void {
  if (radiusX <= 0 || radiusY <= 0) return;

  const twoPi = Math.PI * 2;
  startAngle = ((startAngle % twoPi) + twoPi) % twoPi;
  endAngle = ((endAngle % twoPi) + twoPi) % twoPi;

  // Calculate arc length for step count
  const arcLength =
    endAngle > startAngle
      ? endAngle - startAngle
      : twoPi - startAngle + endAngle;

  // More steps for larger arcs
  const avgRadius = (radiusX + radiusY) / 2;
  const angleSteps = Math.max(16, Math.ceil(avgRadius * arcLength * 0.4));

  for (let i = 0; i <= angleSteps; i++) {
    const t = i / angleSteps;
    let angle: number;
    if (endAngle > startAngle) {
      angle = startAngle + t * (endAngle - startAngle);
    } else {
      angle = startAngle + t * (twoPi - startAngle + endAngle);
      if (angle >= twoPi) angle -= twoPi;
    }

    // Convert from "0 = top" to standard math coordinates
    const mathAngle = angle - Math.PI / 2;
    const cos = Math.cos(mathAngle);
    const sin = Math.sin(mathAngle);

    // Draw radial line from inner to outer with ellipse scaling
    const maxR = Math.max(radiusX, radiusY);
    const innerR = Math.max(innerRadiusX, innerRadiusY);

    for (let r = Math.ceil(innerR); r <= maxR; r++) {
      // Scale by aspect ratio
      const scaleX = radiusX / maxR;
      const scaleY = radiusY / maxR;
      const x = Math.round(centerX + r * cos * scaleX);
      const y = Math.round(centerY + r * sin * scaleY);
      canvas.setDot(x, y, seriesIndex);
    }
  }
}
