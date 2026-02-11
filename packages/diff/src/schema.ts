import { z } from "zod";

/**
 * Type of diff line.
 */
export const lineTypeSchema = z.enum([
  "addition", // Added line (+)
  "deletion", // Removed line (-)
  "context", // Unchanged context line
]);

export type LineType = z.infer<typeof lineTypeSchema>;

/**
 * Schema for a single diff line.
 */
export const diffLineSchema = z.object({
  /**
   * Type of the line.
   */
  type: lineTypeSchema,

  /**
   * Content of the line.
   */
  content: z.string(),

  /**
   * Optional line number in the old file (for deletions and context).
   */
  oldLineNumber: z.number().int().positive().optional(),

  /**
   * Optional line number in the new file (for additions and context).
   */
  newLineNumber: z.number().int().positive().optional(),
});

export type DiffLine = z.infer<typeof diffLineSchema>;

/**
 * Schema for a hunk (section of changes).
 */
export const hunkSchema = z.object({
  /**
   * Hunk header information.
   */
  header: z
    .object({
      oldStart: z.number().int().nonnegative(),
      oldCount: z.number().int().nonnegative(),
      newStart: z.number().int().nonnegative(),
      newCount: z.number().int().nonnegative(),
    })
    .optional(),

  /**
   * Lines in the hunk.
   */
  lines: z.array(diffLineSchema),
});

export type Hunk = z.infer<typeof hunkSchema>;

/**
 * Style options for line markers.
 */
export const markerStyleSchema = z.enum([
  "symbol", // +/- markers
  "word", // ADD/DEL markers
  "none", // No markers, rely on color/indentation
]);

export type MarkerStyle = z.infer<typeof markerStyleSchema>;

/**
 * Schema for diff component input.
 */
export const diffInputSchema = z.object({
  /**
   * Array of hunks containing diff lines.
   */
  hunks: z.array(hunkSchema),

  /**
   * Optional old file name for header.
   */
  oldFile: z.string().optional(),

  /**
   * Optional new file name for header.
   */
  newFile: z.string().optional(),

  /**
   * Show line numbers.
   * @default false
   */
  showLineNumbers: z.boolean().default(false),

  /**
   * Style for line markers.
   * @default "symbol"
   */
  markerStyle: markerStyleSchema.default("symbol"),

  /**
   * Show hunk headers (@@ -x,y +a,b @@).
   * @default true
   */
  showHunkHeaders: z.boolean().default(true),

  /**
   * Number of context lines to show around changes.
   * This is informational only - the component renders what you provide.
   */
  contextLines: z.number().int().nonnegative().optional(),
});

export type DiffInput = z.input<typeof diffInputSchema>;
export type DiffInputWithDefaults = z.output<typeof diffInputSchema>;
