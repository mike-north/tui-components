import { getStringWidth } from "@tuicomponents/core";
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

/** Minimum bar width when fit mode is enabled */
const MIN_FIT_BAR_WIDTH = 5;

/**
 * Compute the layout for a progress bar.
 *
 * @param input - Validated progress input with defaults applied
 * @param chars - Character set to use
 * @param availableWidth - Available width for fit mode (from context.width)
 * @returns Computed layout ready for rendering
 */
export function computeProgressLayout(
  input: ProgressInputWithDefaults,
  chars: ProgressChars,
  availableWidth?: number
): ProgressLayout {
  // Calculate percentage (clamped to 0-100)
  const rawPercentage = input.max > 0 ? (input.value / input.max) * 100 : 0;
  const percentage = Math.min(100, Math.max(0, rawPercentage));

  // Format percentage and value strings early (needed for fit calculation)
  const percentageStr = `${String(Math.round(percentage))}%`;
  const valueStr = `${String(input.value)}/${String(input.max)}`;

  // Determine actual bar width
  let barWidth: number;

  if (input.fit && availableWidth !== undefined) {
    // Calculate bar width to fit available space
    barWidth = calculateFittedBarWidth(
      input,
      chars,
      availableWidth,
      percentageStr,
      valueStr
    );
  } else {
    // Use explicit width from input
    barWidth = input.width;
  }

  // Calculate filled/empty character counts
  const filledCount = Math.round((percentage / 100) * barWidth);
  const emptyCount = barWidth - filledCount;

  // Get effective characters (allow override)
  const filledChar = input.filledChar ?? chars.filled;
  const emptyChar = input.emptyChar ?? chars.empty;

  // Build bar strings
  const filledBar = filledChar.repeat(filledCount);
  const emptyBar = emptyChar.repeat(emptyCount);

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

/**
 * Calculate the bar width when fit mode is enabled.
 * Format: [label] [leftBracket][bar][rightBracket] [suffix]
 */
function calculateFittedBarWidth(
  input: ProgressInputWithDefaults,
  chars: ProgressChars,
  availableWidth: number,
  percentageStr: string,
  valueStr: string
): number {
  let usedWidth = 0;

  // Label width + space after label
  if (input.label) {
    usedWidth += getStringWidth(input.label) + 1;
  }

  // Bracket widths
  usedWidth += getStringWidth(chars.leftBracket);
  usedWidth += getStringWidth(chars.rightBracket);

  // Suffix width (space before + suffix content)
  const suffixParts: string[] = [];
  if (input.showPercentage) {
    suffixParts.push(percentageStr);
  }
  if (input.showValue) {
    suffixParts.push(valueStr);
  }
  if (suffixParts.length > 0) {
    const suffix = suffixParts.join(" ");
    usedWidth += 1 + getStringWidth(suffix); // space + suffix
  }

  // Calculate remaining width for bar
  const remainingWidth = availableWidth - usedWidth;

  // Enforce minimum bar width
  return Math.max(MIN_FIT_BAR_WIDTH, remainingWidth);
}
