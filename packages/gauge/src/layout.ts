import type {
  GaugeInputWithDefaults,
  GaugeZone,
  GaugeZoneColor,
} from "./schema.js";
import type { GaugeChars } from "./chars.js";

/**
 * A segment of the gauge bar with its color.
 */
export interface GaugeSegment {
  /** Number of characters in this segment */
  length: number;
  /** Whether this segment is filled */
  filled: boolean;
  /** Optional zone color for this segment */
  color?: GaugeZoneColor | undefined;
}

/**
 * Pre-computed layout for the gauge.
 */
export interface GaugeLayout {
  /** Label to display (empty string if none) */
  label: string;
  /** Segments of the gauge bar (filled and empty portions with colors) */
  segments: GaugeSegment[];
  /** Character for filled portions */
  filledChar: string;
  /** Character for empty portions */
  emptyChar: string;
  /** Current value (clamped to min/max) */
  displayValue: number;
  /** Formatted value string (e.g., "75%") */
  valueStr: string;
  /** Total width of the bar */
  barWidth: number;
  /** Percentage (0-100) of fill */
  percentage: number;
}

/**
 * Find which zone a value belongs to.
 */
function _findZoneForValue(
  value: number,
  zones: GaugeZone[] | undefined,
  _min: number
): GaugeZone | undefined {
  if (!zones || zones.length === 0) {
    return undefined;
  }

  // Find the first zone where value <= threshold
  for (const zone of zones) {
    if (value <= zone.threshold) {
      return zone;
    }
  }

  // Value is above all zones, use last zone
  return zones[zones.length - 1];
}

/**
 * Compute the layout for a gauge.
 *
 * @param input - Validated gauge input with defaults applied
 * @param chars - Character set to use
 * @returns Computed layout ready for rendering
 */
export function computeGaugeLayout(
  input: GaugeInputWithDefaults,
  chars: GaugeChars
): GaugeLayout {
  const { value, min, max, width, zones, unit } = input;

  // Clamp value to min/max range
  const clampedValue = Math.min(max, Math.max(min, value));

  // Calculate percentage (0-100)
  const range = max - min;
  const percentage = range > 0 ? ((clampedValue - min) / range) * 100 : 0;

  // Calculate total filled character count
  const totalFilled = Math.round((percentage / 100) * width);
  const totalEmpty = width - totalFilled;

  // Build segments based on zones
  const segments: GaugeSegment[] = [];

  if (!zones || zones.length === 0) {
    // No zones - simple filled/empty segments
    if (totalFilled > 0) {
      segments.push({ length: totalFilled, filled: true });
    }
    if (totalEmpty > 0) {
      segments.push({ length: totalEmpty, filled: false });
    }
  } else {
    // With zones - build colored segments
    // Calculate character positions for each zone boundary
    const zonePositions: { position: number; zone: GaugeZone }[] = [];

    for (const zone of zones) {
      // Convert zone threshold to character position
      const zonePercentage =
        range > 0 ? ((zone.threshold - min) / range) * 100 : 0;
      const position = Math.round((zonePercentage / 100) * width);
      zonePositions.push({ position, zone });
    }

    // Build filled segments with zone colors
    let currentPos = 0;
    let remainingFilled = totalFilled;

    for (let i = 0; i < zonePositions.length && remainingFilled > 0; i++) {
      const zonePos = zonePositions[i];
      if (!zonePos) continue;
      const { position, zone } = zonePos;
      const zoneEnd = Math.min(position, totalFilled);
      const segmentLength = zoneEnd - currentPos;

      if (segmentLength > 0) {
        segments.push({
          length: segmentLength,
          filled: true,
          color: zone.color,
        });
        remainingFilled -= segmentLength;
        currentPos = zoneEnd;
      }
    }

    // If there's remaining filled area beyond all zones, use the last zone's color
    if (remainingFilled > 0 && zonePositions.length > 0) {
      const lastZonePos = zonePositions[zonePositions.length - 1];
      if (lastZonePos) {
        const lastZone = lastZonePos.zone;
        segments.push({
          length: remainingFilled,
          filled: true,
          color: lastZone.color,
        });
      }
    }

    // Add empty segment
    if (totalEmpty > 0) {
      segments.push({ length: totalEmpty, filled: false });
    }
  }

  // Format value string
  const valueStr = unit
    ? `${String(clampedValue)}${unit}`
    : String(clampedValue);

  return {
    label: input.label ?? "",
    segments,
    filledChar: chars.filled,
    emptyChar: chars.empty,
    displayValue: clampedValue,
    valueStr,
    barWidth: width,
    percentage,
  };
}
