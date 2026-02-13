import type { BorderStyle } from "./schema.js";

/**
 * Border characters for callout rendering.
 */
export interface BorderChars {
  topLeft: string;
  top: string;
  topRight: string;
  left: string;
  right: string;
  bottomLeft: string;
  bottom: string;
  bottomRight: string;
}

/**
 * Border character sets for different styles.
 */
const BORDER_CHARS: Record<BorderStyle, BorderChars> = {
  single: {
    topLeft: "┌",
    top: "─",
    topRight: "┐",
    left: "│",
    right: "│",
    bottomLeft: "└",
    bottom: "─",
    bottomRight: "┘",
  },
  double: {
    topLeft: "╔",
    top: "═",
    topRight: "╗",
    left: "║",
    right: "║",
    bottomLeft: "╚",
    bottom: "═",
    bottomRight: "╝",
  },
  round: {
    topLeft: "╭",
    top: "─",
    topRight: "╮",
    left: "│",
    right: "│",
    bottomLeft: "╰",
    bottom: "─",
    bottomRight: "╯",
  },
  bold: {
    topLeft: "┏",
    top: "━",
    topRight: "┓",
    left: "┃",
    right: "┃",
    bottomLeft: "┗",
    bottom: "━",
    bottomRight: "┛",
  },
  none: {
    topLeft: " ",
    top: " ",
    topRight: " ",
    left: " ",
    right: " ",
    bottomLeft: " ",
    bottom: " ",
    bottomRight: " ",
  },
};

/**
 * Get border characters for a given style.
 *
 * @param style - The border style
 * @returns Border character set
 */
export function getBorderChars(style: BorderStyle): BorderChars {
  return BORDER_CHARS[style];
}
