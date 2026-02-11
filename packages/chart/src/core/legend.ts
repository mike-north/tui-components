/**
 * Legend layout computation.
 */

import { getStringWidth } from "@tuicomponents/core";

/**
 * Legend position options.
 */
export type LegendPosition = "none" | "top" | "bottom" | "right" | "inline";

/**
 * A single legend item.
 */
export interface LegendItem {
  /** Series name */
  name: string;
  /** Symbol character */
  symbol: string;
  /** Whether to use inline code (backticks) for markdown */
  useBackticks: boolean;
}

/**
 * Configuration for legend layout.
 */
export interface LegendOptions {
  /** Legend items */
  items: LegendItem[];
  /** Legend position */
  position: LegendPosition;
  /** Whether to use boxed style */
  boxed?: boolean;
  /** Maximum width for wrapping */
  maxWidth?: number;
}

/**
 * A row of legend items.
 */
export interface LegendRow {
  /** Items in this row */
  items: LegendItem[];
  /** Total width of this row */
  width: number;
}

/**
 * Computed legend layout.
 */
export interface LegendLayout {
  /** Position of the legend */
  position: LegendPosition;
  /** Whether legend is boxed */
  boxed: boolean;
  /** Legend rows */
  rows: LegendRow[];
  /** Total width of legend */
  totalWidth: number;
  /** Total height of legend (rows) */
  totalHeight: number;
}

/**
 * Get the display width of a single legend item.
 *
 * Format: "█ Name" or "`█` Name" (with backticks)
 *
 * @param item - Legend item
 * @returns Display width in characters
 */
export function getLegendItemWidth(item: LegendItem): number {
  // Symbol + space + name
  const baseWidth = getStringWidth(item.symbol) + 1 + getStringWidth(item.name);

  // Backticks add 1 space before (for visual alignment compensation in markdown)
  if (item.useBackticks) {
    return baseWidth + 1;
  }

  return baseWidth;
}

/**
 * Format a legend item as a string.
 *
 * @param item - Legend item
 * @param forMarkdown - Whether to format for markdown
 * @returns Formatted string
 */
export function formatLegendItem(item: LegendItem, forMarkdown: boolean): string {
  if (forMarkdown && item.useBackticks) {
    return ` \`${item.symbol}\` ${item.name}`;
  }
  return `${item.symbol} ${item.name}`;
}

/**
 * Compute the layout for a legend.
 *
 * @param options - Legend configuration
 * @returns Computed legend layout
 */
export function computeLegendLayout(options: LegendOptions): LegendLayout {
  const {
    items,
    position,
    boxed = false,
    maxWidth = 80,
  } = options;

  if (position === "none" || items.length === 0) {
    return {
      position,
      boxed,
      rows: [],
      totalWidth: 0,
      totalHeight: 0,
    };
  }

  // Calculate item widths
  const itemWidths = items.map((item) => getLegendItemWidth(item));

  // Separator between items
  const separator = "  "; // Two spaces
  const separatorWidth = 2;

  // Try to fit all items on one row
  const rows: LegendRow[] = [];
  let currentRow: LegendItem[] = [];
  let currentWidth = 0;

  for (let i = 0; i < items.length; i++) {
    const item = items[i]!;
    const itemWidth = itemWidths[i]!;
    const widthWithSeparator = currentRow.length > 0 ? itemWidth + separatorWidth : itemWidth;

    if (currentWidth + widthWithSeparator > maxWidth && currentRow.length > 0) {
      // Start new row
      rows.push({ items: currentRow, width: currentWidth });
      currentRow = [item];
      currentWidth = itemWidth;
    } else {
      currentRow.push(item);
      currentWidth += widthWithSeparator;
    }
  }

  // Add final row
  if (currentRow.length > 0) {
    rows.push({ items: currentRow, width: currentWidth });
  }

  // Calculate total dimensions
  const totalWidth = Math.max(...rows.map((r) => r.width));
  const totalHeight = rows.length + (boxed ? 2 : 0); // Add 2 for box borders

  return {
    position,
    boxed,
    rows,
    totalWidth,
    totalHeight,
  };
}

/**
 * Render a legend row as a string.
 *
 * @param row - Legend row
 * @param forMarkdown - Whether to render for markdown
 * @returns Rendered string
 */
export function renderLegendRow(row: LegendRow, forMarkdown: boolean): string {
  return row.items
    .map((item) => formatLegendItem(item, forMarkdown))
    .join("  ");
}
