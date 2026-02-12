/**
 * Auto-scaling and nice number algorithms for axis ticks.
 *
 * Implements the standard D3.js-style nice interval algorithm
 * for producing human-readable axis tick values.
 */

/**
 * Standard nice intervals for axis ticks.
 * These produce round, readable numbers.
 */
const NICE_INTERVALS = [1, 2, 2.5, 5, 10] as const;

/**
 * Configuration for nice number computation.
 */
export interface NiceTicksOptions {
  /** Minimum data value */
  dataMin: number;
  /** Maximum data value */
  dataMax: number;
  /** Desired number of ticks (default: 5) */
  tickCount?: number | undefined;
  /** Whether to include zero if data is all positive (default: true) */
  includeZero?: boolean | undefined;
  /** Explicit minimum (overrides computed) */
  forceMin?: number | undefined;
  /** Explicit maximum (overrides computed) */
  forceMax?: number | undefined;
}

/**
 * Result from nice tick computation.
 */
export interface NiceTicksResult {
  /** Computed nice minimum */
  min: number;
  /** Computed nice maximum */
  max: number;
  /** Tick step size */
  step: number;
  /** Array of tick values */
  ticks: number[];
}

/**
 * Find the nearest nice interval for a raw step value.
 *
 * @param rawStep - Raw step value
 * @returns Nice step value
 */
function findNiceStep(rawStep: number): number {
  if (rawStep === 0) return 1;

  const magnitude = Math.pow(10, Math.floor(Math.log10(Math.abs(rawStep))));
  const normalized = rawStep / magnitude;

  // Find nearest nice interval
  for (const interval of NICE_INTERVALS) {
    if (interval >= normalized) {
      return interval * magnitude;
    }
  }

  // Fallback to 10 * magnitude
  return 10 * magnitude;
}

/**
 * Round a number down to the nearest multiple of step.
 */
function floorToStep(value: number, step: number): number {
  return Math.floor(value / step) * step;
}

/**
 * Round a number up to the nearest multiple of step.
 */
function ceilToStep(value: number, step: number): number {
  return Math.ceil(value / step) * step;
}

/**
 * Compute nice axis ticks for a data range.
 *
 * This implements the standard algorithm for producing readable tick values:
 * 1. Compute raw step from range and desired tick count
 * 2. Round step to a nice interval (1, 2, 2.5, 5, 10 × 10^n)
 * 3. Round min/max to nice boundaries
 * 4. Generate evenly spaced tick values
 *
 * @param options - Configuration options
 * @returns Computed ticks with nice min/max/step
 *
 * @example
 * ```ts
 * computeNiceTicks({ dataMin: 3, dataMax: 97 })
 * // Returns { min: 0, max: 100, step: 20, ticks: [0, 20, 40, 60, 80, 100] }
 *
 * computeNiceTicks({ dataMin: 0.003, dataMax: 0.097, tickCount: 4 })
 * // Returns { min: 0, max: 0.1, step: 0.025, ticks: [0, 0.025, 0.05, 0.075, 0.1] }
 * ```
 */
export function computeNiceTicks(options: NiceTicksOptions): NiceTicksResult {
  const {
    dataMin,
    dataMax,
    tickCount = 5,
    includeZero = true,
    forceMin,
    forceMax,
  } = options;

  // Handle edge cases
  if (dataMin === dataMax) {
    // Single value - create a range around it
    const center = dataMin;
    const half = center === 0 ? 5 : Math.abs(center) * 0.5;
    const ticks = [center - half, center, center + half];
    return {
      min: ticks[0] ?? center - half,
      max: ticks[2] ?? center + half,
      step: half,
      ticks,
    };
  }

  // Adjust range to include zero if requested
  let effectiveMin = dataMin;
  let effectiveMax = dataMax;

  if (includeZero) {
    if (effectiveMin > 0) effectiveMin = 0;
    if (effectiveMax < 0) effectiveMax = 0;
  }

  // Apply force overrides
  if (forceMin !== undefined) effectiveMin = forceMin;
  if (forceMax !== undefined) effectiveMax = forceMax;

  // Compute nice step
  const range = effectiveMax - effectiveMin;
  const rawStep = range / Math.max(1, tickCount - 1);
  const niceStep = findNiceStep(rawStep);

  // Round boundaries to nice values
  let niceMin = forceMin ?? floorToStep(effectiveMin, niceStep);
  let niceMax = forceMax ?? ceilToStep(effectiveMax, niceStep);

  // Ensure min/max actually encompass the data
  if (niceMin > dataMin) niceMin -= niceStep;
  if (niceMax < dataMax) niceMax += niceStep;

  // Generate tick values
  const ticks: number[] = [];
  // Use a small epsilon to handle floating point errors
  const epsilon = niceStep * 1e-10;

  for (let value = niceMin; value <= niceMax + epsilon; value += niceStep) {
    // Round to avoid floating point artifacts
    const roundedValue = Math.round(value * 1e12) / 1e12;
    ticks.push(roundedValue);
  }

  return {
    min: niceMin,
    max: niceMax,
    step: niceStep,
    ticks,
  };
}

/**
 * Format a tick value for display.
 *
 * @param value - Numeric value
 * @param format - Format type
 * @param decimals - Number of decimal places
 * @returns Formatted string
 */
export function formatTickValue(
  value: number,
  format: "number" | "percent" | "compact" | "currency" = "number",
  decimals?: number
): string {
  switch (format) {
    case "percent":
      return `${(value * 100).toFixed(decimals ?? 0)}%`;

    case "compact": {
      const abs = Math.abs(value);
      if (abs >= 1_000_000_000) {
        return `${(value / 1_000_000_000).toFixed(decimals ?? 1)}B`;
      }
      if (abs >= 1_000_000) {
        return `${(value / 1_000_000).toFixed(decimals ?? 1)}M`;
      }
      if (abs >= 1_000) {
        return `${(value / 1_000).toFixed(decimals ?? 1)}K`;
      }
      return value.toFixed(decimals ?? 0);
    }

    case "currency":
      return `$${value.toLocaleString("en-US", {
        minimumFractionDigits: decimals ?? 0,
        maximumFractionDigits: decimals ?? 0,
      })}`;

    case "number":
    default:
      if (decimals !== undefined) {
        return value.toFixed(decimals);
      }
      // Auto-detect appropriate precision
      if (Number.isInteger(value)) {
        return value.toLocaleString("en-US");
      }
      return value.toLocaleString("en-US", {
        minimumFractionDigits: 0,
        maximumFractionDigits: 2,
      });
  }
}

/**
 * Compute the scale factor to map a value to a pixel position.
 *
 * @param value - Data value
 * @param min - Scale minimum
 * @param max - Scale maximum
 * @param size - Available size (pixels/characters)
 * @returns Position in range [0, size]
 */
export function scaleValue(
  value: number,
  min: number,
  max: number,
  size: number
): number {
  if (max === min) return size / 2;
  return ((value - min) / (max - min)) * size;
}

/**
 * Inverse of scaleValue - map a position back to data value.
 *
 * @param position - Position in range [0, size]
 * @param min - Scale minimum
 * @param max - Scale maximum
 * @param size - Available size (pixels/characters)
 * @returns Data value
 */
export function unscaleValue(
  position: number,
  min: number,
  max: number,
  size: number
): number {
  if (size === 0) return min;
  return min + (position / size) * (max - min);
}
