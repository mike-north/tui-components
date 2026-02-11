import type { GraphStyle } from "./schema.js";

/**
 * Characters used for graph rendering.
 */
export interface GraphChars {
  /** Node marker */
  node: string;
  /** Vertical line */
  vertical: string;
  /** Horizontal line */
  horizontal: string;
  /** Left branch (fork going down-right) */
  branchLeft: string;
  /** Right branch (fork going down-left) */
  branchRight: string;
  /** Merge point (multiple lines converging) */
  merge: string;
  /** Down and right corner */
  cornerDownRight: string;
  /** Down and left corner */
  cornerDownLeft: string;
  /** Diagonal going down-right */
  diagonalRight: string;
  /** Diagonal going down-left */
  diagonalLeft: string;
  /** Space for alignment */
  space: string;
}

/**
 * Unicode graph characters.
 */
const unicodeChars: GraphChars = {
  node: "●",
  vertical: "│",
  horizontal: "─",
  branchLeft: "├",
  branchRight: "┤",
  merge: "┼",
  cornerDownRight: "╭",
  cornerDownLeft: "╮",
  diagonalRight: "╱",
  diagonalLeft: "╲",
  space: " ",
};

/**
 * ASCII graph characters.
 */
const asciiChars: GraphChars = {
  node: "*",
  vertical: "|",
  horizontal: "-",
  branchLeft: "+",
  branchRight: "+",
  merge: "+",
  cornerDownRight: ",",
  cornerDownLeft: ".",
  diagonalRight: "/",
  diagonalLeft: "\\",
  space: " ",
};

/**
 * Get graph characters for a given style.
 */
export function getGraphChars(style: GraphStyle): GraphChars {
  switch (style) {
    case "unicode":
      return unicodeChars;
    case "ascii":
      return asciiChars;
  }
}
