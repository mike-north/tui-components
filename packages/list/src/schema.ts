import { z } from "zod";

/**
 * List style options.
 *
 * @public
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
  "task",
  "definition",
]);

/**
 * @public
 */
export type ListStyle = z.infer<typeof listStyleSchema>;

/**
 * Task item checked state.
 * - `true`: Completed (checked)
 * - `false`: Not completed (unchecked)
 * - `"partial"`: Partially completed
 *
 * @public
 */
export const taskCheckedSchema = z.union([z.boolean(), z.literal("partial")]);

/**
 * @public
 */
export type TaskChecked = z.infer<typeof taskCheckedSchema>;

/**
 * Base list item schema (standard items).
 */
const baseListItemSchema = z.object({
  /** Text content of the list item */
  text: z.string(),
});

/**
 * Task list item schema.
 *
 * @public
 */
export const taskItemSchema = z.object({
  /** Text content of the task */
  text: z.string(),
  /** Whether the task is checked/completed */
  checked: taskCheckedSchema,
});

/**
 * @public
 */
export type TaskItem = z.infer<typeof taskItemSchema>;

/**
 * Definition list item schema.
 *
 * @public
 */
export const definitionItemSchema = z.object({
  /** The term being defined */
  term: z.string(),
  /** The definition of the term */
  definition: z.string(),
});

/**
 * @public
 */
export type DefinitionItem = z.infer<typeof definitionItemSchema>;

/**
 * Schema for a list item with optional nested items.
 * Can be a standard item, task item, or definition item.
 *
 * Note: Order matters - more specific schemas (task, definition) come first
 * so they are tried before the more general standard item schema.
 *
 * @public
 */
export const listItemSchema: z.ZodType<
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  any,
  z.ZodTypeDef,
  unknown
> = z.union([
  // Task item (has 'checked' property - must come before standard item)
  taskItemSchema,
  // Definition item (has 'term' and 'definition' properties)
  definitionItemSchema,
  // Standard item with optional nesting (most general - must come last)
  baseListItemSchema.extend({
    /** Nested list items */
    items: z.lazy(() => z.array(listItemSchema)).optional(),
  }),
]);

/**
 * Standard list item type.
 *
 * @public
 */
export type StandardItem = z.infer<typeof baseListItemSchema> & {
  items?: ListItem[];
};

/**
 * List item type (union of all item types).
 *
 * @public
 */
export type ListItem = StandardItem | TaskItem | DefinitionItem;

/**
 * Type guard for task items.
 *
 * @public
 */
export function isTaskItem(item: ListItem): item is TaskItem {
  return "checked" in item;
}

/**
 * Type guard for definition items.
 *
 * @public
 */
export function isDefinitionItem(item: ListItem): item is DefinitionItem {
  return "term" in item && "definition" in item;
}

/**
 * Type guard for standard items.
 *
 * @public
 */
export function isStandardItem(item: ListItem): item is StandardItem {
  return "text" in item && !("checked" in item) && !("term" in item);
}

/**
 * Schema for list component input.
 *
 * @public
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
  /**
   * Width for definition terms (definition style only).
   * If not provided, auto-calculates from longest term.
   */
  termWidth: z.number().int().positive().optional(),
});

/**
 * Input type (before defaults applied).
 *
 * @public
 */
export type ListInput = z.input<typeof listInputSchema>;

/**
 * Input type (after defaults applied).
 *
 * @public
 */
export type ListInputWithDefaults = z.output<typeof listInputSchema>;
