/**
 * Box-drawing and block characters for chart rendering.
 */

/**
 * Axis line characters using Unicode box-drawing.
 */
export const AXIS_CHARS = {
  /** Y-axis line (│) */
  vertical: "│",
  /** X-axis line (─) */
  horizontal: "─",
  /** Origin corner (└) */
  origin: "└",
  /** Y-axis tick (├) - points right */
  yTick: "├",
  /** X-axis tick (┬) - points up */
  xTick: "┬",
  /** Grid intersection (┼) */
  cross: "┼",
  /** Y-axis with grid (┤) - points left */
  yTickLeft: "┤",
  /** X-axis tick (┴) - points down */
  xTickDown: "┴",
} as const;

/**
 * Height blocks for line/area charts.
 * 8 levels of vertical fill from 1/8 to full.
 */
export const HEIGHT_BLOCKS = [
  "▁", // 1/8
  "▂", // 2/8
  "▃", // 3/8
  "▄", // 4/8
  "▅", // 5/8
  "▆", // 6/8
  "▇", // 7/8
  "█", // 8/8 (full)
] as const;

/**
 * Bar fill characters for different visual styles.
 */
export const BAR_CHARS = {
  /** Solid block █ */
  block: "█",
  /** Dark shade ▓ */
  shaded: "▓",
  /** Light shade ░ */
  light: "░",
  /** Hash # */
  hash: "#",
  /** Equals = */
  equals: "=",
  /** Arrow > */
  arrow: ">",
} as const;

/**
 * Braille base character for high-resolution rendering.
 * Unicode U+2800 (blank braille pattern).
 */
export const BRAILLE_BASE = 0x2800;

/**
 * Dot positions in a braille cell (standard Unicode layout):
 * ```
 *   1 4
 *   2 5
 *   3 6
 *   7 8
 * ```
 * Each dot adds 2^(position-1) to the base.
 */
export const BRAILLE_DOTS = {
  topLeft: 1,
  upperLeft: 2,
  lowerLeft: 3,
  bottomLeft: 7,
  topRight: 4,
  upperRight: 5,
  lowerRight: 6,
  bottomRight: 8,
} as const;

/**
 * Convert a value (0-1) to a height block character.
 *
 * @param normalized - Value between 0 and 1
 * @returns Appropriate height block character
 */
export function valueToBlock(normalized: number): string {
  if (normalized <= 0) return " ";
  const index = Math.min(7, Math.floor(normalized * 8));
  return HEIGHT_BLOCKS[index] ?? "█";
}

/**
 * Get the bar fill character for a given style.
 *
 * @param style - Bar style name
 * @returns Corresponding fill character
 */
export function getBarChar(
  style: "block" | "shaded" | "light" | "hash" | "equals" | "arrow"
): string {
  return BAR_CHARS[style];
}

/**
 * Convert an array of dot positions to a braille character.
 *
 * @param dots - Array of dot positions (1-8)
 * @returns Unicode braille character
 */
export function toBrailleChar(dots: number[]): string {
  let pattern = 0;
  for (const dot of dots) {
    if (dot >= 1 && dot <= 8) {
      pattern |= 1 << (dot - 1);
    }
  }
  return String.fromCharCode(BRAILLE_BASE + pattern);
}

/**
 * Series visual distinction styles.
 * Uses combination of fill characters and markdown highlighting.
 */
export const SERIES_STYLES = [
  { char: "█", useBackticks: false }, // Solid, plain
  { char: "█", useBackticks: true }, // Solid, highlighted
  { char: "▓", useBackticks: false }, // Shaded, plain
  { char: "░", useBackticks: true }, // Light, highlighted
] as const;

/**
 * Scatter plot marker characters for multi-series distinction.
 */
export const SCATTER_MARKERS = {
  circle: "●",
  square: "■",
  triangle: "▲",
  diamond: "◆",
  plus: "+",
} as const;

/**
 * Array of scatter markers for series rotation.
 */
export const SCATTER_MARKER_SEQUENCE = ["●", "■", "▲", "◆", "+"] as const;

/**
 * Heatmap intensity characters (low to high).
 * 5 levels from empty to full.
 */
export const HEATMAP_BLOCKS = [" ", "░", "▒", "▓", "█"] as const;

/**
 * ASCII-safe heatmap characters (low to high).
 * 5 levels for markdown-friendly output.
 */
export const HEATMAP_ASCII = [" ", ".", ":", "*", "#"] as const;

/**
 * Convert a normalized value (0-1) to a heatmap character.
 *
 * @param normalized - Value between 0 and 1
 * @param style - "blocks" for Unicode blocks, "ascii" for ASCII chars
 * @returns Appropriate intensity character
 */
export function valueToHeatmapChar(
  normalized: number,
  style: "blocks" | "ascii"
): string {
  const chars = style === "blocks" ? HEATMAP_BLOCKS : HEATMAP_ASCII;
  if (normalized <= 0) return chars[0];
  if (normalized >= 1) return chars[chars.length - 1] ?? " ";
  const index = Math.min(
    chars.length - 1,
    Math.floor(normalized * chars.length)
  );
  return chars[index] ?? " ";
}

/**
 * Line-drawing characters for connecting points.
 */
export const LINE_CHARS = {
  /** Point marker */
  point: "●",
  /** Horizontal line */
  horizontal: "─",
  /** Vertical line */
  vertical: "│",
  /** Rising diagonal (approximation) */
  rising: "╱",
  /** Falling diagonal (approximation) */
  falling: "╲",
} as const;

/**
 * Braille dot grid for a single character cell.
 * Layout (x, y where y=0 is top):
 *   (0,0) (1,0)  -> dots 1, 4
 *   (0,1) (1,1)  -> dots 2, 5
 *   (0,2) (1,2)  -> dots 3, 6
 *   (0,3) (1,3)  -> dots 7, 8
 */
const BRAILLE_DOT_MAP: Record<string, number> = {
  "0,0": 1,
  "0,1": 2,
  "0,2": 3,
  "0,3": 7,
  "1,0": 4,
  "1,1": 5,
  "1,2": 6,
  "1,3": 8,
};

/**
 * A braille canvas for drawing high-resolution graphics.
 * Each character cell contains a 2x4 grid of dots.
 */
export class BrailleCanvas {
  /** Width in character cells */
  readonly width: number;
  /** Height in character cells */
  readonly height: number;
  /** Dot grid (width*2 x height*4) */
  private dots: boolean[][];
  /** Series index for each dot (for coloring) */
  private seriesIndices: (number | null)[][];

  constructor(width: number, height: number) {
    this.width = width;
    this.height = height;
    // Initialize dot grid (2 dots per char width, 4 dots per char height)
    const dotWidth = width * 2;
    const dotHeight = height * 4;
    this.dots = Array.from({ length: dotHeight }, () =>
      Array.from({ length: dotWidth }, () => false)
    );
    this.seriesIndices = Array.from({ length: dotHeight }, () =>
      Array.from({ length: dotWidth }, () => null)
    );
  }

  /**
   * Set a dot at the given dot coordinates.
   */
  setDot(dotX: number, dotY: number, seriesIndex = 0): void {
    if (
      dotX >= 0 &&
      dotX < this.width * 2 &&
      dotY >= 0 &&
      dotY < this.height * 4
    ) {
      const dotRow = this.dots[dotY];
      const seriesRow = this.seriesIndices[dotY];
      if (dotRow && seriesRow) {
        dotRow[dotX] = true;
        seriesRow[dotX] = seriesIndex;
      }
    }
  }

  /**
   * Draw a line between two points using Bresenham's algorithm.
   * Coordinates are in dot space (width*2 x height*4).
   */
  drawLine(
    x0: number,
    y0: number,
    x1: number,
    y1: number,
    seriesIndex = 0
  ): void {
    const dx = Math.abs(x1 - x0);
    const dy = Math.abs(y1 - y0);
    const sx = x0 < x1 ? 1 : -1;
    const sy = y0 < y1 ? 1 : -1;
    let err = dx - dy;

    let x = x0;
    let y = y0;

    // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition -- Bresenham's algorithm loop
    while (true) {
      this.setDot(x, y, seriesIndex);

      if (x === x1 && y === y1) break;

      const e2 = 2 * err;
      if (e2 > -dy) {
        err -= dy;
        x += sx;
      }
      if (e2 < dx) {
        err += dx;
        y += sy;
      }
    }
  }

  /**
   * Draw a point marker (fills more dots for visibility).
   */
  drawPoint(dotX: number, dotY: number, seriesIndex = 0): void {
    // Draw a small cluster of dots for the point marker
    for (let dy = -1; dy <= 1; dy++) {
      for (let dx = -1; dx <= 1; dx++) {
        this.setDot(dotX + dx, dotY + dy, seriesIndex);
      }
    }
  }

  /**
   * Draw a circle outline using the midpoint circle algorithm.
   * Coordinates are in dot space (width*2 x height*4).
   *
   * @param centerX - Center X in dot coordinates
   * @param centerY - Center Y in dot coordinates
   * @param radius - Radius in dot units
   * @param seriesIndex - Series index for coloring
   */
  drawCircle(
    centerX: number,
    centerY: number,
    radius: number,
    seriesIndex = 0
  ): void {
    if (radius <= 0) return;

    // Midpoint circle algorithm
    let x = radius;
    let y = 0;
    let err = 1 - radius;

    while (x >= y) {
      // Draw all 8 octants
      this.setDot(centerX + x, centerY + y, seriesIndex);
      this.setDot(centerX - x, centerY + y, seriesIndex);
      this.setDot(centerX + x, centerY - y, seriesIndex);
      this.setDot(centerX - x, centerY - y, seriesIndex);
      this.setDot(centerX + y, centerY + x, seriesIndex);
      this.setDot(centerX - y, centerY + x, seriesIndex);
      this.setDot(centerX + y, centerY - x, seriesIndex);
      this.setDot(centerX - y, centerY - x, seriesIndex);

      y++;
      if (err < 0) {
        err += 2 * y + 1;
      } else {
        x--;
        err += 2 * (y - x) + 1;
      }
    }
  }

  /**
   * Draw an arc (portion of a circle).
   * Angles are in radians, 0 = top (12 o'clock), increasing clockwise.
   *
   * @param centerX - Center X in dot coordinates
   * @param centerY - Center Y in dot coordinates
   * @param radius - Radius in dot units
   * @param startAngle - Start angle in radians (0 = top)
   * @param endAngle - End angle in radians
   * @param seriesIndex - Series index for coloring
   */
  drawArc(
    centerX: number,
    centerY: number,
    radius: number,
    startAngle: number,
    endAngle: number,
    seriesIndex = 0
  ): void {
    if (radius <= 0) return;

    // Normalize angles to 0-2π
    const twoPi = Math.PI * 2;
    startAngle = ((startAngle % twoPi) + twoPi) % twoPi;
    endAngle = ((endAngle % twoPi) + twoPi) % twoPi;

    // Calculate number of steps based on arc length
    const arcLength =
      endAngle > startAngle
        ? endAngle - startAngle
        : twoPi - startAngle + endAngle;
    const steps = Math.max(8, Math.ceil(radius * arcLength * 0.5));

    for (let i = 0; i <= steps; i++) {
      const t = i / steps;
      let angle: number;
      if (endAngle > startAngle) {
        angle = startAngle + t * (endAngle - startAngle);
      } else {
        angle = startAngle + t * (twoPi - startAngle + endAngle);
        if (angle >= twoPi) angle -= twoPi;
      }
      // Convert from "0 = top" to standard math coordinates
      // Math: 0 = right, π/2 = top; Our: 0 = top, π/2 = right
      const mathAngle = angle - Math.PI / 2;
      const x = Math.round(centerX + radius * Math.cos(mathAngle));
      const y = Math.round(centerY + radius * Math.sin(mathAngle));
      this.setDot(x, y, seriesIndex);
    }
  }

  /**
   * Fill a wedge (pie slice) from center to edge.
   * Angles are in radians, 0 = top (12 o'clock), increasing clockwise.
   *
   * @param centerX - Center X in dot coordinates
   * @param centerY - Center Y in dot coordinates
   * @param radius - Outer radius in dot units
   * @param startAngle - Start angle in radians (0 = top)
   * @param endAngle - End angle in radians
   * @param seriesIndex - Series index for coloring
   * @param innerRadius - Inner radius for donut (0 for pie)
   */
  fillWedge(
    centerX: number,
    centerY: number,
    radius: number,
    startAngle: number,
    endAngle: number,
    seriesIndex = 0,
    innerRadius = 0
  ): void {
    if (radius <= 0) return;

    // Normalize angles to 0-2π
    const twoPi = Math.PI * 2;
    startAngle = ((startAngle % twoPi) + twoPi) % twoPi;
    endAngle = ((endAngle % twoPi) + twoPi) % twoPi;

    // Use radial filling - draw lines from center to edge
    const arcLength =
      endAngle > startAngle
        ? endAngle - startAngle
        : twoPi - startAngle + endAngle;

    // More angular steps for larger arcs
    const angleSteps = Math.max(8, Math.ceil(radius * arcLength * 0.3));

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

      // Draw radial line from inner to outer radius
      const startR = Math.ceil(innerRadius);
      for (let r = startR; r <= radius; r++) {
        const x = Math.round(centerX + r * cos);
        const y = Math.round(centerY + r * sin);
        this.setDot(x, y, seriesIndex);
      }
    }
  }

  /**
   * Get the braille character at the given character cell.
   */
  getChar(charX: number, charY: number): string {
    const dots: number[] = [];
    const dotBaseX = charX * 2;
    const dotBaseY = charY * 4;

    for (let dy = 0; dy < 4; dy++) {
      for (let dx = 0; dx < 2; dx++) {
        const dotX = dotBaseX + dx;
        const dotY = dotBaseY + dy;
        const dotRow = this.dots[dotY];
        if (
          dotY >= 0 &&
          dotY < this.height * 4 &&
          dotX >= 0 &&
          dotX < this.width * 2 &&
          dotRow?.[dotX]
        ) {
          const dotNum = BRAILLE_DOT_MAP[`${String(dx)},${String(dy)}`];
          if (dotNum) {
            dots.push(dotNum);
          }
        }
      }
    }

    if (dots.length === 0) {
      return " ";
    }

    return toBrailleChar(dots);
  }

  /**
   * Get the dominant series index for a character cell.
   */
  getSeriesIndex(charX: number, charY: number): number | null {
    const counts = new Map<number, number>();
    const dotBaseX = charX * 2;
    const dotBaseY = charY * 4;

    for (let dy = 0; dy < 4; dy++) {
      for (let dx = 0; dx < 2; dx++) {
        const dotX = dotBaseX + dx;
        const dotY = dotBaseY + dy;
        if (
          dotY >= 0 &&
          dotY < this.height * 4 &&
          dotX >= 0 &&
          dotX < this.width * 2
        ) {
          const seriesRow = this.seriesIndices[dotY];
          const idx = seriesRow?.[dotX];
          if (idx !== null && idx !== undefined) {
            counts.set(idx, (counts.get(idx) ?? 0) + 1);
          }
        }
      }
    }

    let maxCount = 0;
    let maxIndex: number | null = null;
    for (const [idx, count] of counts) {
      if (count > maxCount) {
        maxCount = count;
        maxIndex = idx;
      }
    }

    return maxIndex;
  }

  /**
   * Render the entire canvas to a 2D array of characters.
   */
  render(): { chars: string[][]; seriesIndices: (number | null)[][] } {
    const chars: string[][] = [];
    const indices: (number | null)[][] = [];

    for (let y = 0; y < this.height; y++) {
      const row: string[] = [];
      const indexRow: (number | null)[] = [];
      for (let x = 0; x < this.width; x++) {
        row.push(this.getChar(x, y));
        indexRow.push(this.getSeriesIndex(x, y));
      }
      chars.push(row);
      indices.push(indexRow);
    }

    return { chars, seriesIndices: indices };
  }
}
