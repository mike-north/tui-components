import type { SparklineInputWithDefaults } from "./schema.js";

/**
 * Height block characters from lowest to highest.
 * Index 0 is the shortest bar, index 7 is the tallest.
 */
export const HEIGHT_BLOCKS = ["▁", "▂", "▃", "▄", "▅", "▆", "▇", "█"] as const;

/**
 * Middle block index (used when all values are equal).
 */
const MIDDLE_BLOCK_INDEX = 4;

/**
 * Layout information for a sparkline.
 */
export interface SparklineLayout {
  /** The computed sparkline string (blocks only) */
  blocks: string;
  /** Optional label prefix */
  label: string | undefined;
  /** Total visual width of the output */
  totalWidth: number;
}

/**
 * Map a value to a height block index (0-7).
 *
 * @param value - The value to map
 * @param min - Minimum value in the range
 * @param max - Maximum value in the range
 * @returns Block index (0-7)
 */
function valueToBlockIndex(value: number, min: number, max: number): number {
  // If min === max, all values are equal, use middle block
  if (max === min) {
    return MIDDLE_BLOCK_INDEX;
  }

  // Normalize value to 0-1 range
  const normalized = (value - min) / (max - min);

  // Scale to 0-7 range and clamp
  // We use Math.floor and then clamp to ensure we get 0-7
  const index = Math.floor(normalized * 8);

  // Clamp to valid range (handles edge cases like value === max)
  return Math.max(0, Math.min(7, index));
}

/**
 * Bucket values into groups and return averaged values.
 *
 * @param values - Array of values to bucket
 * @param targetWidth - Target number of buckets
 * @returns Array of averaged values
 */
function bucketValues(values: number[], targetWidth: number): number[] {
  if (targetWidth >= values.length) {
    return values;
  }

  const result: number[] = [];
  const bucketSize = values.length / targetWidth;

  for (let i = 0; i < targetWidth; i++) {
    const startIndex = Math.floor(i * bucketSize);
    const endIndex = Math.floor((i + 1) * bucketSize);

    // Calculate average for this bucket
    let sum = 0;
    let count = 0;
    for (let j = startIndex; j < endIndex && j < values.length; j++) {
      const value = values[j];
      if (value !== undefined) {
        sum += value;
        count++;
      }
    }

    result.push(count > 0 ? sum / count : 0);
  }

  return result;
}

/**
 * Compute the layout for a sparkline.
 *
 * @param input - Validated sparkline input
 * @returns Layout information
 */
export function computeSparklineLayout(
  input: SparklineInputWithDefaults
): SparklineLayout {
  const { values, width, min: explicitMin, max: explicitMax, label } = input;

  // Apply width compression if needed
  const displayValues =
    width !== undefined && width < values.length
      ? bucketValues(values, width)
      : values;

  // Determine min/max for scaling
  const actualMin = Math.min(...displayValues);
  const actualMax = Math.max(...displayValues);
  const min = explicitMin ?? actualMin;
  const max = explicitMax ?? actualMax;

  // Convert values to block characters
  const blocks = displayValues
    .map((v) => {
      // Clamp value to explicit min/max range if provided
      const clampedValue = Math.max(min, Math.min(max, v));
      const index = valueToBlockIndex(clampedValue, min, max);
      return HEIGHT_BLOCKS[index];
    })
    .join("");

  // Calculate total width
  const labelWidth = label?.length ?? 0;
  const blocksWidth = displayValues.length;
  const totalWidth = labelWidth + blocksWidth;

  return {
    blocks,
    label,
    totalWidth,
  };
}
