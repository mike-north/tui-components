import type { BorderStyle } from "./schema.js";

/**
 * Border characters for a table.
 */
export interface BorderChars {
  topLeft: string;
  topRight: string;
  bottomLeft: string;
  bottomRight: string;
  horizontal: string;
  vertical: string;
  topJoin: string;
  bottomJoin: string;
  leftJoin: string;
  rightJoin: string;
  cross: string;
}

/**
 * No border characters (empty strings).
 */
const noneBorders: BorderChars = {
  topLeft: "",
  topRight: "",
  bottomLeft: "",
  bottomRight: "",
  horizontal: "",
  vertical: "",
  topJoin: "",
  bottomJoin: "",
  leftJoin: "",
  rightJoin: "",
  cross: "",
};

/**
 * Single line border characters (Unicode box drawing).
 */
const singleBorders: BorderChars = {
  topLeft: "┌",
  topRight: "┐",
  bottomLeft: "└",
  bottomRight: "┘",
  horizontal: "─",
  vertical: "│",
  topJoin: "┬",
  bottomJoin: "┴",
  leftJoin: "├",
  rightJoin: "┤",
  cross: "┼",
};

/**
 * Double line border characters (Unicode box drawing).
 */
const doubleBorders: BorderChars = {
  topLeft: "╔",
  topRight: "╗",
  bottomLeft: "╚",
  bottomRight: "╝",
  horizontal: "═",
  vertical: "║",
  topJoin: "╦",
  bottomJoin: "╩",
  leftJoin: "╠",
  rightJoin: "╣",
  cross: "╬",
};

/**
 * Rounded corner border characters (Unicode box drawing).
 */
const roundedBorders: BorderChars = {
  topLeft: "╭",
  topRight: "╮",
  bottomLeft: "╰",
  bottomRight: "╯",
  horizontal: "─",
  vertical: "│",
  topJoin: "┬",
  bottomJoin: "┴",
  leftJoin: "├",
  rightJoin: "┤",
  cross: "┼",
};

/**
 * Heavy line border characters (Unicode box drawing).
 */
const heavyBorders: BorderChars = {
  topLeft: "┏",
  topRight: "┓",
  bottomLeft: "┗",
  bottomRight: "┛",
  horizontal: "━",
  vertical: "┃",
  topJoin: "┳",
  bottomJoin: "┻",
  leftJoin: "┣",
  rightJoin: "┫",
  cross: "╋",
};

/**
 * ASCII-only border characters.
 */
const asciiBorders: BorderChars = {
  topLeft: "+",
  topRight: "+",
  bottomLeft: "+",
  bottomRight: "+",
  horizontal: "-",
  vertical: "|",
  topJoin: "+",
  bottomJoin: "+",
  leftJoin: "+",
  rightJoin: "+",
  cross: "+",
};

/**
 * Get border characters for a given border style.
 *
 * @param style - The border style
 * @returns Border characters
 */
export function getBorderChars(style: BorderStyle): BorderChars {
  switch (style) {
    case "none":
      return noneBorders;
    case "single":
      return singleBorders;
    case "double":
      return doubleBorders;
    case "rounded":
      return roundedBorders;
    case "heavy":
      return heavyBorders;
    case "ascii":
      return asciiBorders;
  }
}
