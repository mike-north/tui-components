/**
 * Unified semantic styling for TUI components.
 *
 * Provides consistent styling across render modes:
 * - ANSI mode: Uses theme semantic colors
 * - Markdown mode: Uses markdown formatting (backticks, bold, etc.)
 * - Grayscale mode: Uses Unicode shade character decorations
 */

import type { RenderMode } from "./component.js";
import { createGrayscaleStyleFunctions } from "./grayscale.js";
import { inlineCode, type MarkdownRendererOptions } from "./markdown.js";
import type { TuiTheme } from "./theme.js";

/**
 * Semantic styling functions that work across render modes.
 *
 * Components call these functions to apply semantic styling:
 * - In ANSI mode: Applies theme colors
 * - In markdown mode: Applies markdown formatting
 *
 * @example
 * ```ts
 * // In a component render method:
 * const styledText = context.style.secondary(sparklineBlocks);
 * // ANSI mode: muted color
 * // Markdown mode: `sparklineBlocks` (backtick wrapped)
 * ```
 */
export interface StyleFunctions {
  /** Primary content - default foreground */
  primary: (text: string) => string;
  /** Secondary/muted content - subdued style */
  secondary: (text: string) => string;
  /** Headers and titles - emphasized style */
  header: (text: string) => string;
  /** Borders and separators - subtle style */
  border: (text: string) => string;
  /** Success state - positive indicator */
  success: (text: string) => string;
  /** Warning state - caution indicator */
  warning: (text: string) => string;
  /** Error state - negative indicator */
  error: (text: string) => string;
  /** Informational text - neutral highlight */
  info: (text: string) => string;
}

/**
 * Create style function implementations for markdown mode.
 *
 * Maps semantic styles to markdown formatting:
 * - primary: Plain text (no formatting)
 * - secondary: Inline code backticks (visual distinction via background color)
 * - header: Bold (**text**)
 * - border: Plain text (borders don't need styling in markdown)
 * - success/warning/error/info: Inline code (colored in many renderers)
 *
 * @param options - Optional markdown renderer options
 */
function createMarkdownStyleFunctions(
  options?: MarkdownRendererOptions
): StyleFunctions {
  return {
    primary: (text: string) => text,
    secondary: (text: string) => (text === "" ? "" : inlineCode(text, options)),
    header: (text: string) => (text === "" ? "" : `**${text}**`),
    border: (text: string) => text,
    success: (text: string) => (text === "" ? "" : inlineCode(text, options)),
    warning: (text: string) => (text === "" ? "" : inlineCode(text, options)),
    error: (text: string) => (text === "" ? "" : inlineCode(text, options)),
    info: (text: string) => (text === "" ? "" : inlineCode(text, options)),
  };
}

/**
 * Create passthrough style functions (no styling applied).
 */
function createPassthroughStyleFunctions(): StyleFunctions {
  const passthrough = (text: string) => text;
  return {
    primary: passthrough,
    secondary: passthrough,
    header: passthrough,
    border: passthrough,
    success: passthrough,
    warning: passthrough,
    error: passthrough,
    info: passthrough,
  };
}

/**
 * Create style functions that apply theme colors.
 */
function createThemedStyleFunctions(theme: TuiTheme): StyleFunctions {
  return {
    primary: (text: string) => theme.semantic.primary(text),
    secondary: (text: string) => theme.semantic.secondary(text),
    header: (text: string) => theme.semantic.header(text),
    border: (text: string) => theme.semantic.border(text),
    success: (text: string) => theme.semantic.success(text),
    warning: (text: string) => theme.semantic.warning(text),
    error: (text: string) => theme.semantic.error(text),
    info: (text: string) => theme.semantic.info(text),
  };
}

/**
 * Create style functions appropriate for the render mode.
 *
 * @param renderMode - The current render mode ("ansi", "markdown", or "grayscale")
 * @param theme - Optional theme for ANSI mode styling
 * @param markdownOptions - Optional markdown-specific renderer options
 * @returns StyleFunctions that apply mode-appropriate styling
 *
 * @example
 * ```ts
 * // Markdown mode
 * const style = createStyleFunctions("markdown");
 * style.secondary("blocks") // Returns " `blocks`"
 *
 * // Markdown mode with relaxed spacing (for Kiro CLI)
 * const style = createStyleFunctions("markdown", undefined, { spacingMode: "relaxed" });
 * style.secondary("blocks") // Returns "  `blocks`"
 *
 * // Grayscale mode (for Cline)
 * const style = createStyleFunctions("grayscale");
 * style.secondary("blocks") // Returns "░blocks░"
 *
 * // ANSI mode with theme
 * const style = createStyleFunctions("ansi", theme);
 * style.secondary("blocks") // Returns muted-colored text
 *
 * // ANSI mode without theme
 * const style = createStyleFunctions("ansi");
 * style.secondary("blocks") // Returns "blocks" unchanged
 * ```
 */
export function createStyleFunctions(
  renderMode: RenderMode,
  theme?: TuiTheme,
  markdownOptions?: MarkdownRendererOptions
): StyleFunctions {
  if (renderMode === "grayscale") {
    return createGrayscaleStyleFunctions();
  }

  if (renderMode === "markdown") {
    return createMarkdownStyleFunctions(markdownOptions);
  }

  // ANSI mode: use theme if available, otherwise passthrough
  if (theme) {
    return createThemedStyleFunctions(theme);
  }

  return createPassthroughStyleFunctions();
}
