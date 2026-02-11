import { z } from "zod";

/**
 * List style options.
 */
export const listStyleSchema = z.enum([
  "bullet",
  "dash",
  "arrow",
  "star",
  "numbered",
  "lettered",
  "roman",
  "none",
]);

export type ListStyle = z.infer<typeof listStyleSchema>;

/**
 * Base list item schema.
 */
const baseListItemSchema = z.object({
  /** Text content of the list item */
  text: z.string(),
});

/**
 * Schema for a list item with optional nested items.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const listItemSchema: z.ZodType<any, z.ZodTypeDef, unknown> =
  baseListItemSchema.extend({
    /** Nested list items */
    items: z.lazy(() => z.array(listItemSchema)).optional(),
  });

/**
 * List item type.
 */
export type ListItem = z.infer<typeof baseListItemSchema> & {
  items?: ListItem[];
};

/**
 * Schema for list component input.
 */
export const listInputSchema = z.object({
  /** Array of list items */
  items: z.array(listItemSchema),
  /** List style (bullet type or numbering style) */
  style: listStyleSchema.optional().default("bullet"),
  /** Indentation width per nesting level */
  indent: z.number().int().positive().optional().default(2),
  /** Starting number for numbered lists */
  start: z.number().int().positive().optional().default(1),
});

/**
 * Input type (before defaults applied).
 */
export type ListInput = z.input<typeof listInputSchema>;

/**
 * Input type (after defaults applied).
 */
export type ListInputWithDefaults = z.output<typeof listInputSchema>;
