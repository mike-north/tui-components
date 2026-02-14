import { z } from "zod";

/**
 * Semantic callout types with default styling.
 */
export const calloutTypeSchema = z.enum([
  "tip",
  "note",
  "info",
  "warning",
  "error",
  "success",
]);

export type CalloutType = z.infer<typeof calloutTypeSchema>;

/**
 * Border style options for callout rendering.
 */
export const borderStyleSchema = z.enum([
  "single",
  "double",
  "round",
  "bold",
  "none",
]);

export type BorderStyle = z.infer<typeof borderStyleSchema>;

/**
 * Schema for callout component input.
 */
export const calloutInputSchema = z.object({
  /**
   * The message content to display in the callout.
   */
  message: z.string(),

  /**
   * Semantic type of the callout.
   * Determines default icon, color, and title.
   * @default "info"
   */
  type: calloutTypeSchema.default("info"),

  /**
   * Custom title to override the default for the type.
   * If not provided, uses the default title for the type (e.g., "Tip", "Warning").
   */
  title: z.string().optional(),

  /**
   * Custom icon to override the default for the type.
   * Set to empty string to hide the icon.
   */
  icon: z.string().optional(),

  /**
   * Border style for the callout box.
   * @default "round"
   */
  borderStyle: borderStyleSchema.default("round"),

  /**
   * Fixed width for the callout.
   * If not specified, fits the content (minimum 40 characters).
   */
  width: z.number().int().positive().optional(),
});

export type CalloutInput = z.input<typeof calloutInputSchema>;
export type CalloutInputWithDefaults = z.output<typeof calloutInputSchema>;
