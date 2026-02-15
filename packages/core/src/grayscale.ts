/**
 * Grayscale rendering utilities using Unicode shade characters.
 *
 * This renderer provides visual distinction in environments where neither
 * ANSI escape codes nor markdown backticks work properly (e.g., Cline).
 *
 * The grayscale system uses Unicode shade characters to differentiate
 * content types:
 * - ░ (U+2591): Light shade - secondary/muted content
 * - ▒ (U+2592): Medium shade - warnings
 * - ▓ (U+2593): Dark shade - success
 * - █ (U+2588): Solid block - headers/errors
 */

/**
 * Shade intensity levels for grayscale rendering.
 *
 * @public
 */
export type GrayscaleShade = "light" | "medium" | "dark" | "solid";

/**
 * Unicode shade characters mapped to intensity levels.
 *
 * @public
 */
export const GRAYSCALE_CHARS: Record<GrayscaleShade, string> = {
  light: "░",
  medium: "▒",
  dark: "▓",
  solid: "█",
};

/**
 * Style functions for grayscale mode.
 *
 * These map semantic styles to Unicode shade character decorations,
 * providing visual distinction without requiring ANSI or markdown support.
 *
 * @public
 */
export interface GrayscaleStyleFunctions {
  /** Primary content - returns text unchanged */
  primary: (text: string) => string;
  /** Secondary/muted content - wrapped with light shade */
  secondary: (text: string) => string;
  /** Headers and titles - prefixed with solid block */
  header: (text: string) => string;
  /** Borders and separators - returns text unchanged */
  border: (text: string) => string;
  /** Success state - wrapped with dark shade */
  success: (text: string) => string;
  /** Warning state - wrapped with medium shade */
  warning: (text: string) => string;
  /** Error state - wrapped with solid block */
  error: (text: string) => string;
  /** Informational text - wrapped with light shade */
  info: (text: string) => string;
}

/**
 * Create grayscale style functions.
 *
 * These functions wrap text with Unicode shade characters to provide
 * visual distinction in environments without ANSI or markdown support.
 *
 * @returns Style functions that apply grayscale formatting
 *
 * @example
 * ```ts
 * const style = createGrayscaleStyleFunctions();
 * style.header("Title")     // "█ Title"
 * style.secondary("muted")  // "░muted░"
 * style.success("done")     // "▓done▓"
 * ```
 *
 * @public
 */
export function createGrayscaleStyleFunctions(): GrayscaleStyleFunctions {
  return {
    primary: (text: string) => text,
    secondary: (text: string) =>
      text === "" ? "" : `${GRAYSCALE_CHARS.light}${text}${GRAYSCALE_CHARS.light}`,
    header: (text: string) =>
      text === "" ? "" : `${GRAYSCALE_CHARS.solid} ${text}`,
    border: (text: string) => text,
    success: (text: string) =>
      text === "" ? "" : `${GRAYSCALE_CHARS.dark}${text}${GRAYSCALE_CHARS.dark}`,
    warning: (text: string) =>
      text === "" ? "" : `${GRAYSCALE_CHARS.medium}${text}${GRAYSCALE_CHARS.medium}`,
    error: (text: string) =>
      text === "" ? "" : `${GRAYSCALE_CHARS.solid}${text}${GRAYSCALE_CHARS.solid}`,
    info: (text: string) =>
      text === "" ? "" : `${GRAYSCALE_CHARS.light}${text}${GRAYSCALE_CHARS.light}`,
  };
}

/**
 * Get the appropriate shade character for a normalized value (0-1).
 *
 * Useful for rendering data visualizations in grayscale mode,
 * mapping intensity values to shade characters.
 *
 * @param normalizedValue - Value between 0 and 1
 * @returns Appropriate shade character
 *
 * @example
 * ```ts
 * getShadeForValue(0.1)  // "░" (light)
 * getShadeForValue(0.5)  // "▒" (medium)
 * getShadeForValue(0.75) // "▓" (dark)
 * getShadeForValue(0.95) // "█" (solid)
 * ```
 *
 * @public
 */
export function getShadeForValue(normalizedValue: number): string {
  if (normalizedValue < 0.25) {
    return GRAYSCALE_CHARS.light;
  }
  if (normalizedValue < 0.5) {
    return GRAYSCALE_CHARS.medium;
  }
  if (normalizedValue < 0.75) {
    return GRAYSCALE_CHARS.dark;
  }
  return GRAYSCALE_CHARS.solid;
}
