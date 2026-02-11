import { z } from "zod";

/**
 * Border style options for box rendering.
 */
export const borderStyleSchema = z.enum([
  "single",
  "double",
  "round",
  "bold",
  "singleDouble",
  "doubleSingle",
  "classic",
  "none",
]);

export type BorderStyle = z.infer<typeof borderStyleSchema>;

/**
 * Text alignment options.
 */
export const alignmentSchema = z.enum(["left", "center", "right"]);

export type Alignment = z.infer<typeof alignmentSchema>;

/**
 * Padding configuration - can be a single number or object with sides.
 */
export const paddingSchema = z.union([
  z.number().int().nonnegative(),
  z.object({
    top: z.number().int().nonnegative().optional().default(0),
    right: z.number().int().nonnegative().optional().default(0),
    bottom: z.number().int().nonnegative().optional().default(0),
    left: z.number().int().nonnegative().optional().default(0),
  }),
]);

export type Padding = z.infer<typeof paddingSchema>;

/**
 * Normalized padding with all sides specified.
 */
export interface NormalizedPadding {
  top: number;
  right: number;
  bottom: number;
  left: number;
}

/**
 * Schema for box component input.
 */
export const boxInputSchema = z.object({
  /** Content to display inside the box */
  content: z.string(),
  /** Title to display in the top border */
  title: z.string().optional(),
  /** Title alignment */
  titleAlignment: alignmentSchema.optional().default("left"),
  /** Border style */
  borderStyle: borderStyleSchema.optional().default("single"),
  /** Padding inside the box */
  padding: paddingSchema.optional().default(0),
  /** Fixed width (if not set, fits content) */
  width: z.number().int().positive().optional(),
  /** Text alignment within the box */
  textAlignment: alignmentSchema.optional().default("left"),
  /** Whether to dim the border */
  dimBorder: z.boolean().optional().default(false),
});

/**
 * Input type (before defaults applied).
 */
export type BoxInput = z.input<typeof boxInputSchema>;

/**
 * Input type (after defaults applied).
 */
export type BoxInputWithDefaults = z.output<typeof boxInputSchema>;
