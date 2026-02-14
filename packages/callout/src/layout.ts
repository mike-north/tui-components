import { getStringWidth, wrapText } from "@tuicomponents/core";
import type { CalloutInputWithDefaults } from "./schema.js";
import { getCalloutDefaults } from "./defaults.js";

/**
 * Pre-computed layout for a callout.
 */
export interface CalloutLayout {
  /** The icon to display (resolved from type or custom) */
  icon: string;
  /** The title to display (resolved from type or custom) */
  title: string;
  /** The message lines (wrapped to fit width) */
  messageLines: string[];
  /** The inner width (content area, excluding borders) */
  innerWidth: number;
  /** The content width (excluding padding) */
  contentWidth: number;
}

/** Minimum callout width */
const MIN_WIDTH = 40;

/** Padding inside the callout (left and right) */
const PADDING = 1;

/**
 * Compute the layout for a callout.
 *
 * @param input - Validated callout input with defaults applied
 * @returns Computed layout ready for rendering
 */
export function computeCalloutLayout(
  input: CalloutInputWithDefaults
): CalloutLayout {
  // Get defaults for the type
  const defaults = getCalloutDefaults(input.type);

  // Resolve icon (custom or default, empty string hides it)
  const icon = input.icon ?? defaults.icon;

  // Resolve title (custom or default)
  const title = input.title ?? defaults.title;

  // Calculate title width (icon + space + title + space)
  const titleText = icon ? `${icon} ${title}` : title;
  const titleWidth = getStringWidth(` ${titleText} `);

  // Calculate content width
  let contentWidth: number;
  if (input.width) {
    // Fixed width specified (subtract borders and padding)
    contentWidth = input.width - 2 - PADDING * 2;
  } else {
    // Auto width: measure message, use max of message width, title width, or minimum
    const messageWidth = getStringWidth(input.message);
    const minWidthForTitle = titleWidth - PADDING * 2;
    contentWidth = Math.max(
      MIN_WIDTH - 2 - PADDING * 2,
      messageWidth,
      minWidthForTitle
    );
  }

  // Ensure minimum content width
  contentWidth = Math.max(contentWidth, MIN_WIDTH - 2 - PADDING * 2);

  // Wrap message to fit content width
  const wrappedMessage = wrapText(input.message, contentWidth);
  const messageLines = wrappedMessage.split("\n");

  // Calculate inner width (content + padding)
  const innerWidth = contentWidth + PADDING * 2;

  return {
    icon,
    title,
    messageLines,
    innerWidth,
    contentWidth,
  };
}
