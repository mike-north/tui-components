import { z } from "zod";

/**
 * Text alignment options for table columns.
 */
export const alignmentSchema = z.enum(["left", "center", "right"]);
export type Alignment = z.infer<typeof alignmentSchema>;

/**
 * Border style options for tables.
 */
export const borderStyleSchema = z.enum([
  "none",
  "single",
  "double",
  "rounded",
  "heavy",
  "ascii",
]);
export type BorderStyle = z.infer<typeof borderStyleSchema>;

/**
 * Header text formatting options.
 *
 * In markdown mode:
 * - "normal": plain text
 * - "bold": **text**
 * - "italic": _text_
 * - "bold-italic": ***text***
 *
 * In ANSI mode, corresponding terminal styles are applied.
 */
export const headerStyleSchema = z.enum([
  "normal",
  "bold",
  "italic",
  "bold-italic",
]);
export type HeaderStyle = z.infer<typeof headerStyleSchema>;

/**
 * Schema for a table column definition.
 */
export const columnSchema = z.object({
  /** Column header text */
  header: z.string(),
  /** Key to extract value from row objects */
  key: z.string(),
  /** Column width (auto-calculated if not specified) */
  width: z.number().int().positive().optional(),
  /** Minimum column width */
  minWidth: z.number().int().positive().optional(),
  /** Maximum column width */
  maxWidth: z.number().int().positive().optional(),
  /** Text alignment (default: left) */
  align: alignmentSchema.optional().default("left"),
});

/**
 * Column input type (before defaults applied).
 */
export type Column = z.input<typeof columnSchema>;

/**
 * Column type with defaults applied.
 */
export type ColumnWithDefaults = z.output<typeof columnSchema>;

/**
 * Schema for table input data.
 */
export const tableInputSchema = z.object({
  /** Column definitions */
  columns: z.array(columnSchema).min(1),
  /** Row data as array of objects */
  rows: z.array(z.record(z.string(), z.unknown())),
  /** Border style (default: single) */
  borderStyle: borderStyleSchema.optional().default("single"),
  /** Whether to show header row (default: true) */
  showHeader: z.boolean().optional().default(true),
  /** Whether to show row separators (default: false) */
  rowSeparators: z.boolean().optional().default(false),
  /** Maximum table width (default: terminal width) */
  maxWidth: z.number().int().positive().optional(),
  /** Header text formatting style (default: bold) */
  headerStyle: headerStyleSchema.optional().default("bold"),
});

/**
 * Table input type (before defaults are applied).
 * Use this type for function parameters and metadata examples.
 */
export type TableInput = z.input<typeof tableInputSchema>;

/**
 * Table input type after defaults are applied.
 * Use this type for internal processing after schema parsing.
 */
export type TableInputWithDefaults = z.output<typeof tableInputSchema>;
