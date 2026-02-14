import {
  type TuiTheme,
  padToWidth,
  anchorLine,
  DEFAULT_ANCHOR,
  getStringWidth,
} from "@tuicomponents/core";
import type { CalloutLayout } from "./layout.js";
import type { CalloutInputWithDefaults, CalloutType } from "./schema.js";
import type { BorderChars } from "./chars.js";

/** Padding inside the callout (left and right) */
const PADDING = 1;

/**
 * Apply border color based on callout type.
 */
function colorBorder(
  text: string,
  type: CalloutType,
  theme: TuiTheme | undefined
): string {
  if (!theme) {
    return text;
  }

  switch (type) {
    case "error":
      return theme.semantic.error(text);
    case "warning":
      return theme.semantic.warning(text);
    case "success":
      return theme.semantic.success(text);
    case "info":
    case "tip":
    case "note":
    default:
      return theme.semantic.border(text);
  }
}

/**
 * Apply title color based on callout type.
 */
function colorTitle(
  text: string,
  type: CalloutType,
  theme: TuiTheme | undefined
): string {
  if (!theme) {
    return text;
  }

  switch (type) {
    case "error":
      return theme.semantic.error(text);
    case "warning":
      return theme.semantic.warning(text);
    case "success":
      return theme.semantic.success(text);
    case "info":
    case "tip":
    case "note":
    default:
      return theme.semantic.header(text);
  }
}

/**
 * Render a callout using ANSI escape codes for rich terminal output.
 *
 * @param layout - Pre-computed callout layout
 * @param input - Original input with defaults
 * @param chars - Border characters
 * @param theme - Optional theme for colors
 * @returns ANSI-formatted callout string
 */
export function renderCalloutAnsi(
  layout: CalloutLayout,
  input: CalloutInputWithDefaults,
  chars: BorderChars,
  theme?: TuiTheme
): string {
  const outputLines: string[] = [];
  const { type } = input;

  // Build title text (icon + title)
  const titleText = layout.icon
    ? `${layout.icon} ${layout.title}`
    : layout.title;
  const titleWithSpace = ` ${titleText} `;

  // Top border with title - use getStringWidth for emoji support
  const titleLen = getStringWidth(titleWithSpace);
  const remainingWidth = layout.innerWidth - titleLen;
  const leftPad = Math.floor(remainingWidth / 2);
  const rightPad = remainingWidth - leftPad;

  outputLines.push(
    colorBorder(chars.topLeft + chars.top.repeat(leftPad), type, theme) +
      colorTitle(titleWithSpace, type, theme) +
      colorBorder(chars.top.repeat(rightPad) + chars.topRight, type, theme)
  );

  // Empty line for visual spacing
  outputLines.push(
    colorBorder(chars.left, type, theme) +
      " ".repeat(layout.innerWidth) +
      colorBorder(chars.right, type, theme)
  );

  // Message lines with padding
  for (const line of layout.messageLines) {
    const paddedLine = padToWidth(line, layout.contentWidth, { align: "left" });
    outputLines.push(
      colorBorder(chars.left, type, theme) +
        " ".repeat(PADDING) +
        paddedLine +
        " ".repeat(PADDING) +
        colorBorder(chars.right, type, theme)
    );
  }

  // Empty line for visual spacing
  outputLines.push(
    colorBorder(chars.left, type, theme) +
      " ".repeat(layout.innerWidth) +
      colorBorder(chars.right, type, theme)
  );

  // Bottom border
  outputLines.push(
    colorBorder(
      chars.bottomLeft +
        chars.bottom.repeat(layout.innerWidth) +
        chars.bottomRight,
      type,
      theme
    )
  );

  return outputLines.join("\n");
}

/**
 * Render a callout using markdown-friendly output.
 *
 * @param layout - Pre-computed callout layout
 * @param input - Original input with defaults
 * @param chars - Border characters
 * @returns Markdown-friendly callout string
 */
export function renderCalloutMarkdown(
  layout: CalloutLayout,
  input: CalloutInputWithDefaults,
  chars: BorderChars
): string {
  const outputLines: string[] = [];

  // Build title text (icon + title)
  const titleText = layout.icon
    ? `${layout.icon} ${layout.title}`
    : layout.title;
  const titleWithSpace = ` ${titleText} `;

  // Top border with title (centered) - use getStringWidth for emoji support
  const titleLen = getStringWidth(titleWithSpace);
  const remainingWidth = layout.innerWidth - titleLen;
  const leftPad = Math.floor(remainingWidth / 2);
  const rightPad = remainingWidth - leftPad;

  outputLines.push(
    anchorLine(
      chars.topLeft +
        chars.top.repeat(leftPad) +
        titleWithSpace +
        chars.top.repeat(rightPad) +
        chars.topRight,
      DEFAULT_ANCHOR
    )
  );

  // Empty line for visual spacing
  outputLines.push(
    anchorLine(
      chars.left + " ".repeat(layout.innerWidth) + chars.right,
      DEFAULT_ANCHOR
    )
  );

  // Message lines with padding
  for (const line of layout.messageLines) {
    const paddedLine = padToWidth(line, layout.contentWidth, { align: "left" });
    outputLines.push(
      anchorLine(
        chars.left +
          " ".repeat(PADDING) +
          paddedLine +
          " ".repeat(PADDING) +
          chars.right,
        DEFAULT_ANCHOR
      )
    );
  }

  // Empty line for visual spacing
  outputLines.push(
    anchorLine(
      chars.left + " ".repeat(layout.innerWidth) + chars.right,
      DEFAULT_ANCHOR
    )
  );

  // Bottom border
  outputLines.push(
    anchorLine(
      chars.bottomLeft +
        chars.bottom.repeat(layout.innerWidth) +
        chars.bottomRight,
      DEFAULT_ANCHOR
    )
  );

  return outputLines.join("\n");
}
