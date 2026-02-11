import {
  BaseTuiComponent,
  type ComponentMetadata,
  type RenderContext,
  type RenderResult,
  measureLines,
  registry,
} from "@tuicomponents/core";
import { zodToJsonSchema } from "zod-to-json-schema";
import { gaugeInputSchema, type GaugeInput } from "./schema.js";
import { getGaugeChars } from "./chars.js";
import { computeGaugeLayout } from "./layout.js";
import { renderGaugeAnsi, renderGaugeMarkdown } from "./renderers.js";

/**
 * Gauge component for rendering meters with threshold zones.
 */
class GaugeComponent extends BaseTuiComponent<
  GaugeInput,
  typeof gaugeInputSchema
> {
  readonly metadata: ComponentMetadata<GaugeInput> = {
    name: "gauge",
    description: "Renders meters with threshold zones for status display",
    version: "0.1.0",
    supportedModes: ["ansi", "markdown"],
    examples: [
      {
        name: "basic",
        description: "Simple gauge at 75%",
        input: {
          value: 75,
          min: 0,
          max: 100,
        },
      },
      {
        name: "with-label",
        description: "Gauge with label",
        input: {
          value: 60,
          label: "CPU:",
        },
      },
      {
        name: "with-unit",
        description: "Gauge with unit",
        input: {
          value: 85,
          label: "Memory:",
          unit: "%",
        },
      },
      {
        name: "with-zones",
        description: "Gauge with colored zones",
        input: {
          value: 75,
          label: "Load:",
          zones: [
            { threshold: 30, color: "success" },
            { threshold: 70, color: "warning" },
            { threshold: 100, color: "error" },
          ],
        },
      },
      {
        name: "temperature",
        description: "Temperature gauge with zones",
        input: {
          value: 65,
          min: 0,
          max: 100,
          label: "Temp:",
          unit: "°C",
          zones: [
            { threshold: 50, color: "success" },
            { threshold: 80, color: "warning" },
            { threshold: 100, color: "error" },
          ],
        },
      },
      {
        name: "battery",
        description: "Battery gauge",
        input: {
          value: 100,
          label: "Battery:",
          unit: "%",
          style: "blocks",
        },
      },
      {
        name: "segments-style",
        description: "Gauge with segments style",
        input: {
          value: 40,
          style: "segments",
        },
      },
      {
        name: "blocks-style",
        description: "Gauge with blocks style",
        input: {
          value: 60,
          style: "blocks",
        },
      },
      {
        name: "wide-gauge",
        description: "Wide gauge",
        input: {
          value: 45,
          width: 40,
          label: "Progress:",
        },
      },
      {
        name: "low-value",
        description: "Gauge in success zone",
        input: {
          value: 15,
          label: "Usage:",
          zones: [
            { threshold: 30, color: "success" },
            { threshold: 70, color: "warning" },
            { threshold: 100, color: "error" },
          ],
        },
      },
    ],
  };

  readonly schema = gaugeInputSchema;

  /**
   * Override getJsonSchema to use direct schema generation.
   */
  override getJsonSchema(): object {
    return zodToJsonSchema(this.schema, {
      name: this.metadata.name,
      $refStrategy: "none",
    });
  }

  render(input: GaugeInput, context: RenderContext): RenderResult {
    const parsed = this.schema.parse(input);

    // Get character set based on style
    const chars = getGaugeChars(parsed.style);

    // Compute layout once, share between renderers
    const layout = computeGaugeLayout(parsed, chars);

    // Choose renderer based on render mode
    const output =
      context.renderMode === "markdown"
        ? renderGaugeMarkdown(layout, parsed)
        : renderGaugeAnsi(layout, parsed, context.theme);

    const measured = measureLines(output);

    return {
      output,
      actualWidth: measured.maxWidth,
      lineCount: measured.lineCount,
    };
  }
}

/**
 * Factory function to create a gauge component.
 */
export function createGauge(): GaugeComponent {
  return new GaugeComponent();
}

// Register with global registry
registry.register(createGauge);

export { GaugeComponent };
