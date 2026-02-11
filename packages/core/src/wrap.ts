import wrapAnsi from "wrap-ansi";
import { getStringWidth } from "./width.js";

/**
 * Options for text wrapping.
 */
export interface WrapOptions {
  /** Whether to hard-wrap words that exceed the width */
  hard?: boolean;
  /** Whether to trim leading/trailing whitespace from each line */
  trim?: boolean;
  /** Whether to wrap at word boundaries (default: true) */
  wordWrap?: boolean;
}

/**
 * Wrap text to fit within a specified width.
 * Preserves ANSI escape codes when wrapping.
 *
 * @param text - Text to wrap
 * @param width - Maximum width in columns
 * @param options - Wrapping options
 * @returns Wrapped text with newlines
 *
 * @example
 * ```ts
 * wrapText("The quick brown fox jumps over the lazy dog", 20);
 * // "The quick brown fox\njumps over the lazy\ndog"
 *
 * // With ANSI codes preserved
 * wrapText("\x1b[31mRed text that is very long\x1b[0m", 10);
 * // "\x1b[31mRed text\x1b[0m\n\x1b[31mthat is\x1b[0m\n\x1b[31mvery long\x1b[0m"
 * ```
 */
export function wrapText(
  text: string,
  width: number,
  options: WrapOptions = {}
): string {
  const { hard = false, trim = true, wordWrap = true } = options;

  return wrapAnsi(text, width, {
    hard,
    trim,
    wordWrap,
  });
}

/**
 * Wrap text and return information about the result.
 *
 * @param text - Text to wrap
 * @param width - Maximum width in columns
 * @param options - Wrapping options
 * @returns Object with wrapped text and metadata
 */
export function wrapTextWithInfo(
  text: string,
  width: number,
  options: WrapOptions = {}
): {
  text: string;
  lines: string[];
  lineCount: number;
  maxWidth: number;
} {
  const wrapped = wrapText(text, width, options);
  const lines = wrapped.split("\n");

  let maxWidth = 0;
  for (const line of lines) {
    const lineWidth = getStringWidth(line);
    if (lineWidth > maxWidth) {
      maxWidth = lineWidth;
    }
  }

  return {
    text: wrapped,
    lines,
    lineCount: lines.length,
    maxWidth,
  };
}
