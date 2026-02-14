import {
  BaseTuiComponent,
  type ComponentMetadata,
  type RenderContext,
  type RenderResult,
  measureLines,
  registry,
} from "@tuicomponents/core";
import { zodToJsonSchema } from "zod-to-json-schema";
import { progressInputSchema, type ProgressInput } from "./schema.js";
import { getProgressChars } from "./chars.js";
import { computeProgressLayout } from "./layout.js";
import { renderProgressAnsi, renderProgressMarkdown } from "./renderers.js";

/**
 * Progress component for rendering horizontal progress bars.
 */
class ProgressComponent extends BaseTuiComponent<
  ProgressInput,
  typeof progressInputSchema
> {
  readonly metadata: ComponentMetadata<ProgressInput> = {
    name: "progress",
    description: "Renders horizontal progress bars for task completion",
    version: "0.1.0",
    supportedModes: ["ansi", "markdown"],
    examples: [
      {
        name: "basic",
        description: "Simple progress bar at 50%",
        input: {
          value: 50,
          max: 100,
        },
      },
      {
        name: "with-label",
        description: "Progress bar with label",
        input: {
          value: 75,
          max: 100,
          label: "Loading:",
        },
      },
      {
        name: "block-style",
        description: "Block style progress bar",
        input: {
          value: 60,
          max: 100,
          style: "block",
          label: "Progress",
        },
      },
      {
        name: "shaded-style",
        description: "Shaded style progress bar",
        input: {
          value: 40,
          max: 100,
          style: "shaded",
        },
      },
      {
        name: "bracket-style",
        description: "Bracket style progress bar",
        input: {
          value: 80,
          max: 100,
          style: "bracket",
        },
      },
      {
        name: "arrow-style",
        description: "Arrow style progress bar",
        input: {
          value: 65,
          max: 100,
          style: "arrow",
        },
      },
      {
        name: "ascii-style",
        description: "ASCII style progress bar",
        input: {
          value: 50,
          max: 100,
          style: "ascii",
        },
      },
      {
        name: "with-value",
        description: "Progress bar showing current/max value",
        input: {
          value: 12,
          max: 25,
          label: "Downloads",
          showValue: true,
        },
      },
      {
        name: "complete",
        description: "100% complete progress bar",
        input: {
          value: 100,
          max: 100,
          style: "bracket",
        },
      },
      {
        name: "custom-width",
        description: "Wide progress bar",
        input: {
          value: 45,
          max: 100,
          width: 40,
          label: "Processing:",
        },
      },
      {
        name: "fit-to-width",
        description: "Progress bar that fits to available width",
        input: {
          value: 60,
          max: 100,
          fit: true,
          label: "Downloading:",
        },
      },
    ],
  };

  readonly schema = progressInputSchema;

  /**
   * Override getJsonSchema to use direct schema generation.
   */
  override getJsonSchema(): object {
    return zodToJsonSchema(this.schema, {
      name: this.metadata.name,
      $refStrategy: "none",
    });
  }

  render(input: ProgressInput, context: RenderContext): RenderResult {
    const parsed = this.schema.parse(input);

    // Get character set based on style
    const chars = getProgressChars(parsed.style);

    // Compute layout once, share between renderers
    // Pass context.width for fit mode calculation
    const layout = computeProgressLayout(parsed, chars, context.width);

    // Choose renderer based on render mode
    const output =
      context.renderMode === "markdown"
        ? renderProgressMarkdown(layout, parsed)
        : renderProgressAnsi(layout, parsed, context.theme);

    const measured = measureLines(output);

    return {
      output,
      actualWidth: measured.maxWidth,
      lineCount: measured.lineCount,
    };
  }
}

/**
 * Factory function to create a progress component.
 */
export function createProgress(): ProgressComponent {
  return new ProgressComponent();
}

// Register with global registry
registry.register(createProgress);

export { ProgressComponent };
