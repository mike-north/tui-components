import stringWidth from "string-width";

/**
 * Get the visual width of a string in terminal columns.
 * Handles emoji, CJK characters, ANSI escape codes, and zero-width characters.
 *
 * @param str - The string to measure
 * @returns Width in terminal columns
 *
 * @example
 * ```ts
 * getStringWidth("hello");     // 5
 * getStringWidth("你好");       // 4 (CJK characters are 2 columns each)
 * getStringWidth("👋");         // 2 (emoji are typically 2 columns)
 * getStringWidth("\x1b[31mred\x1b[0m"); // 3 (ANSI codes have 0 width)
 * ```
 */
export function getStringWidth(str: string): number {
  return stringWidth(str);
}

/**
 * Options for padding operations.
 */
export interface PadOptions {
  /** Character to use for padding (default: space) */
  padChar?: string;
  /** Alignment direction */
  align?: "left" | "right" | "center";
}

/**
 * Pad a string to a target width.
 * If the string is already wider than the target, it is returned unchanged.
 *
 * @param str - The string to pad
 * @param targetWidth - Target width in columns
 * @param options - Padding options
 * @returns Padded string
 *
 * @example
 * ```ts
 * padToWidth("hi", 5);                    // "hi   "
 * padToWidth("hi", 5, { align: "right" }); // "   hi"
 * padToWidth("hi", 5, { align: "center" }); // " hi  "
 * ```
 */
export function padToWidth(
  str: string,
  targetWidth: number,
  options: PadOptions = {}
): string {
  const { padChar = " ", align = "left" } = options;
  const currentWidth = getStringWidth(str);

  if (currentWidth >= targetWidth) {
    return str;
  }

  const padCharWidth = getStringWidth(padChar);
  if (padCharWidth === 0) {
    return str;
  }

  const paddingNeeded = targetWidth - currentWidth;
  const padCount = Math.floor(paddingNeeded / padCharWidth);
  const padding = padChar.repeat(padCount);

  switch (align) {
    case "right":
      return padding + str;
    case "center": {
      const leftPadCount = Math.floor(padCount / 2);
      const rightPadCount = padCount - leftPadCount;
      return padChar.repeat(leftPadCount) + str + padChar.repeat(rightPadCount);
    }
    case "left":
    default:
      return str + padding;
  }
}

/**
 * Options for truncation operations.
 */
export interface TruncateOptions {
  /** String to append when truncating (default: "…") */
  ellipsis?: string;
  /** Where to truncate: end or middle */
  position?: "end" | "middle";
}

/**
 * Truncate a string to fit within a target width.
 * If the string already fits, it is returned unchanged.
 *
 * @param str - The string to truncate
 * @param targetWidth - Maximum width in columns
 * @param options - Truncation options
 * @returns Truncated string
 *
 * @example
 * ```ts
 * truncateToWidth("hello world", 8);           // "hello w…"
 * truncateToWidth("hello world", 8, { ellipsis: "..." }); // "hello..."
 * truncateToWidth("hello world", 8, { position: "middle" }); // "hel…rld"
 * ```
 */
export function truncateToWidth(
  str: string,
  targetWidth: number,
  options: TruncateOptions = {}
): string {
  const { ellipsis = "…", position = "end" } = options;
  const currentWidth = getStringWidth(str);

  if (currentWidth <= targetWidth) {
    return str;
  }

  const ellipsisWidth = getStringWidth(ellipsis);
  if (ellipsisWidth >= targetWidth) {
    // Ellipsis alone is too wide; just return what we can
    return truncateChars(str, targetWidth);
  }

  const availableWidth = targetWidth - ellipsisWidth;

  if (position === "middle") {
    const leftWidth = Math.ceil(availableWidth / 2);
    const rightWidth = Math.floor(availableWidth / 2);
    const leftPart = truncateChars(str, leftWidth);
    const rightPart = truncateCharsFromEnd(str, rightWidth);
    return leftPart + ellipsis + rightPart;
  }

  // position === "end"
  return truncateChars(str, availableWidth) + ellipsis;
}

/**
 * Truncate string to fit within width, character by character from the start.
 */
function truncateChars(str: string, targetWidth: number): string {
  let result = "";
  let width = 0;

  for (const char of str) {
    const charWidth = getStringWidth(char);
    if (width + charWidth > targetWidth) {
      break;
    }
    result += char;
    width += charWidth;
  }

  return result;
}

/**
 * Get the last N columns of a string.
 */
function truncateCharsFromEnd(str: string, targetWidth: number): string {
  // Collect characters using for-of which properly handles Unicode
  const collectedChars: string[] = [];
  for (const char of str) {
    collectedChars.push(char);
  }

  // Build result from end, character by character
  let result = "";
  let width = 0;

  for (let i = collectedChars.length - 1; i >= 0; i--) {
    const char = collectedChars[i];
    if (char === undefined) continue;
    const charWidth = getStringWidth(char);
    if (width + charWidth > targetWidth) {
      break;
    }
    result = char + result;
    width += charWidth;
  }

  return result;
}

/**
 * Split a string into lines and measure each line's width.
 *
 * @param str - The string to analyze
 * @returns Object with lines array and max width
 */
export function measureLines(str: string): {
  lines: string[];
  maxWidth: number;
  lineCount: number;
} {
  const lines = str.split("\n");
  let maxWidth = 0;

  for (const line of lines) {
    const lineWidth = getStringWidth(line);
    if (lineWidth > maxWidth) {
      maxWidth = lineWidth;
    }
  }

  return {
    lines,
    maxWidth,
    lineCount: lines.length,
  };
}
