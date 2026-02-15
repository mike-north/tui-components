/**
 * Main Chart component.
 */

import {
  BaseTuiComponent,
  type ComponentMetadata,
  type RenderContext,
  type RenderResult,
  measureLines,
  registry,
} from "@tuicomponents/core";
import { zodToJsonSchema } from "zod-to-json-schema";
import { chartInputSchema } from "./schema.js";
import type { ChartInput } from "./types.js";
import { computeBarLayout } from "./layout/bar.js";
import { computeStackedBarLayout } from "./layout/stacked-bar.js";
import { computeLineLayout } from "./layout/line.js";
import { computeAreaLayout } from "./layout/area.js";
import { computeScatterLayout } from "./layout/scatter.js";
import { computePieLayout } from "./layout/pie.js";
import { computeHeatmapLayout } from "./layout/heatmap.js";
import {
  renderBarChartAnsi,
  renderVerticalBarChartAnsi,
  renderStackedBarChartAnsi,
  renderLineChartAnsi,
  renderAreaChartAnsi,
  renderScatterChartAnsi,
  renderPieChartAnsi,
  renderHeatmapAnsi,
} from "./renderers/ansi.js";
import {
  renderBarChartMarkdown,
  renderVerticalBarChartMarkdown,
  renderStackedBarChartMarkdown,
  renderLineChartMarkdown,
  renderAreaChartMarkdown,
  renderScatterChartMarkdown,
  renderPieChartMarkdown,
  renderHeatmapMarkdown,
} from "./renderers/markdown.js";
import {
  renderBarChartInline,
  renderStackedBarChartInline,
  renderChartSummaryInline,
} from "./renderers/markdown-inline.js";

/**
 * Chart component for rendering various chart types.
 */
class ChartComponent extends BaseTuiComponent<
  ChartInput,
  typeof chartInputSchema
> {
  readonly metadata: ComponentMetadata<ChartInput> = {
    name: "chart",
    description:
      "Renders various chart types including bar, line, and area charts",
    version: "0.1.0",
    supportedModes: ["ansi", "markdown"],
    examples: [
      {
        name: "horizontal-bar",
        description: "Simple horizontal bar chart",
        input: {
          type: "bar",
          series: [
            {
              name: "Sales",
              data: [
                { x: "Q1", y: 120 },
                { x: "Q2", y: 150 },
                { x: "Q3", y: 180 },
                { x: "Q4", y: 200 },
              ],
            },
          ],
          showValues: true,
        },
      },
      {
        name: "vertical-bar",
        description: "Vertical bar chart (column chart)",
        input: {
          type: "bar-vertical",
          series: [
            {
              name: "Revenue",
              data: [
                { x: "Jan", y: 65 },
                { x: "Feb", y: 80 },
                { x: "Mar", y: 95 },
                { x: "Apr", y: 70 },
              ],
            },
          ],
          height: 8,
          width: 30,
        },
      },
      {
        name: "stacked-bar",
        description: "Stacked horizontal bar chart",
        input: {
          type: "bar-stacked",
          series: [
            {
              name: "Product A",
              data: [
                { x: "Q1", y: 50 },
                { x: "Q2", y: 60 },
                { x: "Q3", y: 70 },
              ],
            },
            {
              name: "Product B",
              data: [
                { x: "Q1", y: 30 },
                { x: "Q2", y: 40 },
                { x: "Q3", y: 35 },
              ],
            },
          ],
          width: 40,
        },
      },
      {
        name: "stacked-vertical",
        description: "Stacked vertical bar chart",
        input: {
          type: "bar-stacked-vertical",
          series: [
            {
              name: "Revenue",
              data: [
                { x: "Q1", y: 100 },
                { x: "Q2", y: 120 },
                { x: "Q3", y: 90 },
                { x: "Q4", y: 150 },
              ],
            },
            {
              name: "Costs",
              data: [
                { x: "Q1", y: 60 },
                { x: "Q2", y: 70 },
                { x: "Q3", y: 55 },
                { x: "Q4", y: 80 },
              ],
            },
            {
              name: "Profit",
              data: [
                { x: "Q1", y: 40 },
                { x: "Q2", y: 50 },
                { x: "Q3", y: 35 },
                { x: "Q4", y: 70 },
              ],
            },
          ],
          height: 10,
          width: 35,
        },
      },
      {
        name: "line",
        description: "Line chart with height blocks",
        input: {
          type: "line",
          series: [
            {
              name: "Temperature",
              data: [
                { x: "J", y: 30 },
                { x: "F", y: 35 },
                { x: "M", y: 50 },
                { x: "A", y: 65 },
                { x: "M", y: 75 },
                { x: "J", y: 85 },
                { x: "J", y: 90 },
                { x: "A", y: 88 },
                { x: "S", y: 78 },
                { x: "O", y: 62 },
                { x: "N", y: 45 },
                { x: "D", y: 32 },
              ],
            },
          ],
          height: 8,
          width: 20,
        },
      },
      {
        name: "multi-line",
        description: "Multiple series line chart",
        input: {
          type: "line",
          series: [
            {
              name: "2023",
              data: [
                { x: "Q1", y: 100 },
                { x: "Q2", y: 120 },
                { x: "Q3", y: 110 },
                { x: "Q4", y: 140 },
              ],
            },
            {
              name: "2024",
              data: [
                { x: "Q1", y: 130 },
                { x: "Q2", y: 145 },
                { x: "Q3", y: 135 },
                { x: "Q4", y: 160 },
              ],
            },
          ],
          height: 6,
          width: 20,
        },
      },
      {
        name: "area",
        description: "Area chart",
        input: {
          type: "area",
          series: [
            {
              name: "Users",
              data: [
                { x: "W1", y: 100 },
                { x: "W2", y: 150 },
                { x: "W3", y: 180 },
                { x: "W4", y: 160 },
                { x: "W5", y: 200 },
              ],
            },
          ],
          height: 6,
          width: 15,
        },
      },
      {
        name: "stacked-area",
        description: "Stacked area chart",
        input: {
          type: "area-stacked",
          series: [
            {
              name: "Mobile",
              data: [
                { x: "J", y: 50 },
                { x: "F", y: 60 },
                { x: "M", y: 70 },
                { x: "A", y: 65 },
              ],
            },
            {
              name: "Desktop",
              data: [
                { x: "J", y: 100 },
                { x: "F", y: 90 },
                { x: "M", y: 85 },
                { x: "A", y: 95 },
              ],
            },
          ],
          height: 8,
          width: 15,
        },
      },
      {
        name: "scatter",
        description: "Scatter plot with numeric axes",
        input: {
          type: "scatter",
          series: [
            {
              name: "Data",
              data: [
                { x: 10, y: 20 },
                { x: 30, y: 50 },
                { x: 50, y: 30 },
                { x: 70, y: 80 },
                { x: 90, y: 60 },
              ],
            },
          ],
          height: 8,
          width: 30,
        },
      },
      {
        name: "pie",
        description: "Pie chart with percentage breakdown",
        input: {
          type: "pie",
          series: [
            {
              name: "Revenue",
              data: [
                { label: "Sales", x: "Sales", y: 45 },
                { label: "Support", x: "Support", y: 30 },
                { label: "Other", x: "Other", y: 25 },
              ],
            },
          ],
          height: 10,
          width: 30,
        },
      },
      {
        name: "donut",
        description: "Donut chart with center label",
        input: {
          type: "donut",
          series: [
            {
              name: "Market Share",
              data: [
                { label: "Chrome", x: "Chrome", y: 65 },
                { label: "Firefox", x: "Firefox", y: 20 },
                { label: "Safari", x: "Safari", y: 15 },
              ],
            },
          ],
          height: 10,
          width: 30,
          centerLabel: "100%",
          innerRadius: 0.5,
        },
      },
      {
        name: "heatmap",
        description: "Heatmap showing intensity values",
        input: {
          type: "heatmap",
          series: [
            {
              name: "Activity",
              data: [
                { x: "Mon", y: 10, label: "9am" },
                { x: "Tue", y: 50, label: "9am" },
                { x: "Wed", y: 80, label: "9am" },
                { x: "Mon", y: 30, label: "10am" },
                { x: "Tue", y: 70, label: "10am" },
                { x: "Wed", y: 90, label: "10am" },
              ],
            },
          ],
          height: 6,
          width: 25,
          heatmapStyle: "blocks",
        },
      },
    ],
  };

  readonly schema = chartInputSchema;

  override getJsonSchema(): object {
    return zodToJsonSchema(this.schema, {
      name: this.metadata.name,
      $refStrategy: "none",
    });
  }

  render(input: ChartInput, context: RenderContext): RenderResult {
    const parsed = this.schema.parse(input);

    if (
      parsed.series.length === 0 ||
      parsed.series.every((s) => s.data.length === 0)
    ) {
      return { output: "", actualWidth: 0, lineCount: 0 };
    }

    let output: string;

    // Check if we should use inline mode (for GitHub Copilot)
    const useInlineMode =
      context.renderMode === "markdown" &&
      context.markdownOptions?.multilineMode === "inline";

    // Helper to count total data points across all series
    const totalDataPoints = parsed.series.reduce(
      (sum, s) => sum + s.data.length,
      0
    );

    switch (parsed.type) {
      case "bar": {
        const layout = computeBarLayout(parsed);
        if (useInlineMode) {
          output = renderBarChartInline(layout);
        } else if (context.renderMode === "markdown") {
          output = renderBarChartMarkdown(layout, { input: parsed });
        } else {
          output = renderBarChartAnsi(layout, {
            theme: context.theme,
            input: parsed,
          });
        }
        break;
      }

      case "bar-vertical": {
        const layout = computeBarLayout(parsed);
        if (useInlineMode) {
          // Vertical bar charts use the same inline format as horizontal
          output = renderBarChartInline(layout);
        } else if (context.renderMode === "markdown") {
          output = renderVerticalBarChartMarkdown(layout, { input: parsed });
        } else {
          output = renderVerticalBarChartAnsi(layout, {
            theme: context.theme,
            input: parsed,
          });
        }
        break;
      }

      case "bar-stacked":
      case "bar-stacked-vertical": {
        const layout = computeStackedBarLayout(parsed);
        if (useInlineMode) {
          output = renderStackedBarChartInline(layout);
        } else if (context.renderMode === "markdown") {
          output = renderStackedBarChartMarkdown(layout, { input: parsed });
        } else {
          output = renderStackedBarChartAnsi(layout, {
            theme: context.theme,
            input: parsed,
          });
        }
        break;
      }

      case "line": {
        const layout = computeLineLayout(parsed);
        if (useInlineMode) {
          output = renderChartSummaryInline(
            "line",
            totalDataPoints,
            parsed.series.length
          );
        } else if (context.renderMode === "markdown") {
          output = renderLineChartMarkdown(layout, { input: parsed });
        } else {
          output = renderLineChartAnsi(layout, {
            theme: context.theme,
            input: parsed,
          });
        }
        break;
      }

      case "area":
      case "area-stacked": {
        const layout = computeAreaLayout(parsed);
        if (useInlineMode) {
          output = renderChartSummaryInline(
            parsed.type,
            totalDataPoints,
            parsed.series.length
          );
        } else if (context.renderMode === "markdown") {
          output = renderAreaChartMarkdown(layout, { input: parsed });
        } else {
          output = renderAreaChartAnsi(layout, {
            theme: context.theme,
            input: parsed,
          });
        }
        break;
      }

      case "scatter": {
        const layout = computeScatterLayout(parsed);
        if (useInlineMode) {
          output = renderChartSummaryInline(
            "scatter",
            totalDataPoints,
            parsed.series.length
          );
        } else if (context.renderMode === "markdown") {
          output = renderScatterChartMarkdown(layout, { input: parsed });
        } else {
          output = renderScatterChartAnsi(layout, {
            theme: context.theme,
            input: parsed,
          });
        }
        break;
      }

      case "pie":
      case "donut": {
        const layout = computePieLayout(parsed);
        if (useInlineMode) {
          output = renderChartSummaryInline(
            parsed.type,
            totalDataPoints,
            parsed.series.length
          );
        } else if (context.renderMode === "markdown") {
          output = renderPieChartMarkdown(layout, { input: parsed });
        } else {
          output = renderPieChartAnsi(layout, {
            theme: context.theme,
            input: parsed,
          });
        }
        break;
      }

      case "heatmap": {
        const layout = computeHeatmapLayout(parsed);
        if (useInlineMode) {
          output = renderChartSummaryInline(
            "heatmap",
            totalDataPoints,
            parsed.series.length
          );
        } else if (context.renderMode === "markdown") {
          output = renderHeatmapMarkdown(layout, { input: parsed });
        } else {
          output = renderHeatmapAnsi(layout, {
            theme: context.theme,
            input: parsed,
          });
        }
        break;
      }

      default: {
        // Exhaustiveness check - TypeScript will error if a case is missing
        const _exhaustiveCheck: never = parsed.type;
        throw new Error(`Unknown chart type: ${String(_exhaustiveCheck)}`);
      }
    }

    // Add title if present
    if (parsed.title) {
      const titleLine = context.theme
        ? context.theme.semantic.header(parsed.title)
        : parsed.title;
      output = titleLine + "\n" + output;
    }

    const measured = measureLines(output);

    return {
      output,
      actualWidth: measured.maxWidth,
      lineCount: measured.lineCount,
    };
  }
}

/**
 * Factory function to create a chart component.
 */
export function createChart(): ChartComponent {
  return new ChartComponent();
}

// Register with global registry
registry.register(createChart);

export { ChartComponent };
