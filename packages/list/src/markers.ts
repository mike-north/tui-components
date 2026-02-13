import type { ListStyle, TaskChecked } from "./schema.js";

/**
 * Bullet markers for different styles.
 */
const bulletMarkers: Record<string, string> = {
  bullet: "•",
  dash: "-",
  arrow: "→",
  star: "★",
  none: "",
};

/**
 * Task markers for different checked states.
 */
const taskMarkers: Record<string, string> = {
  true: "[x]",
  false: "[ ]",
  partial: "[~]",
};

/**
 * Get the marker for a task item based on its checked state.
 *
 * @public
 */
export function getTaskMarker(checked: TaskChecked): string {
  return taskMarkers[String(checked)] ?? "[ ]";
}

/**
 * Convert number to roman numerals.
 */
function toRoman(num: number): string {
  const romanNumerals: [number, string][] = [
    [1000, "M"],
    [900, "CM"],
    [500, "D"],
    [400, "CD"],
    [100, "C"],
    [90, "XC"],
    [50, "L"],
    [40, "XL"],
    [10, "X"],
    [9, "IX"],
    [5, "V"],
    [4, "IV"],
    [1, "I"],
  ];

  let result = "";
  let remaining = num;

  for (const [value, symbol] of romanNumerals) {
    while (remaining >= value) {
      result += symbol;
      remaining -= value;
    }
  }

  return result.toLowerCase();
}

/**
 * Convert number to letter (a, b, c, ... z, aa, ab, ...).
 */
function toLetter(num: number): string {
  let result = "";
  let n = num;

  while (n > 0) {
    n--;
    result = String.fromCharCode(97 + (n % 26)) + result;
    n = Math.floor(n / 26);
  }

  return result;
}

/**
 * Get the marker for a list item.
 *
 * @public
 */
export function getMarker(
  style: ListStyle,
  index: number,
  startNumber: number
): string {
  switch (style) {
    case "numbered":
      return `${String(index + startNumber)}.`;
    case "lettered":
      return `${toLetter(index + startNumber)}.`;
    case "roman":
      return `${toRoman(index + startNumber)}.`;
    case "none":
      return "";
    default:
      return bulletMarkers[style] ?? "•";
  }
}

/**
 * Get the maximum marker width for numbered styles.
 * This helps align list items properly.
 *
 * @public
 */
export function getMaxMarkerWidth(
  style: ListStyle,
  itemCount: number,
  startNumber: number
): number {
  switch (style) {
    case "numbered": {
      // Width of the largest number plus period
      const maxNum = startNumber + itemCount - 1;
      return String(maxNum).length + 1;
    }
    case "lettered": {
      // Width of the largest letter combination plus period
      const maxLetter = toLetter(startNumber + itemCount - 1);
      return maxLetter.length + 1;
    }
    case "roman": {
      // Roman numerals vary in width; estimate based on largest
      const maxRoman = toRoman(startNumber + itemCount - 1);
      return maxRoman.length + 1;
    }
    case "none":
      return 0;
    case "task":
      // Task markers are fixed width: [x], [ ], [~]
      return 3;
    case "definition":
      // Definition lists don't use markers
      return 0;
    default:
      // Bullet styles have fixed width
      return 1;
  }
}
