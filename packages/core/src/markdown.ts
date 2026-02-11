/**
 * Markdown rendering utilities for AI assistant-friendly output.
 *
 * These utilities help create output that renders well in environments
 * that strip ANSI escape codes but support markdown rendering.
 */

import { getStringWidth } from "./width.js";

/**
 * Style types for the two-color markdown system.
 * - "primary": Plain text (default terminal foreground)
 * - "secondary": Inline code (`text`) - typically rendered with tan/yellow background
 */
export type MarkdownStyle = "primary" | "secondary";

/**
 * Default anchor character for line starts.
 * Using │ (U+2502 BOX DRAWINGS LIGHT VERTICAL) as it's visually unobtrusive
 * and prevents leading whitespace collapse in markdown rendering.
 */
export const DEFAULT_ANCHOR = "│";

/**
 * Wrap text in inline code formatting.
 *
 * Adds a leading space before the opening backtick to compensate for
 * the visual width difference when backticks are rendered as invisible.
 *
 * @param text - Text to wrap
 * @returns Text wrapped in inline code with alignment compensation
 *
 * @example
 * ```ts
 * inlineCode("hello") // Returns " `hello`"
 * ```
 */
export function inlineCode(text: string): string {
  // Leading space compensates for invisible backtick
  return ` \`${text}\``;
}

/**
 * Add an anchor character to the start of a line.
 *
 * Markdown renderers often collapse leading whitespace. Using an anchor
 * character at the start of each line preserves alignment.
 *
 * @param content - Line content (without the anchor)
 * @param anchor - Anchor character to use (defaults to │)
 * @returns Line with anchor prefix
 *
 * @example
 * ```ts
 * anchorLine("  Sales    ████████") // "│  Sales    ████████"
 * ```
 */
export function anchorLine(content: string, anchor: string = DEFAULT_ANCHOR): string {
  return `${anchor}${content}`;
}

/**
 * Apply a markdown style to text.
 *
 * Implements the two-color system for markdown mode:
 * - "primary": Returns text unchanged (plain foreground)
 * - "secondary": Wraps text in inline code (typically tan/yellow background)
 *
 * @param text - Text to style
 * @param style - Style to apply
 * @returns Styled text
 *
 * @example
 * ```ts
 * applyMarkdownStyle("Sales", "primary")   // "Sales"
 * applyMarkdownStyle("Support", "secondary") // " `Support`"
 * ```
 */
export function applyMarkdownStyle(text: string, style: MarkdownStyle): string {
  if (style === "secondary") {
    return inlineCode(text);
  }
  return text;
}

/**
 * Join multiple lines with anchors.
 *
 * @param lines - Lines to join
 * @param anchor - Anchor character to use
 * @returns Lines joined with newlines, each prefixed with anchor
 *
 * @example
 * ```ts
 * joinAnchoredLines(["line 1", "line 2"]) // "│line 1\n│line 2"
 * ```
 */
export function joinAnchoredLines(
  lines: string[],
  anchor: string = DEFAULT_ANCHOR
): string {
  return lines.map((line) => anchorLine(line, anchor)).join("\n");
}

/**
 * Strip markdown formatting characters that will be consumed during rendering.
 *
 * This removes:
 * - Inline code backticks: `text` → text
 * - Bold markers: **text** or __text__ → text
 * - Italic markers at word boundaries: *text* or _text_ → text
 *
 * It preserves:
 * - Mid-word underscores: foo_bar stays as foo_bar
 * - Asterisks with surrounding spaces: a * b stays as a * b
 * - Unmatched markers without a closing pair
 *
 * @param str - String potentially containing markdown formatting
 * @returns String with consumed formatting characters removed
 *
 * @example
 * ```ts
 * stripMarkdownFormatting("`code`")     // "code"
 * stripMarkdownFormatting("**bold**")   // "bold"
 * stripMarkdownFormatting("_italic_")   // "italic"
 * stripMarkdownFormatting("foo_bar")    // "foo_bar" (preserved)
 * stripMarkdownFormatting("a * b")      // "a * b" (preserved)
 * ```
 */
export function stripMarkdownFormatting(str: string): string {
  let result = str;

  // Remove inline code backticks (highest priority - prevents other formatting inside)
  // Match `...` where content doesn't contain backticks
  result = result.replace(/`([^`]+)`/g, "$1");

  // Remove bold markers: **text** or __text__
  result = result.replace(/\*\*([^*]+)\*\*/g, "$1");
  result = result.replace(/__([^_]+)__/g, "$1");

  // Remove italic markers at word boundaries: *text* or _text_
  // These patterns match markers at start/end of string or with word boundaries
  // *text* - asterisks at word boundaries (not mid-word, not spaced like "a * b")
  result = result.replace(/(?<![*\w])\*([^*\s][^*]*[^*\s]|[^*\s])\*(?![*\w])/g, "$1");

  // _text_ - underscores at word boundaries (not mid-word like foo_bar)
  result = result.replace(/(?<![_\w])_([^_\s][^_]*[^_\s]|[^_\s])_(?![_\w])/g, "$1");

  return result;
}

/**
 * Get the visual width of a string after markdown rendering.
 *
 * This accounts for markdown formatting characters that will be consumed
 * (become invisible) when rendered, such as backticks for inline code,
 * asterisks for bold/italic, etc.
 *
 * Use this instead of getStringWidth() when calculating alignment for
 * markdown output where formatting characters affect visual width.
 *
 * @param str - String potentially containing markdown formatting
 * @returns Visual width in columns after markdown rendering
 *
 * @example
 * ```ts
 * getStringWidth("`code`")           // 6 (counts backticks)
 * getMarkdownRenderedWidth("`code`") // 4 (backticks will be invisible)
 *
 * getStringWidth("**bold**")           // 8 (counts asterisks)
 * getMarkdownRenderedWidth("**bold**") // 4 (asterisks will be invisible)
 *
 * getStringWidth("foo_bar")           // 7
 * getMarkdownRenderedWidth("foo_bar") // 7 (underscore preserved mid-word)
 * ```
 */
export function getMarkdownRenderedWidth(str: string): number {
  return getStringWidth(stripMarkdownFormatting(str));
}
