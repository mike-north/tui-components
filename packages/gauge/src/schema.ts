import { z } from "zod";

/**
 * Semantic color options for gauge zones.
 */
export const gaugeZoneColorSchema = z.enum(["success", "warning", "error"]);

export type GaugeZoneColor = z.infer<typeof gaugeZoneColorSchema>;

/**
 * Schema for a zone in the gauge.
 * Zones define colored threshold regions.
 */
export const gaugeZoneSchema = z.object({
  /**
   * Upper bound of this zone (inclusive).
   * Value must be greater than the previous zone's threshold.
   */
  threshold: z.number(),

  /**
   * Optional semantic color for this zone.
   * If not specified, uses default bar appearance.
   */
  color: gaugeZoneColorSchema.optional(),
});

export type GaugeZone = z.infer<typeof gaugeZoneSchema>;

/**
 * Style options for gauge bar characters.
 */
export const gaugeStyleSchema = z.enum(["bar", "segments", "blocks"]);

export type GaugeStyle = z.infer<typeof gaugeStyleSchema>;

/**
 * Schema for gauge component input.
 */
export const gaugeInputSchema = z.object({
  /**
   * Current gauge value.
   */
  value: z.number(),

  /**
   * Minimum value on the scale.
   * @default 0
   */
  min: z.number().default(0),

  /**
   * Maximum value on the scale.
   * @default 100
   */
  max: z.number().default(100),

  /**
   * Optional zones for colored thresholds.
   * Zones should be ordered by increasing threshold.
   */
  zones: z.array(gaugeZoneSchema).optional(),

  /**
   * Width of the gauge bar in characters.
   * @default 20
   */
  width: z.number().int().positive().default(20),

  /**
   * Style for gauge bar characters.
   * @default "bar"
   */
  style: gaugeStyleSchema.default("bar"),

  /**
   * Optional label to display before the gauge.
   */
  label: z.string().optional(),

  /**
   * Whether to show the current value.
   * @default true
   */
  showValue: z.boolean().default(true),

  /**
   * Unit string to display after the value (e.g., "%", "°C").
   * @default ""
   */
  unit: z.string().default(""),
});

export type GaugeInput = z.input<typeof gaugeInputSchema>;
export type GaugeInputWithDefaults = z.output<typeof gaugeInputSchema>;
