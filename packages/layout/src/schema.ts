import { z } from "zod";

/**
 * Alignment options for vertical layout items.
 */
export const verticalAlignSchema = z.enum(["left", "center", "right"]);

export type VerticalAlign = z.infer<typeof verticalAlignSchema>;

/**
 * Schema for a vertical layout item.
 * Items are pre-rendered strings that will be stacked vertically.
 */
export const verticalLayoutItemSchema = z.string();

export type VerticalLayoutItem = z.infer<typeof verticalLayoutItemSchema>;

/**
 * Schema for vertical layout component input.
 */
export const verticalLayoutInputSchema = z.object({
  /**
   * Items to stack vertically.
   * Each item is a pre-rendered string (output from another component or plain text).
   */
  items: z.array(verticalLayoutItemSchema).min(1),

  /**
   * Number of blank lines between items.
   * @default 0
   */
  gap: z.number().int().nonnegative().default(0),

  /**
   * Target width for alignment purposes.
   * If not specified, uses the width of the widest item.
   */
  width: z.number().int().positive().optional(),

  /**
   * Horizontal alignment of items within the layout width.
   * @default "left"
   */
  align: verticalAlignSchema.default("left"),
});

export type VerticalLayoutInput = z.input<typeof verticalLayoutInputSchema>;
export type VerticalLayoutInputWithDefaults = z.output<
  typeof verticalLayoutInputSchema
>;
