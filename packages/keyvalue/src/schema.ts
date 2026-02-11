import { z } from "zod";

/**
 * Separator style options.
 */
export const separatorStyleSchema = z.enum([
  "colon",
  "equals",
  "arrow",
  "dots",
  "none",
]);

export type SeparatorStyle = z.infer<typeof separatorStyleSchema>;

/**
 * Schema for a single key-value pair.
 */
export const keyValuePairSchema = z.object({
  /** Key/label for this pair */
  key: z.string(),
  /** Value for this pair */
  value: z.union([z.string(), z.number(), z.boolean()]),
});

export type KeyValuePair = z.infer<typeof keyValuePairSchema>;

/**
 * Schema for keyvalue component input.
 */
export const keyValueInputSchema = z.object({
  /** Array of key-value pairs */
  pairs: z.array(keyValuePairSchema),
  /** Separator between key and value */
  separator: separatorStyleSchema.optional().default("colon"),
  /** Align keys to the same width */
  alignKeys: z.boolean().optional().default(true),
  /** Minimum key width (for alignment) */
  minKeyWidth: z.number().int().nonnegative().optional(),
  /** Gap between key+separator and value */
  gap: z.number().int().nonnegative().optional().default(1),
});

/**
 * Input type (before defaults applied).
 */
export type KeyValueInput = z.input<typeof keyValueInputSchema>;

/**
 * Input type (after defaults applied).
 */
export type KeyValueInputWithDefaults = z.output<typeof keyValueInputSchema>;
