import { type TuiTheme, anchorLine, DEFAULT_ANCHOR } from "@tuicomponents/core";
import type { ProgressLayout } from "./layout.js";
import type { ProgressInputWithDefaults } from "./schema.js";

/**
 * Render a progress bar using ANSI escape codes for rich terminal output.
 *
 * @param layout - Pre-computed progress layout
 * @param input - Original input with defaults
 * @param theme - Optional theme for colors
 * @returns ANSI-formatted progress bar string
 */
export function renderProgressAnsi(
  layout: ProgressLayout,
  input: ProgressInputWithDefaults,
  theme?: TuiTheme
): string {
  const parts: string[] = [];

  // Add label if present
  if (layout.label) {
    const coloredLabel = theme
      ? theme.semantic.header(layout.label)
      : layout.label;
    parts.push(coloredLabel);
    parts.push(" ");
  }

  // Add left bracket
  if (layout.leftBracket) {
    const coloredBracket = theme
      ? theme.semantic.border(layout.leftBracket)
      : layout.leftBracket;
    parts.push(coloredBracket);
  }

  // Add bar
  const coloredFilled = theme
    ? theme.semantic.primary(layout.filledBar)
    : layout.filledBar;
  const coloredEmpty = theme
    ? theme.semantic.secondary(layout.emptyBar)
    : layout.emptyBar;
  parts.push(coloredFilled);
  parts.push(coloredEmpty);

  // Add right bracket
  if (layout.rightBracket) {
    const coloredBracket = theme
      ? theme.semantic.border(layout.rightBracket)
      : layout.rightBracket;
    parts.push(coloredBracket);
  }

  // Add percentage and/or value
  const suffix = buildSuffix(layout, input, theme);
  if (suffix) {
    parts.push(" ");
    parts.push(suffix);
  }

  return parts.join("");
}

/**
 * Render a progress bar using markdown-friendly output.
 *
 * @param layout - Pre-computed progress layout
 * @param input - Original input with defaults
 * @returns Markdown-friendly progress bar string
 */
export function renderProgressMarkdown(
  layout: ProgressLayout,
  input: ProgressInputWithDefaults
): string {
  const parts: string[] = [];

  // Add label if present
  if (layout.label) {
    parts.push(layout.label);
    parts.push(" ");
  }

  // Add left bracket
  if (layout.leftBracket) {
    parts.push(layout.leftBracket);
  }

  // Add bar
  parts.push(layout.filledBar);
  parts.push(layout.emptyBar);

  // Add right bracket
  if (layout.rightBracket) {
    parts.push(layout.rightBracket);
  }

  // Add percentage and/or value
  const suffix = buildSuffix(layout, input);
  if (suffix) {
    parts.push(" ");
    parts.push(suffix);
  }

  return anchorLine(parts.join(""), DEFAULT_ANCHOR);
}

/**
 * Build the suffix string (percentage and/or value).
 */
function buildSuffix(
  layout: ProgressLayout,
  input: ProgressInputWithDefaults,
  theme?: TuiTheme
): string {
  const suffixParts: string[] = [];

  if (input.showPercentage) {
    suffixParts.push(layout.percentageStr);
  }

  if (input.showValue) {
    suffixParts.push(layout.valueStr);
  }

  if (suffixParts.length === 0) {
    return "";
  }

  const suffix = suffixParts.join(" ");
  return theme ? theme.semantic.secondary(suffix) : suffix;
}
