import { z } from "zod";

/**
 * Vertical alignment options for horizontal layout items.
 * Used when items have different heights.
 */
export const horizontalVerticalAlignSchema = z.enum([
  "top",
  "middle",
  "bottom",
]);

export type HorizontalVerticalAlign = z.infer<
  typeof horizontalVerticalAlignSchema
>;

/**
 * Width distribution mode for horizontal layout.
 * - `equal`: All items get equal width (layout width / item count)
 * - `auto`: Items get their natural width, remaining space distributed to 'fill' items
 * - `manual`: Use explicit widths array
 */
export const widthModeSchema = z.enum(["equal", "auto", "manual"]);

export type WidthMode = z.infer<typeof widthModeSchema>;

/**
 * Width specification for an item.
 * - number: Fixed width in columns
 * - 'fill': Expand to fill remaining space (divided among all 'fill' items)
 * - 'auto': Use natural width of the item
 */
export const widthSpecSchema = z.union([
  z.number().int().positive(),
  z.literal("fill"),
  z.literal("auto"),
]);

export type WidthSpec = z.infer<typeof widthSpecSchema>;

/**
 * Overflow behavior when items don't fit.
 * - `truncate`: Truncate items to fit
 * - `stack`: Fall back to vertical stacking
 */
export const overflowBehaviorSchema = z.enum(["truncate", "stack"]);

export type OverflowBehavior = z.infer<typeof overflowBehaviorSchema>;

/**
 * Schema for horizontal layout component input.
 */
export const horizontalLayoutInputSchema = z.object({
  /**
   * Items to arrange horizontally.
   * Each item is a pre-rendered string (output from another component or plain text).
   */
  items: z.array(z.string()).min(1),

  /**
   * Width distribution mode.
   * - `equal`: All items get equal width
   * - `auto`: Items get natural width, 'fill' items expand
   * - `manual`: Use explicit widths array
   * @default "auto"
   */
  widthMode: widthModeSchema.default("auto"),

  /**
   * Explicit width specifications for each item.
   * Only used when widthMode is 'manual'.
   * Can be a number (fixed width), 'fill' (expand), or 'auto' (natural width).
   */
  widths: z.array(widthSpecSchema).optional(),

  /**
   * Number of columns between items (gap).
   * @default 1
   */
  gap: z.number().int().nonnegative().default(1),

  /**
   * Total width of the layout.
   * If not specified, calculated from context or sum of item widths.
   */
  width: z.number().int().positive().optional(),

  /**
   * Vertical alignment of items within the row.
   * Used when items have different heights.
   * @default "top"
   */
  verticalAlign: horizontalVerticalAlignSchema.default("top"),

  /**
   * Behavior when items don't fit in the available width.
   * - `truncate`: Truncate items to fit
   * - `stack`: Fall back to vertical stacking
   * @default "truncate"
   */
  overflow: overflowBehaviorSchema.default("truncate"),

  /**
   * Minimum width for any item (prevents items from becoming too narrow).
   * @default 3
   */
  minItemWidth: z.number().int().positive().default(3),
});

export type HorizontalLayoutInput = z.input<typeof horizontalLayoutInputSchema>;
export type HorizontalLayoutInputWithDefaults = z.output<
  typeof horizontalLayoutInputSchema
>;
