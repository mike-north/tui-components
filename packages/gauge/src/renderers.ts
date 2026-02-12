import {
  type TuiTheme,
  anchorLine,
  DEFAULT_ANCHOR,
} from "@tuicomponents/core";
import type { GaugeLayout, GaugeSegment } from "./layout.js";
import type { GaugeInputWithDefaults, GaugeZoneColor } from "./schema.js";

/**
 * Get the theme color function for a zone color.
 */
function getZoneColorFunction(
  color: GaugeZoneColor | undefined,
  theme: TuiTheme
): ((text: string) => string) | undefined {
  if (!color) {
    return undefined;
  }

  switch (color) {
    case "success":
      return theme.semantic.success;
    case "warning":
      return theme.semantic.warning;
    case "error":
      return theme.semantic.error;
  }
}

/**
 * Render a segment in ANSI mode.
 */
function renderSegmentAnsi(
  segment: GaugeSegment,
  layout: GaugeLayout,
  theme?: TuiTheme
): string {
  const char = segment.filled ? layout.filledChar : layout.emptyChar;
  const segmentStr = char.repeat(segment.length);

  if (!theme) {
    return segmentStr;
  }

  if (!segment.filled) {
    // Empty segments use secondary color
    return theme.semantic.secondary(segmentStr);
  }

  // Filled segments use zone color or primary
  const colorFn = getZoneColorFunction(segment.color, theme);
  if (colorFn) {
    return colorFn(segmentStr);
  }

  return theme.semantic.primary(segmentStr);
}

/**
 * Render a gauge using ANSI escape codes for rich terminal output.
 *
 * @param layout - Pre-computed gauge layout
 * @param input - Original input with defaults
 * @param theme - Optional theme for colors
 * @returns ANSI-formatted gauge string
 */
export function renderGaugeAnsi(
  layout: GaugeLayout,
  input: GaugeInputWithDefaults,
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

  // Render each segment
  for (const segment of layout.segments) {
    parts.push(renderSegmentAnsi(segment, layout, theme));
  }

  // Add value if enabled
  if (input.showValue) {
    const coloredValue = theme
      ? theme.semantic.secondary(layout.valueStr)
      : layout.valueStr;
    parts.push(" ");
    parts.push(coloredValue);
  }

  return parts.join("");
}

/**
 * Check if a segment should be emphasized with backticks in markdown.
 */
function segmentNeedsEmphasis(segment: GaugeSegment): boolean {
  return segment.filled && !!segment.color && segment.color !== "success";
}

/**
 * Render a gauge using markdown-friendly output.
 *
 * Consolidates adjacent emphasized segments to avoid double-backtick issues
 * (e.g., `warning``error` renders incorrectly as two adjacent inline code spans).
 *
 * @param layout - Pre-computed gauge layout
 * @param input - Original input with defaults
 * @returns Markdown-friendly gauge string
 */
export function renderGaugeMarkdown(
  layout: GaugeLayout,
  input: GaugeInputWithDefaults
): string {
  const parts: string[] = [];

  // Add label if present
  if (layout.label) {
    parts.push(layout.label);
    parts.push(" ");
  }

  // Group consecutive segments by whether they need emphasis
  let i = 0;
  while (i < layout.segments.length) {
    const segment = layout.segments[i];
    if (!segment) {
      i++;
      continue;
    }
    const needsEmphasis = segmentNeedsEmphasis(segment);
    const char = segment.filled ? layout.filledChar : layout.emptyChar;

    if (needsEmphasis) {
      // Collect all consecutive emphasized segments
      let combinedStr = char.repeat(segment.length);
      let j = i + 1;
      while (j < layout.segments.length) {
        const nextSegment = layout.segments[j];
        if (!nextSegment) break;
        if (!segmentNeedsEmphasis(nextSegment)) {
          break;
        }
        const nextChar = nextSegment.filled
          ? layout.filledChar
          : layout.emptyChar;
        combinedStr += nextChar.repeat(nextSegment.length);
        j++;
      }
      // Wrap the entire combined string in backticks
      parts.push(`\`${combinedStr}\``);
      i = j;
    } else {
      // Non-emphasized segment - render as-is
      parts.push(char.repeat(segment.length));
      i++;
    }
  }

  // Add value if enabled
  if (input.showValue) {
    parts.push(" ");
    parts.push(layout.valueStr);
  }

  return anchorLine(parts.join(""), DEFAULT_ANCHOR);
}
