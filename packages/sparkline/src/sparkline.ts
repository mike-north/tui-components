import {
  BaseTuiComponent,
  measureLines,
  registry,
  type ComponentMetadata,
  type RenderContext,
  type RenderResult,
} from "@tuicomponents/core";
import { sparklineInputSchema, type SparklineInput } from "./schema.js";
import { computeSparklineLayout } from "./layout.js";
import {
  renderSparklineAnsi,
  renderSparklineMarkdown,
  renderSparklineGrayscale,
} from "./renderers.js";

/**
 * Sparkline component for compact inline data visualization.
 *
 * Renders numeric data as a row of height block characters: ▁▂▃▄▅▆▇█
 *
 * @example
 * ```ts
 * const sparkline = createSparkline();
 * const result = sparkline.render(
 *   { values: [1, 3, 5, 7, 6, 4, 2], label: "Trend: " },
 *   context
 * );
 * // Output: "Trend: ▁▃▅▇▆▄▂"
 * ```
 */
export class SparklineComponent extends BaseTuiComponent<
  SparklineInput,
  typeof sparklineInputSchema
> {
  readonly metadata: ComponentMetadata<SparklineInput> = {
    name: "sparkline",
    description:
      "Compact inline sparkline visualization using height block characters (▁▂▃▄▅▆▇█)",
    version: "0.1.0",
    supportedModes: ["ansi", "markdown", "grayscale"],
    examples: [
      {
        name: "basic",
        description: "Simple ascending values",
        input: { values: [1, 2, 3, 4, 5, 6, 7, 8] },
      },
      {
        name: "with-label",
        description: "Sparkline with a label prefix",
        input: { values: [10, 25, 40, 35, 50, 45, 60], label: "Revenue: " },
      },
      {
        name: "compressed",
        description: "Data compressed to fewer columns",
        input: {
          values: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12],
          width: 6,
        },
      },
      {
        name: "explicit-range",
        description: "Values scaled to explicit min/max range",
        input: {
          values: [50, 60, 70, 65, 75],
          min: 0,
          max: 100,
        },
      },
      {
        name: "fit-to-width",
        description: "Sparkline that compresses to fit available width",
        input: {
          values: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15],
          fit: true,
          label: "Data: ",
        },
      },
    ],
  };

  readonly schema = sparklineInputSchema;

  render(input: SparklineInput, context: RenderContext): RenderResult {
    // Parse input (applies defaults)
    const parsed = this.schema.parse(input);

    // Compute layout (pass context.width for fit mode)
    const layout = computeSparklineLayout(parsed, context.width);

    // Render based on mode
    let output: string;
    switch (context.renderMode) {
      case "markdown":
        output = renderSparklineMarkdown(layout, context);
        break;
      case "grayscale":
        output = renderSparklineGrayscale(layout, context);
        break;
      default:
        output = renderSparklineAnsi(layout, context.theme);
    }

    // Measure output
    const measured = measureLines(output);

    return {
      output,
      actualWidth: measured.maxWidth,
      lineCount: measured.lineCount,
    };
  }
}

/**
 * Factory function to create a SparklineComponent instance.
 */
export function createSparkline(): SparklineComponent {
  return new SparklineComponent();
}

// Auto-register with global registry
registry.register(createSparkline);
