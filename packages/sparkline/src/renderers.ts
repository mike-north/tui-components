import {
  anchorLine,
  DEFAULT_ANCHOR,
  type RenderContext,
  type TuiTheme,
} from "@tuicomponents/core";
import type { SparklineLayout } from "./layout.js";

/**
 * Render a sparkline in ANSI mode.
 *
 * @param layout - Computed sparkline layout
 * @param theme - Optional theme for styling
 * @returns Rendered ANSI string
 */
export function renderSparklineAnsi(
  layout: SparklineLayout,
  theme?: TuiTheme
): string {
  const { blocks, label } = layout;

  // Apply theme if available
  const styledBlocks = theme ? theme.semantic.primary(blocks) : blocks;
  const styledLabel = label
    ? theme
      ? theme.semantic.header(label)
      : label
    : "";

  return styledLabel + styledBlocks;
}

/**
 * Render a sparkline in markdown mode.
 *
 * Uses context.style.secondary() to apply semantic styling to the blocks,
 * which wraps them in backticks for visual distinction in markdown renderers.
 * The anchor character is prepended to preserve leading whitespace.
 *
 * @param layout - Computed sparkline layout
 * @param context - Render context for styling
 * @returns Rendered markdown string
 */
export function renderSparklineMarkdown(
  layout: SparklineLayout,
  context: RenderContext
): string {
  const { blocks, label } = layout;

  // Apply secondary styling to the data blocks
  // In markdown mode, this wraps in backticks for visual distinction
  const styledBlocks = context.style.secondary(blocks);
  const styledLabel = label ?? "";

  // Add anchor to preserve leading whitespace in markdown
  return anchorLine(
    styledLabel + styledBlocks,
    DEFAULT_ANCHOR,
    context.markdownOptions
  );
}

/**
 * Render a sparkline in grayscale mode.
 *
 * Uses context.style.secondary() to apply Unicode shade character
 * decorations for visual distinction without requiring ANSI or markdown.
 *
 * @param layout - Computed sparkline layout
 * @param context - Render context for styling
 * @returns Rendered grayscale string
 */
export function renderSparklineGrayscale(
  layout: SparklineLayout,
  context: RenderContext
): string {
  const { blocks, label } = layout;

  // Apply secondary styling to the data blocks
  // In grayscale mode, this wraps with shade characters
  const styledBlocks = context.style.secondary(blocks);
  const styledLabel = label ? context.style.header(label) : "";

  return styledLabel + styledBlocks;
}
