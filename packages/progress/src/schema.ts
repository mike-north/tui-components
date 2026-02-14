import { z } from "zod";

/**
 * Style options for progress bar characters.
 */
export const progressStyleSchema = z.enum([
  "block",
  "shaded",
  "bracket",
  "arrow",
  "ascii",
]);

export type ProgressStyle = z.infer<typeof progressStyleSchema>;

/**
 * Schema for progress component input.
 */
export const progressInputSchema = z.object({
  /**
   * Current progress value (0 or greater).
   * Required unless indeterminate state is desired.
   */
  value: z.number().nonnegative(),

  /**
   * Maximum value (determines 100%).
   * @default 100
   */
  max: z.number().positive().default(100),

  /**
   * Width of the progress bar in characters.
   * @default 20
   */
  width: z.number().int().positive().default(20),

  /**
   * Style for progress bar characters.
   * @default "block"
   */
  style: progressStyleSchema.default("block"),

  /**
   * Custom filled character (overrides style default).
   */
  filledChar: z.string().length(1).optional(),

  /**
   * Custom empty character (overrides style default).
   */
  emptyChar: z.string().length(1).optional(),

  /**
   * Optional label to display before the progress bar.
   */
  label: z.string().optional(),

  /**
   * Whether to show percentage after the bar.
   * @default true
   */
  showPercentage: z.boolean().default(true),

  /**
   * Whether to show the current/max value (e.g., "12/25").
   * @default false
   */
  showValue: z.boolean().default(false),

  /**
   * Whether to auto-fit the progress bar to the available width.
   * When true, the bar expands to fill context.width minus the label, percentage
   * (when showPercentage is true), and value suffix (when showValue is true).
   * @default false
   */
  fit: z.boolean().default(false),
});

export type ProgressInput = z.input<typeof progressInputSchema>;
export type ProgressInputWithDefaults = z.output<typeof progressInputSchema>;
