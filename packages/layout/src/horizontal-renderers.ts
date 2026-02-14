import { anchorLine, DEFAULT_ANCHOR } from "@tuicomponents/core";
import type { HorizontalLayoutComputed } from "./horizontal-layout.js";
import { fitLineToWidth, padLinesVertically } from "./horizontal-layout.js";

/**
 * Render a horizontal layout using ANSI escape codes for rich terminal output.
 *
 * @param layout - Pre-computed horizontal layout
 * @returns ANSI-formatted horizontal layout string
 */
export function renderHorizontalLayoutAnsi(
  layout: HorizontalLayoutComputed
): string {
  // If we should stack due to overflow, render vertically
  if (layout.shouldStack) {
    return renderStackedAnsi(layout);
  }

  return renderSideBySideAnsi(layout);
}

/**
 * Render items side by side (ANSI).
 */
function renderSideBySideAnsi(layout: HorizontalLayoutComputed): string {
  const { itemLines, itemAllocatedWidths, maxHeight, verticalAlign, gap } =
    layout;

  const gapStr = " ".repeat(gap);
  const outputLines: string[] = [];

  // Prepare all items: pad vertically and fit widths
  const preparedItems: string[][] = [];

  for (let i = 0; i < itemLines.length; i++) {
    const lines = itemLines[i] ?? [];
    const allocatedWidth = itemAllocatedWidths[i] ?? 0;

    // Pad vertically to match max height
    const paddedLines = padLinesVertically(lines, maxHeight, verticalAlign);

    // Fit each line to the allocated width
    const fittedLines = paddedLines.map((line) =>
      fitLineToWidth(line, allocatedWidth)
    );

    preparedItems.push(fittedLines);
  }

  // Combine lines horizontally
  for (let lineIdx = 0; lineIdx < maxHeight; lineIdx++) {
    const rowParts: string[] = [];

    for (const item of preparedItems) {
      const line = item[lineIdx] ?? "";
      rowParts.push(line);
    }

    outputLines.push(rowParts.join(gapStr));
  }

  return outputLines.join("\n");
}

/**
 * Render items stacked vertically (fallback for overflow).
 */
function renderStackedAnsi(layout: HorizontalLayoutComputed): string {
  const outputLines: string[] = [];

  for (const lines of layout.itemLines) {
    for (const line of lines) {
      outputLines.push(line);
    }
  }

  return outputLines.join("\n");
}

/**
 * Render a horizontal layout using markdown-friendly output.
 *
 * @param layout - Pre-computed horizontal layout
 * @returns Markdown-friendly horizontal layout string
 */
export function renderHorizontalLayoutMarkdown(
  layout: HorizontalLayoutComputed
): string {
  // If we should stack due to overflow, render vertically
  if (layout.shouldStack) {
    return renderStackedMarkdown(layout);
  }

  return renderSideBySideMarkdown(layout);
}

/**
 * Render items side by side (Markdown).
 */
function renderSideBySideMarkdown(layout: HorizontalLayoutComputed): string {
  const { itemLines, itemAllocatedWidths, maxHeight, verticalAlign, gap } =
    layout;

  const gapStr = " ".repeat(gap);
  const outputLines: string[] = [];

  // Prepare all items: pad vertically and fit widths
  const preparedItems: string[][] = [];

  for (let i = 0; i < itemLines.length; i++) {
    const lines = itemLines[i] ?? [];
    const allocatedWidth = itemAllocatedWidths[i] ?? 0;

    // Pad vertically to match max height
    const paddedLines = padLinesVertically(lines, maxHeight, verticalAlign);

    // Fit each line to the allocated width
    const fittedLines = paddedLines.map((line) =>
      fitLineToWidth(line, allocatedWidth)
    );

    preparedItems.push(fittedLines);
  }

  // Combine lines horizontally
  for (let lineIdx = 0; lineIdx < maxHeight; lineIdx++) {
    const rowParts: string[] = [];

    for (const item of preparedItems) {
      const line = item[lineIdx] ?? "";
      rowParts.push(line);
    }

    // Apply anchor for markdown mode
    outputLines.push(anchorLine(rowParts.join(gapStr), DEFAULT_ANCHOR));
  }

  return outputLines.join("\n");
}

/**
 * Render items stacked vertically (Markdown fallback).
 */
function renderStackedMarkdown(layout: HorizontalLayoutComputed): string {
  const outputLines: string[] = [];

  for (const lines of layout.itemLines) {
    for (const line of lines) {
      outputLines.push(anchorLine(line, DEFAULT_ANCHOR));
    }
  }

  return outputLines.join("\n");
}
