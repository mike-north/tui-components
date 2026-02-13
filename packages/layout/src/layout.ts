import { getStringWidth } from "@tuicomponents/core";
import type {
  VerticalLayoutInputWithDefaults,
  VerticalAlign,
} from "./schema.js";

/**
 * Pre-computed layout for vertical layout.
 */
export interface VerticalLayoutComputed {
  /** The lines of each item, split by newline */
  itemLines: string[][];
  /** The width of each item (widest line) */
  itemWidths: number[];
  /** The overall layout width */
  layoutWidth: number;
  /** The alignment to use */
  align: VerticalAlign;
  /** Number of gap lines between items */
  gap: number;
}

/**
 * Compute the layout for a vertical layout.
 *
 * @param input - Validated vertical layout input with defaults applied
 * @returns Computed layout ready for rendering
 */
export function computeVerticalLayout(
  input: VerticalLayoutInputWithDefaults
): VerticalLayoutComputed {
  // Split each item into lines and measure widths
  const itemLines: string[][] = [];
  const itemWidths: number[] = [];

  for (const item of input.items) {
    const lines = item.split("\n");
    itemLines.push(lines);

    // Find the widest line in this item
    let maxWidth = 0;
    for (const line of lines) {
      const lineWidth = getStringWidth(line);
      if (lineWidth > maxWidth) {
        maxWidth = lineWidth;
      }
    }
    itemWidths.push(maxWidth);
  }

  // Determine overall layout width
  const maxItemWidth = Math.max(...itemWidths);
  const layoutWidth = input.width ?? maxItemWidth;

  return {
    itemLines,
    itemWidths,
    layoutWidth,
    align: input.align,
    gap: input.gap,
  };
}

/**
 * Align a line within a given width.
 *
 * @param line - The line to align
 * @param lineWidth - The visual width of the line
 * @param targetWidth - The width to align within
 * @param align - The alignment type
 * @returns The aligned line (with padding)
 */
export function alignLine(
  line: string,
  lineWidth: number,
  targetWidth: number,
  align: VerticalAlign
): string {
  if (lineWidth >= targetWidth || align === "left") {
    return line;
  }

  const padding = targetWidth - lineWidth;

  if (align === "right") {
    return " ".repeat(padding) + line;
  }

  // Center alignment
  const leftPad = Math.floor(padding / 2);
  return " ".repeat(leftPad) + line;
}

/**
 * Measure the final output dimensions.
 *
 * @param layout - The computed layout
 * @returns Width and line count
 */
export function measureVerticalOutput(layout: VerticalLayoutComputed): {
  width: number;
  lineCount: number;
} {
  let totalLines = 0;

  for (let i = 0; i < layout.itemLines.length; i++) {
    const lines = layout.itemLines[i];
    if (lines) {
      totalLines += lines.length;
    }

    // Add gap lines between items (not after the last item)
    if (i < layout.itemLines.length - 1) {
      totalLines += layout.gap;
    }
  }

  return {
    width: layout.layoutWidth,
    lineCount: totalLines,
  };
}
