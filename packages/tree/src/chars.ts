import type { TreeStyle } from "./schema.js";

/**
 * Characters used for tree rendering.
 */
export interface TreeChars {
  /** Branch character for non-last children: ├ */
  branch: string;
  /** Last child character: └ */
  last: string;
  /** Vertical continuation: │ */
  vertical: string;
  /** Horizontal line: ─ */
  horizontal: string;
  /** Space for alignment */
  space: string;
}

/**
 * Unicode tree characters.
 */
const unicodeChars: TreeChars = {
  branch: "├",
  last: "└",
  vertical: "│",
  horizontal: "─",
  space: " ",
};

/**
 * ASCII tree characters.
 */
const asciiChars: TreeChars = {
  branch: "|",
  last: "`",
  vertical: "|",
  horizontal: "-",
  space: " ",
};

/**
 * Compact tree characters (minimal).
 */
const compactChars: TreeChars = {
  branch: "+",
  last: "+",
  vertical: "|",
  horizontal: "-",
  space: " ",
};

/**
 * Get tree characters for a given style.
 */
export function getTreeChars(style: TreeStyle): TreeChars {
  switch (style) {
    case "unicode":
      return unicodeChars;
    case "ascii":
      return asciiChars;
    case "compact":
      return compactChars;
  }
}
