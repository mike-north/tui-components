import type { ProgressStyle } from "./schema.js";

/**
 * Characters used for progress bar rendering.
 */
export interface ProgressChars {
  /** Filled portion character */
  filled: string;
  /** Empty portion character */
  empty: string;
  /** Left bracket (only for bracket style) */
  leftBracket: string;
  /** Right bracket (only for bracket style) */
  rightBracket: string;
}

/**
 * Block style: █░
 */
const blockChars: ProgressChars = {
  filled: "█",
  empty: "░",
  leftBracket: "",
  rightBracket: "",
};

/**
 * Shaded style: ▓░
 */
const shadedChars: ProgressChars = {
  filled: "▓",
  empty: "░",
  leftBracket: "",
  rightBracket: "",
};

/**
 * Bracket style: [█░]
 */
const bracketChars: ProgressChars = {
  filled: "█",
  empty: "░",
  leftBracket: "[",
  rightBracket: "]",
};

/**
 * Arrow style: >-
 */
const arrowChars: ProgressChars = {
  filled: ">",
  empty: "-",
  leftBracket: "",
  rightBracket: "",
};

/**
 * ASCII style: #.
 */
const asciiChars: ProgressChars = {
  filled: "#",
  empty: ".",
  leftBracket: "",
  rightBracket: "",
};

/**
 * Get progress bar characters for a given style.
 */
export function getProgressChars(style: ProgressStyle): ProgressChars {
  switch (style) {
    case "block":
      return blockChars;
    case "shaded":
      return shadedChars;
    case "bracket":
      return bracketChars;
    case "arrow":
      return arrowChars;
    case "ascii":
      return asciiChars;
  }
}
