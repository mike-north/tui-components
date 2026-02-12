import type { ProgressInputWithDefaults } from "./schema.js";
import type { ProgressChars } from "./chars.js";

/**
 * Pre-computed layout for the progress bar.
 */
export interface ProgressLayout {
  /** Label to display (empty string if none) */
  label: string;
  /** Filled portion of the bar */
  filledBar: string;
  /** Empty portion of the bar */
  emptyBar: string;
  /** Left bracket (empty for non-bracket styles) */
  leftBracket: string;
  /** Right bracket (empty for non-bracket styles) */
  rightBracket: string;
  /** Percentage (0-100) */
  percentage: number;
  /** Formatted percentage string (e.g., "50%") */
  percentageStr: string;
  /** Formatted value string (e.g., "12/25") */
  valueStr: string;
  /** Number of filled characters */
  filledCount: number;
  /** Number of empty characters */
  emptyCount: number;
  /** Total width of the bar portion */
  barWidth: number;
}

/**
 * Compute the layout for a progress bar.
 *
 * @param input - Validated progress input with defaults applied
 * @param chars - Character set to use
 * @returns Computed layout ready for rendering
 */
export function computeProgressLayout(
  input: ProgressInputWithDefaults,
  chars: ProgressChars
): ProgressLayout {
  // Calculate percentage (clamped to 0-100)
  const rawPercentage = input.max > 0 ? (input.value / input.max) * 100 : 0;
  const percentage = Math.min(100, Math.max(0, rawPercentage));

  // Determine actual bar width (accounting for brackets if present)
  const barWidth = input.width;

  // Calculate filled/empty character counts
  const filledCount = Math.round((percentage / 100) * barWidth);
  const emptyCount = barWidth - filledCount;

  // Get effective characters (allow override)
  const filledChar = input.filledChar ?? chars.filled;
  const emptyChar = input.emptyChar ?? chars.empty;

  // Build bar strings
  const filledBar = filledChar.repeat(filledCount);
  const emptyBar = emptyChar.repeat(emptyCount);

  // Format percentage
  const percentageStr = `${String(Math.round(percentage))}%`;

  // Format value
  const valueStr = `${String(input.value)}/${String(input.max)}`;

  return {
    label: input.label ?? "",
    filledBar,
    emptyBar,
    leftBracket: chars.leftBracket,
    rightBracket: chars.rightBracket,
    percentage,
    percentageStr,
    valueStr,
    filledCount,
    emptyCount,
    barWidth,
  };
}
