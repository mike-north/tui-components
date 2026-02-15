import type { TransformFn } from "./types.js";

/**
 * Regular expression matching ANSI escape codes.
 * Matches CSI sequences, OSC sequences, and simple escape codes.
 */
// eslint-disable-next-line no-control-regex
const ANSI_REGEX = /\x1b\[[0-9;]*m|\x1b\].*?\x07|\x1b\[.*?[A-Za-z]/g;

/**
 * Strips all ANSI escape codes from the input string.
 *
 * @param input - String potentially containing ANSI codes
 * @returns String with all ANSI codes removed
 *
 * @example
 * ```typescript
 * stripAnsi("\x1b[31mRed text\x1b[0m") // => "Red text"
 * ```
 *
 * @public
 */
export function stripAnsi(input: string): string {
  return input.replace(ANSI_REGEX, "");
}

/**
 * Collapses multiple consecutive newlines into a single space.
 * Useful for assistants that display output in a collapsed format.
 *
 * @param input - String with potential multiple newlines
 * @returns String with newlines collapsed to spaces
 *
 * @example
 * ```typescript
 * collapseNewlines("line1\n\nline2\nline3") // => "line1 line2 line3"
 * ```
 *
 * @public
 */
export function collapseNewlines(input: string): string {
  return input.replace(/\n+/g, " ");
}

/**
 * Truncates output to a maximum number of lines.
 * Adds an ellipsis indicator if truncation occurs.
 *
 * @param input - String to truncate
 * @param maxLines - Maximum number of lines to keep
 * @returns Truncated string with ellipsis if needed
 *
 * @example
 * ```typescript
 * truncateLines("line1\nline2\nline3\nline4", 2)
 * // => "line1\nline2\n... (2 more lines)"
 * ```
 *
 * @public
 */
export function truncateLines(input: string, maxLines: number): string {
  if (maxLines <= 0) {
    return input;
  }

  const lines = input.split("\n");
  if (lines.length <= maxLines) {
    return input;
  }

  const kept = lines.slice(0, maxLines);
  const remaining = lines.length - maxLines;
  const ellipsis = `... (${String(remaining)} more ${remaining === 1 ? "line" : "lines"})`;

  return [...kept, ellipsis].join("\n");
}

/**
 * Creates a truncation transform with a specified line limit.
 * Useful for creating reusable truncation configurations.
 *
 * @param maxLines - Maximum number of lines to keep
 * @returns Transform function that truncates to maxLines
 *
 * @example
 * ```typescript
 * const truncate3 = createTruncateTransform(3);
 * truncate3("a\nb\nc\nd\ne") // => "a\nb\nc\n... (2 more lines)"
 * ```
 *
 * @public
 */
export function createTruncateTransform(maxLines: number): TransformFn {
  return (input: string) => truncateLines(input, maxLines);
}

/**
 * Strips backticks from the input string.
 * Useful for assistants that don't support markdown code highlighting.
 *
 * @param input - String potentially containing backticks
 * @returns String with backticks removed
 *
 * @example
 * ```typescript
 * stripBackticks("`code`") // => "code"
 * stripBackticks("```typescript\ncode\n```") // => "typescript\ncode\n"
 * ```
 *
 * @public
 */
export function stripBackticks(input: string): string {
  return input.replace(/`/g, "");
}

/**
 * Strips markdown bold markers (** and __) from the input string.
 * Useful for assistants that don't render bold text.
 *
 * @param input - String potentially containing bold markers
 * @returns String with bold markers removed
 *
 * @example
 * ```typescript
 * stripBoldMarkers("**bold** text") // => "bold text"
 * stripBoldMarkers("__bold__ text") // => "bold text"
 * ```
 *
 * @public
 */
export function stripBoldMarkers(input: string): string {
  return input.replace(/\*\*/g, "").replace(/__/g, "");
}

/**
 * Adds a space after Unicode box-drawing characters.
 * Helps prevent rendering issues where box characters connect to following text.
 *
 * @param input - String potentially containing box-drawing characters
 * @returns String with spaces added after box characters
 *
 * @example
 * ```typescript
 * addSpaceAfterBoxChars("█text") // => "█ text"
 * addSpaceAfterBoxChars("│item") // => "│ item"
 * ```
 *
 * @public
 */
export function addSpaceAfterBoxChars(input: string): string {
  // Box Drawing and Block Elements Unicode ranges
  // U+2500–U+257F: Box Drawing
  // U+2580–U+259F: Block Elements
  return input.replace(/([│┤┼├┬┴─┌┐└┘█▀▄■▪▫▬▲►▼◄])/g, "$1 ");
}

/**
 * Identity transform that returns the input unchanged.
 * Useful as a no-op placeholder in transform pipelines.
 *
 * @param input - Any string
 * @returns The same string unchanged
 *
 * @example
 * ```typescript
 * identity("text") // => "text"
 * ```
 *
 * @public
 */
export function identity(input: string): string {
  return input;
}

/**
 * Composes multiple transform functions into a single transform.
 * Applies transforms left-to-right (first transform is applied first).
 *
 * @param transforms - Array of transform functions to compose
 * @returns Single transform function that applies all transforms in sequence
 *
 * @example
 * ```typescript
 * const transform = composeTransforms([stripAnsi, collapseNewlines]);
 * transform("\x1b[31mRed\x1b[0m\n\nText") // => "Red Text"
 * ```
 *
 * @public
 */
export function composeTransforms(
  transforms: readonly TransformFn[]
): TransformFn {
  return (input: string) => {
    let result = input;
    for (const transform of transforms) {
      result = transform(result);
    }
    return result;
  };
}
