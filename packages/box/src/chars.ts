import type { BorderStyle } from "./schema.js";

/**
 * Border character set for box rendering.
 */
export interface BorderChars {
  topLeft: string;
  top: string;
  topRight: string;
  right: string;
  bottomRight: string;
  bottom: string;
  bottomLeft: string;
  left: string;
}

/**
 * Border character sets for different styles.
 */
const borderCharSets: Record<BorderStyle, BorderChars> = {
  single: {
    topLeft: "┌",
    top: "─",
    topRight: "┐",
    right: "│",
    bottomRight: "┘",
    bottom: "─",
    bottomLeft: "└",
    left: "│",
  },
  double: {
    topLeft: "╔",
    top: "═",
    topRight: "╗",
    right: "║",
    bottomRight: "╝",
    bottom: "═",
    bottomLeft: "╚",
    left: "║",
  },
  round: {
    topLeft: "╭",
    top: "─",
    topRight: "╮",
    right: "│",
    bottomRight: "╯",
    bottom: "─",
    bottomLeft: "╰",
    left: "│",
  },
  bold: {
    topLeft: "┏",
    top: "━",
    topRight: "┓",
    right: "┃",
    bottomRight: "┛",
    bottom: "━",
    bottomLeft: "┗",
    left: "┃",
  },
  singleDouble: {
    topLeft: "╓",
    top: "─",
    topRight: "╖",
    right: "║",
    bottomRight: "╜",
    bottom: "─",
    bottomLeft: "╙",
    left: "║",
  },
  doubleSingle: {
    topLeft: "╒",
    top: "═",
    topRight: "╕",
    right: "│",
    bottomRight: "╛",
    bottom: "═",
    bottomLeft: "╘",
    left: "│",
  },
  classic: {
    topLeft: "+",
    top: "-",
    topRight: "+",
    right: "|",
    bottomRight: "+",
    bottom: "-",
    bottomLeft: "+",
    left: "|",
  },
  none: {
    topLeft: " ",
    top: " ",
    topRight: " ",
    right: " ",
    bottomRight: " ",
    bottom: " ",
    bottomLeft: " ",
    left: " ",
  },
};

/**
 * Get border characters for the specified style.
 */
export function getBorderChars(style: BorderStyle): BorderChars {
  return borderCharSets[style];
}
