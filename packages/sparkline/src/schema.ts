import { z } from "zod";

/**
 * Input schema for the sparkline component.
 */
export const sparklineInputSchema = z.object({
  /** Array of numeric data points to visualize (at least 1 required) */
  values: z.array(z.number()).min(1),
  /** Compress output to this width if less than values.length */
  width: z.number().int().positive().optional(),
  /** Explicit minimum value for scaling (defaults to min of values) */
  min: z.number().optional(),
  /** Explicit maximum value for scaling (defaults to max of values) */
  max: z.number().optional(),
  /** Optional label prefix (e.g., "CPU: ") */
  label: z.string().optional(),
});

/**
 * Input type for the sparkline component (before defaults applied).
 */
export type SparklineInput = z.input<typeof sparklineInputSchema>;

/**
 * Input type for the sparkline component (after defaults applied).
 */
export type SparklineInputWithDefaults = z.output<typeof sparklineInputSchema>;
