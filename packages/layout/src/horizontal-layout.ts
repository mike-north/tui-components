import {
  getStringWidth,
  measureLines,
  padToWidth,
  truncateToWidth,
} from "@tuicomponents/core";
import type {
  HorizontalLayoutInputWithDefaults,
  HorizontalVerticalAlign,
  WidthSpec,
} from "./horizontal-schema.js";

/**
 * Pre-computed layout for horizontal layout.
 */
export interface HorizontalLayoutComputed {
  /** The lines of each item, split by newline */
  itemLines: string[][];
  /** The natural width of each item (widest line) */
  itemNaturalWidths: number[];
  /** The computed/allocated width for each item */
  itemAllocatedWidths: number[];
  /** The height (line count) of each item */
  itemHeights: number[];
  /** Maximum height across all items */
  maxHeight: number;
  /** The overall layout width */
  layoutWidth: number;
  /** Vertical alignment */
  verticalAlign: HorizontalVerticalAlign;
  /** Gap between items */
  gap: number;
  /** Whether to stack (overflow fallback) */
  shouldStack: boolean;
}

/**
 * Compute the layout for a horizontal layout.
 *
 * @param input - Validated horizontal layout input with defaults applied
 * @param contextWidth - Available width from render context (optional)
 * @returns Computed layout ready for rendering
 */
export function computeHorizontalLayout(
  input: HorizontalLayoutInputWithDefaults,
  contextWidth?: number
): HorizontalLayoutComputed {
  const { items, gap, widthMode, widths, verticalAlign, minItemWidth } = input;

  // Measure each item
  const itemLines: string[][] = [];
  const itemNaturalWidths: number[] = [];
  const itemHeights: number[] = [];

  for (const item of items) {
    const measured = measureLines(item);
    itemLines.push(measured.lines);
    itemNaturalWidths.push(measured.maxWidth);
    itemHeights.push(measured.lineCount);
  }

  const maxHeight = Math.max(...itemHeights);

  // Calculate total gap space
  const totalGapWidth = gap * (items.length - 1);

  // Determine layout width based on mode and input
  const totalNaturalWidth =
    itemNaturalWidths.reduce((a, b) => a + b, 0) + totalGapWidth;

  // Use explicit width if provided, otherwise:
  // - For "auto" mode: use natural widths (no padding)
  // - For "equal" and "manual" modes: use context width or natural width
  let layoutWidth: number;
  if (input.width !== undefined) {
    layoutWidth = input.width;
  } else if (widthMode === "auto") {
    // In auto mode without explicit width, use natural widths
    layoutWidth = totalNaturalWidth;
  } else {
    // For equal/manual modes, prefer context width for distribution
    layoutWidth = contextWidth ?? totalNaturalWidth;
  }

  // Calculate available width for items (excluding gaps)
  const availableForItems = layoutWidth - totalGapWidth;

  // Compute allocated widths based on mode
  let itemAllocatedWidths: number[];

  switch (widthMode) {
    case "equal":
      itemAllocatedWidths = computeEqualWidths(
        items.length,
        availableForItems,
        minItemWidth
      );
      break;

    case "manual":
      itemAllocatedWidths = computeManualWidths(
        widths ?? itemNaturalWidths.map(() => "auto" as const),
        itemNaturalWidths,
        availableForItems,
        minItemWidth
      );
      break;

    case "auto":
    default:
      // In auto mode, items use their natural width (no shrinking/expanding)
      itemAllocatedWidths = itemNaturalWidths.map((w) =>
        Math.max(w, minItemWidth)
      );
      break;
  }

  // Check if we need to stack due to overflow
  const totalAllocatedWidth =
    itemAllocatedWidths.reduce((a, b) => a + b, 0) + totalGapWidth;
  const shouldStack =
    input.overflow === "stack" && totalAllocatedWidth > layoutWidth;

  return {
    itemLines,
    itemNaturalWidths,
    itemAllocatedWidths,
    itemHeights,
    maxHeight,
    layoutWidth,
    verticalAlign,
    gap,
    shouldStack,
  };
}

/**
 * Compute equal widths for all items.
 */
function computeEqualWidths(
  itemCount: number,
  availableWidth: number,
  minWidth: number
): number[] {
  const baseWidth = Math.max(minWidth, Math.floor(availableWidth / itemCount));
  const remainder = availableWidth - baseWidth * itemCount;

  // Distribute remainder to first items
  return Array.from({ length: itemCount }, (_, i) =>
    i < remainder ? baseWidth + 1 : baseWidth
  );
}

/**
 * Compute widths based on manual specifications.
 */
function computeManualWidths(
  specs: WidthSpec[],
  naturalWidths: number[],
  availableWidth: number,
  minWidth: number
): number[] {
  const results: number[] = [];
  let usedWidth = 0;
  let fillCount = 0;

  // First pass: count fixed widths and fill items
  for (let i = 0; i < specs.length; i++) {
    const spec = specs[i] ?? "auto";
    const natural = naturalWidths[i] ?? 0;

    if (spec === "fill") {
      fillCount++;
      results.push(-1); // Placeholder
    } else if (spec === "auto") {
      const width = Math.max(natural, minWidth);
      results.push(width);
      usedWidth += width;
    } else {
      // Fixed width
      const width = Math.max(spec, minWidth);
      results.push(width);
      usedWidth += width;
    }
  }

  // Second pass: distribute remaining space to fill items
  if (fillCount > 0) {
    const remainingWidth = Math.max(0, availableWidth - usedWidth);
    const fillWidth = Math.max(
      minWidth,
      Math.floor(remainingWidth / fillCount)
    );
    const fillRemainder = remainingWidth - fillWidth * fillCount;

    let fillIndex = 0;
    for (let i = 0; i < results.length; i++) {
      if (results[i] === -1) {
        results[i] = fillWidth + (fillIndex < fillRemainder ? 1 : 0);
        fillIndex++;
      }
    }
  }

  return results;
}

/**
 * Pad lines vertically to match target height.
 *
 * @param lines - The lines to pad
 * @param targetHeight - Target number of lines
 * @param align - Vertical alignment
 * @returns Padded lines array
 */
export function padLinesVertically(
  lines: string[],
  targetHeight: number,
  align: HorizontalVerticalAlign
): string[] {
  if (lines.length >= targetHeight) {
    return lines;
  }

  const padding = targetHeight - lines.length;
  const emptyLine = "";

  switch (align) {
    case "bottom": {
      const topPad = Array<string>(padding).fill(emptyLine);
      return [...topPad, ...lines];
    }
    case "middle": {
      const topPad = Array<string>(Math.floor(padding / 2)).fill(emptyLine);
      const bottomPad = Array<string>(Math.ceil(padding / 2)).fill(emptyLine);
      return [...topPad, ...lines, ...bottomPad];
    }
    case "top":
    default: {
      const bottomPad = Array<string>(padding).fill(emptyLine);
      return [...lines, ...bottomPad];
    }
  }
}

/**
 * Fit a line to a target width (pad or truncate).
 *
 * @param line - The line to fit
 * @param targetWidth - Target width
 * @returns Fitted line
 */
export function fitLineToWidth(line: string, targetWidth: number): string {
  const lineWidth = getStringWidth(line);

  if (lineWidth === targetWidth) {
    return line;
  }

  if (lineWidth > targetWidth) {
    return truncateToWidth(line, targetWidth);
  }

  return padToWidth(line, targetWidth);
}

/**
 * Measure the final output dimensions.
 *
 * @param layout - The computed layout
 * @returns Width and line count
 */
export function measureHorizontalOutput(layout: HorizontalLayoutComputed): {
  width: number;
  lineCount: number;
} {
  if (layout.shouldStack) {
    // When stacking, height is sum of all items
    const totalLines = layout.itemHeights.reduce((a, b) => a + b, 0);
    const maxWidth = Math.max(...layout.itemNaturalWidths);
    return {
      width: maxWidth,
      lineCount: totalLines,
    };
  }

  return {
    width: layout.layoutWidth,
    lineCount: layout.maxHeight,
  };
}
