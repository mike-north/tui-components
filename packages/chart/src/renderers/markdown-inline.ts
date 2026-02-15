/**
 * Inline markdown renderers for charts.
 *
 * These renderers produce single-line output for environments that collapse
 * newlines in chat output (e.g., GitHub Copilot).
 *
 * Instead of multi-line charts, these produce compact inline representations
 * that convey the same data in a horizontal format.
 */

import type { BarChartLayout } from "../layout/bar.js";
import type { StackedBarChartLayout } from "../layout/stacked-bar.js";

/**
 * Render a horizontal bar chart as a single line.
 *
 * Produces output like: "Sales: ████ 40 | Marketing: ██████ 60"
 *
 * @param layout - Computed bar chart layout
 * @returns Single-line representation of the bar chart
 *
 * @example
 * ```ts
 * const inline = renderBarChartInline(layout);
 * // "Q1: ████ 25 | Q2: ██████████ 50 | Q3: ████████████████ 75"
 * ```
 *
 * @public
 */
export function renderBarChartInline(layout: BarChartLayout): string {
  return layout.bars
    .map((bar) => {
      // Use a proportional bar length (max 10 chars for inline)
      const maxInlineBarLength = 10;
      const inlineLength = Math.max(
        1,
        Math.round((bar.length / layout.barAreaSize) * maxInlineBarLength)
      );
      const barStr = bar.barChar.repeat(inlineLength);

      if (layout.showValues) {
        return `${bar.label}: ${barStr} ${bar.formattedValue}`;
      }
      return `${bar.label}: ${barStr}`;
    })
    .join(" | ");
}

/**
 * Render a stacked bar chart as a single line.
 *
 * Produces output like: "Jan: ██▒▒ | Feb: ███▒▒▒"
 * where different characters represent different series.
 *
 * @param layout - Computed stacked bar chart layout
 * @returns Single-line representation of the stacked bar chart
 *
 * @example
 * ```ts
 * const inline = renderStackedBarChartInline(layout);
 * // "Q1: ██▒▒ (10+15) | Q2: ███▒▒▒ (15+20)"
 * ```
 *
 * @public
 */
export function renderStackedBarChartInline(
  layout: StackedBarChartLayout
): string {
  const maxInlineBarLength = 10;

  return layout.stacks
    .map((stack) => {
      // Calculate total length of all segments
      let totalLength = 0;
      for (const seg of stack.segments) {
        totalLength += seg.length;
      }

      // Build the stacked bar segments
      const barParts: string[] = [];

      for (const segment of stack.segments) {
        const inlineLength = Math.max(
          1,
          Math.round((segment.length / totalLength) * maxInlineBarLength)
        );
        barParts.push(segment.barChar.repeat(inlineLength));
      }

      const barStr = barParts.join("");

      // Show segment values in parentheses
      const values = stack.segments.map((s) => s.formattedValue).join("+");
      return `${stack.label}: ${barStr} (${values})`;
    })
    .join(" | ");
}

/**
 * Render a simple inline summary for chart types that don't
 * translate well to single-line format (scatter, line, area, pie).
 *
 * For these chart types, the inline renderer provides a textual
 * summary rather than a visual representation.
 *
 * @param chartType - The chart type being rendered
 * @param dataPoints - Number of data points
 * @param seriesCount - Number of series
 * @returns Descriptive inline summary
 *
 * @example
 * ```ts
 * const inline = renderChartSummaryInline("scatter", 50, 3);
 * // "[Scatter: 3 series, 50 points]"
 * ```
 *
 * @public
 */
export function renderChartSummaryInline(
  chartType: string,
  dataPoints: number,
  seriesCount: number
): string {
  const typeLabel = chartType.replace("-", " ");
  const seriesLabel = seriesCount === 1 ? "series" : "series";
  const pointLabel = dataPoints === 1 ? "point" : "points";

  return `[${typeLabel}: ${String(seriesCount)} ${seriesLabel}, ${String(dataPoints)} ${pointLabel}]`;
}
