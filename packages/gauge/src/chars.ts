import type { GaugeStyle } from "./schema.js";

/**
 * Characters used for gauge rendering.
 */
export interface GaugeChars {
  /** Filled portion character */
  filled: string;
  /** Empty portion character */
  empty: string;
}

/**
 * Bar style: █░
 */
const barChars: GaugeChars = {
  filled: "█",
  empty: "░",
};

/**
 * Segments style: ▰▱
 */
const segmentsChars: GaugeChars = {
  filled: "▰",
  empty: "▱",
};

/**
 * Blocks style: ■□
 */
const blocksChars: GaugeChars = {
  filled: "■",
  empty: "□",
};

/**
 * Get gauge characters for a given style.
 */
export function getGaugeChars(style: GaugeStyle): GaugeChars {
  switch (style) {
    case "bar":
      return barChars;
    case "segments":
      return segmentsChars;
    case "blocks":
      return blocksChars;
  }
}
