import {
  anchorLine,
  DEFAULT_ANCHOR,
  getStringWidth,
} from "@tuicomponents/core";
import type { VerticalLayoutComputed } from "./layout.js";
import { alignLine } from "./layout.js";

/**
 * Render a vertical layout using ANSI escape codes for rich terminal output.
 *
 * @param layout - Pre-computed vertical layout
 * @returns ANSI-formatted vertical layout string
 */
export function renderVerticalLayoutAnsi(
  layout: VerticalLayoutComputed
): string {
  const outputLines: string[] = [];

  for (let i = 0; i < layout.itemLines.length; i++) {
    const itemLines = layout.itemLines[i];
    if (itemLines) {
      for (const line of itemLines) {
        const lineWidth = getStringWidth(line);
        const aligned = alignLine(
          line,
          lineWidth,
          layout.layoutWidth,
          layout.align
        );
        outputLines.push(aligned);
      }
    }

    // Add gap lines between items (not after the last item)
    if (i < layout.itemLines.length - 1 && layout.gap > 0) {
      for (let g = 0; g < layout.gap; g++) {
        outputLines.push("");
      }
    }
  }

  return outputLines.join("\n");
}

/**
 * Render a vertical layout using markdown-friendly output.
 *
 * @param layout - Pre-computed vertical layout
 * @returns Markdown-friendly vertical layout string
 */
export function renderVerticalLayoutMarkdown(
  layout: VerticalLayoutComputed
): string {
  const outputLines: string[] = [];

  for (let i = 0; i < layout.itemLines.length; i++) {
    const itemLines = layout.itemLines[i];
    if (itemLines) {
      for (const line of itemLines) {
        const lineWidth = getStringWidth(line);
        const aligned = alignLine(
          line,
          lineWidth,
          layout.layoutWidth,
          layout.align
        );
        // Apply anchor to each line for markdown mode
        outputLines.push(anchorLine(aligned, DEFAULT_ANCHOR));
      }
    }

    // Add gap lines between items (not after the last item)
    if (i < layout.itemLines.length - 1 && layout.gap > 0) {
      for (let g = 0; g < layout.gap; g++) {
        outputLines.push(anchorLine("", DEFAULT_ANCHOR));
      }
    }
  }

  return outputLines.join("\n");
}
